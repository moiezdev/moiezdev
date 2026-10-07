import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Chevron } from '../components/ui/SectionTitle';
import { useContent } from '../i18n/content';
import { pageInClass } from '../utils/pageTransition';

export default function NotFound() {
  const { t } = useContent();

  return (
    <div className={`${pageInClass()} relative flex flex-col items-center justify-center min-h-[80vh] px-6 pt-[52px] text-center overflow-hidden`}>
      <div className="blueprint absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
      <p className="text-[120px] md:text-[180px] font-bold tracking-[-0.06em] leading-none text-gradient">404</p>
      <h1 className="headline-2 text-label mt-4">{t('notFound.title')}</h1>
      <p className="lead mt-3 max-w-md">{t('notFound.body')}</p>
      <Button to="/" primary size="lg" className="mt-8">
        {t('notFound.home')}
      </Button>
      <p className="mt-10 text-[13px] text-label-3">{t('notFound.or')}</p>
      <nav className="mt-3 flex flex-wrap justify-center gap-2">
        {t('notFound.links').map((link) => (
          <Link key={link.to} to={link.to} className="chip text-[14px] py-1.5 px-4 hover:text-label transition-colors">
            {link.label}
            <Chevron />
          </Link>
        ))}
      </nav>
    </div>
  );
}
