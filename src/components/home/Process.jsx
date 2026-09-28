import SectionTitle from '../ui/SectionTitle';
import Reveal from '../ui/Reveal';
import WindowChrome from '../ui/WindowChrome';
import ArchitectureGraph from './ArchitectureGraph';
import { useContent } from '../../i18n/content';

const STEP_ICONS = [
  'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 4v3.5l2.5 1.5',
  'M3 5h5v5H3zM12 10h5v5h-5zM8 7.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1',
  'm7 6-4 4 4 4M13 6l4 4-4 4M11 4 9 16',
  'M10 3v9m0-9L6.5 6.5M10 3l3.5 3.5M4 12v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3',
];

const Process = () => {
  const { t } = useContent();
  const steps = t('process.steps');
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
              <ArchitectureGraph
                titles={{
                  clients: t('process.layers.clients'),
                  api: t('process.layers.api'),
                  services: t('process.layers.services'),
                  data: t('process.layers.data'),
                }}
              />
              <div className="mt-10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-label-2 max-w-2xl">{t('process.caption')}</p>
                <p className="hidden lg:block text-[12px] text-label-3">{t('process.hint')}</p>
              </div>
            </div>
          </WindowChrome>
        </Reveal>
      </div>
    </section>
  );
};

export default Process;
