import type { ReactNode } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

type ValuesSectionProps = {
  onShowMethod: () => void;
  children: ReactNode;
};

export function ValuesSection({ onShowMethod, children }: ValuesSectionProps) {
  return (
    <section
      className="values-section"
      id="values"
      aria-labelledby="values-title"
    >
      <div className="values-heading">
        <p className="eyebrow">01 / YOUR VALUES, YOUR COMPASS</p>
        <h2 id="values-title">
          A good future
          <br />
          starts with
          <br />
          <em>what matters.</em>
        </h2>
        <p>Five questions about the choices beneath the technology.</p>
        <p>
          Your answers connect you with futures to think through, including the
          parts you might reject.
        </p>
        <div className="privacy-note">
          <ShieldCheck size={17} />
          <span>
            Your answers stay in this page.
            <br />
            Reloading clears them.
          </span>
        </div>
        <button className="underlined" onClick={onShowMethod}>
          How the compass works <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="quiz-surface">{children}</div>
    </section>
  );
}
