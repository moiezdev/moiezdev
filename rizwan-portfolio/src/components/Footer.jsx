import { contact, nav, profile } from '../data/content'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        <nav aria-label="Footer">
          {nav.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
          <a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        </nav>
      </div>
    </footer>
  )
}
