import SectionTitle from '../components/ui/SectionTitle';
import ContactSection from '../components/home/Contact/ContactSection';
import Transition from '../components/functions/Transition';
import { useContent } from '../i18n/content';

const Contact = () => {
  const { t } = useContent();
  return (
    <section className="w-full px-4 py-12" id="projects">
      <Transition>
        <div className="app-container mx-auto pt-[30px] md:py-[60px]">
          <SectionTitle hash={'/'} title={t('contact.section')} />
          <p className="mt-[-20px] md:mb-[50px] max-md:mb-6">{t('contact.blurb')}</p>
          <ContactSection />
        </div>
      </Transition>
    </section>
  );
};

export default Contact;
