import type { Ref } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { dimensions, questions } from '../futures';
import type { DraftAnswers } from './answers';
import { twoDigits } from './format';

type QuizProps = {
  step: number;
  answers: DraftAnswers;
  headingRef: Ref<HTMLHeadingElement>;
  onChoose: (value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
};

export function Quiz({
  step,
  answers,
  headingRef,
  onChoose,
  onBack,
  onNext,
}: QuizProps) {
  const question = questions[step];
  const answer = answers[step];
  const completed = answers.filter((v) => v !== undefined).length;
  const isLast = step === questions.length - 1;

  return (
    <>
      <div className="quiz-top">
        <span className="eyebrow">{twoDigits(step + 1)} / 05</span>
        <span>{dimensions[step]}</span>
        <Compass size={23} />
      </div>
      <Progress
        value={(completed / 5) * 100}
        aria-label={`${completed} of 5 questions answered`}
        className="quiz-progress"
      />
      <h3 ref={headingRef} tabIndex={-1}>
        {question.title}
      </h3>
      <p className="question-context">{question.context}</p>
      <RadioGroup
        key={step}
        aria-label={question.title}
        value={answer ?? null}
        onValueChange={onChoose}
        className="answer-options"
      >
        {question.options.map((option, i) => {
          const value = String(option.value);
          const chosen = answer === value;
          return (
            <label
              key={option.value}
              className={`answer-option ${chosen ? 'chosen' : ''}`}
            >
              <RadioGroupItem value={value} aria-label={option.title} />
              <span className="answer-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>
                <strong>{option.title}</strong>
                <small>{option.detail}</small>
              </span>
              {chosen && <Check size={19} className="answer-check" />}
            </label>
          );
        })}
        <label
          className={`unsure-option ${answer === 'unsure' ? 'chosen' : ''}`}
        >
          <RadioGroupItem value="unsure" aria-label="Unsure or it depends" />
          <span>Unsure / it depends</span>
        </label>
      </RadioGroup>
      <div className="quiz-bottom">
        <button className="back-button" disabled={step === 0} onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </button>
        <span>
          {isLast
            ? 'A starting point for reflection.'
            : 'You can change your answers.'}
        </span>
        <button
          className="button ink"
          disabled={answer === undefined}
          onClick={onNext}
        >
          {isLast ? 'See my futures' : 'Continue'}
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
