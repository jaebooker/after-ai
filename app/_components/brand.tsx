import { Asterisk } from 'lucide-react';

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
