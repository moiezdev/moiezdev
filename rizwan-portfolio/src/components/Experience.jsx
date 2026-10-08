import { experience } from '../data/content'
import Reveal from './Reveal'
import SectionHead from './SectionHead'

export default function Experience() {
  return (
    <section className="section section-alt" id="experience">
      <div className="container">
        <SectionHead
          eyebrow="Experience"
          title="Twelve years of building operations."
          lead="From hands-on execution to leading operations for organisations of more than a thousand people."
        />
        <ol className="timeline">
          {experience.map((job) => (
            <Reveal as="li" key={job.role + job.period} className="job">
              <div className="job-meta">
                <span className="job-period">{job.period}</span>
                <span className="job-place">{job.company} · {job.location}</span>
              </div>
              <div className="job-body">
                <h3>{job.role}</h3>
                <p>{job.summary}</p>
                <ul>{job.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
