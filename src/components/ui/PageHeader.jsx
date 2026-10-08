
/** Large centered page header used at the top of every inner page. */
const PageHeader = ({ eyebrow, title, subtitle, children }) => (
  <header className="relative px-5 pt-[132px] md:pt-[168px] pb-14 md:pb-20 text-center overflow-hidden">
    <div
      aria-hidden
      className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[520px] opacity-50 dark:opacity-35 blur-3xl"
      style={{
        background:
          'radial-gradient(45% 55% at 40% 45%, var(--glow-a), transparent 70%), radial-gradient(35% 45% at 65% 50%, var(--glow-b), transparent 70%)',
      }}
    />
    <div className="relative app-container flex flex-col items-center">
      {eyebrow && (
        <p className="eyebrow mb-4">
          {eyebrow}
        </p>
      )}
      <h1 className="headline-hero text-label max-w-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="lead mt-5 max-w-2xl">
          {subtitle}
        </p>
      )}
      {children && (
        <div className="mt-8">
          {children}
        </div>
      )}
    </div>
  </header>
);

export default PageHeader;
