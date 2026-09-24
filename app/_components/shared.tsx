import { Asterisk } from 'lucide-react';
import type { Answers } from '../futures';

/** One entry per question: an option value as a string, 'unsure', or unanswered. */
export type AnswerDraft = (string | undefined)[];

export const emptyAnswers = (): AnswerDraft => Array(5).fill(undefined);

export const toValues = (answers: AnswerDraft): Answers =>
  answers.map((v) =>
    v === undefined || v === 'unsure' ? null : Number(v),
  ) as Answers;

export const fromValues = (values: Answers): AnswerDraft =>
  values.map((v) => (v === null ? 'unsure' : String(v)));

export const twoDigits = (n: number) => String(n).padStart(2, '0');

export const externalLink = { target: '_blank', rel: 'noopener noreferrer' };

export function Brand({ label }: { label?: string }) {
  return (
    <a href="#" className="brand" aria-label={label}>
      <Asterisk aria-hidden="true" />
      <span>
        AFTER<span className="brand-ai">AI</span>
      </span>
    </a>
  );
}
