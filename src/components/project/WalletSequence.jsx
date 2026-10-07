import { useId } from 'react';
import { useContent } from '../../i18n/content';

const W = 780;
const TOP = 16;
const BOX_H = 44;
const ROW = 46;
const FIRST = TOP + BOX_H + 40;

const ACTORS = ['source', 'api', 'queue', 'worker', 'wallet', 'device'];
const x = (i) => 65 + i * 130;

// [from, to, label key]: webhook → BullMQ job → pass update → push
const STEPS = [
  [0, 1, 'webhook'],
  [1, 2, 'enqueue'],
  [2, 3, 'process'],
  [3, 4, 'update'],
  [4, 5, 'push'],
  [5, 4, 'refresh'],
];

const H = FIRST + STEPS.length * ROW + 10;

/**
 * Sequence diagram of the Apple/Google Wallet pass update flow, as inline SVG.
 * Colours come from the theme tokens; the drawing stays left-to-right on RTL
 * pages, and the numbered list underneath carries the same steps as text.
 */
export default function WalletSequence() {
  const { t } = useContent();
  const id = useId().replace(/:/g, '');
  const label = (k) => t(`caseStudy.seq.${k}`);

  return (
    <figure className="surface !rounded-[20px] p-4 md:p-6">
      <div className="overflow-x-auto" dir="ltr">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[640px] h-auto"
          role="img"
          aria-labelledby={`${id}-t ${id}-d`}
        >
          <title id={`${id}-t`}>{t('caseStudy.seq.title')}</title>
          <desc id={`${id}-d`}>{STEPS.map(([, , k], i) => `${i + 1}. ${label(k)}`).join(' ')}</desc>
          <defs>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" style={{ fill: 'var(--color-label-2)' }} />
            </marker>
          </defs>

          {ACTORS.map((a, i) => (
            <g key={a}>
              <line x1={x(i)} x2={x(i)} y1={TOP + BOX_H} y2={H - 4} strokeDasharray="3 5" style={{ stroke: 'var(--color-separator)', strokeWidth: 1.5 }} />
              <rect x={x(i) - 58} y={TOP} width="116" height={BOX_H} rx="12" style={{ fill: 'var(--color-surface-2)', stroke: 'var(--color-separator)' }} />
              <text x={x(i)} y={TOP + BOX_H / 2 + 4.5} textAnchor="middle" style={{ fill: 'var(--color-label)', fontSize: 13, fontWeight: 600 }}>
                {label(`actor.${a}`)}
              </text>
            </g>
          ))}

          {STEPS.map(([from, to, k], i) => {
            const y = FIRST + i * ROW;
            const dir = to > from ? 1 : -1;
            const x1 = x(from) + dir * 6;
            const x2 = x(to) - dir * 8;
            const back = k === 'refresh';
            return (
              <g key={k}>
                <line
                  x1={x1}
                  x2={x2}
                  y1={y}
                  y2={y}
                  markerEnd={`url(#${id}-arrow)`}
                  strokeDasharray={back ? '5 4' : undefined}
                  style={{ stroke: 'var(--color-label-2)', strokeWidth: 1.5 }}
                />
                <circle cx={x(from) - dir * 17} cy={y} r="8" style={{ fill: 'var(--color-label)' }} />
                <text x={x(from) - dir * 17} y={y + 3.5} textAnchor="middle" style={{ fill: 'var(--color-bg)', fontSize: 10, fontWeight: 700 }}>
                  {i + 1}
                </text>
                <text
                  x={(x(from) + x(to)) / 2}
                  y={y - 9}
                  textAnchor="middle"
                  style={{ fill: 'var(--color-label-2)', fontSize: 12 }}
                >
                  {label(k)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-4 border-t border-separator pt-4">
        <p className="text-[13px] font-semibold text-label">{t('caseStudy.seq.title')}</p>
        <ol className="mt-2 grid gap-1 sm:grid-cols-2 text-[13px] leading-relaxed text-label-2 list-decimal ps-5">
          {STEPS.map(([, , k]) => (
            <li key={k}>{t(`caseStudy.seq.steps.${k}`)}</li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
