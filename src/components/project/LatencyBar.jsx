import { useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../motion/reducedMotion';
import { useContent } from '../../i18n/content';

/**
 * Before → after bars for an API latency improvement. Grows once when it
 * scrolls into view (scaleX from the start edge; instant with reduced motion).
 * With real p95 numbers (`beforeMs`/`afterMs` in the project's `latency` data)
 * the bars are labelled in ms; until then they show only the documented
 * relative change (before = 100%).
 */
export default function LatencyBar({ latency }) {
  const { t } = useContent();
  const ref = useRef(null);
  // full by default (HTML, no JS, reduced motion, on screen at load); only bars
  // still below the fold collapse, then grow once they scroll into view
  const [phase, setPhase] = useState('static'); // static | armed | in
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    setPhase('armed');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase('in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!latency?.reduction) return null;

  const hasMs = latency.beforeMs > 0 && latency.afterMs > 0;
  const after = hasMs ? latency.afterMs / latency.beforeMs : 1 - latency.reduction / 100;
  const label = (ms, pct) => (hasMs ? `${latency.percentile || 'p95'} ${ms} ms` : `${pct}%`);
  const rows = [
    { key: 'before', text: t('caseStudy.latency.before'), value: label(latency.beforeMs, 100), scale: 1, strong: false },
    { key: 'after', text: t('caseStudy.latency.after'), value: label(latency.afterMs, Math.round(after * 100)), scale: after, strong: true },
  ];

  return (
    <figure ref={ref} className="surface mt-3 p-5 md:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[15px] font-semibold text-label">{t('caseStudy.latency.title')}</span>
        <span className="text-[13px] text-label-3">{hasMs ? t('caseStudy.latency.measured') : t('caseStudy.latency.relative')}</span>
      </figcaption>
      <div className="mt-4 grid gap-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
            <span className="text-[13px] text-label-2">{r.text}</span>
            <span className="h-2.5 rounded-full bg-fill overflow-hidden">
              <span
                className={`latency-bar block h-full rounded-full ${r.strong ? 'bg-label' : 'bg-label-3'}`}
                style={{ '--to': r.scale, transitionDelay: `${i * 120}ms` }}
                data-phase={phase}
              />
            </span>
            <span className="font-mono text-[12px] text-label-2 tabular-nums" dir="ltr">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
