/**
 * Nano forge: a few thousand machined micro-cubes that keep flying apart and
 * re-assembling into new shapes in the hero stage (a cube, a torus knot, a
 * Möbius loop, a ringed planet and a double helix). The shapes are only ever
 * cubes: nothing fuses into a smooth solid. While the cubes are in flight they
 * are strung together by hairlines, which let go once the shape has formed.
 *
 * Real 3D on one WebGL2 canvas, no library: one instanced cube mesh with the
 * whole morph in the vertex shader, and one line pass that reuses the same
 * maths. Every shape is precomputed, so per frame the CPU only updates a few
 * uniforms. Cheap enough for phones.
 *
 * Returns null when WebGL2 isn't available (the stage then keeps its static glow).
 */

const TAU = Math.PI * 2;
const MORPH = 4.0; // seconds for the cubes to fly to the next shape
const HOLD = 6.0; // seconds the formed shape holds
const CYCLE = MORPH + HOLD;
const FLOOR_Y = -1.12; // the floor the shadow falls on, below the shapes


// ---------- shapes: n points, xyz in about [-1, 1], w = cube scale (0 hides a spare cube) ----------

const rand = (a, b) => a + Math.random() * (b - a);

/** Sort so cube i lands near cube i of the next shape: by height band, then around the y axis. */
function settle(pts) {
  const band = (p) => Math.round((p[1] + 1.2) * 14);
  pts.sort((a, b) => band(a) - band(b) || Math.atan2(a[2], a[0]) - Math.atan2(b[2], b[0]));
  const out = new Float32Array(pts.length * 4);
  pts.forEach((p, i) => out.set([p[0], p[1], p[2], p[3] ?? 1], i * 4));
  return out;
}

/** Fill up to n with hidden spares that sit inside the shape (so a morph never flies in from 0,0,0). */
function pad(pts, n) {
  if (pts.length > n) {
    for (let i = pts.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    pts.length = n;
  }
  while (pts.length < n) {
    const p = pts[(Math.random() * pts.length) | 0];
    pts.push([p[0], p[1], p[2], 0]);
  }
  return pts;
}

/** A hollow cube built from a voxel grid: the most "transformium" of the set. */
function voxelCube(n, g) {
  const pts = [];
  const h = 0.62;
  for (let x = 0; x < g; x++)
    for (let y = 0; y < g; y++)
      for (let z = 0; z < g; z++) {
        if (x && y && z && x < g - 1 && y < g - 1 && z < g - 1) continue;
        const f = (v) => (v / (g - 1)) * 2 * h - h;
        pts.push([f(x), f(y), f(z)]);
      }
  return pad(pts, n);
}

function torusKnot(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const c = (u) => {
      const r = Math.cos(3 * u) + 2.1;
      return [r * Math.cos(2 * u), r * Math.sin(2 * u), Math.sin(3 * u) * 1.1];
    };
    const p = c(t);
    const q = c(t + 0.001);
    const tan = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const tl = Math.hypot(...tan);
    // a random offset around the tube, with its tangent part removed
    let o = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
    const d = (o[0] * tan[0] + o[1] * tan[1] + o[2] * tan[2]) / (tl * tl);
    o = [o[0] - tan[0] * d, o[1] - tan[1] * d, o[2] - tan[2] * d];
    const ol = Math.hypot(...o) || 1;
    const R = 0.42;
    pts.push([(p[0] + (o[0] / ol) * R) / 3.3, (p[1] + (o[1] / ol) * R) / 3.3, (p[2] + (o[2] / ol) * R) / 3.3]);
  }
  return pts;
}

function planet(n) {
  const pts = [];
  const ns = Math.round(n * 0.7);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < ns; i++) {
    const y = 1 - (i / (ns - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(golden * i) * r * 0.5, y * 0.5, Math.sin(golden * i) * r * 0.5]);
  }
  const tilt = 0.42;
  for (let i = ns; i < n; i++) {
    const a = rand(0, TAU);
    const r = Math.sqrt(rand(0.7 * 0.7, 1.08 * 1.08));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // a loose belt of debris: some thickness, and rocks of every size
    const y = rand(-0.045, 0.045) * (0.4 + Math.random());
    const scale = 0.3 + Math.random() ** 1.8 * 0.85;
    // w = 2 + scale: the second part (the ring), so no strings run between it and the globe
    pts.push([x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt), 2 + scale]);
  }
  return pts;
}

const HELIX_TURNS = 0.75; // per half: 1.5 turns top to bottom
const HELIX_RUNGS = 9;
function helix(n) {
  const pts = [];
  const rungs = Math.round(n * 0.14);
  const strand = n - rungs;
  for (let i = 0; i < strand; i++) {
    const t = (i / strand) * 2 - 1;
    const a = t * TAU * HELIX_TURNS + (i % 2 ? Math.PI : 0);
    const j = () => rand(-0.035, 0.035);
    // each strand is its own part (w = 1 or 3), so no strings jump the gap between them
    pts.push([Math.cos(a) * 0.4 + j(), t * 0.95, Math.sin(a) * 0.4 + j(), i % 2 ? 3 : 1]);
  }
  for (let i = 0; i < rungs; i++) {
    const k = Math.floor(rand(0, HELIX_RUNGS));
    const t = (k / (HELIX_RUNGS - 1)) * 1.8 - 0.9;
    const a = t * TAU * HELIX_TURNS;
    const s = rand(-0.4, 0.4);
    // the rungs are a third part (w = 5)
    pts.push([Math.cos(a) * s, t * 0.95, Math.sin(a) * s, 5]);
  }
  return pts;
}

const MOBIUS_R = 0.72;
const MOBIUS_W = 0.1;
/** A point on the Möbius band: u around the loop (one full twist per 2π), v across it. */
// tipped towards the viewer so the twist reads, instead of lying flat like a ring
const MOBIUS_TILT = 0.95;
const mobiusAt = (u, v) => {
  const r = MOBIUS_R + v * Math.cos(u / 2);
  const y = v * Math.sin(u / 2);
  const z = r * Math.sin(u);
  const c = Math.cos(MOBIUS_TILT);
  const s = Math.sin(MOBIUS_TILT);
  return [r * Math.cos(u), y * c - z * s, y * s + z * c];
};

/** Cubes spread evenly over a Möbius band (denser where the band runs wider from the centre). */
function mobius(n) {
  const pts = [];
  while (pts.length < n) {
    const u = rand(0, TAU);
    const v = rand(-MOBIUS_W, MOBIUS_W);
    // area weighting: the outer edge of the loop has more surface than the inner one
    if (Math.random() * (MOBIUS_R + MOBIUS_W) > MOBIUS_R + v * Math.cos(u / 2)) continue;
    pts.push(mobiusAt(u, v));
  }
  return pts;
}

function cloud(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const d = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
    const l = Math.hypot(...d) || 1;
    const r = rand(0.95, 1.65);
    pts.push([(d[0] / l) * r, (d[1] / l) * r, (d[2] / l) * r, 0.4]);
  }
  return pts;
}

// ---------- look ----------

const LOOK = {
  dark: {
    // white metal on the dark page
    base: [0.66, 0.67, 0.69],
    envLow: [0.1, 0.1, 0.11],
    envHigh: [0.92, 0.93, 0.95],
    spec: [1.0, 1.0, 1.0],
    rim: [0.7, 0.72, 0.75],
    edge: [0.24, 0.24, 0.25],
    glow: [0.8, 0.83, 0.88],
    line: [0.86, 0.87, 0.9],
    lineAlpha: 0.85,
    shadow: 0.55,
  },
  light: {
    // black metal on the light page
    base: [0.09, 0.095, 0.1],
    envLow: [0.01, 0.01, 0.012],
    envHigh: [0.42, 0.43, 0.45],
    spec: [0.85, 0.85, 0.87],
    rim: [0.22, 0.23, 0.25],
    edge: [0.16, 0.16, 0.17],
    glow: [0.22, 0.23, 0.25],
    line: [0.1, 0.105, 0.115],
    lineAlpha: 0.75,
    shadow: 0.2,
  },
};

// ---------- shaders ----------

/** Flattens a point onto the floor under the shape, lit from a little above and to the left. */
const FLOOR = `
uniform float uShadow, uFloor;
uniform mat3 uPitch;
vec3 toFloor(vec3 w) {
  vec3 u = transpose(uPitch) * w;
  float h = u.y - uFloor;
  u.x += h * 0.2;
  u.z -= h * 0.1;
  u.y = uFloor;
  return uPitch * u;
}`;

const CENTRE = `
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uMix, uTime, uScatter, uAspect, uPointerOn;
uniform vec2 uPointer;
uniform float uRingA, uRingB, uOrbit; // 1 when shape A / B is the planet, whose ring stays loose debris
const vec3 RING_AXIS = vec3(0.0, 0.9130889, 0.4077604); // the ring's normal: (0, cos 0.42, sin 0.42)
mat3 axisAngle(vec3 a, float t) {
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(
    c + a.x*a.x*k,      a.y*a.x*k + a.z*s, a.z*a.x*k - a.y*s,
    a.x*a.y*k - a.z*s,  c + a.y*a.y*k,     a.z*a.y*k + a.x*s,
    a.x*a.z*k + a.y*s,  a.y*a.z*k - a.x*s, c + a.z*a.z*k);
}
// ring debris orbits the globe, the inner rocks a little faster
vec3 orbit(vec3 p) {
  float r = length(p - RING_AXIS * dot(p, RING_AXIS));
  return axisAngle(RING_AXIS, uOrbit / pow(max(r, 0.5), 1.5)) * p;
}

vec3 centreOf(vec4 A, vec4 B, vec4 seed, out float e, out float arc, out float near, out float scale, out vec3 dir, out float debris) {
  // built from the core outwards, each cube a little out of step
  float delay = seed.x * 0.42 + clamp(length(B.xyz), 0.0, 1.2) * 0.22;
  e = clamp((uMix - delay) / 0.3, 0.0, 1.0);
  e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
  arc = sin(3.14159265 * e);
  dir = normalize(seed.yzw * 2.0 - 1.0 + vec3(1e-4));
  // a straight flight with only a slight outward give, so cubes don't pass through each other
  float ringA = uRingA * step(0.5, floor(A.w * 0.5));
  float ringB = uRingB * step(0.5, floor(B.w * 0.5));
  vec3 pa = ringA > 0.5 ? orbit(A.xyz) : A.xyz;
  vec3 pb = ringB > 0.5 ? orbit(B.xyz) : B.xyz;
  debris = mix(ringA, ringB, step(0.5, e));
  vec3 p = mix(pa, pb, e) + dir * arc * (0.05 + seed.x * 0.05);
  p += dir * 0.005 * sin(uTime * 1.6 + seed.y * 40.0);
  p += dir * uScatter * (0.7 + seed.x * 1.8);
  // w holds the cube's scale, plus 2 x the part it belongs to (the planet's globe and ring, each helix strand and the rungs)
  scale = mix(mod(A.w, 2.0), mod(B.w, 2.0), e) * (1.0 - 0.1 * arc) * (1.0 - 0.75 * uScatter);
  vec3 c = uRot * p;
  // the pointer parts the cubes around it
  vec4 c0 = uProj * vec4(c - vec3(0.0, 0.0, uCamZ), 1.0);
  vec2 d = c0.xy / c0.w - uPointer;
  d.x *= uAspect;
  near = uPointerOn * smoothstep(0.42, 0.0, length(d));
  vec2 away = normalize(d + vec2(1e-4));
  away.x /= uAspect;
  c.xy += away * near * 0.32;
  c.z += near * 0.25;
  return c;
}`;

const SHADE = `
uniform vec3 uBase, uEnvLow, uEnvHigh, uSpec, uRim, uGlow;
uniform float uCamZ;
vec3 shade(vec3 n, vec3 world) {
  vec3 v = normalize(vec3(0.0, 0.0, uCamZ) - world);
  vec3 l1 = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 l2 = normalize(vec3(0.8, -0.25, 0.35));
  float d1 = max(dot(n, l1), 0.0);
  float d2 = max(dot(n, l2), 0.0);
  float sp = pow(max(dot(n, normalize(l1 + v)), 0.0), 56.0) + 0.35 * pow(max(dot(n, normalize(l2 + v)), 0.0), 24.0);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  // a studio sky reflected in each surface: brushed steel, not plastic
  vec3 r = reflect(-v, n);
  vec3 env = mix(uEnvLow, uEnvHigh, smoothstep(-0.35, 0.75, r.y));
  return uBase * (0.12 + 0.78 * d1 + 0.2 * d2) + env * 0.34 + uSpec * sp * 0.8 + uRim * fres * 0.35;
}`;

const CUBE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aA;
layout(location=3) in vec4 aB;
layout(location=4) in vec4 aSeed;
uniform float uSize;
out vec3 vN;
out vec3 vLocal;
out vec3 vWorld;
out float vGlow;
${CENTRE}
${FLOOR}
void main() {
  float e, arc, near, scale, debris;
  vec3 dir;
  vec3 c = centreOf(aA, aB, aSeed, e, arc, near, scale, dir, debris);
  // no tumbling in flight: cubes keep square to the grid and only turn when scattered by scroll;
  // the ring's debris turns slowly as it orbits
  float spin = uScatter * aSeed.w * 5.0 + debris * uOrbit * (aSeed.w - 0.5) * 4.0;
  mat3 R = uRot * axisAngle(dir, spin);
  vec3 world = c + R * (aPos * scale * uSize);
  if (uShadow > 0.5) world = toFloor(world);
  vN = R * aNormal;
  vLocal = aPos;
  vWorld = world;
  vGlow = arc * 0.3 + near * 0.35;
  gl_Position = uProj * vec4(world - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const CUBE_FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vLocal;
in vec3 vWorld;
in float vGlow;
uniform vec3 uEdge;
uniform float uShadow;
out vec4 o;
${SHADE}
void main() {
  if (uShadow > 0.5) {
    o = vec4(1.0);
    return;
  }
  vec3 n = normalize(vN);
  vec3 col = shade(n, vWorld);
  // machined bevel: light catches where two faces meet
  vec3 a = abs(vLocal) * 2.0;
  float mid = a.x + a.y + a.z - max(a.x, max(a.y, a.z)) - min(a.x, min(a.y, a.z));
  col += uEdge * smoothstep(0.86, 0.96, mid) * (0.35 + 0.65 * max(dot(n, normalize(vec3(-0.55, 0.85, 0.6))), 0.0));
  o = vec4(col + uGlow * vGlow, 1.0);
}`;

const LINE_VS = `#version 300 es
precision highp float;
layout(location=2) in vec4 aA;
layout(location=3) in vec4 aB;
layout(location=4) in vec4 aSeed;
layout(location=5) in vec4 aA2;
layout(location=6) in vec4 aB2;
layout(location=7) in vec4 aSeed2;
uniform float uStrings, uMaxLen;
out float vAlpha;
${CENTRE}
void main() {
  float e1, arc1, near1, s1, k1, e2, arc2, near2, s2, k2;
  vec3 d1, d2;
  vec3 c1 = centreOf(aA, aB, aSeed, e1, arc1, near1, s1, d1, k1);
  vec3 c2 = centreOf(aA2, aB2, aSeed2, e2, arc2, near2, s2, d2, k2);
  float len = distance(c1, c2);
  // cubes in flight are strung together; the strings let go once the shape has formed
  float on = uStrings;
  // never string two separate parts together (the globe and its ring)
  float sameA = float(floor(aA.w * 0.5) == floor(aA2.w * 0.5));
  float sameB = float(floor(aB.w * 0.5) == floor(aB2.w * 0.5));
  float same = mix(sameA, sameB, step(0.5, (e1 + e2) * 0.5));
  vAlpha = same * smoothstep(uMaxLen, uMaxLen * 0.3, len) * step(0.01, s1 * s2) * on * (0.5 + 0.4 * max(arc1, arc2) + 0.5 * uScatter);
  gl_Position = uProj * vec4(c1 - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const LINE_FS = `#version 300 es
precision highp float;
in float vAlpha;
uniform vec3 uLine;
uniform float uLineAlpha;
out vec4 o;
void main() {
  float a = clamp(vAlpha * uLineAlpha, 0.0, 1.0);
  o = vec4(uLine * a, a);
}`;

/** The floor shadow: drawn small into its own texture, then laid down softly blurred. */
const SHADOW_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const SHADOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDark;
out vec4 o;
void main() {
  float a = 0.0;
  float wsum = 0.0;
  for (int i = -3; i <= 3; i++) {
    for (int j = -3; j <= 3; j++) {
      float w = exp(-float(i * i + j * j) / 6.0);
      a += texture(uTex, vUv + vec2(float(i), float(j)) * uTexel * 1.4).a * w;
      wsum += w;
    }
  }
  a = a / wsum * uDark;
  o = vec4(0.0, 0.0, 0.0, a);
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

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function rotation(yaw, pitch, roll = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  const cz = Math.cos(roll), sz = Math.sin(roll);
  // R = Rx(pitch) * Ry(yaw) * Rz(roll), column-major
  const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx];
  const rz = [cz, sz, 0, -sz, cz, 0, 0, 0, 1];
  const mul = (a, b) => {
    const o = new Array(9);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
    return o;
  };
  return new Float32Array(mul(rx, mul(ry, rz)));
}

/**
 * @param {HTMLCanvasElement} canvas  fills the hero stage
 * @param {{
 *   theme: () => 'dark'|'light',
 *   scroll?: () => number,          0 with the hero at the top, 1 once it has gone
 *   pointer?: () => {x:number, y:number, active:boolean},  in the canvas's CSS px
 *   onShape?: (index:number, name:string, total:number) => void,
 *   bleed?: number,                 how many times bigger than the stage the canvas is (default 1)
 * }} opts
 */
export function createNanoForge(canvas, { theme, scroll = () => 0, pointer = () => ({ x: 0, y: 0, active: false }), onShape = () => {}, bleed = 1, gentle = false }) {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return null;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const locs = {};
    p.u = (name) => (name in locs ? locs[name] : (locs[name] = gl.getUniformLocation(p, name)));
    return p;
  };
  let cubeProg;
  let lineProg;
  let shadowProg;
  try {
    cubeProg = program(CUBE_VS, CUBE_FS);
    lineProg = program(LINE_VS, LINE_FS);
    shadowProg = program(SHADOW_VS, SHADOW_FS);
  } catch (err) {
    console.warn('[nano forge]', err);
    return null;
  }
  const progs = [cubeProg, lineProg, shadowProg];
  /** Set a uniform on every program that has it. */
  const setAll = (name, fn) => {
    for (const p of progs) {
      const l = p.u(name);
      if (l === null) continue;
      gl.useProgram(p);
      fn(l);
    }
  };

  // ---- sizes: fewer cubes on small or low-power screens ----
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const g = small ? 15 : 22; // voxel cube edge
  const N = g * g * g - (g - 2) ** 3; // every cube in the hollow cube is used
  const spacing = (2 * 0.62) / (g - 1);
  const size = spacing * 0.86;

  const shapes = [
    { name: 'cube', pts: voxelCube(N, g) },
    { name: 'torus knot', pts: pad(torusKnot(N), N) },
    { name: 'möbius loop', pts: mobius(N) },
    { name: 'planet', pts: pad(planet(N), N) },
    { name: 'double helix', pts: pad(helix(N), N) },
  ];

  const buf = (data, target = gl.ARRAY_BUFFER) => {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  };
  const attrib = (loc, size_, divisor = 0) => {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size_, gl.FLOAT, false, 0, 0);
    if (divisor) gl.vertexAttribDivisor(loc, divisor);
  };

  // ---- cubes: one instanced mesh ----
  const cubeVao = gl.createVertexArray();
  gl.bindVertexArray(cubeVao);
  const mesh = cubeMesh();
  buf(mesh.P);
  attrib(0, 3);
  buf(mesh.N);
  attrib(1, 3);
  buf(mesh.I, gl.ELEMENT_ARRAY_BUFFER);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  buf(seeds);
  attrib(4, 4, 1);
  const settled = shapes.map((s) => settle(s.pts));
  const shapeBufs = settled.map((d) => buf(d));
  const startData = settle(cloud(N));
  const startBuf = buf(startData);
  for (const loc of [2, 3]) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribDivisor(loc, 1);
  }

  // ---- lines: each cube is strung to its neighbours (in the sorted order every shape shares) ----
  const pairs = [];
  for (let i = 0; i < N; i++) for (const k of [1, 4, 13]) if (i + k < N) pairs.push(i, i + k);
  const V = pairs.length; // line vertices
  const expand = (src, self) => {
    const out = new Float32Array(V * 4);
    for (let v = 0; v < V; v++) {
      const i = self ? pairs[v] : pairs[v ^ 1];
      out.set(src.subarray(i * 4, i * 4 + 4), v * 4);
    }
    return out;
  };
  const lineVao = gl.createVertexArray();
  gl.bindVertexArray(lineVao);
  buf(expand(seeds, true));
  attrib(4, 4);
  buf(expand(seeds, false));
  attrib(7, 4);
  const lineBufs = [...settled, startData].map((d) => [buf(expand(d, true)), buf(expand(d, false))]);
  const lineStart = lineBufs.pop();
  for (const loc of [2, 3, 5, 6]) gl.enableVertexAttribArray(loc);

  gl.bindVertexArray(null);

  let pairKey = '';
  const bindPair = (a, b) => {
    const key = `${a}:${b}`;
    if (key === pairKey) return;
    pairKey = key;
    const A = a < 0 ? startBuf : shapeBufs[a];
    const B = shapeBufs[b];
    gl.bindVertexArray(cubeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, A);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, B);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
    const LA = a < 0 ? lineStart : lineBufs[a];
    const LB = lineBufs[b];
    gl.bindVertexArray(lineVao);
    for (const [loc, bf] of [[2, LA[0]], [3, LB[0]], [5, LA[1]], [6, LB[1]]]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bf);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
  };

  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(cubeProg);
  gl.uniform1f(cubeProg.u('uSize'), size);
  gl.useProgram(lineProg);
  gl.uniform1f(lineProg.u('uMaxLen'), spacing * 9);

  let W = 0;
  let H = 0;
  let dprCap = small ? 1.5 : 2;
  const CAM = 4.2;
  const shadowTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
    gl.texParameteri(gl.TEXTURE_2D, k, v);
  const shadowFbo = gl.createFramebuffer();
  let shadowW = 1;
  let shadowH = 1;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    // the shadow is drawn at a quarter of the size: cheap, and soft once it's blurred
    shadowW = Math.max(1, Math.round(canvas.width / 4));
    shadowH = Math.max(1, Math.round(canvas.height / 4));
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, shadowW, shadowH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.useProgram(shadowProg);
    gl.uniform2f(shadowProg.u('uTexel'), 1 / shadowW, 1 / shadowH);
    const aspect = W / Math.max(1, H);
    // fit a radius of ~1.2 inside the shorter side
    // the canvas is `bleed` times the stage, so loose cubes and the shadow aren't cut at its edge
    const fov = 2 * Math.atan((1.32 * bleed) / CAM / Math.min(1, aspect));
    const proj = perspective(fov, aspect, 0.5, 20);
    setAll('uProj', (l) => gl.uniformMatrix4fv(l, false, proj));
    setAll('uAspect', (l) => gl.uniform1f(l, aspect));
  };
  resize();
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  setAll('uCamZ', (l) => gl.uniform1f(l, CAM));
  setAll('uFloor', (l) => gl.uniform1f(l, FLOOR_Y));

  let lookTheme = null;
  const applyLook = () => {
    const th = theme();
    if (th === lookTheme) return;
    lookTheme = th;
    const L = LOOK[th];
    for (const [u, v] of [['uBase', L.base], ['uEnvLow', L.envLow], ['uEnvHigh', L.envHigh], ['uSpec', L.spec], ['uRim', L.rim], ['uEdge', L.edge], ['uGlow', L.glow], ['uLine', L.line]])
      setAll(u, (l) => gl.uniform3fv(l, v));
    setAll('uLineAlpha', (l) => gl.uniform1f(l, L.lineAlpha));
    gl.useProgram(shadowProg);
    gl.uniform1f(shadowProg.u('uDark'), L.shadow);
  };

  // eased interaction state
  let near = 0;
  let calm = 0; // 1 while the planet stands still
  let px = 0;
  let py = 0;
  let scatter = 0;
  let shown = -1;
  let yaw = 0.6;
  const ss = (e0, e1, x) => {
    const u = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return u * u * (3 - 2 * u);
  };

  /** a, b: shapes to morph between (a = -1 is the opening cloud); mix: 0..1 of that morph. */
  const draw = ({ a, b, mix, t, yaw: y, pitch }) => {
    applyLook();
    bindPair(a, b);
    const rot = rotation(y, pitch, Math.sin(t * 0.13) * 0.06 * (1 - calm));
    setAll('uRot', (l) => gl.uniformMatrix3fv(l, false, rot));
    setAll('uPitch', (l) => gl.uniformMatrix3fv(l, false, rotation(0, pitch)));
    setAll('uMix', (l) => gl.uniform1f(l, mix));
    setAll('uTime', (l) => gl.uniform1f(l, t));
    setAll('uScatter', (l) => gl.uniform1f(l, scatter));
    setAll('uPointer', (l) => gl.uniform2f(l, px, py));
    setAll('uPointerOn', (l) => gl.uniform1f(l, near));
    const isPlanet = (i) => (i >= 0 && shapes[i].name === 'planet' ? 1 : 0);
    setAll('uRingA', (l) => gl.uniform1f(l, isPlanet(a)));
    setAll('uRingB', (l) => gl.uniform1f(l, isPlanet(b)));
    setAll('uOrbit', (l) => gl.uniform1f(l, t * 0.3));
    // strings only while the cubes are in flight (or scattered by scroll): a formed shape is just cubes
    const strings = Math.max(Math.min(ss(0, 0.08, mix), 1 - ss(0.82, 1, mix)), scatter);

    const drawCubes = () => {
      gl.useProgram(cubeProg);
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(cubeVao);
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0, N);
      gl.disable(gl.CULL_FACE);
    };

    // 1. the shape's silhouette, flattened onto the floor, into the small shadow texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo);
    gl.viewport(0, 0, shadowW, shadowH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    setAll('uShadow', (l) => gl.uniform1f(l, 1));
    drawCubes();
    setAll('uShadow', (l) => gl.uniform1f(l, 0));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 2. lay it down, blurred
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shadowProg);
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.enable(gl.BLEND);
    gl.bindVertexArray(null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.enable(gl.DEPTH_TEST);

    // 3. the cubes themselves
    drawCubes();

    if (strings > 0.001) {
      gl.useProgram(lineProg);
      gl.uniform1f(lineProg.u('uStrings'), strings);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.bindVertexArray(lineVao);
      gl.drawArrays(gl.LINES, 0, V);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
  };

  // frame-time watchdog: if a phone can't keep up, drop the resolution once
  let slow = 0;
  let checked = 0;

  /** Advance to time `t` (seconds) by `dt`, and draw. */
  function step(t, dt) {
    if (!checked && dt > 0.034) slow += dt;
    if (!checked && t > 4) {
      checked = 1;
      if (slow > 1.4 && dprCap > 1) {
        dprCap = 1;
        resize();
      }
    }
    // gentle (reduced motion): no swarm flying in (it opens on the formed first shape), half speed, no scroll
    if (gentle) {
      t = t * 0.5 + MORPH;
      dt *= 0.5;
    }
    // a cycle: the cubes fly from the last shape to the next one, then hold it
    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const target = k % shapes.length;
    const from = k === 0 ? -1 : (k - 1) % shapes.length;
    const mix = Math.min(1, phase / MORPH);
    if (target !== shown && (mix > 0.85 || k === 0)) {
      shown = target;
      onShape(target, shapes[target].name, shapes.length);
    }
    const ease = Math.min(1, dt * 3);
    const p = pointer();
    const inside = p.active && p.x > -W * 0.25 && p.x < W * 1.25 && p.y > -H * 0.25 && p.y < H * 1.25;
    // hover only: the pointer parts nearby cubes but never turns the shape
    near += ((inside ? 1 : 0) - near) * ease;
    if (p.active) {
      px = (p.x / Math.max(1, W)) * 2 - 1;
      py = 1 - (p.y / Math.max(1, H)) * 2;
    }
    // while the planet stands, the globe stops turning and only its debris ring orbits
    const planetUp = shapes[target].name === 'planet' && mix > 0.9;
    calm += ((planetUp ? 1 : 0) - calm) * Math.min(1, dt * 1.5);
    yaw += dt * 0.32 * (1 - calm);
    const sp = gentle ? 0 : Math.min(1, Math.max(0, scroll()));
    scatter += (Math.min(1, Math.max(0, (sp - 0.08) / 0.7)) - scatter) * Math.min(1, dt * 8);
    draw({
      a: from,
      b: target,
      mix,
      t,
      yaw: yaw + sp * 1.6,
      pitch: 0.38 + Math.sin(t * 0.21) * 0.08 * (1 - calm),
    });
  }

  /** One finished shape, no motion. */
  function still(index = shapes.findIndex((s) => s.name === 'torus knot')) {
    scatter = 0;
    near = 0;
    shown = index;
    onShape(index, shapes[index].name, shapes.length);
    draw({ a: index, b: index, mix: 1, t: 2, yaw: 0.7, pitch: 0.42 });
  }

  function destroy() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { step, still, resize, destroy, count: N };
}
