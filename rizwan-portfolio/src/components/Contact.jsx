import { useState } from 'react'
import { contact } from '../data/content'
import Reveal from './Reveal'
import SectionHead from './SectionHead'

export default function Contact() {
  const [sent, setSent] = useState(false)

  // No backend yet: opens the visitor's mail app with the message prefilled.
  // Swap for EmailJS / Formspree / an API route when going live.
  const onSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const subject = encodeURIComponent(`Enquiry from ${f.get('name')}${f.get('company') ? ` (${f.get('company')})` : ''}`)
    const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')}\n${f.get('email')}`)
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  const rows = [
    { label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    { label: 'LinkedIn', value: 'View profile', href: contact.linkedin },
    { label: 'Location', value: contact.location },
  ]

  return (
    <section className="section" id="contact">
      <div className="container">
        <SectionHead
          eyebrow="Contact"
          title="Let’s talk operations."
          lead="Whether it’s a leadership role, a consulting engagement or a speaking invitation — I’d be glad to hear from you."
        />
        <div className="contact-grid">
          <Reveal as="ul" className="contact-list">
            {rows.map((r) => (
              <li key={r.label}>
                <span>{r.label}</span>
                {r.href ? (
                  <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{r.value}</a>
                ) : (
                  <strong>{r.value}</strong>
                )}
              </li>
            ))}
          </Reveal>
          <Reveal as="form" className="contact-form" onSubmit={onSubmit} delay={80}>
            <div className="field-row">
              <label className="field"><span>Name</span><input name="name" required autoComplete="name" /></label>
              <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
            </div>
            <label className="field"><span>Company <em>(optional)</em></span><input name="company" autoComplete="organization" /></label>
            <label className="field"><span>Message</span><textarea name="message" rows="5" required /></label>
            <button className="btn btn-primary" type="submit">Send message</button>
            <p className={`form-note ${sent ? 'is-visible' : ''}`} role="status">
              {sent ? 'Your mail app should open with the message ready to send.' : ''}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
