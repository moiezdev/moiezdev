import Img from '../ui/Img';

/**
 * The hero's visual: Moiz's full cut-out portrait, on the side opposite the copy (mirrored in RTL, above the copy on
 * phones). Deto, the liquid, sits behind it in the middle of the hero (HeroLiquid.jsx).
 */
export default function HeroStage({ alt = '' }) {
  return (
    <div className="hero-stage" data-hero-portrait>
      {/* soft light behind the cut-out so a dark shirt never melts into the page */}
      <div aria-hidden className="hero-stage__glow" />
      <Img
        src="/heroSection/hero-img.webp"
        alt={alt}
        sizes="(min-width: 1024px) 480px, 300px"
        priority
        className="hero-stage__portrait"
      />
    </div>
  );
}
