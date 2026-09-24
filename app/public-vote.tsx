'use client';

import { useEffect, useState } from 'react';
import { Check, ArrowRight, RotateCcw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { scenarios } from './futures';

type Results = { total: number; choice: string | null; counts: { id: string; votes: number }[] };

export function PublicVote() {
  const [results, setResults] = useState<Results | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function request(method: 'GET' | 'POST' | 'DELETE' = 'GET') {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/votes', {
        method, credentials: 'same-origin', cache: 'no-store',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }) } : {}),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Voting is temporarily unavailable. Please refresh and try again.');
      const data = await response.json() as Results & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
      setResults(data); setChoice(data.choice);
      if (method === 'POST') setMessage('Your choice is counted. You can change it at any time.');
      if (method === 'DELETE') setMessage('Your vote has been removed from the results.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }
  useEffect(() => { void request(); }, []);
  const sorted = scenarios.map(s => ({ ...s, votes: results?.counts.find(r => r.id === s.id)?.votes ?? 0 }))
    .sort((a, b) => b.votes - a.votes);

  return <section className="public-vote" id="public-vote" aria-labelledby="vote-title">
    <div className="section-heading">
      <div><p className="eyebrow">03 / A FUTURE WORTH CHOOSING</p><h2 id="vote-title">Which future<br/><span>would you choose?</span></h2></div>
      <div className="section-aside"><p>Your compass match is a starting point. Your preferred future is a separate choice.</p><p>Cast an optional vote, or simply explore what other visitors have chosen. All twelve scenarios are included.</p></div>
    </div>
    <div className="vote-layout">
      <form className="vote-ballot" onSubmit={event => { event.preventDefault(); void request('POST'); }}>
        <h3>Your choice</h3><p>Choose the future you would most want to live in.</p>
        <RadioGroup aria-label="Your preferred future" value={choice} onValueChange={value => setChoice(String(value))} disabled={busy || !results} className="vote-options">
          {scenarios.map(s => <label key={s.id} className={`vote-option ${choice === s.id ? 'chosen' : ''}`}>
            <RadioGroupItem value={s.id} aria-label={s.name}/><span>{s.name}{results?.choice === s.id && <small>Your current vote</small>}</span>
            {choice === s.id && <Check size={16} aria-hidden="true"/>}
          </label>)}
        </RadioGroup>
        <div className="vote-actions"><button className="button ink" type="submit" disabled={busy || !results || !choice || results.choice === choice}>{busy ? 'Please wait…' : results?.choice ? 'Update my vote' : 'Cast my vote'}<ArrowRight size={17}/></button>
        {results?.choice && <button className="underlined" type="button" disabled={busy} onClick={() => void request('DELETE')}>Remove my vote</button>}</div>
        <p className="vote-status" role="status">{message}</p>
        {error && <p className="vote-error" role="alert">{error} <button className="underlined" type="button" disabled={busy} onClick={() => void request()}>Refresh results</button></p>}
        <p className="vote-privacy">Voting saves your choice and uses an anonymous cookie to remember this browser for up to a year. Your five quiz answers are never submitted.</p>
      </form>
      <div className="vote-results" aria-busy={busy}>
        <div className="vote-results-heading"><div><p className="eyebrow">THE VISITORS’ VIEW</p><h3>{results ? `${results.total.toLocaleString()} ${results.total === 1 ? 'vote' : 'votes'}` : busy ? 'Loading results…' : 'Results unavailable'}</h3></div><button className="vote-refresh" onClick={() => void request()} disabled={busy} aria-label="Refresh vote results"><RotateCcw size={18}/></button></div>
        {results && results.total === 0 && <p className="vote-empty">No votes yet. Yours could be the first.</p>}
        {results && <ol className="vote-bars">{sorted.map(s => {
          const percentage = results.total ? s.votes / results.total * 100 : 0;
          return <li key={s.id} className={results.choice === s.id ? 'your-vote' : ''}>
            <div className="vote-bar-label"><span>{s.name}{results.choice === s.id && <Check size={14} aria-label="Your vote"/>}</span><span>{s.votes.toLocaleString()} <small>· {percentage.toFixed(1)}%</small></span></div>
            <div className="vote-bar-track" aria-hidden="true"><div style={{ width: `${percentage}%` }}/></div>
          </li>;
        })}</ol>}
        <p className="vote-method">Voluntary votes from site visitors, not a representative survey or a prediction. One active vote per browser; changing your choice replaces your previous vote. Other devices, private browsing, or clearing cookies can allow repeat votes. Percentages may not total 100% because of rounding.</p>
      </div>
    </div>
  </section>;
}
