import { ArrowUpRight } from 'lucide-react';
import { externalLink, twoDigits } from './format';

const researchNotes = [
  {
    title: 'Abundance is a governance question.',
    body: 'The OECD links AI benefits with inclusion, human agency, transparency, and accountability. More output alone does not answer who benefits.',
    href: 'https://www.oecd.org/en/topics/ai-principles.html',
    source: 'OECD AI Principles',
  },
  {
    title: 'Different people can want different futures.',
    body: 'UNESCO’s ethics recommendation grounds AI governance in dignity, diversity, participation, and human responsibility. A five-question quiz cannot speak for that diversity.',
    href: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
    source: 'UNESCO Recommendation on AI Ethics',
  },
  {
    title: 'Digital minds raise a separate question.',
    body: 'Long and colleagues argue for investigating possible AI welfare under uncertainty. This does not establish that AI is conscious, or imply that humanity should be replaced.',
    href: 'https://arxiv.org/abs/2411.00986',
    source: 'Taking AI Welfare Seriously, 2024',
  },
];

export function ThinkingSection({
  onShowMethod,
}: {
  onShowMethod: () => void;
}) {
  return (
    <section
      className="thinking-section"
      id="about"
      aria-labelledby="thinking-title"
    >
      <div className="thinking-intro">
        <p className="eyebrow">03 / KEEP THE QUESTION OPEN</p>
        <h2 id="thinking-title">
          A compass,
          <br />
          <span>not a crystal ball.</span>
        </h2>
        <p>
          A future can be prosperous without being fair, safe without being
          free, or intelligent without being humane. The useful question is what
          we would want to protect—and who gets a say.
        </p>
        <button className="underlined" onClick={onShowMethod}>
          Read the method and its limits <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="research-notes">
        {researchNotes.map((note, i) => (
          <article key={note.href}>
            <span className="source-number">{`[${twoDigits(i + 1)}]`}</span>
            <div>
              <h3>{note.title}</h3>
              <p>{note.body}</p>
              <a href={note.href} {...externalLink}>
                {note.source} <ArrowUpRight size={14} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
