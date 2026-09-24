import { ArrowRight, ArrowUpRight, MoveDown, Plus } from 'lucide-react';

export function Hero() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-art">
          <img
            src="/future-city.webp"
            width="1672"
            height="941"
            alt="A lone person faces two diverging bridges toward a vast cyan city beneath an amber sun."
            fetchPriority="high"
          />
          <div className="hero-art-shade" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">+ MANY POSSIBLE WORLDS. ONE SHARED FUTURE.</p>
          <h1 id="hero-title">
            The future
            <br />
            isn’t written.
            <br />
            <span>
              Where do
              <br />
              you stand?
            </span>
          </h1>
          <p className="hero-intro">
            AI could change what it means to be human.
            <br />
            Explore twelve possible futures. Find out what matters to you.
          </p>
          <div className="hero-actions">
            <a className="button orange" href="#values">
              Find your future <ArrowUpRight size={20} />
            </a>
            <a className="text-link" href="#futures">
              Explore all 12 <ArrowRight size={17} />
            </a>
          </div>
          <p className="hero-meta">
            5 QUESTIONS <span>·</span> ABOUT 2 MINUTES <span>·</span> NO RIGHT
            ANSWERS
          </p>
        </div>
        <div className="art-caption">
          <span>THE NEXT CHAPTER IS STILL OPEN</span>
          <span>
            IMAGINE / QUESTION / CHOOSE <Plus size={15} />
          </span>
        </div>
      </section>
      <div className="bridge">
        <span>More intelligence is only part of the story.</span>
        <span>
          Who has power? Who benefits? What do we preserve?{' '}
          <MoveDown size={19} />
        </span>
      </div>
    </>
  );
}
