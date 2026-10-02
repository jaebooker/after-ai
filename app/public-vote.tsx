'use client';

import { useEffect, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { scenarios } from './futures';

type Results = { total: number; choice: string | null; counts: { id: string; votes: number }[] };

/** Final step of the journey: pick the future you would choose, then see what other visitors chose. */
export function PublicVote({ matches, onAbout }: { matches: string[]; onAbout: () => void }) {
  const [results, setResults] = useState<Results | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [peek, setPeek] = useState(false);

  async function request(method: 'GET' | 'POST' | 'DELETE' = 'GET') {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/votes', {
        method, credentials: 'same-origin', cache: 'no-store',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }) } : {}),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Voting is unavailable right now.');
      const data = await response.json() as Results & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
      setResults(data); setChoice(data.choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }
  useEffect(() => { void request(); }, []);

  // The visitor's compass matches lead the ballot; the rest follow in atlas order.
  const ballot = [...matches.flatMap(id => scenarios.filter(s => s.id === id)), ...scenarios.filter(s => !matches.includes(s.id))];
  // Only futures that have votes are charted, so the list stays short.
  const sorted = scenarios.map(s => ({ ...s, votes: results?.counts.find(r => r.id === s.id)?.votes ?? 0 })).filter(s => s.votes > 0).sort((a, b) => b.votes - a.votes);
  const voted = Boolean(results?.choice);
  const showResults = results && (voted || peek);

  return <div className="vote-step">
    <form className="vote-ballot" onSubmit={event => { event.preventDefault(); void request('POST'); }}>
      <RadioGroup aria-label="The future you would choose" value={choice} onValueChange={value => setChoice(String(value))} disabled={busy || !results} className="vote-options">
        {ballot.map(s => <label key={s.id} className={`vote-option ${choice === s.id ? 'chosen' : ''}`}>
          <RadioGroupItem value={s.id} aria-label={s.name}/><span>{s.name}{matches.includes(s.id) && <small>Your match</small>}</span>
          {choice === s.id && <Check size={16} aria-hidden="true"/>}
        </label>)}
      </RadioGroup>
      <div className="vote-actions">
        <button className="button ink" type="submit" disabled={busy || !results || !choice || results.choice === choice}>{busy ? 'Please wait…' : voted ? (results?.choice === choice ? 'Vote counted' : 'Change my vote') : 'Cast my vote'}{!(voted && results?.choice === choice) && <ArrowRight size={17}/>}</button>
        {voted ? <button className="underlined" type="button" disabled={busy} onClick={() => void request('DELETE')}>Remove my vote</button>
          : results && !peek && <button className="underlined" type="button" onClick={() => setPeek(true)}>Skip to the results</button>}
      </div>
      {error && <p className="vote-error" role="alert">{error} <button className="underlined" type="button" disabled={busy} onClick={() => void request()}>Retry</button></p>}
    </form>
    {showResults && <div className="vote-results" aria-busy={busy}>
      <p className="eyebrow">WHAT VISITORS CHOSE</p>
      <h4>{results.total.toLocaleString()} {results.total === 1 ? 'vote' : 'votes'}</h4>
      {results.total === 0 ? <p className="vote-empty">No votes yet. Yours could be the first.</p> : <ol className="vote-bars">{sorted.map(s => {
        const percentage = s.votes / results.total * 100;
        return <li key={s.id} className={results.choice === s.id ? 'your-vote' : ''}>
          <div className="vote-bar-label"><span>{s.name}{results.choice === s.id && <Check size={14} aria-label="Your vote"/>}</span><span>{s.votes.toLocaleString()} <small>· {percentage.toFixed(0)}%</small></span></div>
          <div className="vote-bar-track" aria-hidden="true"><div style={{ width: `${percentage}%` }}/></div>
        </li>;
      })}</ol>}
    </div>}
    <p className="step-note">Anonymous, one vote per browser. A visitor poll, not a representative survey. <button className="underlined" type="button" onClick={onAbout}>What is stored</button></p>
  </div>;
}
