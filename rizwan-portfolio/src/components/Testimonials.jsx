import { testimonials } from '../data/content'
import Reveal from './Reveal'

export default function Testimonials() {
  return (
    <section className="section testimonials" aria-label="Testimonials">
      <div className="container quote-grid">
        {testimonials.map((t, i) => (
          <Reveal as="figure" key={i} className="quote" delay={i * 80}>
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              <strong>{t.name}</strong>
              <span>{t.title}</span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
