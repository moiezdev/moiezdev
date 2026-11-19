import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * Botfolio's avatar: a small ball of the same liquid metal as the hero's blob — white metal on the dark
 * page, black metal on the light one. It ripples gently at rest, churns faster while thinking, and
 * pulses while speaking. One tiny WebGL2 canvas, raymarched; with reduced motion it moves at half speed, and
 * without WebGL it falls back to a shaded CSS sphere.
 * `mood`: idle | thinking | speaking
 * `faceOnly` (the panel header) drops the floor shadow.
 */

const VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime, uAmp, uPulse, uPx;
uniform vec3 uBase, uEnvLow, uEnvHigh, uSpec, uRim;
out vec4 o;

// the same ripple as the hero's sludge, on a unit-ish ball
float field(vec3 p) {
  vec3 n = normalize(p);
  float t = uTime;
  float r = 0.58 * (1.0 + uPulse * 0.06)
    + uAmp * (0.026 * sin(n.x * 3.1 + t * 1.7) * sin(n.y * 2.7 - t * 1.3)
    + 0.021 * sin(n.z * 4.3 + n.y * 2.0 + t * 2.1)
    + 0.008 * sin(n.x * 9.0 + n.z * 7.0 - t * 3.2))
    + uPulse * 0.035 * sin(n.y * 5.0 - t * 9.0);
  return length(p) - r;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(
    field(p + e.xyy) - field(p - e.xyy),
    field(p + e.yxy) - field(p - e.yxy),
    field(p + e.yyx) - field(p - e.yyx)));
}
vec3 shade(vec3 n, vec3 v) {
  vec3 l1 = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 l2 = normalize(vec3(0.8, -0.25, 0.35));
  float d1 = max(dot(n, l1), 0.0);
  float d2 = max(dot(n, l2), 0.0);
  float sp = pow(max(dot(n, normalize(l1 + v)), 0.0), 56.0) + 0.35 * pow(max(dot(n, normalize(l2 + v)), 0.0), 24.0);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 r = reflect(-v, n);
  vec3 env = mix(uEnvLow, uEnvHigh, smoothstep(-0.35, 0.75, r.y));
  vec3 col = uBase * (0.12 + 0.78 * d1 + 0.2 * d2) + env * 0.34 + uSpec * sp * 0.8 + uRim * fres * 0.35;
  // wetter than the rest: a tight bright highlight
  col += uSpec * pow(max(dot(r, l1), 0.0), 120.0) * 0.6;
  return col;
}
void main() {
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(vUv * 0.31, -1.0));
  float t = 1.9;
  float best = 1e9;
  bool hit = false;
  for (int i = 0; i < 48; i++) {
    float d = field(ro + rd * t);
    best = min(best, d);
    if (d < 0.0008) { hit = true; break; }
    t += d * 0.8;
    if (t > 4.2) break;
  }
  if (!hit) {
    // soft silhouette edge instead of jaggies
    float a = 1.0 - smoothstep(0.0, uPx * 1.5, best);
    if (a <= 0.0) discard;
    vec3 p = ro + rd * t;
    o = vec4(shade(normalAt(p), -rd) * a, a);
    return;
  }
  vec3 p = ro + rd * t;
  o = vec4(shade(normalAt(p), -rd), 1.0);
}`;

const LOOK = {
  dark: { base: [0.66, 0.67, 0.69], envLow: [0.1, 0.1, 0.11], envHigh: [0.92, 0.93, 0.95], spec: [1, 1, 1], rim: [0.7, 0.72, 0.75] },
  light: { base: [0.09, 0.095, 0.1], envLow: [0.01, 0.01, 0.012], envHigh: [0.42, 0.43, 0.45], spec: [0.85, 0.85, 0.87], rim: [0.22, 0.23, 0.25] },
};

const MOODS = { idle: { amp: 1, speed: 1 }, thinking: { amp: 1.5, speed: 2.4 }, speaking: { amp: 1.15, speed: 1.4 } };

const themeOf = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function createBlob(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const u = (n) => gl.getUniformLocation(prog, n);
  const vao = gl.createVertexArray();

  return {
    draw({ time, amp, pulse, theme }) {
      const w = canvas.width;
      gl.viewport(0, 0, w, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      const L = LOOK[theme];
      gl.uniform3fv(u('uBase'), L.base);
      gl.uniform3fv(u('uEnvLow'), L.envLow);
      gl.uniform3fv(u('uEnvHigh'), L.envHigh);
      gl.uniform3fv(u('uSpec'), L.spec);
      gl.uniform3fv(u('uRim'), L.rim);
      gl.uniform1f(u('uTime'), time);
      gl.uniform1f(u('uAmp'), amp);
      gl.uniform1f(u('uPulse'), pulse);
      // one pixel, in the ray's world units at the ball
      gl.uniform1f(u('uPx'), (2 * 0.31 * 2.4) / w);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

const RobotAvatar = ({ size = 64, mood = 'idle', faceOnly = false, className = '' }) => {
  const canvasRef = useRef(null);
  const fallbackRef = useRef(null);
  const moodRef = useRef(mood);
  const reduced = usePrefersReducedMotion();
  moodRef.current = mood;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * dpr);
    const blob = createBlob(canvas);
    if (!blob) {
      canvas.style.display = 'none';
      if (fallbackRef.current) fallbackRef.current.style.display = 'block';
      return undefined;
    }

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let amp = 1;
    let speed = 1;
    let pulse = 0;
    let theme = themeOf();
    const mo = new MutationObserver(() => {
      theme = themeOf();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const pace = reduced ? 0.5 : 1;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = MOODS[moodRef.current] || MOODS.idle;
      const k = Math.min(1, dt * 4);
      amp += (m.amp - amp) * k;
      speed += (m.speed - speed) * k;
      // speaking: an uneven, syllable-like swell
      const talk = moodRef.current === 'speaking'
        ? Math.max(0, Math.sin(now * 0.017) * 0.6 + Math.sin(now * 0.029 + 1.3) * 0.5)
        : 0;
      pulse += (talk - pulse) * Math.min(1, dt * 12);
      clock += dt * speed * pace;
      blob.draw({ time: clock, amp, pulse, theme });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      blob.dispose();
    };
  }, [size, reduced]);

  return (
    <div className={`relative select-none ${className}`} style={{ width: size, height: size }} aria-hidden>
      {!faceOnly && (
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-black/30 blur-[3px]"
          style={{ bottom: size * 0.02, width: size * 0.5, height: size * 0.07 }}
        />
      )}
      <canvas ref={canvasRef} className="relative block" style={{ width: size, height: size }} />
      <span
        ref={fallbackRef}
        className="absolute rounded-full"
        style={{
          display: 'none',
          inset: size * 0.12,
          background: 'radial-gradient(circle at 34% 28%, #fff 0%, #b9bdc4 38%, #4a4d53 78%, #1a1b1e 100%)',
        }}
      />
    </div>
  );
};

export default RobotAvatar;
