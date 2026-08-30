import { useParams } from 'react-router-dom';
import Transition from '../components/functions/Transition';
import ImageSlider from '../components/ui/ImageSlider';
import Button from '../components/ui/Button';
import SectionTitle from '../components/ui/SectionTitle';
import { getSkillIcon } from '../utils/skillIcons';
import { getProjectById } from '../data';
import { useContent } from '../i18n/content';

export default function ProjectDetail() {
  const { id } = useParams();
  const { t, localize } = useContent();
  const project = localize(getProjectById(id));
  if (!project) return <p className="p-6">{t('projects.notFound')}</p>;
  return (
    <Transition>
      <section className="w-full px-4 py-12" id="projects">
        <div className="app-container mx-auto pt-[30px] md:py-[60px]">
          <SectionTitle
            hash={'/'}
            title={project.title}
            buttonText={t('projects.back')}
            link="/works"
          />
          <p className="mt-[-20px] md:mb-[50px]">{project.subtitle}</p>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="w-full cursor-pointer cursor-white cursor-scale-3">
              <ImageSlider
                className="cursor-pointer cursor-white cursor-scale-3"
                images={project.media.map(
                  (img) => project.imageUrl.split('/').slice(0, -1).join('/') + '/' + img
                )}
              />
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="leading-relaxed space-y-2">
                {project.description.map((line, i) =>
                  Array.isArray(line) ? (
                    <ul
                      key={i}
                      className="list-disc list-inside cursor-pointer cursor-white cursor-scale-2"
                    >
                      {line.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-large cursor-pointer cursor-white cursor-scale-2" key={i}>
                      {line}
                    </p>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, i) => {
                  const skillIcon = getSkillIcon(tech);
                  const Icon = skillIcon?.Icon;
                  return (
                    <span
                      className="inline-flex items-center gap-1.5 cursor-pointer cursor-scale-0 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all"
                      key={i}
                      title={tech}
                    >
                      {Icon && (
                        <Icon
                          className="text-[14px] shrink-0"
                          style={{ color: skillIcon.color }}
                          aria-hidden
                        />
                      )}
                      {tech}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-2">
                {project.projectUrl && (
                  <Button onClick={() => window.open(project.projectUrl, '_blank')} primary={true}>
                    {t('projects.live')}
                  </Button>
                )}
                {project.githubUrl && (
                  <Button
                    className={`cursor-scale-0 cursor-pointer`}
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    {t('projects.github')}
                  </Button>
                )}
                {project.githubBackendUrl && (
                  <Button
                    className={`cursor-scale-0 cursor-pointer`}
                    onClick={() => window.open(project.githubBackendUrl, '_blank')}
                  >
                    {t('projects.backend')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Transition>
  );
}
