'use client';

import { useEffect, useRef, useState } from 'react';
import { questions, rankScenarios, type Scenario } from './futures';
import { emptyAnswers, fromValues, toValues } from './_components/answers';
import { Atlas } from './_components/atlas';
import { Hero } from './_components/hero';
import { MethodDialog } from './_components/method-dialog';
import { Quiz } from './_components/quiz';
import { Results } from './_components/results';
import { ScenarioDialog } from './_components/scenario-dialog';
import { SiteFooter } from './_components/site-footer';
import { SiteHeader } from './_components/site-header';
import { ThinkingSection } from './_components/thinking-section';
import { useModelContextTools } from './_components/use-model-context-tools';
import { ValuesSection } from './_components/values-section';

const lastStep = questions.length - 1;

export default function Home() {
  const [answers, setAnswers] = useState(emptyAnswers);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const focusRequested = useRef(false);

  const matches = finished ? rankScenarios(toValues(answers)).slice(0, 3) : [];
  const matchIds = new Set(matches.map((m) => m.scenario.id));

  useEffect(() => {
    if (focusRequested.current) {
      (finished ? resultHeading : questionHeading).current?.focus({
        preventScroll: true,
      });
      focusRequested.current = false;
    }
  }, [step, finished]);

  useModelContextTools({
    onCompleteValues(values) {
      setAnswers(fromValues(values));
      setStep(lastStep);
      setFinished(true);
    },
    onOpenScenario: setSelected,
  });

  function navigate(next: number) {
    focusRequested.current = true;
    setStep(next);
  }
  function finish() {
    focusRequested.current = true;
    setFinished(true);
  }
  function reset() {
    focusRequested.current = true;
    setAnswers(emptyAnswers());
    setStep(0);
    setFinished(false);
  }
  function edit() {
    focusRequested.current = true;
    setStep(0);
    setFinished(false);
  }
  function choose(value: unknown) {
    setAnswers((prev) => prev.map((v, i) => (i === step ? String(value) : v)));
  }
  const showMethod = () => setMethodOpen(true);

  return (
    <main>
      <a className="skip" href="#values">
        Skip to the values explorer
      </a>
      <SiteHeader />
      <Hero />
      <ValuesSection onShowMethod={showMethod}>
        {finished ? (
          <Results
            matches={matches}
            headingRef={resultHeading}
            onSelect={setSelected}
            onEdit={edit}
            onReset={reset}
          />
        ) : (
          <Quiz
            step={step}
            answers={answers}
            headingRef={questionHeading}
            onChoose={choose}
            onBack={() => navigate(step - 1)}
            onNext={() => (step < lastStep ? navigate(step + 1) : finish())}
          />
        )}
      </ValuesSection>
      <Atlas matchIds={matchIds} onSelect={setSelected} />
      <ThinkingSection onShowMethod={showMethod} />
      <SiteFooter />
      <ScenarioDialog scenario={selected} onSelect={setSelected} />
      <MethodDialog open={methodOpen} onOpenChange={setMethodOpen} />
    </main>
  );
}
