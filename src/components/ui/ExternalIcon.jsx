/** Small "opens elsewhere" arrow for external links; mirrors in RTL. */
const ExternalIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={`${className} rtl:-scale-x-100`} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ExternalIcon;
