import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import TechChip from '../ui/TechChip';
import { Chevron } from '../ui/SectionTitle';
import { getProjectById } from '../../data';
import { useContent } from '../../i18n/content';

const CompanyLogo = ({ job }) => (
  <span
    className={`inline-flex size-12 items-center justify-center overflow-hidden rounded-[14px] ring-1 ring-separator shrink-0 ${
      job.logoOnLight ? 'bg-[#ffffff]' : 'bg-surface-2'
    }`}
  >
    {job.logo ? (
      <img src={job.logo} alt="" className="max-h-9 max-w-9 object-contain" />
    ) : (
      <span className="text-[18px] font-semibold text-label-2">{job.company?.[0]}</span>
    )}
  </span>
);

const ExperienceCard = ({ job, highlightLimit }) => {
  const { t, localize } = useContent();
  const highlights =
    highlightLimit > 0 ? (job.highlights || []).slice(0, highlightLimit) : job.highlights || [];
  const related = (job.relatedProjects || [])
    .map((id) => localize(getProjectById(id)))
    .filter(Boolean);

  return (
    <article className="surface p-6 md:p-8 lg:grid lg:grid-cols-12 lg:gap-10">
      <div className="flex items-start gap-4 lg:col-span-4 lg:flex-col">
        <CompanyLogo job={job} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[21px] font-semibold tracking-[-0.02em] text-label leading-tight">
              {job.title}
            </h3>
            {job.current && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)] px-2.5 py-0.5 text-[12px] font-semibold text-green">
                <span className="size-1.5 rounded-full bg-green" aria-hidden />
                {t('experience.present')}
              </span>
            )}
          </div>
          <p className="mt-1 text-[15px] text-label-2">
            {job.companyUrl ? (
              <a
                href={job.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label hover:text-accent font-medium"
              >
                {job.company}
              </a>
            ) : (
              <span className="text-label font-medium">{job.company}</span>
            )}
            <span className="mx-2 text-label-3 lg:hidden">·</span>
            <span className="lg:block lg:mt-1">{job.period}</span>
            {job.location ? (
              <>
                <span className="mx-2 text-label-3 lg:hidden">·</span>
                <span className="lg:block">{job.location}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="lg:col-span-8">
        {job.summary && <p className="mt-5 lg:mt-0 text-[17px] text-label">{job.summary}</p>}

        {highlights.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2.5">
            {highlights.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-label-2">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-label-3" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {job.stack?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {job.stack.map((tech) => (
              <TechChip key={tech} name={tech} />
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-5 pt-5 border-t border-separator flex flex-wrap gap-x-6 gap-y-2">
            {related.map((project) => (
              <Link key={project.id} to={`/works/${project.id}`} className="link-arrow text-[15px]">
                {project.title}
                <Chevron />
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

const ExperienceCards = ({ jobs, highlightLimit = 0 }) => (
  <ol className="relative flex flex-col gap-6">
    <span
      className="hidden md:block absolute start-[23px] top-6 bottom-6 w-px bg-separator"
      aria-hidden
    />
    {jobs.map((job, i) => (
      <Reveal
        as="li"
        key={job.id || `${job.company}-${job.period}`}
        delay={i * 60}
        className="relative md:ps-16"
      >
        <span
          className={`hidden md:block absolute start-[17px] top-9 size-[13px] rounded-full ring-4 ring-bg ${
            job.current ? 'bg-accent' : 'bg-label-3'
          }`}
          aria-hidden
        />
        <ExperienceCard job={job} highlightLimit={highlightLimit} />
      </Reveal>
    ))}
  </ol>
);

export default ExperienceCards;
