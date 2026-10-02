import { rankScenarios, scenarios, validateAnswers, type Answers } from '../../futures';
import { db, identify, json, readJson, writer } from '@/lib/server';

export const dynamic = 'force-dynamic';

type Row = { q: number; value: number | null; n: string };
type Own = { q1: number | null; q2: number | null; q3: number | null; q4: number | null; q5: number | null; q6: number | null; top_match: string | null };

async function results(voterHash: string) {
  const [distribution, matches, own] = await Promise.all([
    // One pass per question; NULL value means "unsure". Question 6 only counts responses saved since it was added.
    db().query<Row>(`SELECT q, value, COUNT(*) AS n FROM survey_responses,
      LATERAL (VALUES (1, q1, true), (2, q2, true), (3, q3, true), (4, q4, true), (5, q5, true), (6, q6, v >= 2)) AS a(q, value, counted)
      WHERE counted GROUP BY q, value`),
    db().query<{ top_match: string | null; n: string }>('SELECT top_match, COUNT(*) AS n FROM survey_responses GROUP BY top_match'),
    db().query<Own>('SELECT q1, q2, q3, q4, q5, q6, top_match FROM survey_responses WHERE voter_hash = $1', [voterHash]),
  ]);
  const total = matches.reduce((sum, r) => sum + Number(r.n), 0);
  const questions = [1, 2, 3, 4, 5, 6].map(q => {
    const count = (value: number | null) => Number(distribution.find(r => r.q === q && r.value === value)?.n ?? 0);
    return { '-1': count(-1), '0': count(0), '1': count(1), unsure: count(null) };
  });
  const topMatches = scenarios.map(s => ({ id: s.id, count: Number(matches.find(r => r.top_match === s.id)?.n ?? 0) })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  const mine = own[0] ? { answers: [own[0].q1, own[0].q2, own[0].q3, own[0].q4, own[0].q5, own[0].q6] as Answers, topMatch: own[0].top_match } : null;
  return { total, questions, topMatches, mine };
}

export async function GET(request: Request) {
  try {
    const { voterHash, cookie } = await identify(request);
    return json(await results(voterHash), 200, cookie);
  } catch {
    return json({ error: 'Survey results are temporarily unavailable. Please try again shortly.' }, 503);
  }
}

async function mutate(request: Request, remove: boolean) {
  const auth = await writer(request);
  if (auth.error) return auth.error;
  const { voterHash } = auth;
  try {
    if (remove) {
      await db().query('DELETE FROM survey_responses WHERE voter_hash = $1', [voterHash]);
    } else {
      const { value, error } = await readJson(request);
      if (error) return error;
      let answers: Answers;
      try { answers = validateAnswers(value && typeof value === 'object' && 'answers' in value ? value.answers : null); }
      catch (e) { return json({ error: (e as Error).message }, 400); }
      if (answers.every(v => v === null)) return json({ error: 'Answer at least one question before sharing.' }, 400);
      // The closest match is computed on the server so it always agrees with the stored answers.
      const top = rankScenarios(answers)[0]?.scenario.id ?? null;
      await db().query(`INSERT INTO survey_responses (voter_hash, q1, q2, q3, q4, q5, q6, top_match, v) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 2)
        ON CONFLICT (voter_hash) DO UPDATE SET q1 = excluded.q1, q2 = excluded.q2, q3 = excluded.q3, q4 = excluded.q4, q5 = excluded.q5, q6 = excluded.q6,
        top_match = excluded.top_match, v = 2, updated_at = now()`, [voterHash, ...answers, top]);
    }
    return json(await results(voterHash));
  } catch {
    return json({ error: 'Your answers could not be saved. Please try again shortly.' }, 503);
  }
}
export const POST = (request: Request) => mutate(request, false);
export const DELETE = (request: Request) => mutate(request, true);
