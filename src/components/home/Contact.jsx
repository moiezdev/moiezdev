import SectionTitle from '../ui/SectionTitle';
import ContactSection from './Contact/ContactSection';
import { useContent } from '../../i18n/content';

const Contact = () => {
  const { t } = useContent();
  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="contact">
      <div className="app-container">
        <SectionTitle eyebrow={t('contact.eyebrow')} title={t('contact.headline')} />
        <ContactSection />
      </div>
    </section>
  );
};

export default Contact;
