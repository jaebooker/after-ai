'use client';

import { useEffect, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { questions, scenarios, type Answers } from './futures';

type Counts = { '-1': number; '0': number; '1': number; unsure: number };
type Survey = { total: number; questions: Counts[]; topMatches: { id: string; count: number }[]; mine: { answers: Answers; topMatch: string | null } | null };

const key = (v: Answers[number]) => (v === null ? 'unsure' : String(v)) as keyof Counts;
const pct = (n: number, total: number) => (total ? Math.round(n / total * 100) : 0);
const same = (a: Answers, b: Answers) => a.every((v, i) => v === b[i]);
const sum = (c: Counts) => c['-1'] + c['0'] + c['1'] + c.unsure;

/** Optional step inside the results: share answers anonymously, then see how other visitors answered. */
export function SurveyCompare({ answers, onAbout }: { answers: Answers; onAbout: () => void }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const allUnsure = answers.every(v => v === null);

  async function request(method: 'GET' | 'POST' | 'DELETE' = 'GET') {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/survey', {
        method, credentials: 'same-origin', cache: 'no-store',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) } : {}),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Sharing is unavailable right now.');
      const data = await response.json() as Survey & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
      setSurvey(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }
  // Loads the current count and sets the anonymous visitor cookie needed before sharing.
  useEffect(() => { void request(); }, []);

  const mine = survey?.mine ?? null;

  if (!mine) return <section className="survey-compare" aria-labelledby="survey-title">
    <div className="survey-head"><Users size={20} aria-hidden="true"/><h4 id="survey-title">How did everyone else answer?</h4></div>
    <p>Add your answers anonymously to see how {survey && survey.total > 0 ? `${survey.total.toLocaleString()} other ${survey.total === 1 ? 'visitor' : 'visitors'}` : 'other visitors'} answered.</p>
    <div className="survey-actions">
      <button className="button ink" onClick={() => void request('POST')} disabled={busy || !survey || allUnsure}>{busy && survey ? 'Sharing…' : 'Share & compare'}</button>
      <button className="underlined" onClick={onAbout}>What is stored</button>
    </div>
    {error && <p className="survey-error" role="alert">{error} <button className="underlined" onClick={() => void request()}>Retry</button></p>}
  </section>;

  const stale = !same(mine.answers, answers);
  return <section className="survey-compare" aria-labelledby="survey-title">
    <div className="survey-head"><Users size={20} aria-hidden="true"/><h4 id="survey-title">How you compare</h4><span className="survey-count">{survey!.total.toLocaleString()} {survey!.total === 1 ? 'response' : 'responses'}</span></div>
    {stale && <div className="survey-stale"><p>Your answers have changed since you shared.</p><button className="button ink" onClick={() => void request('POST')} disabled={busy}>Update</button></div>}
    <ol className="survey-questions">{questions.map((q, i) => {
      const counts = survey!.questions[i];
      const total = sum(counts);
      const yours = key(mine.answers[i]);
      const options = [...q.options.map((o, j) => ({ k: String(o.value) as keyof Counts, letter: String.fromCharCode(65 + j), label: o.title })), { k: 'unsure' as const, letter: '?', label: 'Unsure / it depends' }];
      return <li key={q.title}><details>
        <summary><span className="survey-q"><span>{String(i + 1).padStart(2, '0')}</span>{q.title}</span><span className="survey-agree"><strong>{pct(counts[yours], total)}%</strong> answered like you</span></summary>
        <ul>{options.map(o => {
          const p = pct(counts[o.k], total);
          return <li key={o.k} className={o.k === yours ? 'yours' : ''}>
            <span className="survey-letter">{o.letter}</span>
            <span className="survey-label">{o.label}{o.k === yours && <Check size={14} aria-label="Your answer"/>}</span>
            <span className="survey-pct">{p}%</span>
            <span className="survey-track" aria-hidden="true"><span style={{ width: `${p}%` }}/></span>
          </li>;
        })}</ul>
      </details></li>;
    })}</ol>
    {survey!.topMatches.length > 0 && <div className="survey-matches">
      <p className="survey-q">Closest matches across all visitors</p>
      <ul>{survey!.topMatches.slice(0, 5).map(m => {
        const p = pct(m.count, survey!.total);
        return <li key={m.id} className={m.id === mine.topMatch ? 'yours' : ''}>
          <span className="survey-label">{scenarios.find(s => s.id === m.id)?.name}{m.id === mine.topMatch && <Check size={14} aria-label="Your closest match"/>}</span>
          <span className="survey-pct">{p}%</span>
          <span className="survey-track" aria-hidden="true"><span style={{ width: `${p}%` }}/></span>
        </li>;
      })}</ul>
    </div>}
    {error && <p className="survey-error" role="alert">{error}</p>}
    <div className="survey-actions">
      <button className="underlined" onClick={() => void request('DELETE')} disabled={busy}>Remove my answers</button>
      <button className="underlined" onClick={onAbout}>What is stored</button>
    </div>
  </section>;
}
