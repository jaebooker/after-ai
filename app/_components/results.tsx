import type { Ref } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { dimensions, type Match, type Scenario } from '../futures';
import { twoDigits } from './format';

type ResultsProps = {
  matches: Match[];
  headingRef: Ref<HTMLHeadingElement>;
  onSelect: (scenario: Scenario) => void;
  onEdit: () => void;
  onReset: () => void;
};

export function Results({
  matches,
  headingRef,
  onSelect,
  onEdit,
  onReset,
}: ResultsProps) {
  const hasMatches = matches.length > 0;

  return (
    <div className="results">
      <div className="quiz-top">
        <span className="eyebrow">YOUR COMPASS</span>
        <Compass size={23} />
      </div>
      <h3 ref={headingRef} tabIndex={-1}>
        {hasMatches
          ? 'Three futures to think through.'
          : 'Your compass is still open.'}
      </h3>
      <p className="question-context">
        {hasMatches
          ? 'These scenarios connect with your answers. None captures everything you value, and none is a prediction or an endorsement.'
          : 'You chose “unsure” throughout. There is no basis for a match yet. Explore the atlas or revisit any question when you’re ready.'}
      </p>
      {matches.map((match, i) => (
        <ResultCard
          key={match.scenario.id}
          match={match}
          rank={i}
          leader={matches[0]}
          onSelect={onSelect}
        />
      ))}
      {hasMatches && (
        <p className="result-caveat">
          Some scenarios leave values unspecified. Fewer compared dimensions
          means a thinner basis for reflection. Equal affinities are ordered by
          coverage, then name.
        </p>
      )}
      <div className="result-actions">
        <button className="button ink" onClick={onEdit}>
          Revisit my answers <ArrowLeft size={16} />
        </button>
        <button className="back-button" onClick={onReset}>
          <RotateCcw size={16} /> Start over
        </button>
        <a className="underlined" href="#futures">
          {hasMatches ? 'See matches on the map' : 'Explore the atlas'}{' '}
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}

type ResultCardProps = {
  match: Match;
  rank: number;
  leader: Match;
  onSelect: (scenario: Scenario) => void;
};

function ResultCard({ match, rank, leader, onSelect }: ResultCardProps) {
  const { scenario, compared, agreements, differences } = match;

  return (
    <article className="result-card">
      <div className="result-number">{twoDigits(rank + 1)}</div>
      <div className="result-body">
        <div className="result-label">
          {resultLabel(match, rank, leader)}{' '}
          <span>· {compared.length}/5 dimensions compared</span>
        </div>
        <button className="result-title" onClick={() => onSelect(scenario)}>
          {scenario.name}
          <ArrowUpRight size={22} />
        </button>
        <p>
          <strong>
            {agreements.length ? 'Connects on: ' : 'Nearest trade-off: '}
          </strong>
          {dimensionNames(agreements.length ? agreements : compared)}.
        </p>
        <p className="result-tension">
          <strong>Question to keep: </strong>
          {scenario.question}
        </p>
        {differences.length > 0 && (
          <p className="mismatch">
            Different from your choices on {dimensionNames(differences)}.
          </p>
        )}
      </div>
    </article>
  );
}

function resultLabel(match: Match, rank: number, leader: Match) {
  if (rank === 0) return 'CLOSEST DISCUSSION MATCH';
  if (Math.abs(match.distance - leader.distance) < 1e-9)
    return 'TIED ON AFFINITY';
  return 'ALSO WORTH EXPLORING';
}

const dimensionNames = (values: Match['compared']) =>
  values.map((v) => dimensions[v.dimension].toLowerCase()).join(', ');
