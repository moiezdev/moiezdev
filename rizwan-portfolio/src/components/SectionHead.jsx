import Reveal from './Reveal'

export default function SectionHead({ eyebrow, title, lead }) {
  return (
    <header className="section-head">
      <Reveal as="p" className="eyebrow">{eyebrow}</Reveal>
      <Reveal as="h2" className="section-title" delay={60}>{title}</Reveal>
      {lead && <Reveal as="p" className="section-lead" delay={120}>{lead}</Reveal>}
    </header>
  )
}
