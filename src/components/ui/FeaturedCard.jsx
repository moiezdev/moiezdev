import { Link } from 'react-router-dom';
import Img from './Img';
import Button from './Button';
import ExternalIcon from './ExternalIcon';
import TechChip from './TechChip';
import { useContent } from '../../i18n/content';
import { topTech } from '../../utils/techRank';
import TransitionLink from './TransitionLink';

/**
 * Full-width hero card for the featured project: screenshot, one pulled-out
 * metric (`featuredMetric` indexes `metrics`), a link to the live product
 * (`productUrl`, else `projectUrl`) and the case study.
 */
const FeaturedCard = ({ project, className = '' }) => {
  const { t } = useContent();
  const metric = project.metrics?.[project.featuredMetric ?? 0];
  const live = project.productUrl || project.projectUrl;
  const to = `/works/${project.id}`;
  // the screenshot morphs into the case-study hero
  const shared = { from: (link) => link.closest('[data-vt-project]')?.querySelector('[data-vt-image]'), to: '[data-vt-hero]' };

  return (
    <article
      data-vt-project={project.id}
      className={`group relative grid overflow-hidden surface lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] ${className}`}
    >
      <TransitionLink
        to={to}
        tabIndex={-1}
        aria-hidden
        shared={shared}
        data-vt-image
        data-cursor-label={t('cursor.view')}
        className="relative block overflow-hidden bg-surface-2 aspect-[16/10] lg:aspect-auto lg:min-h-[440px]"
      >
        <Img
          src={project.imageUrl}
          alt={`${project.title} — ${project.subtitle}`}
          sizes="(min-width: 1024px) 720px, 100vw"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.03]"
        />
      </TransitionLink>

      <div className="flex flex-col p-7 md:p-10 lg:justify-center">
        <p className="eyebrow">{t('projects.featuredCaseStudy')}</p>
        <h3 className="mt-3 text-[28px] md:text-[34px] font-semibold tracking-[-0.025em] leading-tight text-label">
          <TransitionLink to={to} shared={shared} className="hover:underline underline-offset-4 decoration-2">
            {project.title}
          </TransitionLink>
        </h3>
        <p className="mt-2 text-[17px] text-label-2">{project.subtitle}</p>

        {metric && (
          <div className="mt-7 flex items-end gap-4 border-t border-separator pt-6">
            <span className="text-[52px] md:text-[64px] font-bold tracking-[-0.045em] leading-[0.9] text-label" dir="ltr">
              {metric.value}
            </span>
            <span className="pb-1 text-[15px] leading-snug text-label-2 max-w-[12rem]">{metric.label}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-1.5">
          {topTech(project.technologies, 3).map((item) => (
            <TechChip key={item} name={item} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button to={to} primary>
            {t('projects.caseStudy')}
          </Button>
          {live && (
            <Button href={live} variant="outline">
              {t('projects.liveProduct')}
              <ExternalIcon />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default FeaturedCard;
