import Reveal from '../../motion/Reveal';
import { Link } from 'react-router-dom';
import SectionTitle, { Chevron } from '../ui/SectionTitle';
import { useContent } from '../../i18n/content';

/** Home: the current and previous role in two short rows; the full timeline lives on /experience. */
const Experience = () => {
  const { t, jobs } = useContent();

  return (
    <section className="w-full px-5 py-24 md:py-36 lg:py-44" id="experience">
      <div className="app-container forge-side forge-side--start">
        <SectionTitle
          forge="möbius loop"
          eyebrow={t('experience.eyebrow')}
          title={t('experience.headline')}
          buttonText={t('experience.viewAll')}
          link="/experience"
        />
        <Reveal as="ol" className="border-t border-separator">
          {jobs.slice(0, 2).map((job) => (
            <li
              key={job.id}
              className="grid gap-x-12 gap-y-3 border-b border-separator py-10 md:py-14 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            >
              <div className="flex items-start gap-4 min-w-0">
                <span
                  className={`inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] ring-1 ring-separator ${
                    job.logoOnLight ? 'bg-[#ffffff]' : 'bg-surface-2'
                  }`}
                >
                  {job.logo ? (
                    <img src={job.logo} alt="" loading="lazy" decoding="async" className="max-h-8 max-w-8 object-contain" />
                  ) : (
                    <span className="text-[17px] font-semibold text-label-2">{job.company?.[0]}</span>
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[21px] font-semibold tracking-[-0.02em] leading-snug text-label">{job.title}</h3>
                  <p className="mt-1 text-[15px] text-label-2">
                    <span className="font-medium text-label">{job.company}</span>
                    <span className="mx-2 text-label-3">·</span>
                    {job.period}
                  </p>
                </div>
              </div>
              <div className="min-w-0 md:pt-0.5">
                {job.summary && <p className="text-[18px] leading-relaxed text-label-2">{job.summary}</p>}
                {job.relatedProjects?.[0] && (
                  <Link to={`/works/${job.relatedProjects[0]}`} className="link-arrow mt-4 text-[15px]">
                    {t('experience.relatedWork')}
                    <Chevron />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Experience;
