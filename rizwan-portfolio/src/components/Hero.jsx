import { profile, stats } from '../data/content'
import Media from './Media'
import Reveal from './Reveal'

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-copy">
        <Reveal as="p" className="eyebrow">{profile.role}</Reveal>
        <Reveal as="h1" className="hero-title" delay={80}>{profile.headline}</Reveal>
        <Reveal as="p" className="hero-intro" delay={160}>{profile.intro}</Reveal>
        <Reveal className="hero-actions" delay={240}>
          <a href="#projects" className="btn btn-primary">View my work</a>
          <a href="#contact" className="btn btn-link">Get in touch <span aria-hidden>›</span></a>
        </Reveal>
      </div>

      <Reveal className="container hero-visual" delay={320}>
        <Media src={profile.heroImage} alt="" className="hero-media" eager />
      </Reveal>

      <div className="container">
        <dl className="stats">
          {stats.map((s, i) => (
            <Reveal key={s.label} className="stat" delay={i * 70}>
              <dt>{s.label}</dt>
              <dd>{s.value}<span>{s.suffix}</span></dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
