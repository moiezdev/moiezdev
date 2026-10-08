import { useEffect, useMemo, useRef, useState } from 'react'
import { projects } from '../data/content'
import Media from './Media'
import Reveal from './Reveal'
import SectionHead from './SectionHead'

function ProjectSheet({ project, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (project && !d.open) {
      d.showModal()
      document.body.style.overflow = 'hidden'
    }
  }, [project])

  const close = () => {
    const d = ref.current
    d.classList.add('is-closing')
    setTimeout(() => {
      d.classList.remove('is-closing')
      d.close()
    }, 280)
  }

  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={(e) => { e.preventDefault(); close() }}
      onClose={() => { document.body.style.overflow = ''; onClose() }}
      onClick={(e) => e.target === ref.current && close()}
    >
      {project && (
        <article className="sheet-card">
          <button className="sheet-close" onClick={close} aria-label="Close">×</button>
          <Media src={project.image} alt="" className="sheet-media" />
          <div className="sheet-body">
            <p className="eyebrow">{project.category} · {project.year}</p>
            <h3>{project.title}</h3>
            <p className="sheet-summary">{project.summary}</p>
            <p className="sheet-outcome"><span>Outcome</span>{project.outcome}</p>
            <ul>{project.details.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        </article>
      )}
    </dialog>
  )
}

export default function Projects() {
  const categories = useMemo(() => ['All', ...new Set(projects.map((p) => p.category))], [])
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const list = filter === 'All' ? projects : projects.filter((p) => p.category === filter)

  return (
    <section className="section" id="projects">
      <div className="container">
        <SectionHead
          eyebrow="Projects"
          title="20+ projects. Measurable outcomes."
          lead="A selection of initiatives across facilities, process, compliance and delivery."
        />
        <Reveal className="filters" role="tablist" aria-label="Filter projects">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={filter === c ? 'is-active' : ''}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </Reveal>
        <div className="project-grid" key={filter}>
          {list.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 70}>
              <button className="project-card" onClick={() => setSelected(p)}>
                <Media src={p.image} alt="" className="project-media" />
                <div className="project-body">
                  <p className="eyebrow">{p.category} · {p.year}</p>
                  <h3>{p.title}</h3>
                  <p>{p.summary}</p>
                  <span className="project-outcome">{p.outcome}</span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      <ProjectSheet project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
