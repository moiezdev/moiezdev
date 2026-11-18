/**
 * Nano forge: a few thousand machined micro-cubes that keep tearing themselves
 * apart and re-assembling into new shapes in the hero stage (a cube, a torus
 * knot, a Möbius loop, a ringed planet, a double helix, and a living toxic sludge). Once the cubes are in
 * place they fuse into the real, smooth solid of that shape; when it's time for
 * the next one the solid breaks back up into cubes. While cubes are loose they
 * are strung together by hairlines.
 *
 * Real 3D on one WebGL2 canvas, no library: one instanced cube mesh with the
 * whole morph in the vertex shader, one line pass that reuses the same maths,
 * and one mesh per solid. Every shape is precomputed, so per frame the CPU only
 * updates a few uniforms. Cheap enough for phones.
 *
 * Returns null when WebGL2 isn't available (the stage then keeps its static glow).
 */

const TAU = Math.PI * 2;
const BREAK = 0.8; // seconds for a solid to break back into cubes
const MORPH = 2.6; // seconds for the cubes to fly to the next shape
const FUSE = 1.0; // seconds for them to fuse into its solid
const HOLD = 3.0; // seconds the solid holds
const CYCLE = BREAK + MORPH + FUSE + HOLD;

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
  const ns = Math.round(n * 0.62);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < ns; i++) {
    const y = 1 - (i / (ns - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(golden * i) * r * 0.5, y * 0.5, Math.sin(golden * i) * r * 0.5]);
  }
  const tilt = 0.42;
  for (let i = ns; i < n; i++) {
    const a = rand(0, TAU);
    const r = Math.sqrt(rand(0.72 * 0.72, 1.02 * 1.02));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = rand(-0.012, 0.012);
    // w = 3: scale 1, second part (the ring), so no strings run between it and the globe
    pts.push([x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt), 3]);
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
const MOBIUS_W = 0.3;
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

/** Cubes over the sludge's resting blob (a sphere; the shader makes it move). */
function sludge(n) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pts.push([Math.cos(golden * i) * r * 0.54, y * 0.54, Math.sin(golden * i) * r * 0.54]);
  }
  return pts;
}

function cloud(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const d = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
    const l = Math.hypot(...d) || 1;
    const r = rand(1.2, 2.2);
    pts.push([(d[0] / l) * r, (d[1] / l) * r, (d[2] / l) * r, 0.4]);
  }
  return pts;
}

// ---------- solids: the smooth shape each cube formation fuses into ----------

function builder() {
  const P = [];
  const N = [];
  const I = [];
  return {
    P,
    N,
    I,
    v(x, y, z, nx, ny, nz) {
      P.push(x, y, z);
      N.push(nx, ny, nz);
      return P.length / 3 - 1;
    },
    quad(a, b, c, d) {
      I.push(a, b, c, a, c, d);
    },
    done() {
      return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint32Array(I) };
    },
  };
}

function box(h) {
  const b = builder();
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[-1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [1, 0, 0], [0, 1, 0]],
  ];
  for (const [n, u, w] of faces) {
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([su, sw]) =>
      b.v(...[0, 1, 2].map((k) => (n[k] + u[k] * su + w[k] * sw) * h), ...n),
    );
    b.quad(...q);
  }
  return b;
}

function sphere(b, r, su = 56, sv = 36) {
  const row = [];
  for (let j = 0; j <= sv; j++) {
    const ph = (j / sv) * Math.PI;
    const ring = [];
    for (let i = 0; i <= su; i++) {
      const th = (i / su) * TAU;
      const n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      ring.push(b.v(n[0] * r, n[1] * r, n[2] * r, ...n));
    }
    row.push(ring);
  }
  for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) b.quad(row[j][i], row[j + 1][i], row[j + 1][i + 1], row[j][i + 1]);
  return b;
}

const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
const norm = (a) => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const cross = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];

/** A round tube along curve(u), u in [0, 1], with frames carried along the curve (no twisting). */
function tube(b, curve, segs, r, radial = 14, caps = true) {
  const e = 1e-4;
  let N = null;
  const rings = [];
  let first = null;
  let last = null;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve(u);
    const T = norm(sub(curve(Math.min(1, u + e)), curve(Math.max(0, u - e))));
    if (!N) {
      const any = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      N = norm(cross(T, any));
    } else {
      N = norm(sub(N, T.map((t) => t * dot(N, T))));
    }
    const B = cross(T, N);
    const ring = [];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const n = [0, 1, 2].map((k) => N[k] * Math.cos(a) + B[k] * Math.sin(a));
      ring.push(b.v(p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r, ...n));
    }
    rings.push(ring);
    if (i === 0) first = [p, T];
    last = [p, T];
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) b.quad(rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]);
  if (caps) {
    for (const [[p, T], ring, s] of [[first, rings[0], -1], [last, rings[segs], 1]]) {
      const c = b.v(...p, T[0] * s, T[1] * s, T[2] * s);
      const flat = ring.map((idx) => b.v(b.P[idx * 3], b.P[idx * 3 + 1], b.P[idx * 3 + 2], T[0] * s, T[1] * s, T[2] * s));
      for (let j = 0; j < radial; j++) b.I.push(c, flat[j], flat[j + 1]);
    }
  }
  return b;
}

/** A flat ring with a little thickness, tilted like the cube ring in planet(). */
function annulus(b, r0, r1, th, tilt, segs = 120) {
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const tv = (x, y, z, nx, ny, nz) =>
    b.v(x, y * ct - z * st, y * st + z * ct, nx, ny * ct - nz * st, ny * st + nz * ct);
  const y = th / 2;
  const rows = { top: [], bot: [], out: [], inn: [] };
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    rows.top.push([tv(c * r0, y, s * r0, 0, 1, 0), tv(c * r1, y, s * r1, 0, 1, 0)]);
    rows.bot.push([tv(c * r0, -y, s * r0, 0, -1, 0), tv(c * r1, -y, s * r1, 0, -1, 0)]);
    rows.out.push([tv(c * r1, y, s * r1, c, 0, s), tv(c * r1, -y, s * r1, c, 0, s)]);
    rows.inn.push([tv(c * r0, y, s * r0, -c, 0, -s), tv(c * r0, -y, s * r0, -c, 0, -s)]);
  }
  for (const r of Object.values(rows)) for (let i = 0; i < segs; i++) b.quad(r[i][0], r[i][1], r[i + 1][1], r[i + 1][0]);
  return b;
}

/**
 * A Möbius band with thickness 2h. Going round the loop twice with the surface pushed out along
 * its normal covers both faces in one sheet, because the normal comes back flipped after one lap.
 */
function mobiusSolid(h, su = 360, sv = 14) {
  const b = builder();
  const e = 1e-4;
  const normal = (u, v) => {
    const du = sub(mobiusAt(u + e, v), mobiusAt(u - e, v));
    const dv = sub(mobiusAt(u, v + e), mobiusAt(u, v - e));
    return norm(cross(du, dv));
  };
  const grid = [];
  for (let i = 0; i <= su; i++) {
    const u = (i / su) * 2 * TAU;
    const row = [];
    for (let j = 0; j <= sv; j++) {
      const v = -MOBIUS_W + (j / sv) * 2 * MOBIUS_W;
      const n = normal(u, v);
      const p = mobiusAt(u, v);
      row.push(b.v(p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h, ...n));
    }
    grid.push(row);
  }
  for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) b.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  // the band's single edge, also two laps long, closed off as a thin wall
  const wall = [];
  for (let i = 0; i <= su; i++) {
    const u = (i / su) * 2 * TAU;
    const n = normal(u, MOBIUS_W);
    const p = mobiusAt(u, MOBIUS_W);
    const out = norm(sub(mobiusAt(u, MOBIUS_W + e), mobiusAt(u, MOBIUS_W - e)));
    wall.push([b.v(p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h, ...out), b.v(p[0] - n[0] * h, p[1] - n[1] * h, p[2] - n[2] * h, ...out)]);
  }
  for (let i = 0; i < su; i++) b.quad(wall[i][0], wall[i + 1][0], wall[i + 1][1], wall[i][1]);
  return b;
}

const knotCurve = (u) => {
  const t = u * TAU;
  const r = Math.cos(3 * t) + 2.1;
  return [(r * Math.cos(2 * t)) / 3.3, (r * Math.sin(2 * t)) / 3.3, (Math.sin(3 * t) * 1.1) / 3.3];
};

/** The solid behind each formation, sized so the cube faces sit flush with its surface. */
function solidFor(name, size) {
  const half = size / 2;
  switch (name) {
    case 'cube':
      return box(0.62 + half).done();
    case 'torus knot':
      return tube(builder(), knotCurve, 420, 0.42 / 3.3 + half * 0.6, 18, false).done();
    case 'möbius loop':
      return mobiusSolid(half).done();
    case 'toxic sludge':
      // a unit sphere: the vertex shader turns it into the moving blob
      return sphere(builder(), 1, 144, 104).done();
    case 'planet': {
      const b = sphere(builder(), 0.5 + half * 0.6);
      return annulus(b, 0.72, 1.02, Math.max(0.03, size * 0.9), 0.42).done();
    }
    case 'double helix': {
      const b = builder();
      for (const off of [0, Math.PI]) {
        tube(b, (u) => {
          const t = u * 2 - 1;
          const a = t * TAU * HELIX_TURNS + off;
          return [Math.cos(a) * 0.4, t * 0.95, Math.sin(a) * 0.4];
        }, 220, 0.035 + half, 12);
      }
      for (let k = 0; k < HELIX_RUNGS; k++) {
        const t = (k / (HELIX_RUNGS - 1)) * 1.8 - 0.9;
        const a = t * TAU * HELIX_TURNS;
        const p0 = [Math.cos(a) * 0.4, t * 0.95, Math.sin(a) * 0.4];
        tube(b, (u) => [p0[0] * (1 - 2 * u), p0[1], p0[2] * (1 - 2 * u)], 2, half * 0.9, 10, false);
      }
      return b.done();
    }
    default:
      return null;
  }
}

// ---------- look ----------

const LOOK = {
  dark: {
    base: [0.44, 0.47, 0.53],
    envLow: [0.04, 0.045, 0.06],
    envHigh: [0.62, 0.68, 0.78],
    spec: [1.0, 1.0, 1.0],
    rim: [0.55, 0.65, 0.85],
    edge: [0.22, 0.24, 0.28],
    glow: [0.62, 0.78, 1.0],
    line: [0.78, 0.86, 1.0],
    venom: [0.32, 0.95, 0.42],
    lineAlpha: 0.85,
  },
  light: {
    base: [0.4, 0.42, 0.47],
    envLow: [0.06, 0.065, 0.075],
    envHigh: [0.68, 0.7, 0.74],
    spec: [0.95, 0.95, 0.97],
    rim: [0.3, 0.33, 0.4],
    edge: [0.2, 0.21, 0.24],
    glow: [0.35, 0.45, 0.62],
    line: [0.2, 0.23, 0.29],
    venom: [0.18, 0.72, 0.28],
    lineAlpha: 0.75,
  },
};

// ---------- shaders ----------

/** Where cube `seed` is between shape A and shape B: shared by the cubes and the lines between them. */
const CENTRE = `
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uMix, uTime, uScatter, uAspect, uPointerOn;
uniform vec2 uPointer;

vec3 centreOf(vec4 A, vec4 B, vec4 seed, out float e, out float arc, out float near, out float scale, out vec3 dir) {
  // built from the core outwards, each cube a little out of step
  float delay = seed.x * 0.42 + clamp(length(B.xyz), 0.0, 1.2) * 0.22;
  e = clamp((uMix - delay) / 0.3, 0.0, 1.0);
  e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
  arc = sin(3.14159265 * e);
  dir = normalize(seed.yzw * 2.0 - 1.0 + vec3(1e-4));
  vec3 p = mix(A.xyz, B.xyz, e) + dir * arc * (0.3 + seed.x * 0.45);
  p += dir * 0.005 * sin(uTime * 1.6 + seed.y * 40.0);
  p += dir * uScatter * (0.7 + seed.x * 1.8);
  // w holds the cube's scale, plus 2 x the part it belongs to (the planet's globe and ring, each helix strand and the rungs)
  scale = mix(mod(A.w, 2.0), mod(B.w, 2.0), e) * (1.0 - 0.45 * arc) * (1.0 - 0.75 * uScatter);
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
uniform float uSize, uCubes;
out vec3 vN;
out vec3 vLocal;
out vec3 vWorld;
out float vGlow;
${CENTRE}
mat3 axisAngle(vec3 a, float t) {
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(
    c + a.x*a.x*k,      a.y*a.x*k + a.z*s, a.z*a.x*k - a.y*s,
    a.x*a.y*k - a.z*s,  c + a.y*a.y*k,     a.z*a.y*k + a.x*s,
    a.x*a.z*k + a.y*s,  a.y*a.z*k - a.x*s, c + a.z*a.z*k);
}
void main() {
  float e, arc, near, scale;
  vec3 dir;
  vec3 c = centreOf(aA, aB, aSeed, e, arc, near, scale, dir);
  // while the solid stands the cubes are gone
  float vis = uCubes;
  // whole turns only, so every cube lands square to the grid
  float spin = e * 6.2831853 * floor(1.0 + aSeed.z * 2.99) + uScatter * aSeed.w * 5.0;
  mat3 R = uRot * axisAngle(dir, spin);
  vec3 world = c + R * (aPos * scale * vis * uSize);
  vN = R * aNormal;
  vLocal = aPos;
  vWorld = world;
  vGlow = arc * 0.7 + near * 0.35 + (1.0 - uCubes) * 0.6;
  gl_Position = uProj * vec4(world - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const CUBE_FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vLocal;
in vec3 vWorld;
in float vGlow;
uniform vec3 uEdge;
out vec4 o;
${SHADE}
void main() {
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
uniform float uCubes, uMaxLen;
out float vAlpha;
${CENTRE}
void main() {
  float e1, arc1, near1, s1, e2, arc2, near2, s2;
  vec3 d1, d2;
  vec3 c1 = centreOf(aA, aB, aSeed, e1, arc1, near1, s1, d1);
  vec3 c2 = centreOf(aA2, aB2, aSeed2, e2, arc2, near2, s2, d2);
  float len = distance(c1, c2);
  float on = uCubes;
  // never string two separate parts together (the globe and its ring)
  float sameA = float(floor(aA.w * 0.5) == floor(aA2.w * 0.5));
  float sameB = float(floor(aB.w * 0.5) == floor(aB2.w * 0.5));
  float same = mix(sameA, sameB, step(0.5, (e1 + e2) * 0.5));
  vAlpha = same * smoothstep(uMaxLen, uMaxLen * 0.3, len) * step(0.01, s1 * s2) * on * (0.5 + 0.8 * max(arc1, arc2) + 0.5 * uScatter);
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

const SOLID_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uTime, uLiquid, uSquash;
uniform vec3 uSway;
uniform vec4 uTend[6]; // direction, reach
out vec3 vN;
out vec3 vWorld;
out vec3 vObj;
out float vReach;

// the sludge: a blob that ripples, sways and keeps pushing out tendrils that get pulled back
float reach(vec3 n) {
  float r = 0.0;
  for (int i = 0; i < 6; i++) {
    float a = max(dot(n, uTend[i].xyz), 0.0);
    r += uTend[i].w * (pow(a, 44.0) + 0.18 * pow(a, 6.0));
  }
  return r;
}
vec3 surf(vec3 n) {
  float t = uTime;
  float r = 0.52
    + 0.055 * sin(n.x * 3.1 + t * 1.7) * sin(n.y * 2.7 - t * 1.3)
    + 0.045 * sin(n.z * 4.3 + n.y * 2.0 + t * 2.1)
    + 0.02 * sin(n.x * 9.0 + n.z * 7.0 - t * 3.2)
    + reach(n);
  vec3 p = n * r;
  p.y *= uSquash;
  p.xz /= sqrt(uSquash);
  return p + uSway;
}

void main() {
  vec3 pos = aPos;
  vec3 nrm = aNormal;
  vReach = 0.0;
  if (uLiquid > 0.5) {
    vec3 n = normalize(aPos);
    vec3 t1 = normalize(cross(n, abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(n, t1);
    pos = surf(n);
    vec3 pa = surf(normalize(n + t1 * 0.012));
    vec3 pb = surf(normalize(n + t2 * 0.012));
    nrm = normalize(cross(pa - pos, pb - pos));
    if (dot(nrm, pos - uSway) < 0.0) nrm = -nrm;
    vReach = reach(n);
  }
  vObj = aPos;
  vec3 w = uRot * pos;
  vN = uRot * nrm;
  vWorld = w;
  gl_Position = uProj * vec4(w - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const SOLID_FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vWorld;
in vec3 vObj;
in float vReach;
uniform float uReveal, uBox, uLiquid;
uniform vec3 uVenom;
uniform vec3 uEdge;
out vec4 o;
${SHADE}
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
void main() {
  // the skin grows over the cubes in patches, with a hot edge where it's still forming
  float nz = noise(vObj * 6.0) * 0.7 + noise(vObj * 15.0) * 0.3;
  float thr = uReveal * 1.16 - 0.08;
  if (nz > thr) discard;
  float edge = 1.0 - smoothstep(0.0, 0.06, thr - nz);
  // face the viewer whichever way a triangle is wound (holes show the inside)
  vec3 n = normalize(vN);
  if (dot(n, vec3(0.0, 0.0, uCamZ) - vWorld) < 0.0) n = -n;
  vec3 col = shade(n, vWorld);
  // the solid cube gets the same machined bevel as the little ones
  if (uBox > 0.0) {
    vec3 a = abs(vObj) / uBox;
    float mid = a.x + a.y + a.z - max(a.x, max(a.y, a.z)) - min(a.x, min(a.y, a.z));
    col += uEdge * 1.1 * smoothstep(0.982, 0.996, mid);
  }
  if (uLiquid > 0.5) {
    // wet, near-black and glossy, with a toxic sheen at the rim and in the stretched tendrils
    vec3 v = normalize(vec3(0.0, 0.0, uCamZ) - vWorld);
    vec3 r = reflect(-v, n);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    float sp = pow(max(dot(r, normalize(vec3(-0.55, 0.85, 0.6))), 0.0), 90.0) + 0.5 * pow(max(dot(r, normalize(vec3(0.8, -0.25, 0.35))), 0.0), 40.0);
    vec3 env = mix(vec3(0.0), vec3(0.32, 0.36, 0.34), smoothstep(-0.2, 0.9, r.y));
    col = vec3(0.015, 0.02, 0.018) + env * 0.5 + vec3(1.0) * sp * 1.1 + uVenom * (fres * 0.9 + min(vReach * 1.6, 0.9));
    edge *= 0.0;
    col += uVenom * (1.0 - smoothstep(0.0, 0.06, thr - nz)) * 1.2;
  }
  o = vec4(col + uGlow * edge * 1.3, 1.0);
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
 * }} opts
 */
export function createNanoForge(canvas, { theme, scroll = () => 0, pointer = () => ({ x: 0, y: 0, active: false }), onShape = () => {} }) {
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
  let solidProg;
  try {
    cubeProg = program(CUBE_VS, CUBE_FS);
    lineProg = program(LINE_VS, LINE_FS);
    solidProg = program(SOLID_VS, SOLID_FS);
  } catch (err) {
    console.warn('[nano forge]', err);
    return null;
  }
  const progs = [cubeProg, lineProg, solidProg];
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
    { name: 'toxic sludge', liquid: true, pts: sludge(N) },
  ];
  for (const s of shapes) if (!s.mesh) s.mesh = solidFor(s.name, size);

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

  // ---- solids ----
  const solidVaos = shapes.map((s) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    buf(s.mesh.P);
    attrib(0, 3);
    buf(s.mesh.N);
    attrib(1, 3);
    buf(s.mesh.I, gl.ELEMENT_ARRAY_BUFFER);
    return { vao, count: s.mesh.I.length };
  });
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
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = W / Math.max(1, H);
    // fit a radius of ~1.2 inside the shorter side
    const fov = 2 * Math.atan(1.32 / CAM / Math.min(1, aspect));
    const proj = perspective(fov, aspect, 0.5, 20);
    setAll('uProj', (l) => gl.uniformMatrix4fv(l, false, proj));
    setAll('uAspect', (l) => gl.uniform1f(l, aspect));
  };
  resize();
  setAll('uCamZ', (l) => gl.uniform1f(l, CAM));

  let lookTheme = null;
  const applyLook = () => {
    const th = theme();
    if (th === lookTheme) return;
    lookTheme = th;
    const L = LOOK[th];
    for (const [u, v] of [['uBase', L.base], ['uEnvLow', L.envLow], ['uEnvHigh', L.envHigh], ['uSpec', L.spec], ['uRim', L.rim], ['uEdge', L.edge], ['uGlow', L.glow], ['uLine', L.line], ['uVenom', L.venom]])
      setAll(u, (l) => gl.uniform3fv(l, v));
    setAll('uLineAlpha', (l) => gl.uniform1f(l, L.lineAlpha));
  };

  // eased interaction state
  let near = 0;
  let px = 0;
  let py = 0;
  let scatter = 0;
  let shown = -1;
  let yaw = 0.6;
  let face = 0; // 1 while a flat shape (text) turns to face the viewer

  /**
   * a, b: shapes to morph between (a = -1 is the opening cloud); mix: 0..1 of that morph.
   * solid: which shape's solid stands (-1: none) and how far it has formed (0..1).
   */
  const draw = ({ a, b, mix, solid, reveal, t, yaw: y, pitch }) => {
    applyLook();
    bindPair(a, b);
    // the solid gives way to its cubes as the hero scrolls off
    const skin = solid >= 0 ? reveal * (1 - Math.min(1, scatter * 5)) : 0;
    const rot = rotation(y, pitch, Math.sin(t * 0.13) * 0.06);
    setAll('uRot', (l) => gl.uniformMatrix3fv(l, false, rot));
    setAll('uMix', (l) => gl.uniform1f(l, mix));
    setAll('uTime', (l) => gl.uniform1f(l, t));
    setAll('uScatter', (l) => gl.uniform1f(l, scatter));
    setAll('uPointer', (l) => gl.uniform2f(l, px, py));
    setAll('uPointerOn', (l) => gl.uniform1f(l, near));
    setAll('uCubes', (l) => gl.uniform1f(l, 1 - skin));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (skin > 0.001) {
      gl.useProgram(solidProg);
      gl.uniform1f(solidProg.u('uReveal'), skin);
      gl.uniform1f(solidProg.u('uBox'), shapes[solid].name === 'cube' ? 0.62 + size / 2 : 0);
      const liquid = shapes[solid].liquid;
      gl.uniform1f(solidProg.u('uLiquid'), liquid ? 1 : 0);
      if (liquid) {
        // the blob sways and squashes, and each tendril creeps out, then snaps back
        gl.uniform3f(solidProg.u('uSway'), Math.sin(t * 1.1) * 0.07, Math.sin(t * 1.7) * 0.04, Math.cos(t * 0.9) * 0.05);
        gl.uniform1f(solidProg.u('uSquash'), 1 + Math.sin(t * 2.3) * 0.07);
        const tend = new Float32Array(24);
        for (let i = 0; i < 6; i++) {
          const th = i * 2.4 + t * (0.17 + i * 0.03);
          const ph = Math.sin(t * (0.23 + i * 0.05) + i * 1.7) * 1.1;
          const ct = Math.cos(ph);
          const ph01 = (t * (0.21 + i * 0.037) + i * 0.29) % 1;
          const out = ph01 < 0.72 ? (ph01 / 0.72) ** 1.6 : (1 - (ph01 - 0.72) / 0.28) ** 3;
          tend.set([Math.cos(th) * ct, Math.sin(ph), Math.sin(th) * ct, out * (0.55 + (i % 3) * 0.12)], i * 4);
        }
        gl.uniform4fv(solidProg.u('uTend[0]'), tend);
      }
      gl.bindVertexArray(solidVaos[solid].vao);
      gl.drawElements(gl.TRIANGLES, solidVaos[solid].count, gl.UNSIGNED_INT, 0);
    }

    gl.useProgram(cubeProg);
    gl.enable(gl.CULL_FACE);
    gl.bindVertexArray(cubeVao);
    gl.drawElementsInstanced(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0, N);
    gl.disable(gl.CULL_FACE);

    if (skin < 0.999) {
      gl.useProgram(lineProg);
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
    // a cycle: the last shape's skin breaks up into cubes, they fly to the next shape, and fuse into its skin
    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const target = k % shapes.length;
    const from = k === 0 ? -1 : (k - 1) % shapes.length;
    const fuse = Math.min(1, Math.max(0, (phase - BREAK - MORPH) / FUSE));
    let solid = -1;
    let reveal = 0;
    if (phase < BREAK && from >= 0) {
      solid = from;
      reveal = 1 - phase / BREAK;
    } else if (fuse > 0) {
      solid = target;
      reveal = fuse;
    }
    // name the shape as it fuses
    if (target !== shown && (fuse > 0 || k === 0)) {
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
    // solids keep turning; text swings round to face you, then sways
    const flat = shapes[target].flat && phase > BREAK + MORPH * 0.15;
    face += ((flat ? 1 : 0) - face) * Math.min(1, dt * 3);
    const facing = Math.round(yaw / TAU) * TAU + Math.sin(t * 0.55) * 0.35;
    yaw += dt * 0.32 * (1 - face) + (facing - yaw) * Math.min(1, dt * 3.5) * face;
    const sp = Math.min(1, Math.max(0, scroll()));
    scatter += (Math.min(1, Math.max(0, (sp - 0.08) / 0.7)) - scatter) * Math.min(1, dt * 8);
    draw({
      a: from,
      b: target,
      mix: Math.min(1, Math.max(0, (phase - BREAK) / MORPH)),
      solid,
      reveal,
      t,
      yaw: yaw + sp * 1.6,
      pitch: 0.38 - face * 0.26 + Math.sin(t * 0.21) * 0.08,
    });
  }

  /** One finished shape, no motion (reduced motion). */
  function still(index = 1) {
    scatter = 0;
    near = 0;
    shown = index;
    onShape(index, shapes[index].name, shapes.length);
    draw({ a: index, b: index, mix: 1, solid: index, reveal: 1, t: 2, yaw: 0.7, pitch: 0.42 });
  }

  function destroy() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { step, still, resize, destroy, count: N };
}
