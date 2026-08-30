import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { Link } from 'react-router-dom';
import { useContent } from '../../i18n/content';

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
        gsap.to(card, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
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
    <section className="w-full px-4 py-12 relative" id="projects">
      <div className="app-container mx-auto">
        <SectionTitle title={t('projects.section')} buttonText={t('projects.viewAll')} link="/works" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((project, index) => (
            <Link
              to={`/works/${project.id}`}
              key={project.id}
              ref={(el) => (cardsRef.current[index] = el)}
              className="will-change-transform"
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
  );
};

export default Projects;
