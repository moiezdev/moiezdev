import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import SectionTitle from '../ui/SectionTitle';
import LazyImage from '../ui/LazyImage';
import Floating from '../ui/Floating';
import Magnetic from '../ui/Magnetic';
import FloatingDotBox from '../ui/animatedSvgs/FloatingDotBox';
import { about } from '../../data';

const About = () => {
  return (
    <section className="w-full px-4 py-12" id="projects">
      <div className="app-container mx-auto">
        <SectionTitle title="about me" />
        <div className="grid md:gap-[60px] lg:gap-[97px] md:grid-cols-9">
          <div className="md:col-span-5 order-2 md:order-1 flex flex-col">
            <h3 className="my-6 cursor-pointer cursor-white cursor-scale-1.2 text-large">
              {about.title}
            </h3>
            {about.description.map((p, idx) => (
              <p className="mb-6 cursor-pointer cursor-white cursor-scale-1.2" key={idx}>
                {p}
              </p>
            ))}
            <Link to="/experience" className="self-start">
              <Button>View experience ~~{'>'}</Button>
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
            <Floating className="w-full h-full max-md:aspect-5/6 md:aspect-auto max-md:pb-6">
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
  );
};

export default About;
