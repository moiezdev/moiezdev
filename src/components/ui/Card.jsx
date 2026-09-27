import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import TechChip from './TechChip';
import { Chevron } from './SectionTitle';
import { useContent } from '../../i18n/content';

const ExternalIcon = () => (
  <svg className="w-3 h-3 rtl:-scale-x-100" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Project card. The whole card links to the project page (stretched link);
 * external links sit above it so they stay independently clickable.
 */
const Card = ({ project, featured = false, maxTech = 4, className = '' }) => {
  const { t } = useContent();
  const tech = project.technologies || [];
  const links = [
    project.projectUrl && { href: project.projectUrl, label: t('projects.live') },
    project.githubUrl && { href: project.githubUrl, label: t('projects.github') },
    project.githubBackendUrl && { href: project.githubBackendUrl, label: t('projects.backend') },
  ].filter(Boolean);

  return (
    <article
      className={`group relative flex h-full overflow-hidden surface surface-hover ${
        featured ? 'flex-col lg:flex-row' : 'flex-col'
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-surface-2 ${
          featured ? 'aspect-[16/10] lg:aspect-auto lg:w-[58%] lg:min-h-[420px]' : 'aspect-[16/10]'
        }`}
      >
        <LazyImage
          src={project.imageUrl}
          alt={`${project.title} preview`}
          wrapperClass="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.04]"
        />
      </div>

      <div className={`flex flex-1 flex-col gap-3 ${featured ? 'p-7 md:p-10 lg:justify-center' : 'p-6 md:p-7'}`}>
        {featured && <p className="eyebrow">{t('projects.featured')}</p>}
        <h3
          className={`text-label font-semibold tracking-[-0.02em] leading-tight ${
            featured ? 'text-[28px] md:text-[34px]' : 'text-[21px]'
          }`}
        >
          <Link
            to={`/works/${project.id}`}
            data-cursor-label={t('projects.view')}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {project.title}
          </Link>
        </h3>
        <p className={`text-label-2 ${featured ? 'text-[17px]' : 'text-[15px] line-clamp-2'}`}>
          {project.subtitle}
        </p>

        {tech.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tech.slice(0, featured ? 6 : maxTech).map((item) => (
              <TechChip key={item} name={item} />
            ))}
            {tech.length > (featured ? 6 : maxTech) && (
              <span className="chip text-label-2" title={tech.join(', ')}>
                +{tech.length - (featured ? 6 : maxTech)}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="link-arrow text-[15px]">
            {t('projects.learnMore')}
            <Chevron />
          </span>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 text-[15px] font-medium text-label-2 hover:text-label transition-colors"
            >
              {l.label}
              <ExternalIcon />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

export default Card;
