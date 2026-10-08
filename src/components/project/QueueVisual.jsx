import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContent } from '../../i18n/content';
import { usePauseWhenHidden } from '../../motion/usePauseWhenHidden';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

// illustrative jobs; one fails once and is retried
const JOBS = [
  { id: 1, name: 'wallet.update' },
  { id: 2, name: 'notify.push' },
  { id: 3, name: 'wallet.update' },
  { id: 4, name: 'notify.push' },
];
// per frame, each job's state: w waiting · a active · c completed · f failed (then retried)
const FRAMES = ['wwww', 'awww', 'caww', 'ccaw', 'ccfa', 'ccwc', 'ccac', 'cccc', 'cccc'];
const STATIC_FRAME = 5; // reduced motion: shows every state, including the retry
const COL = { w: 0, a: 1, f: 1, c: 2 };
const TICK = 900;

/**
 * BullMQ in miniature: jobs move waiting → active → completed, and one fails
 * once and is retried. Small, transform-only moves; loops only while visible
 * (and the tab is visible); a single static frame with reduced motion.
 */
export default function QueueVisual() {
  const { t } = useContent();
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [frame, setFrame] = useState(STATIC_FRAME);
  const running = usePauseWhenHidden(ref);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) return setFrame(STATIC_FRAME);
    if (!running) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), TICK);
    return () => clearInterval(id);
  }, [running, reduced]);

  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const states = FRAMES[frame];
  const colW = width / 3;
  const columns = [t('caseStudy.queue.waiting'), t('caseStudy.queue.active'), t('caseStudy.queue.completed')];
  const retried = frame >= 5;

  return (
    <figure className="surface p-5 md:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[15px] font-semibold text-label">{t('caseStudy.queue.title')}</span>
        <span className="text-[12px] text-label-3">{t('caseStudy.queue.illustrative')}</span>
      </figcaption>
      <div ref={ref} className="relative mt-4 h-[188px]" role="img" aria-label={t('caseStudy.queue.alt')}>
        {columns.map((label, i) => (
          <div key={label} className="absolute top-0 bottom-0 border-s border-separator ps-3 first:border-s-0 first:ps-0" style={{ insetInlineStart: `${(i * 100) / 3}%`, width: `${100 / 3}%` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3">{label}</p>
          </div>
        ))}
        {width > 0 &&
          JOBS.map((job, j) => {
            const st = states[j];
            const col = COL[st];
            // stack order inside a column: jobs earlier in the list sit higher
            const row = JOBS.slice(0, j).filter((_, k) => COL[states[k]] === col).length;
            const x = (rtl ? 2 - col : col) * colW + (col === 0 && !rtl ? 0 : 12);
            const y = 28 + row * 38;
            return (
              <div
                key={job.id}
                className="queue-job absolute top-0 left-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] ring-1"
                data-state={st}
                style={{ transform: `translate(${x}px, ${y}px)`, maxWidth: colW - 16 }}
                dir="ltr"
              >
                <span className="truncate">#{job.id} {job.name}</span>
                {st === 'f' && <span className="shrink-0 font-sans font-semibold">{t('caseStudy.queue.failed')}</span>}
                {job.id === 3 && retried && st !== 'f' && <span className="shrink-0 font-sans">↻ 2</span>}
              </div>
            );
          })}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-label-2">{t('caseStudy.queue.caption')}</p>
    </figure>
  );
}
