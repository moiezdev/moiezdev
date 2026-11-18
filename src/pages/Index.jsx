import Hero from '../components/home/Hero.jsx';
import Projects from '../components/home/Projects.jsx';
import Architecture from '../components/home/Architecture.jsx';
import AiHighlight from '../components/home/AiHighlight.jsx';
import Experience from '../components/home/Experience.jsx';
import Contact from '../components/home/Contact.jsx';
import LogoStrip from '../components/credibility/LogoStrip.jsx';
import Testimonials from '../components/credibility/Testimonials.jsx';
import Transition from '../components/functions/Transition.jsx';

/**
 * Home: hero → selected work → architecture → AI integration → short experience →
 * contact. The logo strip and testimonials render nothing until they have content.
 * "How I build", the toolkit, the long story and LEAP live on /about.
 */
export default function Index() {
  return (
    <Transition>
      <Hero />
      <Projects />
      <Architecture />
      <AiHighlight />
      <LogoStrip />
      <Experience />
      <Testimonials />
      <Contact />
    </Transition>
  );
}
