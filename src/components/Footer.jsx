import { Link } from 'react-router-dom';
import { contacts } from '../data';
import { useContent } from '../i18n/content';

const NAV = [
  { key: 'nav.home', link: '/' },
  { key: 'nav.works', link: '/works' },
  { key: 'nav.experience', link: '/experience' },
  { key: 'nav.about', link: '/about' },
  { key: 'nav.contact', link: '/contact' },
];

const Footer = () => {
  const { t } = useContent();
  const media = contacts.filter((c) => c.categories.includes('media') || c.categories.includes('contact'));

  return (
    // bottom padding keeps the last line clear of the floating chat launcher
    <footer className="bg-surface-2 text-[12px] leading-[1.5] text-label-2 mt-24 px-5 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="app-container pt-12 pb-6">
        <div className="grid gap-10 sm:grid-cols-3 pb-8 border-b border-separator">
          <div>
            <p className="text-label text-[15px] font-semibold mb-1">Moieez ur Rehman</p>
            <p>{t('footer.role')}</p>
            <a className="mt-3 inline-block text-accent hover:underline" href="mailto:moiezdev@gmail.com">
              moiezdev@gmail.com
            </a>
          </div>
          <div>
            <p className="text-label font-semibold mb-3">{t('footer.explore')}</p>
            <ul className="flex flex-col gap-2">
              {NAV.map((item) => (
                <li key={item.link}>
                  <Link className="hover:text-label hover:underline" to={item.link}>
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-label font-semibold mb-3">{t('footer.media')}</p>
            <ul className="flex flex-col gap-2">
              {media.map((contact) => (
                <li key={contact.platform}>
                  <a
                    className="hover:text-label hover:underline"
                    href={contact.url}
                    // mail and phone links hand off to an app; only web links get a new tab
                    {...(/^https?:/.test(contact.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {contact.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-5 flex flex-col sm:flex-row gap-2 justify-between">
          <p>
            &copy; {new Date().getFullYear()} MoizDev. {t('footer.rights')}
          </p>
          <p>{t('footer.crafted')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
