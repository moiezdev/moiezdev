import ExperienceCards from '../components/experience/ExperienceCards';
import Transition from '../components/functions/Transition';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';
import Button from '../components/ui/Button';
import { useContent } from '../i18n/content';

const Experience = () => {
  const { t, jobs, education } = useContent();

  return (
    <Transition>
      <PageHeader eyebrow={t('experience.eyebrow')} title={t('experience.pageTitle')} subtitle={t('experience.list')}>
        <Button href="/Moieez%20ur%20Rehman.pdf" download="Moieez ur Rehman.pdf" primary>
          {t('experience.resume')}
        </Button>
      </PageHeader>

      <section className="w-full px-5">
        <div className="app-container">
          <ExperienceCards jobs={jobs} />

          <div className="grid gap-6 md:grid-cols-2 mt-16">
            <Reveal className="surface p-7 md:p-8">
              <p className="eyebrow mb-3">{t('experience.education')}</p>
              <h3 className="text-[21px] font-semibold tracking-[-0.02em] text-label leading-snug">
                {education.degree}
              </h3>
              <p className="mt-2 text-[15px] text-label-2">
                {education.school}
                <span className="mx-2 text-label-3">·</span>
                {education.period}
              </p>
            </Reveal>

            <Reveal delay={80} className="surface p-7 md:p-8">
              <p className="eyebrow mb-3">{t('experience.languages')}</p>
              <div className="flex flex-wrap gap-2">
                {(education.languages || []).map((item) => (
                  <span key={item} className="chip text-[15px] py-1.5 px-4">
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </Transition>
  );
};

export default Experience;
