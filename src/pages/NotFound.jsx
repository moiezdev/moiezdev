import Button from '../components/ui/Button';
import { useContent } from '../i18n/content';

export default function NotFound() {
  const { t } = useContent();

  return (
    <div className="page-in flex flex-col items-center justify-center min-h-[80vh] px-6 pt-[52px] text-center">
      <p className="text-[120px] md:text-[180px] font-bold tracking-[-0.06em] leading-none text-gradient">404</p>
      <h1 className="headline-2 text-label mt-4">{t('notFound.title')}</h1>
      <p className="lead mt-3 max-w-md">{t('notFound.body')}</p>
      <Button to="/" primary size="lg" className="mt-8">
        {t('notFound.home')}
      </Button>
    </div>
  );
}
