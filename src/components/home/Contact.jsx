import SectionTitle from '../ui/SectionTitle';
import ContactSection from './Contact/ContactSection';
import { useContent } from '../../i18n/content';

const Contact = () => {
  const { t } = useContent();
  return (
    <section className="band-tint w-full px-5 py-20 md:py-28" id="contact">
      <div className="app-container">
        <SectionTitle eyebrow={t('contact.eyebrow')} title={t('contact.headline')} />
        <ContactSection />
      </div>
    </section>
  );
};

export default Contact;
