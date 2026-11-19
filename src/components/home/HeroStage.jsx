import { ForgeSpot } from './ForgeLayer';

/**
 * The hero's spot for the nano forge (see ForgeLayer.jsx and MOTION.md): the forge draws the liquid-metal
 * blob here. The prerendered HTML is just a soft glow, which stays as the placeholder until the forge loads.
 */
export default function HeroStage() {
  return (
    <div className="hero-stage" aria-hidden>
      <ForgeSpot shape="toxic sludge" className="hero-stage__canvas">
        <div className="hero-stage__glow" />
      </ForgeSpot>
    </div>
  );
}
