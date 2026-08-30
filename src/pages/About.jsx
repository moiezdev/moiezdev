import { Link } from 'react-router-dom';
import SectionTitle from '../components/ui/SectionTitle';
import Floating from '../components/ui/Floating';
import Magnetic from '../components/ui/Magnetic';
import FloatingDotBox from '../components/ui/animatedSvgs/FloatingDotBox';
import Transition from '../components/functions/Transition';
import LazyImage from '../components/ui/LazyImage';
import Skills from '../components/home/Skills';
import Button from '../components/ui/Button';
import { about } from '../data';

const About = () => {
  return (
    <Transition>
      <>
        <section className="w-full px-4 py-12" id="about">
          <div className="app-container mx-auto pt-[30px] md:py-[60px]">
            <SectionTitle hash={'/'} title="about-me" buttonText="View all" link="/about" />
            <p className="mt-[-20px] md:mb-[50px] max-md:mb-6">
              Get to know the person behind the work.
            </p>

            <div className="grid md:gap-[60px] lg:gap-[97px] md:grid-cols-9">
              <div className="md:col-span-5 order-2 md:order-1 flex flex-col">
                <h3 className="mb-6 cursor-pointer cursor-white cursor-scale-1.2 text-large">
                  {about.title}
                </h3>
                {about.description.map((p, idx) => (
                  <p className="mb-6 cursor-pointer cursor-white cursor-scale-1.2" key={idx}>
                    {p}
                  </p>
                ))}
                <Link to="/experience" className="self-start">
                  <Button primary>View experience ~~{'>'}</Button>
                </Link>
              </div>
              <div className="md:col-span-4 order-1 md:order-2 relative">
                <div className="absolute top-0 right-1">
                  <Magnetic strength={0.1} duration={0.5}>
                    <FloatingDotBox animate={true} dotSize={2} rows={4} cols={5} duration={9} />
                  </Magnetic>
                </div>

                <div className="absolute top-1/3 left-2 translate-x -translate-y-1/2">
                  <Magnetic strength={0.1} duration={0.5}>
                    <FloatingDotBox
                      animate={true}
                      dotSize={2}
                      rows={7}
                      cols={7}
                      duration={12}
                      floatDistance={8}
                    />
                  </Magnetic>
                </div>
                <Floating className="w-full h-full aspect-5/6 max-md:pb-6" duration={8}>
                  <LazyImage
                    wrapperClass="w-full h-full"
                    className="w-full object-cover grayscale-100 cursor-pointer cursor-white cursor-scale-3"
                    src="/aboutSection/about-img.webp"
                    alt=""
                  />
                </Floating>
              </div>
            </div>
          </div>
        </section>

        <Skills />
      </>
    </Transition>
  );
};

export default About;
