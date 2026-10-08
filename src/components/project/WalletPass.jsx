import { useRef, useState } from 'react';
import Img from '../ui/Img';
import { useContent } from '../../i18n/content';
import { prefersReducedMotion } from '../../motion/reducedMotion';

const MAX_TILT = 6; // degrees

/**
 * A wallet pass shown like Apple Wallet: tap/click/Enter flips it (3D, 400ms);
 * on desktop it tilts up to ±6° toward the pointer. Static on touch and with
 * reduced motion (the flip is then instant). Image paths come from the
 * project's `walletPass` data; without a back image the back lists what
 * powers the pass (facts from the case study).
 */
export default function WalletPass({ project }) {
  const { t } = useContent();
  const pass = project.walletPass;
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef(null);
  const raf = useRef(0);
  const target = useRef({ x: 0, y: 0 });

  if (!pass?.front) return null;

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    target.current = {
      x: ((e.clientY - r.top) / r.height - 0.5) * -2 * MAX_TILT,
      y: ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX_TILT,
    };
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        tiltRef.current?.style.setProperty('--rx', `${target.current.x.toFixed(2)}deg`);
        tiltRef.current?.style.setProperty('--ry', `${target.current.y.toFixed(2)}deg`);
      });
    }
  };
  const resetTilt = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    tiltRef.current?.style.setProperty('--rx', '0deg');
    tiltRef.current?.style.setProperty('--ry', '0deg');
  };

  const rows = t('caseStudy.pass.rows');

  return (
    <figure className="surface p-6 md:p-8 grid gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
      <div className="mx-auto w-full max-w-[280px]" onPointerMove={onPointerMove} onPointerLeave={resetTilt}>
        <div ref={tiltRef} className="pass-tilt">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label={flipped ? t('caseStudy.pass.showFront') : t('caseStudy.pass.showBack')}
            data-cursor-label={t('cursor.flip')}
            className={`pass-flip block w-full ${flipped ? 'is-flipped' : ''}`}
            style={{ aspectRatio: '337 / 432' }}
          >
            <span className="pass-face" aria-hidden={flipped}>
              <Img src={pass.front} alt={t('caseStudy.pass.frontAlt')} sizes="280px" className="size-full object-contain" />
            </span>
            <span className="pass-face pass-back" aria-hidden={!flipped}>
              {pass.back ? (
                <Img src={pass.back} alt={t('caseStudy.pass.backAlt')} sizes="280px" className="size-full object-contain" />
              ) : (
                <span className="flex size-full flex-col rounded-[18px] bg-surface-2 p-5 text-start ring-1 ring-separator">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-label-3">{t('caseStudy.pass.backTitle')}</span>
                  <span className="mt-4 flex flex-col divide-y divide-separator">
                    {Array.isArray(rows) &&
                      rows.map((row) => (
                        <span key={row.k} className="py-2.5">
                          <span className="block text-[11px] text-label-3">{row.k}</span>
                          <span className="block text-[13px] font-medium leading-snug text-label">{row.v}</span>
                        </span>
                      ))}
                  </span>
                </span>
              )}
            </span>
          </button>
        </div>
      </div>
      <figcaption className="max-w-md">
        <p className="text-[19px] font-semibold tracking-[-0.02em] text-label">{t('caseStudy.pass.title')}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-label-2">{t('caseStudy.pass.caption')}</p>
        <button type="button" onClick={() => setFlipped((f) => !f)} className="link-arrow mt-4 text-[14px]">
          {flipped ? t('caseStudy.pass.showFront') : t('caseStudy.pass.showBack')}
        </button>
      </figcaption>
    </figure>
  );
}
