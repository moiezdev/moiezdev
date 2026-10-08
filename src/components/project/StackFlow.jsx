import { useRef } from 'react';
import { HiOutlineDevicePhoneMobile, HiOutlineUsers } from 'react-icons/hi2';
import { getSkillIcon, readableIconColor } from '../../utils/skillIcons';
import { usePauseWhenHidden } from '../../motion/usePauseWhenHidden';
import { useContent } from '../../i18n/content';

/** Which layer of a system each technology lives in. Unknown names are skipped. */
const LAYER_OF = {
  // what the visitor's browser or phone runs
  React: 'app', 'React Native': 'app', NextJs: 'app', 'Next.js': 'app', Vue: 'app', NuxtJs: 'app', Flutter: 'app', HTML5: 'app',
  // look, components and client state
  TailwindCSS: 'ui', Bootstrap: 'ui', Buefy: 'ui', SCSS: 'ui', CSS3: 'ui', Jquery: 'ui', jQuery: 'ui',
  Vuex: 'ui', 'Redux Toolkit': 'ui', Zustand: 'ui', Pinia: 'ui', 'TanStack Query': 'ui',
  // server side
  Node: 'api', Express: 'api', NestJS: 'api', Fastify: 'api', Laravel: 'api', 'ASP.NET': 'api', 'REST APIs': 'api', 'C# (C Sharp)': 'api',
  // persistence
  PostgreSQL: 'data', MongoDB: 'data', MySQL: 'data', Prisma: 'data', 'Entity Framework': 'data', Redis: 'data',
  // third parties
  Sabre: 'ext', Amadeus: 'ext', OpenRouter: 'ext', 'Apple Wallet': 'ext', 'Google Wallet': 'ext', MyFatoorah: 'ext', Moyasar: 'ext', EmailJS: 'ext',
};
const ORDER = ['app', 'ui', 'api', 'data', 'ext'];

const Chip = ({ name }) => {
  const icon = getSkillIcon(name);
  const Icon = icon?.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-label">
      {Icon && <Icon className="text-[12px]" style={{ color: readableIconColor(icon.color) }} aria-hidden />}
      {name}
    </span>
  );
};

/**
 * "How it's built": the project's stack as a request travels it — visitor →
 * app → UI & state → API → data → external services — generated from the
 * project's `technologies`, so every case study gets one. Dots flow along the
 * connectors while it's on screen (paused off-screen / reduced motion).
 */
export default function StackFlow({ project }) {
  const { t } = useContent();
  const ref = useRef(null);
  const running = usePauseWhenHidden(ref);

  const groups = Object.fromEntries(ORDER.map((k) => [k, []]));
  (project.technologies || []).forEach((tech) => {
    const layer = LAYER_OF[tech];
    if (layer && !groups[layer].includes(tech)) groups[layer].push(tech);
  });
  const layers = [
    { key: 'visitor', title: t('stackFlow.visitor'), body: t('stackFlow.visitorBody'), Icon: HiOutlineUsers },
    ...ORDER.filter((k) => groups[k].length).map((k) => ({ key: k, title: t(`stackFlow.${k}`), techs: groups[k] })),
  ];
  if (layers.length < 2) return null;

  return (
    <figure ref={ref} className="surface p-6 md:p-8" data-running={running}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
        <span className="text-[15px] font-semibold text-label">{t('stackFlow.title')}</span>
        <span className="text-[12px] text-label-3">{t('stackFlow.caption')}</span>
      </figcaption>
      <ol className="stack-flow flex flex-col md:flex-row md:items-stretch">
        {layers.map((layer, i) => (
          <li key={layer.key} className="contents">
            {i > 0 && (
              <span className="stack-link" aria-hidden>
                <span className="stack-dot" style={{ animationDelay: `${i * 0.25}s` }} />
              </span>
            )}
            <div className="flex-1 min-w-0 rounded-2xl bg-surface-2 ring-1 ring-separator p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3">{layer.title}</p>
              {layer.techs ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {layer.techs.map((tech) => (
                    <Chip key={tech} name={tech} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-[13px] text-label-2">
                  <layer.Icon className="text-[16px] shrink-0" aria-hidden />
                  <HiOutlineDevicePhoneMobile className="text-[16px] shrink-0" aria-hidden />
                  {layer.body}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
