import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * Botfolio's avatar: a small ball packed with the same machined metal cubes as the hero's nano forge (white
 * metal on the dark page, black metal on the light one). It is alive: the ball turns slowly and its cubes
 * dance a little, rippling in and out in waves. They churn faster while it's thinking and swell in
 * syllable-like pulses while it's speaking. One tiny WebGL2 canvas, one instanced cube draw; with reduced motion
 * it moves at half speed, and without WebGL it falls back to a shaded CSS sphere.
 * `mood`: idle | thinking | speaking
 * `faceOnly` (the panel header) drops the floor shadow.
 */

// a ball of cubes on a grid, 7 across, filled right through
const GRID = 3;
const BALL = [];
for (let x = -GRID; x <= GRID; x++)
  for (let y = -GRID; y <= GRID; y++)
    for (let z = -GRID; z <= GRID; z++) if (Math.hypot(x, y, z) <= GRID + 0.45) BALL.push(x, y, z, Math.random());

const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aCell; // grid position, and a random seed
uniform float uTime, uAmp, uPulse;
uniform mat3 uRot;
out vec3 vN;
out vec3 vWorld;
out vec3 vLocal;
void main() {
  vec3 c = aCell.xyz;
  float r = length(c);
  vec3 n = r > 0.01 ? c / r : vec3(0.0, 1.0, 0.0);
  float t = uTime;
  // the dance: waves running over the ball push each cube in and out, each a little out of step
  float wave = sin(dot(c, vec3(0.9, 1.3, 0.7)) * 0.9 + t * 2.3 + aCell.w * 1.5) * 0.55
    + sin(c.y * 1.1 - t * 1.7 + aCell.w * 4.0) * 0.45;
  float push = uAmp * 0.2 * wave * smoothstep(1.5, ${GRID}.0, r);
  // speaking: the ball swells in uneven pulses that run from the middle out
  push += uPulse * 0.45 * (0.6 + 0.4 * sin(r * 1.4 - t * 9.0));
  vec3 p = c + n * push;
  // the cubes keep square to the ball and only tip a touch as they dance
  float tip = uAmp * 0.12 * sin(t * 1.9 + aCell.w * 6.3);
  float ct = cos(tip), st = sin(tip);
  vec3 q = aPos; // flush: no gap between cubes at rest
  q = vec3(q.x * ct - q.y * st, q.x * st + q.y * ct, q.z);
  vec3 nn = vec3(aNormal.x * ct - aNormal.y * st, aNormal.x * st + aNormal.y * ct, aNormal.z);
  vec3 w = uRot * ((p + q) / ${GRID + 1}.6);
  vN = uRot * nn;
  vWorld = w;
  vLocal = aPos;
  gl_Position = vec4(w.xy * 0.9, -w.z * 0.3, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vWorld;
in vec3 vLocal;
uniform vec3 uBase, uEnvLow, uEnvHigh, uSpec, uRim, uEdge;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 l1 = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 l2 = normalize(vec3(0.8, -0.25, 0.35));
  float d1 = max(dot(n, l1), 0.0);
  float d2 = max(dot(n, l2), 0.0);
  float sp = pow(max(dot(n, normalize(l1 + v)), 0.0), 56.0) + 0.35 * pow(max(dot(n, normalize(l2 + v)), 0.0), 24.0);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 r = reflect(-v, n);
  vec3 env = mix(uEnvLow, uEnvHigh, smoothstep(-0.35, 0.75, r.y));
  vec3 col = uBase * (0.12 + 0.78 * d1 + 0.2 * d2) + env * 0.34 + uSpec * sp * 0.8 + uRim * fres * 0.35;
  // machined bevel: light catches where two faces meet
  vec3 a = abs(vLocal) * 2.0;
  float mid = a.x + a.y + a.z - max(a.x, max(a.y, a.z)) - min(a.x, min(a.y, a.z));
  col += uEdge * smoothstep(0.82, 0.96, mid) * (0.35 + 0.65 * d1);
  o = vec4(col, 1.0);
}`;

function cubeMesh() {
  const P = [];
  const N = [];
  const I = [];
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  for (const [nn, u, w] of faces) {
    const base = P.length / 3;
    for (const [su, sw] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      for (let k = 0; k < 3; k++) P.push(nn[k] * 0.5 + u[k] * su * 0.5 + w[k] * sw * 0.5);
      N.push(...nn);
    }
    // wind every face counter-clockwise as seen from outside
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const ccw = cr[0] * nn[0] + cr[1] * nn[1] + cr[2] * nn[2] > 0;
    I.push(...(ccw ? [base, base + 1, base + 2, base, base + 2, base + 3] : [base, base + 2, base + 1, base, base + 3, base + 2]));
  }
  return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) };
}

function rotation(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  // Rx(pitch) * Ry(yaw), column-major
  return new Float32Array([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);
}

const LOOK = {
  dark: { base: [0.66, 0.67, 0.69], envLow: [0.1, 0.1, 0.11], envHigh: [0.92, 0.93, 0.95], spec: [1, 1, 1], rim: [0.7, 0.72, 0.75], edge: [0.24, 0.24, 0.25] },
  light: { base: [0.09, 0.095, 0.1], envLow: [0.01, 0.01, 0.012], envHigh: [0.42, 0.43, 0.45], spec: [0.85, 0.85, 0.87], rim: [0.22, 0.23, 0.25], edge: [0.16, 0.16, 0.17] },
};

const MOODS = { idle: { amp: 1, speed: 1 }, thinking: { amp: 1.5, speed: 2.4 }, speaking: { amp: 1.15, speed: 1.4 } };

const themeOf = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function createBlob(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: true, alpha: true });
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

  const mesh = cubeMesh();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = (data, target = gl.ARRAY_BUFFER) => {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
  };
  const attrib = (loc, n, divisor = 0) => {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
    if (divisor) gl.vertexAttribDivisor(loc, divisor);
  };
  buf(mesh.P);
  attrib(0, 3);
  buf(mesh.N);
  attrib(1, 3);
  buf(new Float32Array(BALL));
  attrib(2, 4, 1);
  buf(mesh.I, gl.ELEMENT_ARRAY_BUFFER);
  gl.bindVertexArray(null);
  const count = BALL.length / 4;

  return {
    draw({ time, amp, pulse, theme }) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.useProgram(prog);
      const L = LOOK[theme];
      gl.uniform3fv(u('uBase'), L.base);
      gl.uniform3fv(u('uEnvLow'), L.envLow);
      gl.uniform3fv(u('uEnvHigh'), L.envHigh);
      gl.uniform3fv(u('uSpec'), L.spec);
      gl.uniform3fv(u('uRim'), L.rim);
      gl.uniform3fv(u('uEdge'), L.edge);
      gl.uniform1f(u('uTime'), time);
      gl.uniform1f(u('uAmp'), amp);
      gl.uniform1f(u('uPulse'), pulse);
      // it turns slowly and sways a little, like it's looking around
      gl.uniformMatrix3fv(u('uRot'), false, rotation(time * 0.35 + 0.6, 0.42 + Math.sin(time * 0.8) * 0.12));
      gl.bindVertexArray(vao);
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0, count);
      gl.bindVertexArray(null);
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
