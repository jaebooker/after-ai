import type { Answers } from '../futures';

/** Radio values as strings, `'unsure'`, or `undefined` while unanswered. */
export type DraftAnswers = (string | undefined)[];

export const emptyAnswers = (): DraftAnswers => Array(5).fill(undefined);

export const toValues = (answers: DraftAnswers): Answers =>
  answers.map((v) =>
    v === undefined || v === 'unsure' ? null : Number(v),
  ) as Answers;

export const fromValues = (values: Answers): DraftAnswers =>
  values.map((v) => (v === null ? 'unsure' : String(v)));
