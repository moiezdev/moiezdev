import Reveal from './Reveal';

/** Large centered page header used at the top of every inner page. */
const PageHeader = ({ eyebrow, title, subtitle, children }) => (
  <header className="relative px-5 pt-[132px] md:pt-[168px] pb-14 md:pb-20 text-center overflow-hidden">
    <div
      aria-hidden
      className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[520px] opacity-50 dark:opacity-35 blur-3xl"
      style={{
        background:
          'radial-gradient(45% 55% at 40% 45%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%), radial-gradient(35% 45% at 65% 50%, rgba(162,89,255,0.22), transparent 70%)',
      }}
    />
    <div className="relative app-container flex flex-col items-center">
      {eyebrow && (
        <Reveal as="p" className="eyebrow mb-4">
          {eyebrow}
        </Reveal>
      )}
      <Reveal as="h1" delay={60} className="headline-hero text-label max-w-4xl">
        {title}
      </Reveal>
      {subtitle && (
        <Reveal as="p" delay={120} className="lead mt-5 max-w-2xl">
          {subtitle}
        </Reveal>
      )}
      {children && (
        <Reveal delay={180} className="mt-8">
          {children}
        </Reveal>
      )}
    </div>
  </header>
);

export default PageHeader;
