import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
];

const Node = ({ node, state, onEnter, onLeave, registerRef }) => {
  const { Icon, label, sub, hub } = node;
  return (
    <div
      ref={registerRef}
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={`relative z-10 flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 outline-none transition-all duration-300 ${hub ? 'order-first lg:order-none sm:col-span-2 lg:col-span-1' : ''} ${
        hub
          ? 'ring-1 ring-label/25 shadow-[0_10px_30px_rgba(0,0,0,0.10)] py-3.5'
          : 'ring-1 ring-separator shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
      } ${state === 'dim' ? 'opacity-35' : ''} ${state === 'on' ? 'ring-label/40 -translate-y-0.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]' : ''}`}
    >
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl ${
          hub ? 'size-10 bg-label text-bg' : 'size-8 bg-fill text-label'
        }`}
      >
        <Icon className={hub ? 'text-[20px]' : 'text-[16px]'} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={`block leading-tight text-label ${hub ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'}`}>
          {label}
        </span>
        <span className="block truncate text-[12px] leading-tight text-label-3 mt-0.5">{sub}</span>
      </span>
    </div>
  );
};

/**
 * Interactive system diagram. Edges are measured from the rendered nodes, so
 * they follow any layout (widths, RTL). Hover or focus a node to trace its
 * connections; pulses show data moving along each edge.
 */
export default function ArchitectureGraph({ titles }) {
  const wrapRef = useRef(null);
  const nodeRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const [motion, setMotion] = useState(true);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || window.innerWidth < 1024) return setPaths([]);
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
        // same column: short vertical link
        const down = b.cy > a.cy;
        d = `M ${a.cx} ${down ? a.b : a.t} L ${b.cx} ${down ? b.t : b.b}`;
      } else {
        const forward = b.cx > a.cx; // false in RTL
        const sx = forward ? a.r : a.l;
        const tx = forward ? b.l : b.r;
        const k = (tx - sx) * 0.5;
        d = `M ${sx} ${a.cy} C ${sx + k} ${a.cy}, ${tx - k} ${b.cy}, ${tx} ${b.cy}`;
      }
      return { id: `${from}-${to}`, from, to, d };
    }).filter(Boolean);
    setSize({ w: box.width, h: box.height });
    setPaths(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  useEffect(() => {
    setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = wrapRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          measure();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [measure]);

  const linked = (id) => active && (id === active || EDGES.some(([a, b]) => (a === active && b === id) || (b === active && a === id)));
  const edgeOn = (p) => active && (p.from === active || p.to === active);

  return (
    <div ref={wrapRef} className="relative" onMouseLeave={() => setActive(null)}>
      {/* edges (desktop) */}
      {paths.length > 0 && (
        <svg className="absolute inset-0 pointer-events-none hidden lg:block" width={size.w} height={size.h} aria-hidden>
          {paths.map((p, i) => (
            <path
              key={p.id}
              id={`edge-${p.id}`}
              d={p.d}
              pathLength="1"
              fill="none"
              strokeLinecap="round"
              className="transition-[stroke,stroke-width,opacity] duration-300"
              style={{
                stroke: edgeOn(p) ? 'var(--color-label)' : 'color-mix(in srgb, var(--color-label) 22%, transparent)',
                strokeWidth: edgeOn(p) ? 2 : 1.25,
                opacity: active && !edgeOn(p) ? 0.25 : 1,
                strokeDasharray: 1,
                strokeDashoffset: drawn ? 0 : 1,
                transition: `stroke-dashoffset 1.1s cubic-bezier(0.28,0.11,0.32,1) ${i * 45}ms, stroke 0.3s, stroke-width 0.3s, opacity 0.3s`,
              }}
            />
          ))}
          {drawn &&
            motion &&
            paths.map((p, i) => (
              <circle
                key={`dot-${p.id}`}
                r={edgeOn(p) ? 3.5 : 2.5}
                fill="var(--color-label)"
                opacity={active && !edgeOn(p) ? 0.15 : 0.8}
              >
                <animateMotion dur={`${2.4 + (i % 4) * 0.35}s`} repeatCount="indefinite" begin={`${(i * 0.37) % 2.4}s`}>
                  <mpath xlinkHref={`#edge-${p.id}`} />
                </animateMotion>
              </circle>
            ))}
        </svg>
      )}

      <div className="relative grid gap-4 lg:gap-x-20 lg:grid-cols-4">
        {LAYERS.map((layer, li) => (
          <div key={layer.key} className="flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3 mb-3">{titles[layer.key]}</p>
            <div className={`grid gap-2.5 sm:grid-cols-2 lg:flex lg:flex-col lg:flex-1 lg:justify-center ${layer.key === 'api' ? 'lg:gap-6' : 'lg:gap-3'}`}>
              {layer.nodes.map((node) => (
                <Node
                  key={node.id}
                  node={node}
                  state={!active ? 'idle' : node.id === active ? 'on' : linked(node.id) ? 'linked' : 'dim'}
                  onEnter={() => setActive(node.id)}
                  onLeave={() => setActive(null)}
                  registerRef={(el) => (nodeRefs.current[node.id] = el)}
                />
              ))}
            </div>
            {/* phone/tablet: vertical flow between stacked layers */}
            {li < LAYERS.length - 1 && (
              <div className="relative lg:hidden h-10 mt-4 flex justify-center" aria-hidden>
                <span className="absolute inset-y-0 w-px bg-separator" />
                <span className="wire-pulse" style={{ animationDelay: `${li * 0.5}s` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
