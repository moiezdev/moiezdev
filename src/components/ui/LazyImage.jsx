import { useState, useRef, useEffect } from 'react';

const LazyImage = ({
  src,
  blurSrc = `${src.split('.').slice(0, -1).join('.')}-blur.webp`,
  alt,
  className = 'w-full h-full',
  wrapperClass = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fade = 'transition-opacity duration-700 ease-[var(--ease-apple)]';

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${wrapperClass}`}>
      <img
        src={blurSrc}
        alt=""
        aria-hidden
        className={`${className} ${fade} absolute top-0 left-0 object-cover w-full h-full scale-105 blur-md`}
        style={{ opacity: loaded ? 0 : 1 }}
      />
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${fade} absolute top-0 left-0 object-cover w-full h-full`}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

export default LazyImage;
