import { ArrowUpRight } from 'lucide-react';
import { sourceUrl } from '../futures';
import { Brand } from './brand';
import { externalLink } from './format';

export function SiteFooter() {
  return (
    <footer>
      <Brand />
      <div>
        <p>
          An independent exploration inspired by{' '}
          <a href={sourceUrl} {...externalLink}>
            Max Tegmark / Future of Life Institute
          </a>
          ,{' '}
          <a
            href="https://thorehusfeldt.com/wp-content/uploads/2018/05/tegmark-001.png"
            {...externalLink}
          >
            Thore Husfeldt’s chart
          </a>
          , and{' '}
          <a href="https://www.tomorrows-ai.org/" {...externalLink}>
            Tomorrow’s AI
          </a>
          .
        </p>
        <p>
          Not affiliated with or endorsed by these organizations. Original
          AI-generated illustration.
        </p>
      </div>
      <a className="back-to-top" href="#">
        BACK TO TOP <ArrowUpRight size={16} />
      </a>
    </footer>
  );
}
