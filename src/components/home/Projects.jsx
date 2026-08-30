import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { Link } from 'react-router-dom';
import { projects } from '../../data';

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  const cardsRef = useRef([]);

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    cardsRef.current = cardsRef.current.slice(0, projects.length);

    // Refresh shared scroll triggers after cards mount (do not kill other sections)

    // Magnetic hover effect
    cardsRef.current.forEach((card) => {
      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.03; // smaller movement
        const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.03;
        gsap.to(card, {
          x: offsetX,
          y: offsetY,
          duration: 0.5, // slightly slower
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

      // Cleanup
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
        <SectionTitle title="projects" buttonText="View all" link="/works" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((project, index) => (
            <Link
              to={`/works/${project.id}`}
              key={index}
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
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
