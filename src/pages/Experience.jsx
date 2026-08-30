import SectionTitle from '../components/ui/SectionTitle';
import ExperienceCards from '../components/experience/ExperienceCards';
import Transition from '../components/functions/Transition';
import Button from '../components/ui/Button';
import Floating from '../components/ui/Floating';
import Magnetic from '../components/ui/Magnetic';
import { useContent } from '../i18n/content';

const Experience = () => {
  const { t, jobs, education } = useContent();

  return (
    <Transition>
      <section className="w-full px-4 py-12" id="experience">
        <div className="app-container mx-auto pt-[20px] md:py-[60px]">
          <SectionTitle hash="/" title={t('experience.section')} />
          <p className="mt-[-20px] md:mb-[50px] max-md:mb-6">{t('experience.list')}</p>

          <ExperienceCards jobs={jobs} />

          <div className="grid gap-8 md:grid-cols-2 mt-8">
            <Floating duration={5}>
              <Magnetic strength={0.1} duration={0.5}>
                <div className="border border-gray-a hover:shadow-lg transition-shadow duration-300">
                  <h3 className="font-semibold text-white border-b border-gray-a p-[8px] cursor-pointer cursor-white cursor-scale-1">
                    {t('experience.education')}
                  </h3>
                  <div className="flex flex-col gap-[8px] p-[16px]">
                    <p className="text-white">{education.degree}</p>
                    <p>
                      {education.school} <span className="text-primary">|</span> {education.period}
                    </p>
                  </div>
                </div>
              </Magnetic>
            </Floating>

            <Floating duration={5}>
              <Magnetic strength={0.1} duration={0.5}>
                <div className="border border-gray-a hover:shadow-lg transition-shadow duration-300">
                  <h3 className="font-semibold text-white border-b border-gray-a p-[8px] cursor-pointer cursor-white cursor-scale-1">
                    {t('experience.languages')}
                  </h3>
                  <div className="flex flex-wrap gap-[8px] p-[8px]">
                    {(education.languages || []).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all cursor-pointer cursor-scale-0"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Magnetic>
            </Floating>
          </div>

          <div className="mt-8">
            <a href="/Moieez%20ur%20Rehman.pdf" download="Moieez ur Rehman.pdf">
              <Button>{t('experience.resume')}</Button>
            </a>
          </div>
        </div>
      </section>
    </Transition>
  );
};

export default Experience;
