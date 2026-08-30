import SectionTitle from '../ui/SectionTitle';
import ContactSection from './Contact/ContactSection';
import { useContent } from '../../i18n/content';

const Contact = () => {
  const { t } = useContent();
  return (
    <section className="w-full px-4 py-12" id="projects">
      <div className="app-container mx-auto">
        <SectionTitle title={t('contact.section')} />
        <ContactSection />
      </div>
    </section>
  );
};

export default Contact;
