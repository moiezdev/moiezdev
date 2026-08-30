import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Card from '../components/ui/Card';
import SectionTitle from '../components/ui/SectionTitle';
import Transition from '../components/functions/Transition';
import { Link } from 'react-router-dom';
import { useContent } from '../i18n/content';

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  const cardsRef = useRef([]);
  const { t, projects } = useContent();

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    cardsRef.current = cardsRef.current.slice(0, projects.length);

    cardsRef.current.forEach((card) => {
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

    ScrollTrigger.refresh();
  }, [projects]);

  return (
    <Transition>
      <section className="w-full px-4 py-12" id="projects">
        <div className="app-container mx-auto pt-[20px] md:py-[60px]">
          <SectionTitle hash={'/'} title={t('projects.section')} />
          <p className="mt-[-20px] md:mb-[50px] max-md:mb-6">{t('projects.list')}</p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                to={`/works/${project.id}`}
                ref={(el) => (cardsRef.current[index] = el)}
                className="will-change-transform cursor-pointer"
              >
                <Card
                  title={project.title}
                  description={project.subtitle}
                  techStack={project.technologies}
                  liveLink={project.projectUrl}
                  codeLink={project.githubUrl}
                  codeLinkSecondary={project.githubBackendUrl}
                  image={project.imageUrl}
                  altText={`${project.title} image`}
                  liveLabel={t('projects.live')}
                  codeLabel={t('projects.github')}
                  codeLinkSecondaryLabel={t('projects.backend')}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Transition>
  );
};

export default Projects;
