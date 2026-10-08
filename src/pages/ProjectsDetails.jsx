import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Transition from '../components/functions/Transition';
import ImageSlider from '../components/ui/ImageSlider';
import Img from '../components/ui/Img';
import Button from '../components/ui/Button';
import Reveal from '../motion/Reveal';
import TechChip from '../components/ui/TechChip';
import ExternalIcon from '../components/ui/ExternalIcon';
import { Chevron } from '../components/ui/SectionTitle';
import ArchitectureFigure from '../components/home/ArchitectureFigure';
import WalletSequence from '../components/project/WalletSequence';
import WalletPass from '../components/project/WalletPass';
import LatencyBar from '../components/project/LatencyBar';
import QueueVisual from '../components/project/QueueVisual';
import ScrollProgress from '../components/ui/ScrollProgress';
import { getProjectById } from '../data';
import { useContent } from '../i18n/content';
import NotFound from './NotFound';
import { sortTech, topTech } from '../utils/techRank';
import { scrollToTarget } from '../utils/smoothScroll';
import TransitionLink from '../components/ui/TransitionLink';

const sameHost = (a, b) => {
  try {
    return Boolean(a && b) && new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, '');
  } catch {
    return false;
  }
};


/** Diagrams a project can list in its `diagrams` field. */
const DIAGRAMS = {
  architecture: ArchitectureFigure,
  walletSequence: WalletSequence,
  walletPass: WalletPass,
  queue: QueueVisual,
};

const nonEmpty = (v) => (Array.isArray(v) ? v.filter(Boolean).length > 0 : typeof v === 'string' && v.trim() !== '');

/** A section's body: one paragraph, or a list of points. */
const Points = ({ items }) =>
  items.length === 1 ? (
    <p className="text-[17px] md:text-[19px] leading-relaxed text-label-2">{items[0]}</p>
  ) : (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3.5 text-[17px] leading-relaxed text-label-2">
          <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-label-3" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

/**
 * Smooth-scrolls to a section; checks again once the scroll settles, since
 * lazy content (the architecture diagram) can grow on the way.
 * The offset comes from the sections' scroll-margin (scroll-mt-24).
 */
function goToSection(e, id) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  history.replaceState(null, '', `#${id}`);
  scrollToTarget(el);
  setTimeout(() => {
    if (Math.abs(el.getBoundingClientRect().top - 96) > 8) scrollToTarget(el);
  }, 1300);
}

/** Highlights the table-of-contents entry for the section in view. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');
  useEffect(() => {
    const els = key.split('|').map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

/**
 * Project page. With a `caseStudy` (TWLM) it reads as a case study: header
 * facts, metrics, Problem → My role → Architecture → Challenges → Results →
 * What I'd do next, diagrams and a sticky table of contents. Projects with only
 * `description` bullets fall back to an overview. Empty fields never render.
 */
export default function ProjectDetail() {
  const { id } = useParams();
  const { t, localize, projects, jobs } = useContent();
  const project = localize(getProjectById(id));

  const cs = project?.caseStudy || {};
  const [headline, ...body] = project?.description || [];
  const overview = (typeof headline === 'string' ? body : project?.description || []).flat();
  const diagrams = (project?.diagrams || []).filter((d) => DIAGRAMS[d]);

  const sections = project
    ? [
        ...(project.caseStudy
          ? [
              { id: 'problem', title: t('caseStudy.problem'), items: cs.problem },
              { id: 'role', title: t('caseStudy.myRole'), items: cs.role },
              { id: 'architecture', title: t('caseStudy.architecture'), items: cs.architecture, diagrams: true },
              { id: 'challenges', title: t('caseStudy.challenges'), items: cs.challenges },
              { id: 'results', title: t('caseStudy.results'), items: cs.results },
              { id: 'next', title: t('caseStudy.next'), items: cs.next },
            ]
          : [{ id: 'overview', title: t('caseStudy.overview'), lead: typeof headline === 'string' ? headline : null, items: overview, diagrams: true }]),
        { id: 'stack', title: t('caseStudy.builtWith'), stack: true },
      ].filter((s) => s.stack || nonEmpty(s.items) || (s.diagrams && diagrams.length))
    : [];
  const active = useActiveSection(sections.map((s) => s.id));
  const tocRef = useRef(null);
  const markerRef = useRef(null);
  // one marker slides to the active contents entry
  useLayoutEffect(() => {
    const link = tocRef.current?.querySelector(`[data-toc="${active}"]`);
    const marker = markerRef.current;
    if (!link || !marker) return;
    marker.style.height = `${link.offsetHeight}px`;
    marker.style.transform = `translateY(${link.offsetTop}px)`;
    marker.style.opacity = '1';
  }, [active, sections.length]);

  if (!project) return <NotFound />;

  const base = project.imageUrl.split('/').slice(0, -1).join('/');
  const images = (project.media?.length ? project.media : [project.imageUrl.split('/').pop()]).map((img) => `${base}/${img}`);
  const index = projects.findIndex((p) => p.id === project.id);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  // role/company from the experience entry that lists this project; the
  // timeline only when the project spans that whole role (`experienceId`)
  const job = jobs.find((j) => j.id === project.experienceId) || jobs.find((j) => j.relatedProjects?.includes(project.id));
  const facts = [
    job && { label: t('caseStudy.role'), value: job.title },
    job && { label: t('caseStudy.company'), value: job.company },
    job && project.experienceId === job.id && { label: t('caseStudy.timeline'), value: job.period },
    nonEmpty(project.teamSize) && { label: t('caseStudy.team'), value: project.teamSize },
    {
      label: t('projects.status'),
      value: project.projectUrl || project.productUrl ? t('projects.statusLive') : project.githubUrl ? t('projects.statusOpen') : t('projects.statusPrivate'),
    },
    { label: t('caseStudy.stack'), value: topTech(project.technologies, 4).join(' · ') },
  ].filter(Boolean);

  const links = [
    project.productUrl && { href: project.productUrl, label: t('projects.liveProduct'), primary: true },
    // one button per site: skip "Visit site" when the live product is on the same domain
    project.projectUrl &&
      !sameHost(project.projectUrl, project.productUrl) && {
        href: project.projectUrl,
        label: t('projects.visit'),
        primary: !project.productUrl,
      },
    project.githubUrl && { href: project.githubUrl, label: t('projects.github') },
    project.githubBackendUrl && { href: project.githubBackendUrl, label: t('projects.backend') },
  ].filter(Boolean);

  const showToc = sections.length >= 3;

  return (
    <Transition>
      {project.caseStudy && <ScrollProgress />}
      <header className="relative px-5 pt-[112px] md:pt-[136px] pb-10 md:pb-14 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[520px] opacity-40 dark:opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(45% 55% at 40% 45%, var(--glow-a), transparent 70%), radial-gradient(35% 45% at 65% 50%, var(--glow-b), transparent 70%)' }}
        />
        <div className="relative app-container">
          <TransitionLink
            to="/works"
            shared={{ from: '[data-vt-hero]', to: `[data-vt-project="${project.id}"] [data-vt-image]` }}
            className="inline-flex items-center gap-1 text-[15px] font-medium text-accent hover:underline underline-offset-4"
          >
            <Chevron dir="back" />
            {t('projects.back')}
          </TransitionLink>
          <h1 className="mt-5 max-w-4xl text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-label [html[lang=ar]_&]:tracking-normal [html[lang=ar]_&]:leading-[1.3] [html[lang=ar]_&]:text-[clamp(1.625rem,3.6vw,2.5rem)]">
            {project.title}
          </h1>
          <p className="mt-4 max-w-3xl text-[19px] md:text-[21px] leading-[1.45] text-label-2">{cs.summary || project.subtitle}</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-separator pt-6 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[12px] font-semibold uppercase tracking-wider text-label-3">{f.label}</dt>
                <dd className="mt-1 text-[15px] font-medium text-label">{f.value}</dd>
              </div>
            ))}
          </dl>

          {links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {links.map((l) => (
                <Button key={l.href} href={l.href} primary={l.primary} variant={l.primary ? undefined : 'outline'}>
                  {l.label}
                  <ExternalIcon />
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="px-5">
        <Reveal className="app-container">
          {/* shared element: project cards morph into this gallery (view transitions) */}
          <div data-vt-hero className="rounded-[28px]">
            <ImageSlider images={images} title={project.title} />
          </div>
        </Reveal>

        {project.metrics?.length > 0 && (
          <div className="app-container mt-8 md:mt-10">
            <Reveal className="grid grid-cols-3 gap-2 sm:gap-3">
              {project.metrics.map((m) => (
                <div key={m.label} className="surface min-w-0 p-4 sm:p-6 md:p-7">
                  <p className="text-[26px] sm:text-[40px] md:text-[48px] font-bold tracking-[-0.04em] leading-none text-label">
                    <span dir="ltr" className="inline-block">{m.value}</span>
                  </p>
                  <p className="mt-2 sm:mt-3 text-[12px] sm:text-[15px] leading-snug text-label-2">{m.label}</p>
                </div>
              ))}
            </Reveal>
            <LatencyBar latency={project.latency} />
            {/* TODO(moiez): caseStudy.measured — how the numbers were measured; hidden until filled */}
            {nonEmpty(cs.measured) && (
              <p className="mt-3 text-[13px] leading-relaxed text-label-3">
                <span className="font-semibold text-label-2">{t('caseStudy.measured')}: </span>
                {cs.measured}
              </p>
            )}
          </div>
        )}

        <div
          className={`app-container mt-16 md:mt-20 grid grid-cols-[minmax(0,1fr)] gap-12 ${
            showToc ? 'lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16' : ''
          }`}
        >
          {showToc && (
            <nav aria-label={t('caseStudy.contents')} className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-label-3 mb-3">{t('caseStudy.contents')}</p>
                <ol ref={tocRef} className="relative flex flex-col border-s border-separator">
                  <span ref={markerRef} className="toc-marker" aria-hidden />
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => goToSection(e, s.id)}
                        aria-current={active === s.id ? 'location' : undefined}
                        data-toc={s.id}
                        className={`block ps-4 py-1.5 text-[14px] leading-snug transition-colors duration-(--dur-fast) ${
                          active === s.id ? 'text-label font-medium' : 'text-label-2 hover:text-label'
                        }`}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          )}

          <article className={`min-w-0 flex flex-col gap-14 md:gap-16 ${showToc ? '' : 'max-w-3xl'}`}>
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <Reveal as="h2" className="text-[26px] md:text-[30px] font-semibold tracking-[-0.025em] leading-tight text-label mb-5">
                  {s.title}
                </Reveal>
                {s.lead && <p className="mb-5 text-[19px] md:text-[21px] font-medium leading-snug text-label">{s.lead}</p>}
                {nonEmpty(s.items) && (
                  <div>
                    <Points items={s.items.filter(Boolean)} />
                  </div>
                )}
                {s.diagrams && diagrams.length > 0 && (
                  <div className="mt-8 flex flex-col gap-6">
                    {diagrams.map((d) => {
                      const Diagram = DIAGRAMS[d];
                      return (
                        <Reveal key={d}>
                          <Diagram project={project} />
                        </Reveal>
                      );
                    })}
                  </div>
                )}
                {s.stack && (
                  <div className="flex flex-wrap gap-2">
                    {sortTech(project.technologies).map((tech) => (
                      <TechChip key={tech} name={tech} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </article>
        </div>

        {projects.length > 1 && (
          <Reveal as="nav" aria-label={t('projects.more')} className="app-container mt-24 md:mt-32 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
            {[
              { p: prev, label: t('projects.previous'), dir: 'back' },
              { p: next, label: t('projects.next'), dir: 'forward' },
            ].map(({ p, label, dir }) => (
              <div key={dir} className="min-w-0">
                <TransitionLink
                  to={`/works/${p.id}`}
                  shared={{ from: (link) => link.querySelector('[data-vt-image]'), to: '[data-vt-hero]' }}
                  data-cursor-label={t('cursor.view')}
                  className={`group surface surface-hover flex items-center gap-4 p-4 md:p-5 h-full ${dir === 'forward' ? 'sm:flex-row-reverse sm:text-end' : ''}`}
                >
                  <span data-vt-image className="relative size-16 md:size-20 shrink-0 overflow-hidden rounded-[14px] bg-surface-2 ring-1 ring-separator">
                    {p.screenshot === false ? (
                      <span className="blueprint absolute inset-0 flex items-center justify-center text-[15px] font-bold text-label">{p.title}</span>
                    ) : (
                      <Img src={p.imageUrl} sizes="80px" className="size-full object-cover card-img" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-1 text-[13px] text-label-3 ${dir === 'forward' ? 'sm:justify-end' : ''}`}>
                      {dir === 'back' && <Chevron dir="back" />}
                      {label}
                      {dir === 'forward' && <Chevron />}
                    </span>
                    <span className="block mt-1 text-[19px] font-semibold tracking-[-0.02em] text-label truncate">{p.title}</span>
                    <span className="block text-[14px] text-label-2 truncate">{p.subtitle}</span>
                  </span>
                </TransitionLink>
              </div>
            ))}
          </Reveal>
        )}
      </section>
    </Transition>
  );
}
