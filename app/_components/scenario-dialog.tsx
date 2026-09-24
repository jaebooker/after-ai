import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  dimensions,
  questions,
  scenarios,
  sourceUrl,
  type Answers,
  type Scenario,
} from '../futures';
import { externalLink, twoDigits } from './format';

type ScenarioDialogProps = {
  scenario: Scenario | null;
  onSelect: (scenario: Scenario | null) => void;
};

export function ScenarioDialog({ scenario, onSelect }: ScenarioDialogProps) {
  return (
    <Dialog
      open={scenario !== null}
      onOpenChange={(open) => {
        if (!open) onSelect(null);
      }}
    >
      <DialogContent className="scenario-dialog">
        {scenario && <ScenarioDetail scenario={scenario} onSelect={onSelect} />}
      </DialogContent>
    </Dialog>
  );
}

function ScenarioDetail({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}) {
  const index = scenarios.indexOf(scenario);
  const position = twoDigits(index + 1);
  const go = (offset: number) =>
    onSelect(scenarios[(index + offset + scenarios.length) % scenarios.length]);

  return (
    <>
      <p className={`eyebrow ${!scenario.profile ? 'warning-text' : ''}`}>
        {scenario.profile ? 'A POSSIBLE WORLD' : 'A WARNING SCENARIO'} /{' '}
        {position}
      </p>
      <DialogTitle className="dialog-heading">{scenario.name}</DialogTitle>
      <DialogDescription className="scenario-summary">
        {scenario.summary}
      </DialogDescription>
      <a className="source-link" href={sourceUrl} {...externalLink}>
        Scenario source: FLI / Life 3.0 <ArrowUpRight size={14} />
      </a>
      <div className="reflection-block">
        <p className="eyebrow">A QUESTION TO TAKE WITH YOU</p>
        <h3>{scenario.question}</h3>
        <p>{scenario.tension}</p>
        <small>Original reflection prompt and commentary.</small>
      </div>
      {scenario.profile ? (
        <ProfileDetails id={scenario.id} profile={scenario.profile} />
      ) : (
        <p className="warning-explainer">
          This scenario is available for reflection but excluded from quiz
          matches.
        </p>
      )}
      <div className="dialog-nav">
        <button className="text-link" onClick={() => go(-1)}>
          <ArrowLeft size={16} /> Previous
        </button>
        <span>{position} / 12</span>
        <button className="text-link" onClick={() => go(1)}>
          Next future <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}

function ProfileDetails({ id, profile }: { id: string; profile: Answers }) {
  return (
    <details className="profile-details">
      <summary>
        How this future appears in the compass <Plus size={16} />
      </summary>
      <p>
        These are editorial interpretations. An unspecified dimension is
        excluded from matching.
      </p>
      <dl>
        {dimensions.map((dimension, i) => (
          <div key={dimension}>
            <dt>{dimension}</dt>
            <dd>
              {profile[i] === null
                ? 'Not specified'
                : questions[i].options.find((o) => o.value === profile[i])!
                    .title}
            </dd>
          </div>
        ))}
      </dl>
      {id === 'egalitarian' && (
        <p>
          The limit on stronger AI comes from Husfeldt’s adaptation, rather than
          FLI’s short summary.
        </p>
      )}
    </details>
  );
}
