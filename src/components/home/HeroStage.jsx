import Img from '../ui/Img';
import { ForgeSpot } from './ForgeLayer';

/**
 * The hero's visual: Moiz's full cut-out portrait. The hero also marks the first shape of the dim forge that runs
 * behind the whole home page (the liquid-metal blob, see ForgeLayer.jsx and MOTION.md).
 */
export default function HeroStage({ alt = '' }) {
  return (
    <div className="hero-stage">
      <ForgeSpot shape="toxic sludge" />
      <Img
        src="/heroSection/hero-img.webp"
        alt={alt}
        sizes="(min-width: 1024px) 520px, 80vw"
        priority
        className="hero-stage__portrait"
      />
    </div>
  );
}
