import { Link } from 'react-router-dom';
import { getCv } from '../utils/cv';
import { usePreferences } from '../context/Preferences';
import './cv.css';

const Cv = () => {
  const { lang, theme, setLang, setTheme } = usePreferences();
  const cv = getCv(lang);

  return (
    <div className="cv-page" data-cv-theme={theme} lang={cv.lang} dir={cv.dir}>
      <div className="cv-toolbar">
        <Link to="/" className="cv-btn">
          {cv.labels.back}
        </Link>
        <div className="cv-toolbar-group">
          <button
            type="button"
            className={`cv-btn${lang === 'en' ? ' is-active' : ''}`}
            onClick={() => setLang('en')}
          >
            {cv.labels.langEn}
          </button>
          <button
            type="button"
            className={`cv-btn${lang === 'ar' ? ' is-active' : ''}`}
            onClick={() => setLang('ar')}
          >
            {cv.labels.langAr}
          </button>
          <button
            type="button"
            className={`cv-btn${theme === 'light' ? ' is-active' : ''}`}
            onClick={() => setTheme('light')}
          >
            {cv.labels.themeLight}
          </button>
          <button
            type="button"
            className={`cv-btn${theme === 'dark' ? ' is-active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            {cv.labels.themeDark}
          </button>
          <button type="button" className="cv-btn" onClick={() => window.print()}>
            {cv.labels.print}
          </button>
        </div>
      </div>

      <article className="cv-sheet">
        <header>
          <h1 className="cv-name">{cv.name}</h1>
          <p className="cv-headline">{cv.headline}</p>
          <p className="cv-meta">
            {cv.location}
            {cv.iqama ? ` · ${cv.iqama}` : ''}
          </p>
          <p className="cv-contacts">
            <a href={`mailto:${cv.contact.email}`}>{cv.contact.email}</a>
            {' · '}
            <a href={`tel:${cv.contact.phone}`}>{cv.contact.phone}</a>
            {' · '}
            <a href="https://www.linkedin.com/in/moiezdev" target="_blank" rel="noreferrer">
              {cv.contact.linkedin}
            </a>
            {' · '}
            <a href="https://github.com/moiezdev" target="_blank" rel="noreferrer">
              {cv.contact.github}
            </a>
            {' · '}
            <a href="https://www.moiez.dev" target="_blank" rel="noreferrer">
              {cv.contact.site}
            </a>
          </p>
        </header>

        <section className="cv-section">
          <h2>{cv.labels.summary}</h2>
          <p>{cv.summary}</p>
        </section>

        <section className="cv-section">
          <h2>{cv.labels.experience}</h2>
          {cv.jobs.map((job) => (
            <div className="cv-job" key={job.id}>
              <div className="cv-job-top">
                <h3>{job.title}</h3>
                <span className="cv-job-period">
                  {job.period}
                  {job.current ? ` · ${cv.labels.present}` : ''}
                </span>
              </div>
              <p className="cv-job-company">
                {job.company} — {job.location}
              </p>
              <ul>
                {job.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="cv-section">
          <h2>{cv.labels.skills}</h2>
          <div className="cv-skills">
            {cv.skillGroups.map((group) => (
              <p className="cv-skill-row" key={group.category}>
                <strong>{group.category}: </strong>
                {group.items.join(' · ')}
              </p>
            ))}
          </div>
        </section>

        <section className="cv-section cv-edu">
          <div>
            <h2>{cv.labels.education}</h2>
            <p>
              <strong>{cv.education.degree}</strong>
            </p>
            <p>
              {cv.education.school} · {cv.education.period}
            </p>
          </div>
          <div>
            <h2>{cv.labels.languages}</h2>
            <div className="cv-chips">
              {cv.education.languages.map((item) => (
                <span className="cv-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};

export default Cv;
