import { useRef } from 'react';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame';
import { useContent } from '../../i18n/content';

const TOP = 88; // sticky offset below the navbar
const STEP = 14; // each card pins a little lower, so the stack edges peek out

/**
 * Stacking cards: every project pins near the top while the next one slides
 * over it; covered cards ease back and dim, like a deck being dealt.
 */
const Projects = () => {
  const { t, projects } = useContent();
  const list = projects.filter((p) => p.status !== 'in-progress').slice(0, 5);
  const stackRef = useRef(null);

  useScrollFrame(stackRef, (root) => {
    const items = [...root.querySelectorAll('[data-stack-item]')];
    items.forEach((item, i) => {
      const card = item.firstElementChild;
      const shade = item.querySelector('[data-stack-shade]');
      const next = items[i + 1];
      let covered = 0;
      if (next) {
        const gap = next.getBoundingClientRect().top - item.getBoundingClientRect().top;
        covered = clamp01(1 - (gap - STEP) / item.offsetHeight);
      }
      // cards deeper in the stack recede a little further
      const depth = items.slice(i + 1).reduce((acc, n, k) => {
        if (k === 0) return acc;
        const g = n.getBoundingClientRect().top - item.getBoundingClientRect().top;
        return acc + clamp01(1 - (g - STEP * (k + 1)) / item.offsetHeight) * 0.5;
      }, 0);
      const amount = covered + depth;
      card.style.transform = `scale(${1 - amount * 0.06})`;
      if (shade) shade.style.opacity = String(Math.min(amount, 1.5) * 0.35);
    });
  });

  return (
    <section className="w-full px-5 pt-28 md:pt-40 scroll-mt-16" id="work">
      <div className="app-container">
        <SectionTitle
          eyebrow={t('projects.eyebrow')}
          title={t('projects.headline')}
          buttonText={t('projects.viewAll')}
          link="/works"
        />
        <div ref={stackRef} className="relative">
          {list.map((project, i) => (
            <div
              key={project.id}
              data-stack-item
              className="sticky motion-reduce:static mb-8 last:mb-0"
              style={{ top: TOP + i * STEP }}
            >
              <div className="relative origin-top will-change-transform">
                <Card
                  project={project}
                  featured
                  eyebrow={`${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`}
                  className="shadow-[0_-8px_40px_rgba(0,0,0,0.08)]"
                />
                <span
                  data-stack-shade
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] bg-[#000] opacity-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
