/** macOS-style window frame with traffic lights and a title. */
const WindowChrome = ({ title, meta, children, className = '' }) => (
  <div className={`surface overflow-hidden ${className}`}>
    <div className="relative flex items-center h-11 px-4 border-b border-separator bg-surface-2/70" dir="ltr">
      <span className="flex gap-2" aria-hidden>
        <span className="size-3 rounded-full bg-label-3/40" />
        <span className="size-3 rounded-full bg-label-3/40" />
        <span className="size-3 rounded-full bg-label-3/40" />
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[12px] text-label-2">{title}</span>
      {meta && (
        <span className="ms-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-label-3">
          <span className="status-dot !size-1.5" aria-hidden />
          {meta}
        </span>
      )}
    </div>
    {children}
  </div>
);

export default WindowChrome;
