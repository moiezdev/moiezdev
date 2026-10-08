import { events } from '../data/content'
import Media from './Media'
import Reveal from './Reveal'
import SectionHead from './SectionHead'

export default function Events() {
  const [feature, ...rest] = events
  return (
    <section className="section section-alt" id="events">
      <div className="container">
        <SectionHead
          eyebrow="Events"
          title="On stage and behind the scenes."
          lead="Summits organised, talks given and workshops hosted."
        />
        <Reveal className="event-feature">
          <Media src={feature.image} alt="" className="event-feature-media" />
          <div className="event-feature-body">
            <p className="eyebrow">{feature.type} · {feature.date}</p>
            <h3>{feature.title}</h3>
            <p>{feature.summary}</p>
            <span className="event-loc">{feature.location}</span>
          </div>
        </Reveal>
        <div className="event-grid">
          {rest.map((e, i) => (
            <Reveal key={e.title} className="event-card" delay={i * 70}>
              <Media src={e.image} alt="" className="event-media" />
              <div className="event-body">
                <p className="eyebrow">{e.type} · {e.date}</p>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                <span className="event-loc">{e.location}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
