import { Link } from 'react-router-dom';
import Img from './Img';
import TechChip from './TechChip';
import ExternalIcon from './ExternalIcon';
import { Chevron } from './SectionTitle';
import { useContent } from '../../i18n/content';
import { topTech } from '../../utils/techRank';

/**
 * Project card. The whole card links to the project page (stretched link);
 * external links sit above it so they stay independently clickable.
 */
const Card = ({ project, featured = false, eyebrow, maxTech = 3, className = '' }) => {
  const { t } = useContent();
  // at most a few tags, the most relevant first
  const tech = topTech(project.technologies, maxTech);
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
        {project.screenshot === false ? (
          // no real screenshot (e.g. only a logo): a calm typographic placeholder
          <div className="blueprint absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.04]">
            <span className="text-[44px] md:text-[52px] font-bold tracking-[-0.04em] text-label leading-none">{project.title}</span>
            <span className="font-mono text-[12px] text-label-3">{tech.join(' · ')}</span>
          </div>
        ) : (
          <Img
            src={project.imageUrl}
            alt={`${project.title} — ${project.subtitle}`}
            sizes={featured ? '(min-width: 1024px) 700px, 100vw' : '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.04]"
          />
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-3 ${featured ? 'p-7 md:p-10 lg:justify-center' : 'p-6 md:p-7'}`}>
        {featured && <p className="eyebrow">{eyebrow ?? t('projects.featured')}</p>}
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
            {tech.map((item) => (
              <TechChip key={item} name={item} />
            ))}
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
