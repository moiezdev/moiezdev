import Hero from '../components/home/Hero.jsx';
import Projects from '../components/home/Projects.jsx';
import Architecture from '../components/home/Architecture.jsx';
import Experience from '../components/home/Experience.jsx';
import Contact from '../components/home/Contact.jsx';
import Transition from '../components/functions/Transition.jsx';

/**
 * Home: hero → selected work → architecture → short experience → contact.
 * "How I build", the toolkit, the long story and LEAP live on /about.
 */
export default function Index() {
  return (
    <Transition>
      <Hero />
      <Projects />
      <Architecture />
      <Experience />
      <Contact />
    </Transition>
  );
}
