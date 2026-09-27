import Hero from '../components/home/Hero.jsx';
import Projects from '../components/home/Projects.jsx';
import Experience from '../components/home/Experience.jsx';
import Process from '../components/home/Process.jsx';
import Skills from '../components/home/Skills.jsx';
import About from '../components/home/About.jsx';
import Contact from '../components/home/Contact.jsx';
import Transition from '../components/functions/Transition.jsx';

export default function Index() {
  return (
    <Transition>
      <Hero />
      <Projects />
      <Process />
      <Experience />
      <Skills />
      <About />
      <Contact />
    </Transition>
  );
}
