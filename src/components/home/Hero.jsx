import Button from '../ui/Button';
import Logo from '../ui/Logo';
import FloatingDotBox from '../ui/animatedSvgs/FloatingDotBox';
import Magnetic from '../ui/Magnetic';
import LazyImage from '../ui/LazyImage';
import { Link } from 'react-router-dom';
import { useContent } from '../../i18n/content';

const Hero = () => {
  const { t } = useContent();

  return (
    <section className="flex flex-col items-center justify-center lg:max-h-[800px] gap-6 px-4 overflow-visible">
      <div className="app-container mx-auto grid grid-cols-1 md:grid-cols-9 items-center justify-center gap-6 pt-[80px] md:pt-[123px] md:pb-[80px] pb-[40px]">
        <div className="md:col-span-5 flex flex-col gap-4 cursor-pointer cursor-white">
          <h1 className="text-xlarge font-semibold cursor-pointer cursor-white cursor-scale-2">
            {t('hero.titleBefore')} <br className="block lg:hidden" />{' '}
            <span className="text-primary">{t('hero.titleRole')}</span> <br />
            {t('hero.titleAfter')}
          </h1>
          <p className="text-lg md:text-2xl max-w-2xl cursor-pointer cursor-white cursor-scale-1.5">
            {t('hero.lead')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/contact">
              <Button primary={true}>{t('hero.contact')}</Button>
            </Link>
            <a href="/Moieez%20ur%20Rehman.pdf" download="Moieez ur Rehman.pdf">
              <Button>{t('hero.resume')}</Button>
            </a>
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col align-middle relative">
          <div className="absolute top-1/3 start-0 translate-x -translate-y-1/2 cursor-pointer cursor-white cursor-scale-0 z-10">
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

          <div className="absolute bottom-1 end-0 translate-x -translate-y-1/2">
            <Magnetic strength={0.4}>
              <FloatingDotBox animate={true} dotSize={2} />
            </Magnetic>
          </div>

          <LazyImage
            src="/heroSection/hero-img.webp"
            alt="Moiz"
            wrapperClass="relative z-0 cursor-pointer cursor-white cursor-scale-1.5 w-[80%] aspect-square me-[10%] ms-auto rtl:-scale-x-100"
          />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border border-gray-a inline-flex items-center p-1 mx-auto cursor-pointer cursor-white w-max">
            <span className="bg-primary h-[16px] aspect-square inline-block mb-[-2px] me-1"></span>
            <p className="flex gap-1">
              {t('hero.now')} <span className="text-white">{t('hero.nowFocus')}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="border border-gray-a relative p-[32px] text-white text-large cursor-pointer cursor-white cursor-scale-3.7">
          <img
            className="bg-gray-b w-[41px] absolute top-[-15px] start-[10px]"
            src="commas.svg"
            alt=""
          />
          <Magnetic strength={0.02}>
            <p>{t('hero.quote')}</p>
          </Magnetic>
          <img
            className="bg-gray-b w-[41px] absolute bottom-[-15px] end-[10px]"
            src="commas.svg"
            alt=""
          />
        </div>
        <div className="border border-gray-a p-[16px] inline-block mt-[-1px] cursor-pointer cursor-white cursor-scale-2">
          <p>{t('hero.quoteBy')}</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
