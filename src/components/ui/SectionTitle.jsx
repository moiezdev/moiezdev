import { Link } from 'react-router-dom';
import Reveal from './Reveal';

const CHEVRON_DIR = { forward: 'rtl:-scale-x-100', back: 'ltr:-scale-x-100', down: 'rotate-90' };

export const Chevron = ({ className = 'w-3 h-3', dir = 'forward' }) => (
  <svg className={`${className} ${CHEVRON_DIR[dir]}`} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Section heading: optional eyebrow, large title, optional subtitle and "view all" link. */
const SectionTitle = ({ eyebrow, title, subtitle, buttonText, link, align = 'start' }) => (
  <Reveal
    className={`mb-10 md:mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
      align === 'center' ? 'items-center text-center md:flex-col md:items-center' : ''
    }`}
  >
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="headline-1 text-label">{title}</h2>
      {subtitle && <p className="lead mt-4">{subtitle}</p>}
    </div>
    {link && buttonText && (
      <Link to={link} className="link-arrow text-[17px] shrink-0">
        {buttonText}
        <Chevron />
      </Link>
    )}
  </Reveal>
);

export default SectionTitle;
