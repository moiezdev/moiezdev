/** Small "opens elsewhere" arrow for external links. It points up and out in both
 *  directions: like the Latin text it sits beside, it is not mirrored in RTL. */
const ExternalIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ExternalIcon;
