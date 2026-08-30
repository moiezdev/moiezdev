import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Button from '../ui/Button';
import { getSkillIcon } from '../../utils/skillIcons';
import { getProjectById } from '../../data';
import { useContent } from '../../i18n/content';

gsap.registerPlugin(ScrollTrigger);

const TechTag = ({ name }) => {
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 cursor-pointer cursor-scale-0 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all"
      title={name}
    >
      {Icon && (
        <Icon className="text-[14px] shrink-0" style={{ color: skillIcon.color }} aria-hidden />
      )}
      {name}
    </span>
  );
};

const CompanyLogo = ({ job }) => {
  if (!job.logo) return null;

  return (
    <span
      className={`inline-flex size-8 items-center justify-center overflow-hidden border border-gray-a shrink-0 ${
        job.logoOnLight ? 'bg-[#ffffff]' : 'bg-gray-b'
      }`}
    >
      <img
        src={job.logo}
        alt={`${job.company} logo`}
        className="max-h-7 max-w-7 object-contain"
      />
    </span>
  );
};

const ExperienceCard = ({ job, highlightLimit }) => {
  const { t, localize } = useContent();
  const highlights =
    highlightLimit > 0 ? (job.highlights || []).slice(0, highlightLimit) : job.highlights || [];
  const related = (job.relatedProjects || [])
    .map((id) => localize(getProjectById(id)))
    .filter(Boolean);
  const companyName = (
    <span className="font-semibold text-white cursor-pointer cursor-white cursor-scale-1">
      {job.companyUrl ? (
        <a href={job.companyUrl} target="_blank" rel="noopener noreferrer">
          {job.company}
        </a>
      ) : (
        job.company
      )}
    </span>
  );

  return (
    <article className="border bg-gray-b border-gray-a hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <p className="border-b border-gray-a p-[8px] flex items-center justify-between gap-2">
        <span className="truncate">{companyName}</span>
        {job.current && (
          <span className="inline-flex items-center gap-1 shrink-0">
            <span className="bg-primary h-[10px] aspect-square inline-block mb-[-1px]" />
            {t('experience.present')}
          </span>
        )}
      </p>

      {job.stack?.length > 0 && (
        <p className="border-b border-gray-a p-[8px]">
          <span className="flex flex-wrap gap-[8px]">
            {job.stack.map((tech) => (
              <TechTag key={tech} name={tech} />
            ))}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-[16px] p-[16px] flex-1">
        <h2 className="text-large font-semibold text-white cursor-pointer cursor-white cursor-scale-1.2">
          {job.title}
        </h2>
        <p className="cursor-pointer cursor-white">
          {job.period}
          {job.location ? ` — ${job.location}` : ''}
        </p>
        {job.summary && <p className="cursor-pointer cursor-white">{job.summary}</p>}
        <ul className="flex flex-col gap-2">
          {highlights.map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-primary shrink-0">#</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {related.length > 0 && (
          <div className="flex flex-wrap gap-[16px] mt-auto pt-2">
            {related.map((project) => (
              <Link key={project.id} to={`/works/${project.id}`}>
                <Button primary>
                  {project.title} {'<~>'}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

const ExperienceCards = ({ jobs, highlightLimit = 0 }) => {
  const rootRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (!jobs?.length) return undefined;
    cardsRef.current = cardsRef.current.slice(0, jobs.length);

    const cleanups = cardsRef.current.map((card) => {
      if (!card) return undefined;

      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.03;
        const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.03;
        gsap.to(card, {
          x: offsetX,
          y: offsetY,
          duration: 0.5,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' });
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    const root = rootRef.current;
    const line = root?.querySelector('[data-exp-line]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (line && !reduceMotion) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top 75%',
              end: 'bottom 40%',
              scrub: 0.5,
            },
          },
        );
      }
    }, root);

    return () => {
      cleanups.forEach((fn) => fn?.());
      ctx.revert();
    };
  }, [jobs]);

  return (
    <div ref={rootRef} className="relative">
      <span
        data-exp-line
        className="absolute start-4 md:start-1/2 top-2 bottom-2 w-px origin-top bg-gray-a md:-translate-x-1/2 rtl:md:translate-x-1/2"
        aria-hidden
      />

      <div className="flex flex-col gap-8">
        {jobs.map((job, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div
              key={job.id || `${job.company}-${job.period}`}
              className={`relative ps-12 md:ps-0 md:w-1/2 ${
                isLeft ? 'md:pe-8 md:me-auto' : 'md:ps-8 md:ms-auto'
              }`}
            >
              <span className="md:hidden absolute start-0 top-3 z-10">
                <CompanyLogo job={job} />
              </span>
              <span
                className="md:hidden absolute start-8 top-[29px] h-px w-4 bg-gray-a"
                aria-hidden
              />
              <span
                className={`hidden md:block absolute top-3 z-10 ${
                  isLeft ? 'end-[-16px]' : 'start-[-16px]'
                }`}
              >
                <CompanyLogo job={job} />
              </span>
              <span
                className={`hidden md:block absolute top-[29px] h-px w-8 bg-gray-a ${
                  isLeft ? 'end-0' : 'start-0'
                }`}
                aria-hidden
              />

              <div
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="will-change-transform"
              >
                <ExperienceCard job={job} highlightLimit={highlightLimit} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExperienceCards;
