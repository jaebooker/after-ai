import { Pool } from 'pg';

// Neon (via the Vercel Marketplace) sets DATABASE_URL; POSTGRES_URL is a common fallback.
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const globalForDb = globalThis as unknown as { afterAiPool?: Pool; afterAiSchema?: Promise<void> };

export function db() {
  if (!connectionString) throw new Error('DATABASE_URL is not configured.');
  globalForDb.afterAiPool ??= new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: true },
  });
  globalForDb.afterAiSchema ??= globalForDb.afterAiPool.query(`
    CREATE TABLE IF NOT EXISTS public_votes (
      voter_hash TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS public_votes_scenario_idx ON public_votes(scenario_id);
    CREATE TABLE IF NOT EXISTS survey_responses (
      voter_hash TEXT PRIMARY KEY,
      q1 SMALLINT CHECK (q1 IN (-1, 0, 1)),
      q2 SMALLINT CHECK (q2 IN (-1, 0, 1)),
      q3 SMALLINT CHECK (q3 IN (-1, 0, 1)),
      q4 SMALLINT CHECK (q4 IN (-1, 0, 1)),
      q5 SMALLINT CHECK (q5 IN (-1, 0, 1)),
      top_match TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- q6 (oversight) was added later. v = 1 marks responses saved before it existed,
    -- so their empty q6 is not counted as "unsure".
    ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS q6 SMALLINT CHECK (q6 IN (-1, 0, 1));
    ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS v SMALLINT NOT NULL DEFAULT 1;
  `).then(() => undefined).catch(error => { globalForDb.afterAiSchema = undefined; throw error; });
  const pool = globalForDb.afterAiPool;
  return { query: async <T extends object>(text: string, values: unknown[] = []) => { await globalForDb.afterAiSchema; return (await pool.query<T>(text, values)).rows; } };
}

// Anonymous visitor identity: a random token in an HttpOnly cookie; only its SHA-256 hash is stored.
const cookieName = 'after_ai_voter';
export const noStore = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...noStore, ...extra } });
}
export function voterToken(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
/** Returns the visitor's hash plus a Set-Cookie header when a new identity was issued. */
export async function identify(request: Request) {
  const existing = voterToken(request);
  const identity = existing ?? Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const cookie: Record<string, string> = existing ? {} : { 'Set-Cookie': `${cookieName}=${identity}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=31536000${secure}` };
  return { voterHash: await hash(identity), cookie };
}
/** Guards writes: same-origin only, and the browser must already hold the anonymous cookie. */
export async function writer(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return { error: json({ error: 'Please submit from this site.' }, 403) };
  const identity = voterToken(request);
  if (!identity) return { error: json({ error: 'Please allow cookies for this site, then refresh before submitting.' }, 400) };
  return { voterHash: await hash(identity) };
}
export async function readJson(request: Request, limit = 512): Promise<{ value?: unknown; error?: Response }> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) return { error: json({ error: 'Expected JSON.' }, 415) };
  const body = await request.text();
  if (body.length > limit) return { error: json({ error: 'Request is too large.' }, 413) };
  try { return { value: JSON.parse(body) }; } catch { return { error: json({ error: 'Invalid JSON.' }, 400) }; }
}
