import { env } from 'cloudflare:workers';
import { scenarios } from '../../futures';

export const dynamic = 'force-dynamic';
const cookieName = 'after_ai_voter';
const ids = new Set(scenarios.map(s => s.id));
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
const database = () => (env as unknown as { DB: D1Database }).DB;

function token(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...headers, ...extra } });
}
async function results(voterHash: string) {
  const db = database();
  const [totals, own] = await db.batch<{ scenario_id: string; votes?: number }>([
    db.prepare('SELECT scenario_id, COUNT(*) AS votes FROM public_votes GROUP BY scenario_id'),
    db.prepare('SELECT scenario_id FROM public_votes WHERE voter_hash = ?').bind(voterHash),
  ]);
  const counts = scenarios.map(s => ({ id: s.id, votes: Number(totals.results.find(r => r.scenario_id === s.id)?.votes ?? 0) }));
  return { counts, total: counts.reduce((sum, r) => sum + r.votes, 0), choice: own.results[0]?.scenario_id ?? null };
}
export async function GET(request: Request) {
  try {
    const existing = token(request);
    const identity = existing ?? Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return json(await results(await hash(identity)), 200, existing ? {} : {
      'Set-Cookie': `${cookieName}=${identity}; HttpOnly; SameSite=Strict; Path=/api/votes; Max-Age=31536000${secure}`,
    });
  } catch {
    return json({ error: 'Results are temporarily unavailable. Please try again shortly.' }, 503);
  }
}
async function mutate(request: Request, remove: boolean) {
  // No cross-origin writes; a browser must first accept the anonymous voter cookie.
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Please vote from this site.' }, 403);
  const identity = token(request);
  if (!identity) return json({ error: 'Please allow cookies for this site, then refresh before voting.' }, 400);
  try {
    const voterHash = await hash(identity);
    if (remove) {
      await database().prepare('DELETE FROM public_votes WHERE voter_hash = ?').bind(voterHash).run();
    } else {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Expected a JSON vote.' }, 415);
      const body = await request.text();
      if (body.length > 256) return json({ error: 'Vote is too large.' }, 413);
      let input: unknown;
      try { input = JSON.parse(body); } catch { return json({ error: 'Invalid vote.' }, 400); }
      const choice = input && typeof input === 'object' && 'choice' in input ? input.choice : null;
      if (typeof choice !== 'string' || !ids.has(choice)) return json({ error: 'Choose one of the twelve futures.' }, 400);
      // The primary key and atomic upsert prevent retries/concurrent writes from adding votes.
      await database().prepare('INSERT INTO public_votes (voter_hash, scenario_id) VALUES (?, ?) ON CONFLICT(voter_hash) DO UPDATE SET scenario_id = excluded.scenario_id').bind(voterHash, choice).run();
    }
    return json(await results(voterHash));
  } catch {
    return json({ error: 'Your vote could not be confirmed. Please refresh the results before trying again.' }, 503);
  }
}
export const POST = (request: Request) => mutate(request, false);
export const DELETE = (request: Request) => mutate(request, true);
