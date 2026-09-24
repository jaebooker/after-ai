import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { sourceUrl } from '../futures';
import { externalLink } from './format';

const steps = [
  {
    title: 'Five editorial dimensions.',
    body: 'Agency, distribution, pluralism, development ambition, and continuity. They are not a validated psychological test.',
  },
  {
    title: 'Three positions per dimension.',
    body: 'The options are coded −1, 0, and +1. “Unsure” is excluded; it is not treated as a middle position.',
  },
  {
    title: 'Compare what is specified.',
    body: 'Each scenario has an editorial profile, visible in its detail panel. We average the absolute differences only where both your answer and its profile are specified, with equal weight.',
  },
  {
    title: 'Offer three discussion matches.',
    body: 'Lower average differences rank first. Ties are ordered by the number of dimensions compared, then name. Sparse profiles can appear close on limited evidence. With all answers unsure, we return no matches.',
  },
  {
    title: 'Keep warnings visible.',
    body: 'Conquerors, Zookeeper, 1984, and Self-destruction stay in the atlas but are excluded from matches. This is an editorial choice, not a claim that the other scenarios are desirable.',
  },
];

type MethodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MethodDialog({ open, onOpenChange }: MethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="method-dialog">
        <p className="eyebrow">READING THE COMPASS</p>
        <DialogTitle className="dialog-heading">
          An invitation to reflect.
        </DialogTitle>
        <DialogDescription className="scenario-summary">
          Your values do not predict what will happen. These matches identify
          questions you might want to explore.
        </DialogDescription>
        <ol>
          {steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> {step.body}
            </li>
          ))}
        </ol>
        <p className="method-note">
          The map’s positions are approximate, not data. The source scenarios
          overlap and omit many possible futures. “Superintelligence” here means
          hypothetical AI that greatly exceeds human abilities; an “upload” is a
          hypothetical digital version of a human mind.
        </p>
        <a className="source-link" href={sourceUrl} {...externalLink}>
          Start with the original twelve scenarios <ArrowUpRight size={16} />
        </a>
      </DialogContent>
    </Dialog>
  );
}
