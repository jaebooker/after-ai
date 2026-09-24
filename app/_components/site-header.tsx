import { ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand label="After AI home" />
      <nav aria-label="Main navigation">
        <a href="#futures">The futures</a>
        <a href="#values">Your values</a>
        <a href="#about">
          The thinking behind it <ArrowUpRight size={14} />
        </a>
      </nav>
      <span className="header-note">
        <i /> A FIELD GUIDE TO WHAT COMES NEXT
      </span>
    </header>
  );
}
