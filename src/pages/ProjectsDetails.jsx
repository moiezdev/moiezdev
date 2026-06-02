// src/pages/ProjectDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Transition from '../components/functions/Transition';
import ImageSlider from '../components/ui/ImageSlider';
import Button from '../components/ui/Button';
import SectionTitle from '../components/ui/SectionTitle';

export default function ProjectDetail() {
  const { id } = useParams();
  const projects = useSelector((state) => state.projects.projects);
  const project = projects.find((p) => p.id === id);
  if (!project) return <p className="p-6">Project not found.</p>;
  return (
    <Transition>
      <section className="w-full px-4 py-12" id="projects">
        <div className="app-container mx-auto pt-[30px] md:py-[60px]">
          {/* Title & subtitle */}
          <SectionTitle hash={'/'} title={project.title} buttonText="back to works" link="/works" />
          <p className="mt-[-20px] md:mb-[50px]">{project.subtitle}</p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: slider */}
            <div className="w-full cursor-pointer cursor-white cursor-scale-3">
              <ImageSlider
                className="cursor-pointer cursor-white cursor-scale-3"
                images={project.media.map(
                  (img) => project.imageUrl.split('/').slice(0, -1).join('/') + '/' + img
                )}
              />
            </div>

            {/* Right: details */}
            <div className="w-full flex flex-col gap-4">
              {/* Description */}
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

              {/* Tech stack */}
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, i) => (
                  <span
                    className="cursor-pointer cursor-scale-0 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all"
                    key={i}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div className="flex gap-4 mt-2">
                {project.projectUrl && (
                  <Button onClick={() => window.open(project.projectUrl, '_blank')} primary={true}>
                    {'Live <~>'}
                  </Button>
                )}
                {project.githubUrl && (
                  <Button
                    className={`cursor-scale-0 cursor-pointer`}
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    {'Github >='}
                  </Button>
                )}
                {project.githubBackendUrl && (
                  <Button
                    className={`cursor-scale-0 cursor-pointer`}
                    onClick={() => window.open(project.githubBackendUrl, '_blank')}
                  >
                    {'Backend >='}
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
