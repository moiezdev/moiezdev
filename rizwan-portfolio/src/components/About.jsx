import { about, profile } from '../data/content'
import Media from './Media'
import Reveal from './Reveal'
import SectionHead from './SectionHead'

function CredList({ title, items }) {
  return (
    <div className="cred">
      <h3>{title}</h3>
      <ul>
        {items.map((it) => (
          <li key={it.title}>
            <span className="cred-title">{it.title}</span>
            <span className="cred-meta">{it.place} · {it.year}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead eyebrow="About" title="Calm leadership. Clear systems." />
        <div className="about-grid">
          <Reveal className="about-portrait">
            <Media src={profile.portrait} alt={profile.name} label={profile.initials} className="portrait" />
            <p className="about-caption">
              <strong>{profile.name}</strong>
              <span>{profile.location}</span>
              <span className="status"><i aria-hidden /> {profile.availability}</span>
            </p>
          </Reveal>
          <div className="about-body">
            {about.paragraphs.map((p, i) => (
              <Reveal as="p" key={i} className={i === 0 ? 'about-lede' : ''} delay={i * 60}>{p}</Reveal>
            ))}
            <Reveal className="competencies" delay={120}>
              <h3>Core competencies</h3>
              <ul>{about.competencies.map((c) => <li key={c}>{c}</li>)}</ul>
            </Reveal>
            <Reveal className="creds" delay={160}>
              <CredList title="Education" items={about.education} />
              <CredList title="Certifications" items={about.certifications} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
