'use client';

import { useEffect, useState } from 'react';
import { Check, Users, RotateCcw } from 'lucide-react';
import { questions, scenarios, type Answers } from './futures';

type Counts = { '-1': number; '0': number; '1': number; unsure: number };
type Survey = { total: number; questions: Counts[]; topMatches: { id: string; count: number }[]; mine: { answers: Answers; topMatch: string | null } | null };

const key = (v: Answers[number]) => (v === null ? 'unsure' : String(v)) as keyof Counts;
const pct = (n: number, total: number) => (total ? Math.round(n / total * 100) : 0);
const same = (a: Answers, b: Answers) => a.every((v, i) => v === b[i]);

export function SurveyCompare({ answers }: { answers: Answers }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const allUnsure = answers.every(v => v === null);

  async function request(method: 'GET' | 'POST' | 'DELETE' = 'GET') {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/survey', {
        method, credentials: 'same-origin', cache: 'no-store',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) } : {}),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Sharing is temporarily unavailable. Please try again shortly.');
      const data = await response.json() as Survey & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
      setSurvey(data);
      if (method === 'POST') setMessage('Your answers are counted. Retaking the compass and sharing again replaces them.');
      if (method === 'DELETE') setMessage('Your answers have been removed from the results.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }
  // Loads the current count and sets the anonymous visitor cookie needed before sharing.
  useEffect(() => { void request(); }, []);

  const mine = survey?.mine ?? null;
  const shared = mine !== null;
  const stale = shared && !same(mine.answers, answers);

  if (!shared) return <section className="survey-compare" aria-labelledby="survey-title">
    <div className="survey-head"><Users size={20} aria-hidden="true"/><h4 id="survey-title">See how everyone else answered</h4></div>
    <p>Share your five answers anonymously to compare them with {survey && survey.total > 0 ? `${survey.total.toLocaleString()} other ${survey.total === 1 ? 'visitor' : 'visitors'}` : 'other visitors'}. Sharing is optional.</p>
    <div className="survey-actions">
      <button className="button ink" onClick={() => void request('POST')} disabled={busy || !survey || allUnsure}>{busy && survey ? 'Sharing…' : 'Share & compare'}</button>
      {allUnsure && <span className="survey-note">Answer at least one question to share.</span>}
    </div>
    {message && <p className="survey-status" role="status">{message}</p>}
    {error && <p className="survey-error" role="alert">{error} <button className="underlined" onClick={() => void request()}>Retry</button></p>}
    <p className="survey-note">We store only your five answers and closest match, linked to a random browser ID in a cookie. No names, emails, or IP addresses. One response per browser.</p>
  </section>;

  const total = survey!.total;
  const topMatch = mine.topMatch;
  return <section className="survey-compare" aria-labelledby="survey-title">
    <div className="survey-head"><Users size={20} aria-hidden="true"/><h4 id="survey-title">How you compare</h4><span className="survey-count">{total.toLocaleString()} {total === 1 ? 'response' : 'responses'}, including yours</span></div>
    {stale && <div className="survey-stale"><p>Your shared answers differ from the ones above.</p><button className="button ink" onClick={() => void request('POST')} disabled={busy}>Update my shared answers</button></div>}
    <ol className="survey-questions">{questions.map((q, i) => {
      const counts = survey!.questions[i];
      const yours = key(mine.answers[i]);
      const options = [...q.options.map((o, j) => ({ k: String(o.value) as keyof Counts, letter: String.fromCharCode(65 + j), label: o.title })), { k: 'unsure' as const, letter: '?', label: 'Unsure / it depends' }];
      return <li key={q.title}>
        <p className="survey-q"><span>{String(i + 1).padStart(2, '0')}</span>{q.title}</p>
        <p className="survey-agree"><strong>{pct(counts[yours], total)}%</strong> answered the same as you.</p>
        <ul>{options.map(o => {
          const p = pct(counts[o.k], total);
          return <li key={o.k} className={o.k === yours ? 'yours' : ''}>
            <span className="survey-letter">{o.letter}</span>
            <span className="survey-label">{o.label}{o.k === yours && <Check size={14} aria-label="Your answer"/>}</span>
            <span className="survey-pct">{p}%</span>
            <span className="survey-track" aria-hidden="true"><span style={{ width: `${p}%` }}/></span>
          </li>;
        })}</ul>
      </li>;
    })}</ol>
    {survey!.topMatches.length > 0 && <div className="survey-matches">
      <p className="survey-q">Closest matches across all visitors</p>
      <ul>{survey!.topMatches.slice(0, 5).map(m => {
        const p = pct(m.count, total);
        return <li key={m.id} className={m.id === topMatch ? 'yours' : ''}>
          <span className="survey-label">{scenarios.find(s => s.id === m.id)?.name}{m.id === topMatch && <Check size={14} aria-label="Your closest match"/>}</span>
          <span className="survey-pct">{p}%</span>
          <span className="survey-track" aria-hidden="true"><span style={{ width: `${p}%` }}/></span>
        </li>;
      })}</ul>
    </div>}
    {message && <p className="survey-status" role="status">{message}</p>}
    {error && <p className="survey-error" role="alert">{error}</p>}
    <div className="survey-actions">
      <button className="back-button" onClick={() => void request()} disabled={busy}><RotateCcw size={15}/> Refresh</button>
      <button className="underlined" onClick={() => void request('DELETE')} disabled={busy}>Remove my answers</button>
    </div>
    <p className="survey-note">Voluntary responses from site visitors, not a representative sample. One response per browser; other devices or cleared cookies can allow repeats. Percentages are rounded.</p>
  </section>;
}
