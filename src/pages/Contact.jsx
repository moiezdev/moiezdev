import ContactSection from '../components/home/Contact/ContactSection';
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
      {/* renders nothing until src/data/testimonials.json has quotes */}
      <Testimonials />
    </Transition>
  );
};

export default Contact;
