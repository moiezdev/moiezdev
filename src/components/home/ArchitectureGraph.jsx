import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import arch from '../../data/architecture.json';
import { useContent } from '../../i18n/content';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';
import { usePauseWhenHidden } from '../../motion/usePauseWhenHidden';
import { useInView } from '../../motion/useInView';
import { DUR, EASE } from '../../motion/tokens';
import { SiApple, SiFlutter, SiNestjs, SiNextdotjs, SiPostgresql, SiReact, SiRedis } from 'react-icons/si';
import {
  MdOutlineBolt,
  MdOutlineCreditCard,
  MdOutlineDashboardCustomize,
  MdOutlineLoyalty,
  MdOutlinePointOfSale,
  MdOutlineShield,
  MdOutlineShoppingBag,
  MdOutlineWebhook,
  MdSmartToy,
} from 'react-icons/md';

/** The retail platform, as layers of nodes and the calls between them. */
const LAYERS = [
  {
    key: 'clients',
    nodes: [
      { id: 'web', Icon: SiReact, label: 'Web apps', sub: 'React · Vue' },
      { id: 'store', Icon: SiNextdotjs, label: 'Storefronts', sub: 'Next.js' },
      { id: 'mobile', Icon: SiFlutter, label: 'Mobile app', sub: 'Flutter' },
      { id: 'terminal', Icon: MdOutlinePointOfSale, label: 'POS terminals', sub: 'In-store' },
    ],
  },
  {
    key: 'api',
    nodes: [
      { id: 'auth', Icon: MdOutlineShield, label: 'Auth', sub: 'RBAC · OAuth2 · SSO' },
      { id: 'gateway', Icon: SiNestjs, label: 'API gateway', sub: 'NestJS · REST', hub: true },
      { id: 'events', Icon: MdOutlineWebhook, label: 'Events', sub: 'Webhooks' },
    ],
  },
  {
    key: 'services',
    nodes: [
      { id: 'orders', Icon: MdOutlineShoppingBag, label: 'POS & orders', sub: 'Inventory · tax' },
      { id: 'loyalty', Icon: MdOutlineLoyalty, label: 'Loyalty', sub: 'Points · gift cards' },
      { id: 'cms', Icon: MdOutlineDashboardCustomize, label: 'CMS', sub: 'Page builder' },
      { id: 'ai', Icon: MdSmartToy, label: 'AI search', sub: 'Menu insights' },
    ],
  },
  {
    key: 'data',
    nodes: [
      { id: 'pg', Icon: SiPostgresql, label: 'PostgreSQL', sub: 'Prisma ORM' },
      { id: 'redis', Icon: SiRedis, label: 'Redis', sub: 'BullMQ workers' },
      { id: 'pay', Icon: MdOutlineCreditCard, label: 'Payments', sub: 'MyFatoorah · Moyasar' },
      { id: 'wallet', Icon: SiApple, label: 'Wallet passes', sub: 'Apple · Google' },
      { id: 'llm', Icon: MdOutlineBolt, label: 'LLM', sub: 'OpenRouter · DeepSeek' },
    ],
  },
];

const EDGES = [
  ['web', 'gateway'],
  ['store', 'gateway'],
  ['mobile', 'gateway'],
  ['terminal', 'gateway'],
  ['gateway', 'auth'],
  ['gateway', 'events'],
  ['gateway', 'orders'],
  ['gateway', 'loyalty'],
  ['gateway', 'cms'],
  ['gateway', 'ai'],
  ['events', 'loyalty'],
  ['orders', 'pg'],
  ['orders', 'pay'],
  ['loyalty', 'redis'],
  ['loyalty', 'wallet'],
  ['cms', 'pg'],
  ['ai', 'llm'],
  ['redis', 'wallet'],
];

const edgeKey = (a, b) => [a, b].sort().join('|');
const DWELL = 900; // ms a step's caption stays before the next hop

const Node = ({ node, state, onEnter, onLeave, registerRef, describedBy }) => {
  const { Icon, label, sub, hub } = node;
  return (
    <div
      ref={registerRef}
      tabIndex={0}
      aria-describedby={describedBy}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      data-state={state}
      className={`arch-node relative z-10 flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 ${hub ? 'order-first @3xl:order-none @lg:col-span-2 @3xl:col-span-1 py-3.5 ring-1 ring-label/25 shadow-[0_10px_30px_rgba(0,0,0,0.10)]' : 'ring-1 ring-separator shadow-[0_1px_2px_rgba(0,0,0,0.04)]'}`}
    >
      <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${hub ? 'size-10 bg-label text-bg' : 'size-8 bg-fill text-label'}`}>
        <Icon className={hub ? 'text-[20px]' : 'text-[16px]'} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={`block leading-tight text-label ${hub ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'}`}>{label}</span>
        <span className="block truncate text-[12px] leading-tight text-label-3 mt-0.5">{sub}</span>
      </span>
    </div>
  );
};

/** Apple-style segmented control; arrow keys move between segments (mirrored in RTL). */
function Segmented({ options, value, onChange, label }) {
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const refs = useRef([]);
  const onKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === 'rtl';
    let n = keys[e.key] === 'first' ? 0 : keys[e.key] === 'last' ? options.length - 1 : idx + keys[e.key] * (rtl ? -1 : 1);
    n = (n + options.length) % options.length;
    onChange(options[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="seg relative grid rounded-full bg-fill p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, '--seg-i': idx, '--seg-n': options.length }}
    >
      <span className="seg-thumb" aria-hidden />
      {options.map((o, i) => (
        <button
          key={o.id}
          ref={(el) => (refs.current[i] = el)}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          onClick={() => onChange(o.id)}
          className={`relative z-10 min-h-9 rounded-full px-3 py-1.5 text-[13px] font-medium leading-tight transition-colors duration-(--dur-fast) ${i === idx ? 'text-label' : 'text-label-2 hover:text-label'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * "How it works" explainer for the TWLM platform.
 * - Pick a scenario; it plays once, hop by hop: the hop's edge draws in, a
 *   packet travels it, the node lights and a caption explains the step. The
 *   final state stays (no loop); playback pauses off-screen or in a hidden tab.
 * - Hover or focus a node: its connections highlight and a frosted tooltip
 *   shows what it does (and why it was chosen, once that's written).
 * - Edges are measured from the rendered nodes, so they follow any layout and
 *   RTL; in the stacked (narrow) layout nodes light in order instead.
 * - Reduced motion: the chosen scenario's whole path is shown lit, statically.
 */
export default function ArchitectureGraph({ titles }) {
  const { t, lang } = useContent();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef(null);
  const packetRef = useRef(null);
  const nodeRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(null);
  const [tip, setTip] = useState(null);
  const [scenarioId, setScenarioId] = useState(arch.scenarios[0].id);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const scenario = arch.scenarios.find((s) => s.id === scenarioId);
  const total = scenario.steps.length;
  const seen = useInView(wrapRef, { once: true, rootMargin: '0px 0px -20% 0px' });
  const canRun = usePauseWhenHidden(wrapRef);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    // edges only in the four-column layout (container ≥ 48rem, see the classes below)
    if (!wrap || wrap.clientWidth < 768) return setPaths([]);
    const box = wrap.getBoundingClientRect();
    const rect = (id) => {
      const r = nodeRefs.current[id]?.getBoundingClientRect();
      return r && { l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top, cx: r.left - box.left + r.width / 2, cy: r.top - box.top + r.height / 2 };
    };
    const next = EDGES.map(([from, to]) => {
      const a = rect(from);
      const b = rect(to);
      if (!a || !b) return null;
      let d;
      if (Math.abs(a.cx - b.cx) < 8) {
        const down = b.cy > a.cy;
        d = `M ${a.cx} ${down ? a.b : a.t} L ${b.cx} ${down ? b.t : b.b}`;
      } else {
        const forward = b.cx > a.cx; // false in RTL
        const sx = forward ? a.r : a.l;
        const tx = forward ? b.l : b.r;
        const k = (tx - sx) * 0.5;
        d = `M ${sx} ${a.cy} C ${sx + k} ${a.cy}, ${tx - k} ${b.cy}, ${tx} ${b.cy}`;
      }
      return { id: `${from}-${to}`, key: edgeKey(from, to), from, to, d };
    }).filter(Boolean);
    setSize({ w: box.width, h: box.height });
    setPaths(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure, lang]);

  const play = useCallback(
    (id) => {
      setScenarioId(id);
      setHovered(null);
      if (reduced) {
        setStep(arch.scenarios.find((s) => s.id === id).steps.length - 1);
        setPlaying(false);
      } else {
        setStep(0);
        setPlaying(true);
      }
    },
    [reduced],
  );

  // first time the diagram is in view: play the first scenario (or show it whole)
  useEffect(() => {
    if (seen && step === -1) play(scenarioId);
  }, [seen, step, play, scenarioId]);

  // one hop: packet travels the edge, then the caption dwells, then the next hop
  useEffect(() => {
    if (!playing || !canRun || step < 0) return undefined;
    const s = scenario.steps[step];
    const packet = packetRef.current;
    let anim;
    if (s.from && packet) {
      const path = paths.find((p) => p.key === edgeKey(s.from, s.to));
      if (path) {
        const reversed = path.from !== s.from;
        packet.style.offsetPath = `path('${path.d}')`;
        anim = packet.animate(
          [
            { offsetDistance: reversed ? '100%' : '0%', opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { opacity: 1, offset: 0.85 },
            { offsetDistance: reversed ? '0%' : '100%', opacity: 0 },
          ],
          { duration: DUR.slow, easing: EASE.inOut, fill: 'forwards' },
        );
      }
    }
    const id = setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else setPlaying(false);
    }, DUR.slow + DWELL);
    return () => {
      clearTimeout(id);
      anim?.cancel();
    };
  }, [playing, canRun, step, scenario, paths, total]);

  // what the current scenario has lit so far
  const lit = useMemo(() => {
    const nodes = new Set();
    const edges = new Map(); // key -> drawn from `from`
    scenario.steps.slice(0, step + 1).forEach((s) => {
      if (s.at) nodes.add(s.at);
      if (s.from) {
        nodes.add(s.from);
        nodes.add(s.to);
        edges.set(edgeKey(s.from, s.to), s.from);
      }
    });
    const cur = scenario.steps[step];
    return { nodes, edges, current: cur ? cur.at || cur.to : null };
  }, [scenario, step]);
  // which end each of this scenario's edges is travelled from (so it draws in that way)
  const startsAt = useMemo(() => new Map(scenario.steps.filter((s) => s.from).map((s) => [edgeKey(s.from, s.to), s.from])), [scenario]);
  const involved = useMemo(() => new Set(scenario.steps.flatMap((s) => (s.at ? [s.at] : [s.from, s.to]))), [scenario]);

  const linkedToHover = (id) => hovered && (id === hovered || EDGES.some(([a, b]) => (a === hovered && b === id) || (b === hovered && a === id)));
  const nodeState = (id) => {
    if (hovered) return id === hovered ? 'on' : linkedToHover(id) ? 'linked' : 'dim';
    if (step < 0) return 'idle';
    if (id === lit.current) return 'current';
    if (lit.nodes.has(id)) return 'lit';
    return involved.has(id) ? 'idle' : 'dim';
  };

  const showTip = (id) => {
    setHovered(id);
    const wrap = wrapRef.current;
    const el = nodeRefs.current[id];
    if (!wrap || !el) return;
    const box = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const width = Math.min(280, box.width - 16);
    const left = Math.min(Math.max(r.left - box.left + r.width / 2 - width / 2, 8), box.width - width - 8);
    setTip({ id, left, top: r.bottom - box.top + 8, width });
  };
  const hideTip = () => {
    setHovered(null);
    setTip(null);
  };

  const node = (id) => LAYERS.flatMap((l) => l.nodes).find((n) => n.id === id);
  const info = tip && arch.nodes[tip.id];
  const why = info?.why?.[lang] || info?.why?.en;
  const current = step >= 0 ? scenario.steps[step] : null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 @container/ctl">
        <Segmented
          options={arch.scenarios.map((s) => ({ id: s.id, label: s.label[lang] || s.label.en }))}
          value={scenarioId}
          onChange={play}
          label={t('explainer.label')}
        />
      </div>

      <div ref={wrapRef} className="@container relative" onMouseLeave={hideTip}>
        {paths.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none hidden @3xl:block" width={size.w} height={size.h} aria-hidden>
            {paths.map((p) => {
              const hoverOn = hovered && (p.from === hovered || p.to === hovered);
              const drawnFrom = lit.edges.get(p.key);
              return (
                <g key={p.id} opacity={hovered && !hoverOn ? 0.25 : 1} className="transition-opacity duration-(--dur-base)">
                  <path d={p.d} fill="none" strokeLinecap="round" stroke="color-mix(in srgb, var(--color-label) 22%, transparent)" strokeWidth={1.25} />
                  <path
                    d={p.d}
                    pathLength="1"
                    fill="none"
                    strokeLinecap="round"
                    stroke="var(--color-label)"
                    strokeWidth={2}
                    strokeDasharray="1 1"
                    className="arch-edge-lit"
                    // hidden: dash shifted off the end it will draw in from
                    style={{ strokeDashoffset: drawnFrom || hoverOn ? 0 : startsAt.get(p.key) && startsAt.get(p.key) !== p.from ? -1 : 1 }}
                  />
                </g>
              );
            })}
          </svg>
        )}
        <span ref={packetRef} className="arch-packet" aria-hidden />

        <div className="relative grid gap-4 @3xl:gap-x-12 @5xl:gap-x-20 @3xl:grid-cols-4">
          {LAYERS.map((layer, li) => (
            <div key={layer.key} className="flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3 mb-3">{titles[layer.key]}</p>
              <div className={`grid gap-2.5 @lg:grid-cols-2 @3xl:flex @3xl:flex-col @3xl:flex-1 @3xl:justify-center ${layer.key === 'api' ? '@3xl:gap-6' : '@3xl:gap-3'}`}>
                {layer.nodes.map((n) => (
                  <Node
                    key={n.id}
                    node={n}
                    state={nodeState(n.id)}
                    describedBy={tip?.id === n.id ? 'arch-tip' : undefined}
                    onEnter={() => showTip(n.id)}
                    onLeave={hideTip}
                    registerRef={(el) => (nodeRefs.current[n.id] = el)}
                  />
                ))}
              </div>
              {/* narrow layout: a plain connector between stacked layers */}
              {li < LAYERS.length - 1 && <div className="@3xl:hidden mx-auto mt-4 h-8 w-px bg-separator" aria-hidden />}
            </div>
          ))}
        </div>

        {tip && info && (
          <div id="arch-tip" role="tooltip" className="arch-tip glass absolute z-20 rounded-2xl ring-1 ring-separator px-4 py-3 shadow-xl" style={{ left: tip.left, top: tip.top, width: tip.width }}>
            <p className="text-[14px] font-semibold text-label">{node(tip.id)?.label}</p>
            <p className="mt-0.5 font-mono text-[11px] text-label-3" dir="ltr">{node(tip.id)?.sub}</p>
            <p className="mt-2 text-[13px] leading-snug text-label-2">{info.role[lang] || info.role.en}</p>
            {why && (
              <p className="mt-2 text-[13px] leading-snug text-label-2">
                <span className="font-semibold text-label">{t('explainer.why')}: </span>
                {why}
              </p>
            )}
          </div>
        )}
      </div>

      {/* captions: the current step is announced; the full list doubles as the static (reduced-motion) view */}
      <div className="mt-8 grid gap-4 @container/cap">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="chip text-[12px]">{t('explainer.simplified')}</span>
          {current && (
            <span className="text-[12px] font-mono text-label-3">{t('explainer.step', { n: step + 1, total })}</span>
          )}
          <button type="button" onClick={() => play(scenarioId)} className="link-arrow text-[13px] ms-auto">
            {t('explainer.replay')}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {current ? current.caption[lang] || current.caption.en : ''}
        </p>
        <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {scenario.steps.map((s, i) => (
            <li
              key={i}
              className={`flex gap-3 text-[14px] leading-snug transition-opacity duration-(--dur-base) ${i === step ? 'text-label font-medium' : i < step ? 'text-label-2' : 'text-label-3 opacity-60'}`}
            >
              <span className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${i <= step ? 'bg-label text-bg' : 'bg-fill text-label-2'}`}>
                {i + 1}
              </span>
              <span>{s.caption[lang] || s.caption.en}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
