import TypingText from '../ui/TypingText';
import Button from '../ui/Button';
import Logo from '../ui/Logo';
import FloatingDotBox from '../ui/animatedSvgs/FloatingDotBox';
import Magnetic from '../ui/Magnetic';
import LazyImage from '../ui/LazyImage';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="flex flex-col items-center justify-center lg:max-h-[800px] gap-6 px-4 overflow-visible">
      <div className="app-container mx-auto grid grid-cols-1 md:grid-cols-9 items-center justify-center gap-6 pt-[80px] md:pt-[123px] md:pb-[80px] pb-[40px]">
        {/* right section */}
        <div className="md:col-span-5 flex flex-col gap-4 cursor-pointer cursor-white">
          <h1 className="text-xlarge font-semibold cursor-pointer cursor-white cursor-scale-2">
            Moiz Dev is a <br className="block lg:hidden" />{' '}
            <span className="text-primary">{'<Full Stack/>'}</span> <br />
            Software Engineer
          </h1>
          <p className="text-lg md:text-2xl max-w-2xl cursor-pointer cursor-white cursor-scale-1.5">
            Product-focused Full Stack Engineer — React, Vue, and Node.js. Owning features
            end-to-end across product, UI/UX, APIs, and databases. Let's build together!
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/contact">
              <Button primary={true}>{'Contact me!!'}</Button>
            </Link>
            <a href="/Moieez%20ur%20Rehman.pdf" download="Moieez ur Rehman.pdf">
              <Button>Download resume</Button>
            </a>
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col align-middle relative">
          {/* Floating SVGs and Image */}

          <div className="absolute top-1/3 left-0 translate-x -translate-y-1/2 cursor-pointer cursor-white cursor-scale-0 z-10">
            <Magnetic strength={0.2}>
              <Logo
                className={'w-[170px]'}
                size={170}
                animate={true}
                animationStyle="draw-floating"
                repeat={1}
                duration={2}
                floatDuration={4}
              />
            </Magnetic>
          </div>

          <div className="absolute bottom-1 right-0 translate-x -translate-y-1/2">
            <Magnetic strength={0.4}>
              <FloatingDotBox animate={true} dotSize={2} />
            </Magnetic>
          </div>

          {/* Floating SVGs and Image end */}

          <LazyImage
            src="/heroSection/hero-img.webp"
            alt="Moiz"
            wrapperClass="relative z-0 cursor-pointer cursor-white cursor-scale-1.5 w-[80%] aspect-square mr-[10%] ml-auto"
          />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border border-gray-a inline-flex items-center p-1 mx-auto cursor-pointer cursor-white w-max">
            <span className="bg-primary h-[16px] aspect-square inline-block mb-[-2px] mr-1"></span>
            <p className="flex gap-1">
              Currently focused on <span className="text-white">product-focused fullstack</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="border border-gray-a relative p-[32px] text-white text-large cursor-pointer cursor-white cursor-scale-3.7">
          <img
            className="bg-gray-b w-[41px] absolute top-[-15px] left-[10px]"
            src="commas.svg"
            alt=""
          />
          <Magnetic strength={0.02}>
            <p>Great products feel simple — the complexity stays under the hood.</p>
          </Magnetic>
          <img
            className="bg-gray-b w-[41px] absolute bottom-[-15px] right-[10px]"
            src="commas.svg"
            alt=""
          />
        </div>
        <div className="border border-gray-a p-[16px] inline-block mt-[-1px] cursor-pointer cursor-white cursor-scale-2">
          <p>--- Mr Unknown</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
