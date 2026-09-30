import { scenarios } from '../../futures';
import { db, identify, json, readJson, writer } from '@/lib/server';

export const dynamic = 'force-dynamic';
const ids = new Set(scenarios.map(s => s.id));

async function results(voterHash: string) {
  const [totals, own] = await Promise.all([
    db().query<{ scenario_id: string; votes: string }>('SELECT scenario_id, COUNT(*) AS votes FROM public_votes GROUP BY scenario_id'),
    db().query<{ scenario_id: string }>('SELECT scenario_id FROM public_votes WHERE voter_hash = $1', [voterHash]),
  ]);
  const counts = scenarios.map(s => ({ id: s.id, votes: Number(totals.find(r => r.scenario_id === s.id)?.votes ?? 0) }));
  return { counts, total: counts.reduce((sum, r) => sum + r.votes, 0), choice: own[0]?.scenario_id ?? null };
}
export async function GET(request: Request) {
  try {
    const { voterHash, cookie } = await identify(request);
    return json(await results(voterHash), 200, cookie);
  } catch {
    return json({ error: 'Results are temporarily unavailable. Please try again shortly.' }, 503);
  }
}
async function mutate(request: Request, remove: boolean) {
  const auth = await writer(request);
  if (auth.error) return auth.error;
  const { voterHash } = auth;
  try {
    if (remove) {
      await db().query('DELETE FROM public_votes WHERE voter_hash = $1', [voterHash]);
    } else {
      const { value, error } = await readJson(request, 256);
      if (error) return error;
      const choice = value && typeof value === 'object' && 'choice' in value ? value.choice : null;
      if (typeof choice !== 'string' || !ids.has(choice)) return json({ error: 'Choose one of the twelve futures.' }, 400);
      // The primary key and atomic upsert prevent retries/concurrent writes from adding votes.
      await db().query('INSERT INTO public_votes (voter_hash, scenario_id) VALUES ($1, $2) ON CONFLICT (voter_hash) DO UPDATE SET scenario_id = excluded.scenario_id', [voterHash, choice]);
    }
    return json(await results(voterHash));
  } catch {
    return json({ error: 'Your vote could not be confirmed. Please refresh the results before trying again.' }, 503);
  }
}
export const POST = (request: Request) => mutate(request, false);
export const DELETE = (request: Request) => mutate(request, true);
