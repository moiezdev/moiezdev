import SectionTitle from '../ui/SectionTitle';
import Reveal from '../ui/Reveal';
import WindowChrome from '../ui/WindowChrome';
import { getSkillIcon, readableIconColor } from '../../utils/skillIcons';
import { useContent } from '../../i18n/content';

const STEP_ICONS = [
  'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 4v3.5l2.5 1.5',
  'M3 5h5v5H3zM12 10h5v5h-5zM8 7.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1',
  'm7 6-4 4 4 4M13 6l4 4-4 4M11 4 9 16',
  'M10 3v9m0-9L6.5 6.5M10 3l3.5 3.5M4 12v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3',
];

/** One node in the architecture diagram. */
const Node = ({ label, tech }) => {
  const skill = tech ? getSkillIcon(tech) : null;
  const Icon = skill?.Icon;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-surface ring-1 ring-separator px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {Icon && <Icon className="text-[16px] shrink-0" style={{ color: readableIconColor(skill.color) }} aria-hidden />}
      <span className="text-[13px] font-medium text-label leading-tight">{label}</span>
    </div>
  );
};

const Layer = ({ title, nodes, delay }) => (
  <Reveal delay={delay} className="flex flex-col gap-2 min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3 mb-1">{title}</p>
    {nodes.map((n) => (
      <Node key={n.label} {...n} />
    ))}
  </Reveal>
);

/** Animated connector: a hairline with a pulse travelling along it. */
const Wire = ({ delay = 0 }) => (
  <div className="relative flex items-center justify-center lg:w-12 h-8 lg:h-auto" aria-hidden>
    <span className="absolute lg:inset-x-0 lg:h-px lg:top-1/2 inset-y-0 w-px lg:w-auto bg-separator" />
    <span className="wire-pulse" style={{ animationDelay: `${delay}s` }} />
  </div>
);

const Process = () => {
  const { t } = useContent();
  const steps = t('process.steps');
  const layers = [
    {
      title: t('process.layers.clients'),
      nodes: [
        { label: 'Web apps', tech: 'React' },
        { label: 'Storefronts', tech: 'NextJs' },
        { label: 'Mobile', tech: 'Flutter' },
      ],
    },
    {
      title: t('process.layers.api'),
      nodes: [
        { label: 'API gateway', tech: 'NestJs' },
        { label: 'Auth · RBAC', tech: 'OAuth2' },
        { label: 'REST & webhooks', tech: 'REST APIs' },
      ],
    },
    {
      title: t('process.layers.services'),
      nodes: [
        { label: 'POS & orders', tech: 'Node' },
        { label: 'Loyalty & wallets', tech: 'Apple Wallet' },
        { label: 'AI search', tech: 'OpenRouter' },
      ],
    },
    {
      title: t('process.layers.data'),
      nodes: [
        { label: 'PostgreSQL', tech: 'PostGreSQL' },
        { label: 'Prisma ORM', tech: 'Prisma' },
        { label: 'Payments', tech: 'MyFatoorah' },
      ],
    },
  ];

  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="process">
      <div className="app-container">
        <SectionTitle eyebrow={t('process.eyebrow')} title={t('process.headline')} subtitle={t('process.subtitle')} />

        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 80} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={STEP_ICONS[i]} />
                  </svg>
                </span>
                <span className="font-mono text-[12px] text-label-3">0{i + 1}</span>
                <span className="hidden lg:block flex-1 h-px bg-separator" aria-hidden />
              </div>
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-label">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-label-2">{step.body}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16 md:mt-20">
          <WindowChrome title="system-architecture.ts" meta={t('process.live')}>
            <div className="blueprint p-6 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-stretch">
                {layers.map((layer, i) => (
                  <div key={layer.title} className="contents">
                    <div className="lg:flex-1">
                      <Layer {...layer} delay={i * 90} />
                    </div>
                    {i < layers.length - 1 && <Wire delay={i * 0.6} />}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-[13px] text-label-2 max-w-2xl">{t('process.caption')}</p>
            </div>
          </WindowChrome>
        </Reveal>
      </div>
    </section>
  );
};

export default Process;
