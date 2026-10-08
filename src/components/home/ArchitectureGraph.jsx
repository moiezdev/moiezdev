import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import arch from '../../data/architecture.json';
import { useContent } from '../../i18n/content';
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

/**
 * The TWLM platform as a system map.
 * - Every node and connection is visible at rest — the whole architecture reads
 *   at a glance, no tabs or playback.
 * - Hover or focus a node: its connections light up, everything else steps back,
 *   and a frosted tooltip says what it does (and why it was chosen, once written).
 * - Edges are measured from the rendered nodes, so they follow any layout and
 *   RTL; the stacked (narrow) layout uses simple connectors between layers.
 */
export default function ArchitectureGraph({ titles }) {
  const { t, lang } = useContent();
  const wrapRef = useRef(null);
  const nodeRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(null);
  const [tip, setTip] = useState(null);

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

  const linked = (id) => EDGES.some(([a, b]) => (a === hovered && b === id) || (b === hovered && a === id));
  const nodeState = (id) => {
    if (!hovered) return 'idle';
    if (id === hovered) return 'on';
    return linked(id) ? 'lit' : 'dim';
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

  return (
    <div>
      <div ref={wrapRef} className="@container relative" onMouseLeave={hideTip}>
        {paths.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none hidden @3xl:block" width={size.w} height={size.h} aria-hidden>
            {paths.map((p) => {
              const on = hovered && (p.from === hovered || p.to === hovered);
              return (
                <g key={p.id} opacity={hovered && !on ? 0.2 : 1} className="transition-opacity duration-(--dur-base)">
                  <path
                    d={p.d}
                    fill="none"
                    strokeLinecap="round"
                    stroke={on ? 'var(--color-label)' : 'color-mix(in srgb, var(--color-label) 38%, transparent)'}
                    strokeWidth={on ? 2 : 1.25}
                    className="transition-[stroke,stroke-width] duration-(--dur-fast)"
                  />
                </g>
              );
            })}
          </svg>
        )}

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
    </div>
  );
}
