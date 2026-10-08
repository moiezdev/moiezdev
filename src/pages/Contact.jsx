import ContactSection from '../components/home/Contact/ContactSection';
import LogoStrip from '../components/credibility/LogoStrip';
import Testimonials from '../components/credibility/Testimonials';
import Transition from '../components/functions/Transition';
import PageHeader from '../components/ui/PageHeader';
import { useContent } from '../i18n/content';

const Contact = () => {
  const { t } = useContent();
  return (
    <Transition>
      <PageHeader eyebrow={t('contact.eyebrow')} title={t('contact.headline')} subtitle={t('contact.blurb')} />
      <section className="w-full px-5">
        <div className="app-container">
          <ContactSection />
        </div>
      </section>
      {/* both render nothing until they have content: quotes in src/data/testimonials.json,
          and site.logoStrip enabled with at least one permitted logo */}
      <LogoStrip />
      <Testimonials />
    </Transition>
  );
};

export default Contact;
