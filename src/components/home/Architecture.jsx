import { Link } from 'react-router-dom';
import SectionTitle, { Chevron } from '../ui/SectionTitle';
import Reveal from '../../motion/Reveal';
import ArchitectureFigure from './ArchitectureFigure';
import { useContent } from '../../i18n/content';

/** Home: the TWLM system architecture diagram. */
const Architecture = () => {
  const { t } = useContent();
  return (
    <section data-theme="dark" className="band-dark w-full px-5 py-20 md:py-28" id="architecture">
      <div className="app-container">
        <SectionTitle eyebrow={t('arch.eyebrow')} title={t('arch.headline')} subtitle={t('arch.subtitle')} />
        <Reveal>
          <ArchitectureFigure />
        </Reveal>
        <Reveal className="mt-6">
          <Link to="/works/twlm-pos" className="link-arrow text-[15px]">
            {t('arch.caseStudy')}
            <Chevron />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default Architecture;
