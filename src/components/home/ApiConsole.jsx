import { useLayoutEffect, useRef, useState } from 'react';
import WindowChrome from '../ui/WindowChrome';
import { useContent } from '../../i18n/content';
import { prefersReducedMotion } from '../../motion/reducedMotion';

// token helpers for the JSON/HTTP lines: k key, s string, n number, m method, p plain
const k = (v) => ['k', `"${v}"`];
const s = (v) => ['s', `"${v}"`];
const n = (v) => ['n', String(v)];
const p = (v) => ['p', v];

/** Illustrative request/response pairs (not live data; labelled on the card). */
const buildTabs = (t) => {
  const results = t('aiConsole.results');
  return {
    order: {
      request: [
        [['m', 'POST'], p(' /v1/orders')],
        [p('Authorization: Bearer eyJhbGciOi…')],
        [p('Content-Type: application/json')],
        [],
        [p('{ '), k('branchId'), p(': '), s('riyadh-olaya'), p(',')],
        [p('  '), k('items'), p(': [{ '), k('sku'), p(': '), s('flat-white'), p(', '), k('qty'), p(': '), n(2), p(' }],')],
        [p('  '), k('payment'), p(': '), s('mada'), p(' }')],
      ],
      status: { code: '201 Created', ms: 142 },
      response: [
        [p('{ '), k('id'), p(': '), s('ord_8f2k1'), p(', '), k('status'), p(': '), s('paid'), p(',')],
        [p('  '), k('subtotal'), p(': '), n('30.00'), p(', '), k('vat'), p(': '), n('4.50'), p(',')],
        [p('  '), k('total'), p(': '), n('34.50'), p(', '), k('currency'), p(': '), s('SAR'), p(' }')],
      ],
    },
    search: {
      request: [
        [['m', 'POST'], p(' /v1/menu/search')],
        [p('Content-Type: application/json')],
        [],
        [p('{ '), k('query'), p(': '), s(t('aiConsole.query')), p(' }')],
      ],
      status: { code: '200 OK', ms: 380 },
      response: [
        [p('{ '), k('results'), p(': [')],
        ...(Array.isArray(results) ? results : []).flatMap((r, i, all) => [
          [p('  { '), k('name'), p(': '), s(r.name), p(',')],
          [p('    '), k('price'), p(': '), n(r.price), p(', '), k('score'), p(': '), n(r.score), p(i < all.length - 1 ? ' },' : ' }')],
        ]),
        [p('] }')],
      ],
    },
  };
};

const Line = ({ tokens, i }) => (
  <div className="con-line min-h-[1.6em] whitespace-pre" style={{ '--i': i }}>
    {tokens.map(([cls, text], j) => (
      <span key={j} className={`con-${cls}`}>
        {text}
      </span>
    ))}
  </div>
);

/**
 * Minimal API console: request lines fade in, then the status pill, then the
 * JSON response (< 2s). Plays once when scrolled to, again on tab change or
 * Replay. Complete by default (no JS, reduced motion, on screen at load).
 */
export default function ApiConsole() {
  const { t, lang } = useContent();
  const tabs = buildTabs(t);
  const [tab, setTab] = useState('order');
  const [phase, setPhase] = useState('static'); // static | armed | play
  const [run, setRun] = useState(0);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    setPhase('armed');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase('play');
          io.disconnect();
        }
      },
      { threshold: 0.15 }, // plays once ~15% of the console is visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const replay = (next = tab) => {
    setTab(next);
    if (prefersReducedMotion()) return setPhase('static');
    setPhase('play');
    setRun((r) => r + 1);
  };

  const cur = tabs[tab];
  const pillAt = cur.request.length + 2;
  const tabIds = ['order', 'search'];

  return (
    <div ref={ref} className="mt-8 min-w-0 max-w-full">
      <WindowChrome title="api-console">
        <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-2.5">
          <div role="tablist" aria-label={t('aiConsole.label')} className="flex gap-1">
            {tabIds.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`con-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="con-panel"
                onClick={() => replay(id)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors duration-(--dur-fast) ${tab === id ? 'bg-fill text-label' : 'text-label-2 hover:text-label'}`}
              >
                {t(`aiConsole.tabs.${id}`)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => replay()} className="text-[12px] font-medium text-label-2 hover:text-label">
            {t('aiConsole.replay')}
          </button>
        </div>
        <div
          id="con-panel"
          role="tabpanel"
          aria-labelledby={`con-tab-${tab}`}
          key={`${tab}-${run}-${lang}`}
          data-phase={phase}
          tabIndex={0}
          className="api-console code-window overflow-x-auto p-4 md:p-5 font-mono text-[12px] md:text-[13px] leading-[1.6]"
          dir="ltr"
        >
          {cur.request.map((line, i) => (
            <Line key={`q${i}`} tokens={line} i={i} />
          ))}
          <div className="con-line my-3" style={{ '--i': pillAt }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-fill px-2.5 py-1 font-sans text-[12px] font-medium text-label">
              <span className="size-1.5 rounded-full bg-green" aria-hidden />
              {cur.status.code} · {cur.status.ms} ms
            </span>
          </div>
          {cur.response.map((line, i) => (
            <Line key={`r${i}`} tokens={line} i={pillAt + 2 + i} />
          ))}
        </div>
      </WindowChrome>
      <p className="mt-2 text-[12px] text-label-3">{t('aiConsole.illustrative')}</p>
    </div>
  );
}
