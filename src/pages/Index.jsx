import Hero from '../components/home/Hero.jsx';
import Projects from '../components/home/Projects.jsx';
import Experience from '../components/home/Experience.jsx';
import Skills from '../components/home/Skills.jsx';
import About from '../components/home/About.jsx';
import Contact from '../components/home/Contact.jsx';
import Transition from '../components/functions/Transition.jsx';

export default function Index() {
  return (
    <Transition>
      <div className="">
        {/* <div className="bg-[length:100%] bg-[url('/background.png')] md:bg-[url('/background.png')]"> */}
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <About />
        <Contact />
      </div>
    </Transition>
  );
}
