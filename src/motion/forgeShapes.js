/**
 * The nano forge's shapes (see nanoForge.js and MOTION.md), built off the main thread in
 * forgeShapes.worker.js: packing thousands of random-sized cubes into each shape takes a moment.
 * Pure maths, no DOM.
 */

const TAU = Math.PI * 2;

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

/**
 * Fill a volume with cubes of random sizes, solid right through and with no gaps between them. sample()
 * returns a random point inside the volume as [x, y, z, part]. The volume is voxelised on a fine grid
 * (spacing sp, the same for every shape, so detail is kept), then cells are merged into bigger cubes at
 * random: blocks from 7x7x7 down to 3x3x3 wherever they fit (mostly deep inside, where they save the most), then
 * some 2x2x2. The count is whatever the shape needs: a thin shape uses few cubes, a big one many.
 * w = cube scale relative to the base + 8 x part.
 */
function voxelize(sample, sp, base, { inside = null, box = 0 } = {}) {
  const K = (x, y, z) => (x + 512) * 1048576 + (y + 512) * 1024 + (z + 512);
  const cells = new Map();
  const inv = 1 / sp;
  const add = (q) => {
    const x = Math.round(q[0] * inv);
    const y = Math.round(q[1] * inv);
    const z = Math.round(q[2] * inv);
    const key = K(x, y, z);
    if (!cells.has(key)) cells.set(key, [x, y, z, q[3], Math.random()]);
  };
  if (inside) {
    // a volume with a cheap inside test: check every cell of the grid over [-box, box]
    const m = Math.ceil(box * inv);
    for (let x = -m; x <= m; x++)
      for (let y = -m; y <= m; y++)
        for (let z = -m; z <= m; z++) {
          const part = inside([x * sp, y * sp, z * sp]);
          if (part >= 0) cells.set(K(x, y, z), [x, y, z, part, Math.random()]);
        }
  } else {
    // keep sampling until new points stop finding new cells, so the volume is covered without holes
    let misses = 0;
    while (misses < 12000) {
      const before = cells.size;
      add(sample());
      misses = cells.size === before ? misses + 1 : 0;
    }
  }
  const order = [...cells.values()].sort((a, b) => a[4] - b[4]);
  const taken = new Set();
  const fits = (x, y, z, s, part) => {
    for (let a = 0; a < s; a++)
      for (let b = 0; b < s; b++)
        for (let c = 0; c < s; c++) {
          const key = K(x + a, y + b, z + c);
          const cell = cells.get(key);
          if (!cell || cell[3] !== part || taken.has(key)) return false;
        }
    return true;
  };
  const out = [];
  const place = (x, y, z, s, part) => {
    for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) for (let c = 0; c < s; c++) taken.add(K(x + a, y + b, z + c));
    const o = (s - 1) / 2;
    out.push([(x + o) * sp, (y + o) * sp, (z + o) * sp, (s * sp) / base + 8 * part]);
  };
  for (const [size, chance] of [[7, 0.9], [6, 0.9], [5, 0.85], [4, 0.85], [3, 0.7], [2, 0.35], [1, 1]])
    for (const [x, y, z, part, r] of order) {
      if (taken.has(K(x, y, z)) || (size > 1 && (r * 9.73) % 1 > chance)) continue;
      if (fits(x, y, z, size, part)) place(x, y, z, size, part);
    }
  return out;
}

const hash3 = (x, y, z) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
};
/** Smooth value noise in 3D, about [0, 1]. */
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const f = (t) => t * t * (3 - 2 * t);
  const fx = f(x - ix), fy = f(y - iy), fz = f(z - iz);
  const l = (a, b, t) => a + (b - a) * t;
  const h = (a, b, c) => hash3(ix + a, iy + b, iz + c);
  return l(
    l(l(h(0, 0, 0), h(1, 0, 0), fx), l(h(0, 1, 0), h(1, 1, 0), fx), fy),
    l(l(h(0, 0, 1), h(1, 0, 1), fx), l(h(0, 1, 1), h(1, 1, 1), fx), fy),
    fz,
  );
}

/** A point in a disc of radius r around p, square to the tangent t. */
function disc(p, t, r) {
  const tl = Math.hypot(...t) || 1;
  let o = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
  const d = (o[0] * t[0] + o[1] * t[1] + o[2] * t[2]) / (tl * tl);
  o = [o[0] - t[0] * d, o[1] - t[1] * d, o[2] - t[2] * d];
  const ol = Math.hypot(...o) || 1;
  const k = (r * Math.sqrt(Math.random())) / ol;
  return [p[0] + o[0] * k, p[1] + o[1] * k, p[2] + o[2] * k];
}

/**
 * A solid cube of cubes whose sides aren't plain: raised plates and sunken panels of different sizes,
 * like a machined block.
 */
function voxelCube(sp, base) {
  const H = 0.48;
  // how far the surface sits out (or in) at a point on a face, from a blocky pattern of plates
  const relief = (u, v, face) => {
    const big = hash3(Math.floor(u / 0.16), Math.floor(v / 0.16), face);
    const small = hash3(Math.floor(u / 0.07) + 31, Math.floor(v / 0.07) + 17, face + 7);
    let d = 0;
    if (big > 0.62) d += 0.04; // a raised plate
    else if (big < 0.22) d -= 0.035; // a sunken panel
    if (small > 0.8) d += 0.025; // studs and nubs
    else if (small < 0.1) d -= 0.025; // small vents
    return d;
  };
  const inside = (p) => {
    const a = p.map(Math.abs);
    const k = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2;
    const face = k * 2 + (p[k] > 0 ? 1 : 0);
    const [u, v] = [p[(k + 1) % 3], p[(k + 2) % 3]];
    // the edges stay crisp; relief only away from them
    const edge = Math.max(Math.abs(u), Math.abs(v)) > H - 0.05;
    return a[k] <= H + (edge ? 0 : relief(u + 1, v + 1, face)) ? 0 : -1;
  };
  return voxelize(null, sp, base, { inside, box: H + 0.07 });
}

const knotAt = (u) => {
  const r = Math.cos(3 * u) + 2.1;
  return [(r * Math.cos(2 * u)) / 3.3, (r * Math.sin(2 * u)) / 3.3, (Math.sin(3 * u) * 1.1) / 3.3];
};
function torusKnot(sp, base) {
  return voxelize(() => {
    const u = rand(0, TAU);
    const p = knotAt(u);
    const q = knotAt(u + 0.001);
    // a ribbed tube: rings of raised cubes all along it, and a slow swell and pinch
    const r = 0.07 * (1 + 0.12 * Math.sin(u * 5)) + (Math.sin(u * 90) > 0.6 ? 0.016 : 0);
    return [...disc(p, [q[0] - p[0], q[1] - p[1], q[2] - p[2]], r), 0];
  }, sp, base);
}

/** A solid globe of cubes, and a belt of loose debris (its own part, so no strings run between them). */
function planet(sp, base, ringN) {
  // a globe with terrain: continents raised over the sea, mountain ranges on them, craters and polar caps
  const R = 0.4;
  const height = (n) => {
    const c = noise3(n[0] * 2.2 + 5, n[1] * 2.2 + 1, n[2] * 2.2 + 9) * 0.65 + noise3(n[0] * 5 + 2, n[1] * 5, n[2] * 5 + 4) * 0.35;
    let h = 0;
    if (c > 0.5) h += 0.05; // land
    if (c > 0.6) h += 0.06 * noise3(n[0] * 11, n[1] * 11 + 3, n[2] * 11); // mountains
    if (Math.abs(n[1]) > 0.86) h += 0.04; // ice caps
    if (c < 0.5 && hash3(Math.floor(n[0] * 9), Math.floor(n[1] * 9), Math.floor(n[2] * 9)) > 0.9) h -= 0.035; // craters
    return h;
  };
  const inside = (p) => {
    const l = Math.hypot(...p);
    if (l < R - 0.03) return 0;
    if (l > R + 0.13) return -1;
    return l <= R + height(p.map((c) => c / l)) ? 0 : -1;
  };
  const pts = voxelize(null, sp, base, { inside, box: R + 0.13 });
  const tilt = 0.42;
  for (let i = 0; i < ringN; i++) {
    const a = rand(0, TAU);
    const r = Math.sqrt(rand(0.7 * 0.7, 1.08 * 1.08));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // a loose belt of debris: some thickness, and rocks of every size
    const y = rand(-0.045, 0.045) * (0.4 + Math.random());
    const scale = 0.3 + Math.random() ** 1.8 * 0.85;
    // w = 8 + scale: the second part (the ring)
    pts.push([x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt), 8 + scale]);
  }
  return pts;
}

const HELIX_TURNS = 0.75; // per half: 1.5 turns top to bottom
const HELIX_RUNGS = 14;
function helix(sp, base) {
  return voxelize(() => {
    if (Math.random() < 0.8) {
      // each strand is its own part (0 or 1), so no strings jump the gap between them
      const side = Math.random() < 0.5 ? 0 : 1;
      const t = rand(-1, 1);
      const at = (tt) => {
        const a = tt * TAU * HELIX_TURNS + side * Math.PI;
        return [Math.cos(a) * 0.4, tt * 0.95, Math.sin(a) * 0.4];
      };
      const p = at(t);
      const q = at(t + 0.001);
      // strands ribbed along their length, swelling into a node where each rung meets them
      const node = Math.cos(((t + 0.9) / 1.8) * (HELIX_RUNGS - 1) * TAU) > 0.93 ? 0.03 : 0;
      const r = 0.036 + (Math.sin(t * 160) > 0.5 ? 0.008 : 0) + node;
      return [...disc(p, [q[0] - p[0], q[1] - p[1], q[2] - p[2]], r), side];
    }
    // the rungs are a third part
    const k = Math.floor(rand(0, HELIX_RUNGS));
    const t = (k / (HELIX_RUNGS - 1)) * 1.8 - 0.9;
    const a = t * TAU * HELIX_TURNS;
    const s = rand(-0.4, 0.4);
    return [...disc([Math.cos(a) * s, t * 0.95, Math.sin(a) * s], [Math.cos(a), 0, Math.sin(a)], 0.02), 2];
  }, sp, base);
}

/**
 * A brain: two hemispheres split by a deep fissure, their surface folded into ridges and grooves, with
 * the cerebellum tucked under the back and the brain stem below. Each hemisphere is its own part, and so
 * is the cerebellum with the stem, so strings never cross the fissure.
 */
function brain(sp, base) {
  const S = 1.25; // a little bigger than the other shapes' unit size, so the folds have room
  const inside = (p) => {
    const [x, y, z] = p.map((c) => c / S);
    // cerebellum and stem, under the back
    const cb = Math.hypot(x / 0.22, (y + 0.24) / 0.13, (z + 0.24) / 0.17);
    const stem = Math.hypot(x / 0.07, (z + 0.12) / 0.075) <= 1 && y < -0.2 && y > -0.5;
    if (cb <= 1 || stem) {
      // fine horizontal folds on the cerebellum
      if (cb <= 1 && cb > 0.8 && Math.sin((y + 0.24) * 110) > 0.55) return -1;
      return 2;
    }
    // the hemispheres: one egg-shaped half each side of the fissure, flatter underneath
    const side = x < 0 ? 0 : 1;
    const hx = Math.abs(x) - 0.215;
    const yy = y > 0 ? y / 0.36 : y / 0.25;
    const d = Math.hypot(hx / 0.235, yy, z / (0.47 - 0.05 * y));
    if (Math.abs(x) < 0.022 && y > -0.12) return -1; // the fissure between them
    if (d > 1.04) return -1;
    // the folds: grooves where a ridged noise is near zero, cut into the outer skin
    if (d > 0.84) {
      // winding folds: stripes bent by noise, so they snake over the surface like gyri
      const w = noise3(x * 4 + 3, y * 4 + 7, z * 4 + 1);
      const f = Math.sin((y * 9 + z * 6 + x * 3) + w * 9 + noise3(x * 9 + 9, y * 9, z * 9 + 5) * 3);
      if (Math.abs(f) < 0.32) return -1; // a groove (sulcus)
      if (d > 0.96 && Math.abs(f) < 0.62) return -1; // the ridges (gyri) stand proud
    }
    return side;
  };
  return voxelize(null, sp, base, { inside, box: 0.56 * S });
}

const MOBIUS_R = 0.72;
const MOBIUS_W = 0.095;
const MOBIUS_T = 0.011; // half the band's thickness
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

/** A thick Möbius band of cubes. */
function mobius(sp, base) {
  const e = 1e-3;
  return voxelize(() => {
    const u = rand(0, TAU);
    const v = rand(-MOBIUS_W, MOBIUS_W);
    const p = mobiusAt(u, v);
    const du = mobiusAt(u + e, v).map((c, k) => c - p[k]);
    const dv = mobiusAt(u, v + e).map((c, k) => c - p[k]);
    const nn = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
    const l = Math.hypot(...nn) || 1;
    const t = rand(-MOBIUS_T, MOBIUS_T) / l;
    return [p[0] + nn[0] * t, p[1] + nn[1] * t, p[2] + nn[2] * t, 0];
  }, sp, base);
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

/**
 * Every shape, settled into the shared order, plus the opening cloud.
 * small: fewer cubes, for phones and low-power devices.
 */
export function buildShapes(small) {
  // one fine grid for every shape, so detail is kept; coarser on phones
  const spacing = small ? 0.04 : 0.024;
  // every shape is filled with cubes of random sizes right through, as many as it needs
  const shapes = [
    ['cube', voxelCube(spacing, spacing)],
    ['torus knot', torusKnot(spacing, spacing)],
    ['brain', brain(spacing, spacing)],
    ['möbius loop', mobius(spacing, spacing)],
    ['planet', planet(spacing, spacing, small ? 450 : 900)],
    ['double helix', helix(spacing, spacing)],
  ];
  // the buffers hold the most any shape needs; a shape that needs fewer hides the rest inside itself
  const N = Math.max(...shapes.map((s) => s[1].length));
  const counts = shapes.map((s) => s[1].length);
  return { N, spacing, counts, names: shapes.map((s) => s[0]), settled: shapes.map((s) => settle(pad(s[1], N))), start: settle(cloud(N)) };
}
