/**
 * Nano forge: a few thousand machined micro-cubes that keep tearing themselves
 * apart and re-assembling into new shapes in the hero stage (a cube, a torus
 * knot, a Möbius loop, a ringed planet, and a living liquid-metal blob). Once the cubes are in
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
const BREAK = 1.2; // seconds for a solid to break back into cubes
const MORPH = 4.0; // seconds for the cubes to fly to the next shape
const FUSE = 1.5; // seconds for them to fuse into its solid
const HOLD = 6.0; // seconds the solid holds
const CYCLE = BREAK + MORPH + FUSE + HOLD;
const FLOOR_Y = -1.12; // the floor the shadow falls on, below the shapes
const PEEL_THR = 0.706; // chunk noise above this covers ~15% of a surface: the share a hover peels back into cubes

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
    const r = rand(0.95, 1.65);
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

/** A box of half-size h with its edges and corners rounded to radius r. */
function roundedBox(h, r) {
  const b = builder();
  const inner = h - r;
  // grid lines across a face: dense over the rounded strips, sparse over the flat middle
  const ticks = [];
  for (let i = 0; i <= 8; i++) ticks.push(-h + (r * i) / 8);
  for (let i = 1; i < 4; i++) ticks.push(-inner + (2 * inner * i) / 4);
  for (let i = 0; i <= 8; i++) ticks.push(inner + (r * i) / 8);
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
  ];
  const m = ticks.length;
  for (const [n, u, w] of faces) {
    const idx = [];
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        const p = [0, 1, 2].map((k) => n[k] * h + u[k] * ticks[i] + w[k] * ticks[j]);
        const q = p.map((c) => Math.max(-inner, Math.min(inner, c)));
        const d = norm(sub(p, q));
        idx.push(b.v(q[0] + d[0] * r, q[1] + d[1] * r, q[2] + d[2] * r, ...d));
      }
    }
    for (let i = 0; i < m - 1; i++) for (let j = 0; j < m - 1; j++) b.quad(idx[i * m + j], idx[(i + 1) * m + j], idx[(i + 1) * m + j + 1], idx[i * m + j + 1]);
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
      return roundedBox(0.62 + half, 0.16).done();
    case 'torus knot':
      return tube(builder(), knotCurve, 420, 0.42 / 3.3 + half * 0.6, 18, false).done();
    case 'möbius loop':
      return mobiusSolid(half).done();
    case 'toxic sludge':
      // a unit sphere: the vertex shader turns it into the moving blob
      return sphere(builder(), 1, 144, 104).done();
    case 'planet': {
      // only the globe fuses; the ring stays a belt of loose debris
      return sphere(builder(), 0.5 + half * 0.6).done();
    }
    default:
      return null;
  }
}

/**
 * Where each cube of a formation sinks to as the solid forms over it: the nearest point on that solid's
 * skin, so the cubes melt into the surface instead of shrinking where they stand. [x, y, z, 1], or w = 0
 * for cubes that never fuse (the planet's ring, the blob, hidden spares).
 */
function snapFor(name, pts, size) {
  const half = size / 2;
  const n = pts.length / 4;
  const out = new Float32Array(n * 4);
  const at = (i) => [pts[i * 4], pts[i * 4 + 1], pts[i * 4 + 2]];
  const put = (i, q, on = 1) => out.set([q[0], q[1], q[2], on], i * 4);
  // nearest of a set of samples, by brute force (a few thousand cubes against a few hundred samples, once)
  const nearest = (p, samples) => {
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < samples.length; k++) {
      const s = samples[k][0];
      const d = (s[0] - p[0]) ** 2 + (s[1] - p[1]) ** 2 + (s[2] - p[2]) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return samples[best];
  };
  let knot = null;
  let band = null;
  if (name === 'torus knot') knot = Array.from({ length: 900 }, (_, k) => [knotCurve(k / 900)]);
  if (name === 'möbius loop') {
    band = [];
    const e = 1e-4;
    for (let a = 0; a < 480; a++)
      for (let b = 0; b <= 10; b++) {
        const u = (a / 480) * TAU;
        const v = -MOBIUS_W + (b / 10) * 2 * MOBIUS_W;
        const nn = norm(cross(sub(mobiusAt(u + e, v), mobiusAt(u - e, v)), sub(mobiusAt(u, v + e), mobiusAt(u, v - e))));
        band.push([mobiusAt(u, v), nn]);
      }
  }
  for (let i = 0; i < n; i++) {
    const p = at(i);
    const w = pts[i * 4 + 3];
    if (w <= 0 || name === 'toxic sludge') {
      put(i, p, 0);
      continue;
    }
    if (name === 'cube') {
      const h = 0.62 + half;
      const r = 0.16;
      const inner = h - r;
      const q = p.map((c) => Math.max(-inner, Math.min(inner, c)));
      put(i, q.map((c, k) => c + norm(sub(p, q))[k] * r));
    } else if (name === 'torus knot') {
      const [c] = nearest(p, knot);
      const R = 0.42 / 3.3 + half * 0.6;
      put(i, c.map((v, k) => v + norm(sub(p, c))[k] * R));
    } else if (name === 'möbius loop') {
      const [m, nn] = nearest(p, band);
      const side = dot(sub(p, m), nn) < 0 ? -half : half;
      put(i, m.map((v, k) => v + nn[k] * side));
    } else if (name === 'planet') {
      // only the globe fuses; the ring (part 1) stays loose
      if (Math.floor(w / 2) >= 1) put(i, p, 0);
      else put(i, norm(p).map((c) => c * (0.5 + half * 0.6)));
    } else put(i, p, 0);
  }
  return out;
}

/**
 * The skin forms where skin() is below a threshold that rises as it fuses. This table maps how far it has
 * fused (0..1) to that threshold, from the field's spread over the shape's own cubes, so the skin covers
 * the shape at an even pace instead of rushing through the middle.
 */
const SKIN_LEAD = 0.24; // the cubes start to close up this far (in skin() units) ahead of the skin
const SKIN_TAIL = 0.12; // and are fully gone this far behind it
function skinTable(snap) {
  const v = [];
  for (let i = 0; i < snap.length / 4; i++) if (snap[i * 4 + 3] > 0) v.push(skinJS([snap[i * 4], snap[i * 4 + 1], snap[i * 4 + 2]]));
  if (!v.length) return null;
  v.sort((a, b) => a - b);
  const T = [v[0] - SKIN_LEAD - 0.02];
  for (let k = 1; k < 32; k++) T.push(v[Math.min(v.length - 1, Math.floor((k / 32) * v.length))]);
  T.push(v[v.length - 1] + SKIN_TAIL + 0.02);
  return T;
}
const skinThreshold = (T, r) => {
  if (!T) return 0;
  const x = Math.min(1, Math.max(0, r)) * (T.length - 1);
  const k = Math.min(T.length - 2, Math.floor(x));
  return T[k] + (T[k + 1] - T[k]) * (x - k);
};

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

// ---------- the hover's inside: a packed matrix of small cubes under each patch that can peel ----------

const pcg = (v) => {
  const st = (Math.imul(v, 747796405) + 2891336453) >>> 0;
  const w = Math.imul(((st >>> ((st >>> 28) + 4)) ^ st) >>> 0, 277803737) >>> 0;
  return ((w >>> 22) ^ w) >>> 0;
};
const hashJS = (x, y, z) => pcg((Math.imul(x + 1000, 73856093) ^ Math.imul(y + 1000, 19349663) ^ Math.imul(z + 1000, 83492791)) >>> 0) / 4294967295;
/** The same value as noise() in the shaders. */
function noiseJS(p) {
  const i = p.map(Math.floor);
  const f = p.map((c, k) => {
    const t = c - i[k];
    return t * t * (3 - 2 * t);
  });
  const h = (a, b, c) => hashJS(i[0] + a, i[1] + b, i[2] + c);
  const m = (a, b, t) => a + (b - a) * t;
  return m(
    m(m(h(0, 0, 0), h(1, 0, 0), f[0]), m(h(0, 1, 0), h(1, 1, 0), f[0]), f[1]),
    m(m(h(0, 0, 1), h(1, 0, 1), f[0]), m(h(0, 1, 1), h(1, 1, 1), f[0]), f[1]),
    f[2],
  );
}
/** The same value as chunk() in the shaders. */
const chunkJS = (p) => noiseJS(p.map((c) => c * 3.5 + 7.3));
/** The same value as skin() in the shaders: where on a shape its solid forms first (low) and last (high). */
const skinJS = (p) =>
  noiseJS(p.map((c, k) => c * 2.4 + [3.1, 1.7, 5.3][k])) * 0.62 +
  noiseJS(p.map((c, k) => c * 6.5 + [8.2, 2.9, 4.4][k])) * 0.28 +
  noiseJS(p.map((c) => c * 17 + 1.3)) * 0.1;

/**
 * Small cubes packed just under the solid's skin, only where a hover can peel it, so an opening shows a
 * dense matrix instead of a hollow shell. Each is [x, y, z, chunk] in the solid's own space.
 */
function fillers(mesh, count, [recess, depth], { round = 0 } = {}) {
  const { P, N, I } = mesh;
  const tris = I.length / 3;
  const cum = new Float64Array(tris);
  let total = 0;
  const at = (k) => [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]];
  for (let t = 0; t < tris; t++) {
    const a = at(I[t * 3]);
    const b = at(I[t * 3 + 1]);
    const c = at(I[t * 3 + 2]);
    total += Math.hypot(...cross(sub(b, a), sub(c, a))) / 2;
    cum[t] = total;
  }
  const out = new Float32Array(count * 4);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 60; tries++) {
    const x = Math.random() * total;
    let lo = 0;
    let hi = tris - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    const ids = [I[lo * 3], I[lo * 3 + 1], I[lo * 3 + 2]];
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const wts = [1 - u - v, u, v];
    const p = [0, 1, 2].map((k) => ids.reduce((acc, id, j) => acc + P[id * 3 + k] * wts[j], 0));
    const nn = norm([0, 1, 2].map((k) => ids.reduce((acc, id, j) => acc + N[id * 3 + k] * wts[j], 0)));
    const ch = chunkJS(round ? norm(p) : p);
    if (ch < PEEL_THR - 0.02) continue;
    // sunk below the skin, so an opening reads as a dent with the matrix at its floor
    const d = recess + depth * Math.random() ** 0.8;
    const q = round ? norm(p).map((c) => c * (round - d)) : [0, 1, 2].map((k) => p[k] - nn[k] * d);
    out.set([q[0], q[1], q[2], ch], n * 4);
    n++;
  }
  return out.subarray(0, n * 4);
}

// ---------- shaders ----------

const NOISE = `
// an integer hash (PCG), so the JS twin in chunkJS() gives the very same patches
float hash(vec3 p) {
  uvec3 u = uvec3(ivec3(p) + 1000);
  uint v = (u.x * 73856093u) ^ (u.y * 19349663u) ^ (u.z * 83492791u);
  uint st = v * 747796405u + 2891336453u;
  uint w = ((st >> ((st >> 28u) + 4u)) ^ st) * 277803737u;
  return float((w >> 22u) ^ w) / 4294967295.0;
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
// big patches that come away from the solid on hover (above PEEL_THR is ~15% of the surface)
float chunk(vec3 obj) { return noise(obj * 3.5 + 7.3); }
// where on a shape its solid forms first (low) and last (high): broad patches with ragged edges (skinJS is its twin)
float skin(vec3 p) {
  return noise(p * 2.4 + vec3(3.1, 1.7, 5.3)) * 0.62 + noise(p * 6.5 + vec3(8.2, 2.9, 4.4)) * 0.28 + noise(p * 17.0 + 1.3) * 0.1;
}
// the skin stands where skin() < uThr; uFuse is 1 while a solid (not the blob) is forming or breaking up
uniform float uThr, uFuse;
const float SKIN_LEAD = ${SKIN_LEAD.toFixed(3)};
const float SKIN_TAIL = ${SKIN_TAIL.toFixed(3)};
uniform float uPeel, uPeelThr;
float peelEdge() { return mix(1.1, uPeelThr, uPeel); }`;

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

const LEAK = `
// the blob's liquid leaks out of its cube ball at scattered spots, each starting at its own moment, and the
// puddles spread until they meet and cover the ball. uFront is how far that has got (0..1; -1: no blob forming).
// leakGap(n) < 0 where the liquid has reached direction n.
uniform float uFront;
const int LEAKS = 9;
const vec4 LEAK[9] = vec4[9](
  vec4(-0.42, 0.52, 0.74, 0.0), vec4(0.71, -0.18, 0.68, 0.08), vec4(0.12, 0.93, -0.35, 0.16),
  vec4(-0.8, -0.45, 0.4, 0.05), vec4(0.3, -0.85, -0.43, 0.22), vec4(-0.55, 0.1, -0.83, 0.12),
  vec4(0.88, 0.42, -0.2, 0.28), vec4(0.05, -0.2, 0.98, 0.18), vec4(-0.2, -0.6, -0.1, 0.3));
float leakGap(vec3 n) {
  float g = 9.0;
  for (int i = 0; i < LEAKS; i++) {
    float f = clamp((uFront - LEAK[i].w) / (0.85 - LEAK[i].w), 0.0, 1.0);
    float reach = 1.35 * f * (2.0 - f) - 0.05;
    g = min(g, acos(clamp(dot(n, normalize(LEAK[i].xyz)), -1.0, 1.0)) - reach);
  }
  return g;
}`;

/** Where cube `seed` is between shape A and shape B: shared by the cubes and the lines between them. */
const CENTRE = `
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uMix, uTime, uScatter, uAspect, uPointerOn;
uniform vec2 uPointer;
uniform float uRound; // 1 when the standing solid is the sludge, whose skin is a unit sphere
${LEAK}
// cubes (and their strings) the liquid has covered are gone
float uncovered(vec4 A, vec4 B) {
  if (uFront < -0.5) return 1.0;
  return smoothstep(-0.22, 0.02, leakGap(normalize(mix(A.xyz, B.xyz, uMix) + vec3(1e-4))));
}
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
${NOISE}
// how far a ring rock has risen out of the globe it first gathers into (1 once it's out in the ring)
float gRise;

vec3 centreOf(vec4 A, vec4 B, vec4 seed, vec4 S, out float e, out float arc, out float near, out float scale, out vec3 dir, out float peel, out float debris, out float melt) {
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
  // forming the planet, the ring's rocks don't fly straight to the ring: they first gather into the globe
  // with the rest, sooner, then break away from its surface one after another and drift out into orbit
  gRise = 1.0;
  if (ringB > 0.5) {
    e = clamp((uMix - seed.x * 0.22 - clamp(length(B.xyz), 0.0, 1.2) * 0.1) / 0.3, 0.0, 1.0);
    e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
    arc = sin(3.14159265 * e);
    float r = clamp((uMix - 0.62 - seed.w * 0.26) / 0.12, 0.0, 1.0);
    gRise = r * r * (3.0 - 2.0 * r);
    vec3 spot = normalize(pb - RING_AXIS * dot(pb, RING_AXIS) * 0.6 + vec3(1e-4)) * 0.5;
    pb = mix(spot, pb, gRise) + RING_AXIS * sin(3.14159265 * gRise) * (seed.y - 0.5) * 0.12;
  }
  debris = max(ringA * (1.0 - e), ringB * gRise);
  vec3 p = mix(pa, pb, e) + dir * arc * (0.05 + seed.x * 0.05);
  p += dir * 0.005 * sin(uTime * 1.6 + seed.y * 40.0);
  // fusing: as the skin's front comes near, the cubes close up and settle onto the skin, then melt into it
  // as it passes over them. Breaking up runs the same way back, so the cubes rise out of the skin as it recedes.
  float fd = uFuse * S.w > 0.5 ? uThr - skin(S.xyz) : -9.0;
  float pull = smoothstep(-SKIN_LEAD * 0.6, SKIN_TAIL * 0.4, fd);
  melt = smoothstep(-0.015, SKIN_TAIL, fd);
  float swell = smoothstep(-SKIN_LEAD, -SKIN_LEAD * 0.35, fd) * (1.0 - melt);
  p = mix(p, S.xyz, pull);
  p += dir * uScatter * (0.7 + seed.x * 1.8);
  // on hover, the cubes under the patches that peel away come loose and drift out a little
  vec3 obj = mix(A.xyz, B.xyz, e);
  peel = uPeel > 0.001 ? smoothstep(peelEdge() - 0.015, peelEdge() + 0.015, chunk(uRound > 0.5 ? normalize(obj) : obj)) : 0.0;
  p += (normalize(obj + vec3(1e-4)) * 0.09 + dir * 0.05 + dir * 0.02 * sin(uTime * 2.0 + seed.z * 30.0)) * peel * uPeel;
  // w holds the cube's scale, plus 2 x the part it belongs to (the planet's globe and its ring)
  // closing up, each cube swells a little to shut the gaps to its neighbours, then sinks away to nothing
  scale = mix(mod(A.w, 2.0), mod(B.w, 2.0), e) * (1.0 - 0.1 * arc) * (1.0 - 0.75 * uScatter) * (1.0 + 0.16 * swell);
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
layout(location=8) in vec4 aS;
uniform float uSize, uCubes;
out vec3 vN;
out vec3 vLocal;
out vec3 vWorld;
out float vGlow;
${CENTRE}
${FLOOR}
void main() {
  float e, arc, near, scale, peel, debris, melt;
  vec3 dir;
  vec3 c = centreOf(aA, aB, aSeed, aS, e, arc, near, scale, dir, peel, debris, melt);
  // while the solid stands the cubes are gone, except the planet's debris and the ones a hover has peeled loose
  float vis = max(max(uCubes * (1.0 - melt), peel), debris);
  // no tumbling in flight: cubes keep square to the grid and only turn when scattered by scroll;
  // the ring's debris turns slowly as it orbits
  float spin = uScatter * aSeed.w * 5.0 + debris * uOrbit * (aSeed.w - 0.5) * 4.0;
  mat3 R = uRot * axisAngle(dir, spin);
  // the cubes a hover peels loose are smaller than the ones that build the shape
  float shrink = mix(1.0, 0.55, peel * max(1.0 - uCubes, melt));
  vis *= max(uncovered(aA, aB), peel);
  vec3 world = c + R * (aPos * scale * vis * shrink * uSize);
  if (uShadow > 0.5) world = toFloor(world);
  vN = R * aNormal;
  vLocal = aPos;
  vWorld = world;
  // a faint warmth on the cubes just as they melt in (the blob's leak keeps its own glow)
  float hot = melt * (1.0 - melt) * 4.0 * (1.0 - max(peel, debris));
  vGlow = arc * 0.3 + near * 0.35 + (1.0 - uCubes) * 0.6 * (1.0 - max(peel, debris)) + hot * 0.35 + peel * 0.25;
  gl_Position = uProj * vec4(world - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const FILL_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aF; // position inside the solid, and the chunk value of the patch above it
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uSize;
out vec3 vN;
out vec3 vLocal;
out vec3 vWorld;
out float vGlow;
${NOISE}
void main() {
  float show = uPeel > 0.001 ? smoothstep(peelEdge() - 0.01, peelEdge() + 0.02, aF.w) : 0.0;
  // sizes vary a little, so the matrix reads as packed rather than gridded
  float r = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
  vec3 world = uRot * (aF.xyz + aPos * uSize * (0.5 + 0.35 * r) * show);
  vN = uRot * aNormal;
  vLocal = aPos;
  vWorld = world;
  vGlow = 0.0;
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
layout(location=8) in vec4 aS;
layout(location=9) in vec4 aS2;
uniform float uCubes, uMaxLen;
out float vAlpha;
${CENTRE}
void main() {
  float e1, arc1, near1, s1, p1, k1, m1, e2, arc2, near2, s2, p2, k2, m2;
  vec3 d1, d2;
  vec3 c1 = centreOf(aA, aB, aSeed, aS, e1, arc1, near1, s1, d1, p1, k1, m1);
  vec3 c2 = centreOf(aA2, aB2, aSeed2, aS2, e2, arc2, near2, s2, d2, p2, k2, m2);
  float len = distance(c1, c2);
  // loose cubes are strung together, and so are the ones a hover peels off
  // a string goes as soon as either of its cubes starts to melt in
  float on = max(uCubes * min(uncovered(aA, aB), uncovered(aA2, aB2)) * (1.0 - max(m1, m2)), min(p1, p2));
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

const SOLID_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uTime, uLiquid, uSquash;
uniform vec3 uSway;
${LEAK}
uniform vec4 uTend[6]; // direction, reach
out vec3 vN;
out vec3 vWorld;
out vec3 vObj;
${FLOOR}

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
    + 0.022 * sin(n.x * 3.1 + t * 1.7) * sin(n.y * 2.7 - t * 1.3)
    + 0.018 * sin(n.z * 4.3 + n.y * 2.0 + t * 2.1)
    + 0.007 * sin(n.x * 9.0 + n.z * 7.0 - t * 3.2)
    + reach(n);
  // the coat always sits just over where the cubes were, so the blob never changes size; while it
  // spreads it swells into a rolling lip at its edges
  float coat = uFront < 0.0 || uFront > 0.999 ? 0.0 : 1.0;
  float lip = exp(-pow(leakGap(n) / 0.14, 2.0));
  r += 0.05 + coat * 0.035 * lip;
  vec3 p = n * r;
  p.y *= uSquash;
  p.xz /= sqrt(uSquash);
  return p + uSway;
}

void main() {
  vec3 pos = aPos;
  vec3 nrm = aNormal;
  if (uLiquid > 0.5) {
    vec3 n = normalize(aPos);
    vec3 t1 = normalize(cross(n, abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(n, t1);
    pos = surf(n);
    vec3 pa = surf(normalize(n + t1 * 0.012));
    vec3 pb = surf(normalize(n + t2 * 0.012));
    nrm = normalize(cross(pa - pos, pb - pos));
    if (dot(nrm, pos - uSway) < 0.0) nrm = -nrm;
  }
  vObj = aPos;
  vec3 w = uRot * pos;
  vN = uRot * nrm;
  vWorld = w;
  if (uShadow > 0.5) w = toFloor(w);
  gl_Position = uProj * vec4(w - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const SOLID_FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vWorld;
in vec3 vObj;
uniform float uLiquid, uShadow, uTime;
${LEAK}
uniform vec3 uEdge;
out vec4 o;
${SHADE}
${NOISE}
void main() {
  // the skin spreads over the cubes in broad patches from where it forms first (the cubes melt into it just
  // behind its edge, see centreOf), with a soft warm rim where it's still forming
  float gap = uThr - skin(vObj);
  if (uLiquid > 0.5) {
    // the liquid covers the ball from where it leaks out, its edges wavering as they run
    if (leakGap(normalize(vObj)) > (noise(vObj * 4.0 + uTime * 0.6) - 0.5) * 0.3) discard;
  } else if (gap < 0.0) discard;
  float edge = uLiquid > 0.5 ? 0.0 : (1.0 - smoothstep(0.0, 0.05, gap)) * 0.45;
  // a hover peels big patches away, and their cubes come loose
  if (uPeel > 0.001) {
    float pe = peelEdge() - chunk(vObj);
    if (pe < 0.0) discard;
    edge = max(edge, (1.0 - smoothstep(0.0, 0.035, pe)) * min(1.0, uPeel * 3.0));
  }
  if (uShadow > 0.5) {
    o = vec4(1.0);
    return;
  }
  // face the viewer whichever way a triangle is wound (holes show the inside)
  vec3 n = normalize(vN);
  bool inside = dot(n, vec3(0.0, 0.0, uCamZ) - vWorld) < 0.0;
  if (inside) n = -n;
  vec3 col = shade(n, vWorld);
  // the inner wall of an opening is in shadow, so a dent reads as a dent
  if (inside) col *= 0.45;
  if (uLiquid > 0.5) {
    // the same metal as every other shape, just wetter: a tighter, brighter highlight
    vec3 v = normalize(vec3(0.0, 0.0, uCamZ) - vWorld);
    vec3 r = reflect(-v, n);
    col += uSpec * (pow(max(dot(r, normalize(vec3(-0.55, 0.85, 0.6))), 0.0), 120.0) * 0.6);
  }
  o = vec4(col + uGlow * edge * 1.3, 1.0);
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
  let fillProg;
  let lineProg;
  let solidProg;
  let shadowProg;
  try {
    cubeProg = program(CUBE_VS, CUBE_FS);
    fillProg = program(FILL_VS, CUBE_FS);
    lineProg = program(LINE_VS, LINE_FS);
    solidProg = program(SOLID_VS, SOLID_FS);
    shadowProg = program(SHADOW_VS, SHADOW_FS);
  } catch (err) {
    console.warn('[nano forge]', err);
    return null;
  }
  const progs = [cubeProg, lineProg, solidProg, shadowProg, fillProg];
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
    // the forge opens on the liquid-metal blob
    { name: 'toxic sludge', liquid: true, pts: sludge(N) },
    { name: 'cube', pts: voxelCube(N, g) },
    { name: 'torus knot', pts: pad(torusKnot(N), N) },
    { name: 'möbius loop', pts: mobius(N) },
    { name: 'planet', pts: pad(planet(N), N) },
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
  // where each cube melts into its shape's solid, and the pace the skin spreads at
  const snaps = shapes.map((s, i) => snapFor(s.name, settled[i], size));
  const skinTables = snaps.map((d) => skinTable(d));
  const snapBufs = snaps.map((d) => buf(d));
  for (const loc of [2, 3, 8]) {
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
  const lineSnapBufs = snaps.map((d) => [buf(expand(d, true)), buf(expand(d, false))]);
  for (const loc of [2, 3, 5, 6, 8, 9]) gl.enableVertexAttribArray(loc);

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
  // the packed inside for each solid, for hover peels (the planet's ring never peels, it's loose already)
  // [how far below the skin the matrix starts, how deep it goes]
  const FILL_DEPTH = { cube: [0.08, 0.14], 'torus knot': [0.05, 0.06], 'möbius loop': [0.005, 0.008], planet: [0.08, 0.14], 'toxic sludge': [0.08, 0.14] };
  const fillVaos = shapes.map((s) => {
    const data = fillers(s.mesh, small ? 2000 : 4500, FILL_DEPTH[s.name] ?? [0.04, 0.08], { round: s.liquid ? 0.57 : 0 });
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    buf(mesh.P);
    attrib(0, 3);
    buf(mesh.N);
    attrib(1, 3);
    buf(mesh.I, gl.ELEMENT_ARRAY_BUFFER);
    buf(data);
    attrib(2, 4, 1);
    return { vao, count: data.length / 4 };
  });
  gl.bindVertexArray(null);

  let pairKey = '';
  const bindPair = (a, b, solid) => {
    const key = `${a}:${b}:${solid}`;
    if (key === pairKey) return;
    pairKey = key;
    // the snap targets of whichever shape's solid is forming or breaking up (any will do when none is)
    const sv = Math.max(0, solid);
    const A = a < 0 ? startBuf : shapeBufs[a];
    const B = shapeBufs[b];
    gl.bindVertexArray(cubeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, A);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, B);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, snapBufs[sv]);
    gl.vertexAttribPointer(8, 4, gl.FLOAT, false, 0, 0);
    const LA = a < 0 ? lineStart : lineBufs[a];
    const LB = lineBufs[b];
    gl.bindVertexArray(lineVao);
    for (const [loc, bf] of [[2, LA[0]], [3, LB[0]], [5, LA[1]], [6, LB[1]], [8, lineSnapBufs[sv][0]], [9, lineSnapBufs[sv][1]]]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bf);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
  };

  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(cubeProg);
  gl.uniform1f(cubeProg.u('uSize'), size);
  gl.useProgram(fillProg);
  gl.uniform1f(fillProg.u('uSize'), size);
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
  setAll('uPeelThr', (l) => gl.uniform1f(l, PEEL_THR));

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
  let peel = 0; // 0..1, eased: how far the hover peel has gone
  let calm = 0; // 1 while the planet stands still
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
    bindPair(a, b, solid);
    // the solid gives way to its cubes as the hero scrolls off
    const skin = solid >= 0 ? reveal * (1 - Math.min(1, scatter * 5)) : 0;
    const liquid = solid >= 0 && shapes[solid].liquid;
    const rot = rotation(y, pitch, Math.sin(t * 0.13) * 0.06 * (1 - calm));
    setAll('uRot', (l) => gl.uniformMatrix3fv(l, false, rot));
    setAll('uPitch', (l) => gl.uniformMatrix3fv(l, false, rotation(0, pitch)));
    setAll('uMix', (l) => gl.uniform1f(l, mix));
    setAll('uTime', (l) => gl.uniform1f(l, t));
    setAll('uScatter', (l) => gl.uniform1f(l, scatter));
    setAll('uPointer', (l) => gl.uniform2f(l, px, py));
    setAll('uPointerOn', (l) => gl.uniform1f(l, near));
    // the blob forms differently from the other shapes
    const ss = (e0, e1, x) => { const u = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return u * u * (3 - 2 * u); };
    // the blob: liquid leaks out of its cube ball at scattered spots until it's covered, then settles
    const front = liquid ? skin : -1;
    // every other solid spreads over its cubes, which melt into it where it passes (uThr, uFuse)
    setAll('uCubes', (l) => gl.uniform1f(l, liquid ? 1 - ss(0.85, 1, skin) : 1));
    setAll('uFuse', (l) => gl.uniform1f(l, solid >= 0 && !liquid ? 1 : 0));
    setAll('uThr', (l) => gl.uniform1f(l, solid >= 0 && !liquid ? skinThreshold(skinTables[solid], skin) : -9));
    setAll('uFront', (l) => gl.uniform1f(l, front));
    setAll('uPeel', (l) => gl.uniform1f(l, peel * skin));
    setAll('uRound', (l) => gl.uniform1f(l, liquid ? 1 : 0));
    const isPlanet = (i) => (i >= 0 && shapes[i].name === 'planet' ? 1 : 0);
    setAll('uRingA', (l) => gl.uniform1f(l, isPlanet(a)));
    setAll('uRingB', (l) => gl.uniform1f(l, isPlanet(b)));
    setAll('uOrbit', (l) => gl.uniform1f(l, t * 0.3));

    const drawSolid = () => {
      if (skin <= 0.001) return;
      gl.useProgram(solidProg);
      gl.uniform1f(solidProg.u('uLiquid'), liquid ? 1 : 0);
      if (liquid) {
        // the blob sways (it keeps its size), and each tendril creeps out, then snaps back
        gl.uniform3f(solidProg.u('uSway'), Math.sin(t * 1.1) * 0.035, Math.sin(t * 1.7) * 0.02, Math.cos(t * 0.9) * 0.025);
        gl.uniform1f(solidProg.u('uSquash'), 1);
        const tend = new Float32Array(24);
        for (let i = 0; i < 6; i++) {
          const th = i * 2.4 + t * (0.17 + i * 0.03);
          const ph = Math.sin(t * (0.23 + i * 0.05) + i * 1.7) * 1.1;
          const ct = Math.cos(ph);
          const ph01 = (t * (0.21 + i * 0.037) + i * 0.29) % 1;
          const out = ph01 < 0.72 ? (ph01 / 0.72) ** 1.6 : (1 - (ph01 - 0.72) / 0.28) ** 3;
          tend.set([Math.cos(th) * ct, Math.sin(ph), Math.sin(th) * ct, out * (0.07 + (i % 3) * 0.02)], i * 4);
        }
        gl.uniform4fv(solidProg.u('uTend[0]'), tend);
      }
      gl.bindVertexArray(solidVaos[solid].vao);
      gl.drawElements(gl.TRIANGLES, solidVaos[solid].count, gl.UNSIGNED_INT, 0);
    };
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
    drawSolid();
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

    // 3. the shape itself, and the packed cubes a hover opens it onto
    drawSolid();
    drawCubes();
    if (skin > 0.001 && peel * skin > 0.001 && fillVaos[solid].count) {
      gl.useProgram(fillProg);
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(fillVaos[solid].vao);
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0, fillVaos[solid].count);
      gl.disable(gl.CULL_FACE);
    }

    if (skin < 0.999 || peel * skin > 0.001) {
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
    // gentle (reduced motion): no swarm flying in, half speed, no scroll scatter or scroll spin
    if (gentle) {
      t = t * 0.5 + BREAK + MORPH + FUSE;
      dt *= 0.5;
    }
    // a cycle: the last shape's skin breaks up into cubes, they fly to the next shape, and fuse into its skin
    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const target = k % shapes.length;
    const from = k === 0 ? -1 : (k - 1) % shapes.length;
    const fuse = Math.min(1, Math.max(0, (phase - BREAK - MORPH) / FUSE));
    let solid = -1;
    let reveal = 0;
    // eased at both ends, so the skin starts spreading gently and settles instead of stopping dead
    const soft = (x) => x * x * (3 - 2 * x);
    if (phase < BREAK && from >= 0) {
      solid = from;
      reveal = shapes[from].liquid ? 1 - phase / BREAK : 1 - soft(phase / BREAK);
    } else if (fuse > 0) {
      solid = target;
      reveal = shapes[target].liquid ? fuse : soft(fuse);
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
    // hovering the stage itself peels about 15% of the standing solid back into cubes
    const mx = (W * (1 - 1 / bleed)) / 2;
    const my = (H * (1 - 1 / bleed)) / 2;
    const over = p.active && p.x >= mx && p.x <= W - mx && p.y >= my && p.y <= H - my;
    peel += ((over ? 1 : 0) - peel) * Math.min(1, dt * 2.2);
    if (p.active) {
      px = (p.x / Math.max(1, W)) * 2 - 1;
      py = 1 - (p.y / Math.max(1, H)) * 2;
    }
    // solids keep turning; text swings round to face you, then sways
    const flat = shapes[target].flat && phase > BREAK + MORPH * 0.15;
    face += ((flat ? 1 : 0) - face) * Math.min(1, dt * 3);
    const facing = Math.round(yaw / TAU) * TAU + Math.sin(t * 0.55) * 0.35;
    // while the planet stands, the globe stops turning and only its debris ring orbits
    const planetUp = solid >= 0 && shapes[solid].name === 'planet';
    calm += ((planetUp ? 1 : 0) - calm) * Math.min(1, dt * 1.5);
    yaw += dt * 0.32 * (1 - face) * (1 - calm) + (facing - yaw) * Math.min(1, dt * 3.5) * face;
    const sp = gentle ? 0 : Math.min(1, Math.max(0, scroll()));
    scatter += (Math.min(1, Math.max(0, (sp - 0.08) / 0.7)) - scatter) * Math.min(1, dt * 8);
    draw({
      a: from,
      b: target,
      mix: Math.min(1, Math.max(0, (phase - BREAK) / MORPH)),
      solid,
      reveal,
      t,
      yaw: yaw + sp * 1.6,
      pitch: 0.38 - face * 0.26 + Math.sin(t * 0.21) * 0.08 * (1 - calm),
    });
  }

  /** One finished shape, no motion (reduced motion). */
  function still(index = shapes.findIndex((s) => s.name === 'torus knot')) {
    scatter = 0;
    near = 0;
    peel = 0;
    shown = index;
    onShape(index, shapes[index].name, shapes.length);
    draw({ a: index, b: index, mix: 1, solid: index, reveal: 1, t: 2, yaw: 0.7, pitch: 0.42 });
  }

  function destroy() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { step, still, resize, destroy, count: N };
}
