/**
 * Nano swarm: a cloud of small metallic cubes beside the hero portrait that
 * bursts apart and reassembles into a new shape every few seconds.
 *
 * One 2D canvas, no dependencies. The caller owns the canvas and decides when
 * it may run (on screen, tab visible, motion allowed): see HeroSwarm.jsx.
 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- formations: n points in roughly [-1, 1]^3 ----------

function sphere(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const k = rand(0.92, 1);
    out.push([Math.cos(golden * i) * r * k, y * k, Math.sin(golden * i) * r * k]);
  }
  return out;
}

function ring(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = rand(0, TAU);
    const v = rand(0, TAU);
    const R = 0.72;
    const r = 0.28;
    out.push([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v) * 1.1, (R + r * Math.cos(v)) * Math.sin(u)]);
  }
  return out;
}

function helix(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 - 1;
    const a = t * TAU * 1.6 + (i % 2 ? Math.PI : 0);
    const rr = Math.random() < 0.18 ? rand(-0.45, 0.45) : 0.45; // a few rungs
    out.push([Math.cos(a) * rr + rand(-0.03, 0.03), t * 1.05, Math.sin(a) * rr + rand(-0.03, 0.03)]);
  }
  return out;
}

function hollowCube(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
    p[(Math.random() * 3) | 0] = Math.random() < 0.5 ? -1 : 1;
    out.push(p.map((v) => v * 0.68));
  }
  return out;
}

/** Points sampled from text drawn on an offscreen canvas. */
function glyph(n, text) {
  const w = 260;
  const h = 130;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.font = 'bold 110px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const data = g.getImageData(0, 0, w, h).data;
  const px = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 128) px.push([x, y]);
  if (!px.length) return sphere(n);
  const out = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = px[(Math.random() * px.length) | 0];
    out.push([(x / w) * 2 - 1, ((y / h) * 2 - 1) * (h / w), rand(-0.12, 0.12)]);
  }
  return out;
}

// ---------- cube sprites: three faces, brushed steel (dark) or graphite (light) ----------

const PALETTES = {
  // [top, left, right] for far, mid, near, and a glint
  dark: [
    ['#5c6370', '#3b404a', '#272b33'],
    ['#8f97a5', '#5f6672', '#3e434c'],
    ['#c9cfd9', '#8c93a0', '#5a606b'],
    ['#ffffff', '#c8ced8', '#7f8693'],
  ],
  light: [
    ['#c3c7cf', '#a9aeb8', '#959aa5'],
    ['#9aa0ab', '#7c828e', '#666c77'],
    ['#6d737f', '#545a65', '#40454f'],
    ['#3a3f48', '#2a2e35', '#1d2026'],
  ],
};

function makeSprites(theme) {
  const S = 24;
  const cx = S / 2;
  const q = S / 4;
  const face = (g, pts, fill) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  return PALETTES[theme].map(([top, left, right]) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    face(g, [[cx, 1], [S - 2, q + 1], [cx, 2 * q + 1], [2, q + 1]], top);
    face(g, [[2, q + 1], [cx, 2 * q + 1], [cx, S - 1], [2, 3 * q - 1]], left);
    face(g, [[S - 2, q + 1], [cx, 2 * q + 1], [cx, S - 1], [S - 2, 3 * q - 1]], right);
    return c;
  });
}

// ---------- engine ----------

const HOLD = 4.2; // seconds a formation holds
const MOVE = 2.4; // seconds to burst and reassemble
const CYCLE = HOLD + MOVE;
const FOV = 3.2;

/**
 * @param {HTMLCanvasElement} canvas  fills the hero; sized by the caller via CSS
 * @param {{
 *   anchor: () => {x:number,y:number,size:number},
 *   theme: () => 'dark'|'light',
 *   scroll?: () => {progress:number, speed:number},
 * }} opts
 *   anchor is in canvas CSS pixels: formation centre and radius.
 *   scroll.progress: 0 with the hero at the top, 1 once it has scrolled away.
 *   scroll.speed: smoothed scroll speed in px/s.
 */
export function createNanoSwarm(canvas, { anchor, theme, scroll = () => ({ progress: 0, speed: 0 }) }) {
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };
  resize();

  const small = window.innerWidth < 1024;
  const N = small ? 380 : 900;
  const P = new Float32Array(N * 3);
  const V = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    seed[i] = Math.random() * 1000;
    P[i * 3] = rand(-1.8, 1.8);
    P[i * 3 + 1] = rand(-1.8, 1.8);
    P[i * 3 + 2] = rand(-1.8, 1.8);
  }
  const shapes = [sphere(N), ring(N), helix(N), glyph(N, '</>'), hollowCube(N)];
  // each cube's turn to leave as the hero scrolls away, and where it drifts to
  const release = new Float32Array(N);
  for (let i = 0; i < N; i++) release[i] = Math.random();
  const order = new Uint16Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const sz = new Float32Array(N);

  let spriteTheme = theme();
  let sprites = makeSprites(spriteTheme);

  /** Advance the simulation to time `t` (seconds) by `dt`, and draw. */
  function step(t, dt) {
    const th = theme();
    if (th !== spriteTheme) sprites = makeSprites((spriteTheme = th));

    const a = anchor();
    const { progress: sp, speed } = scroll();
    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const shape = shapes[k % shapes.length];
    // a fast scroll stirs the swarm; it regroups when the page comes to rest
    const stir = Math.min(1, Math.abs(speed) / 1800);
    // scrolling turns the formation, on top of its slow idle spin
    const ry = t * 0.22 + sp * 2.6;
    const rx = 0.32 + Math.sin(t * 0.17) * 0.12 - sp * 0.5;
    // as the hero leaves, cubes peel away upward and the rest loosens
    const dissolve = Math.max(0, (sp - 0.2) / 0.65);
    const grow = 1 + sp * 0.35;
    const cY = Math.cos(ry);
    const sY = Math.sin(ry);
    const cX = Math.cos(rx);
    const sX = Math.sin(rx);

    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const s = seed[i];
      let [tx, ty, tz] = shape[i];
      // the shape is built in a sweep from top to bottom, not all at once
      const assembling = phase > MOVE * 0.2 + (ty + 1) * 0.42;
      let pull = assembling ? 3.2 : 0.25;
      let swirl = assembling ? 0.25 : 1.6;
      swirl += stir * 2.2;
      pull *= 1 - stir * 0.7;
      if (release[i] < dissolve) {
        // released: rise and spread like dust lifting off
        const r = release[i] * 7.3 + s;
        tx = tx * 1.6 + Math.sin(r) * 0.9;
        ty = ty - 1.6 - dissolve * 2.4 - Math.cos(r * 1.3) * 0.6;
        tz = tz * 1.6 + Math.cos(r) * 0.9;
        pull = 0.9;
        swirl = 0.9;
      }
      const damp = Math.pow(assembling ? 0.06 : 0.3, dt);
      // cheap flow field so the burst swirls instead of exploding radially
      const nx = Math.sin(P[j + 1] * 2.1 + t * 0.9 + s) + Math.cos(P[j + 2] * 1.7 + s * 0.3);
      const ny = Math.sin(P[j + 2] * 2.3 + t * 0.8 + s * 1.3) + Math.cos(P[j] * 1.9 - t * 0.5);
      const nz = Math.sin(P[j] * 1.9 - t * 0.7 + s * 0.7) + Math.cos(P[j + 1] * 2.2 + t * 0.4);
      V[j] = (V[j] + ((tx - P[j]) * pull + nx * swirl * 0.5) * dt) * damp;
      V[j + 1] = (V[j + 1] + ((ty - P[j + 1]) * pull + ny * swirl * 0.5) * dt) * damp;
      V[j + 2] = (V[j + 2] + ((tz - P[j + 2]) * pull + nz * swirl * 0.5) * dt) * damp;
      P[j] += V[j] * dt;
      P[j + 1] += V[j + 1] * dt;
      P[j + 2] += V[j + 2] * dt;

      // rotate the whole formation, then project
      const x1 = P[j] * cY - P[j + 2] * sY;
      const z1 = P[j] * sY + P[j + 2] * cY;
      const y2 = P[j + 1] * cX - z1 * sX;
      const z2 = P[j + 1] * sX + z1 * cX;
      const pz = FOV / (FOV + z2);
      sx[i] = a.x + x1 * a.size * grow * pz;
      sy[i] = a.y + y2 * a.size * grow * pz;
      sz[i] = z2;
      order[i] = i;
    }

    // far to near
    order.sort((p, q) => sz[q] - sz[p]);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const base = small ? 5 : 7.5;
    const alpha = (th === 'dark' ? 0.85 : 0.75) * (1 - Math.min(1, dissolve) * 0.75);
    for (let n = 0; n < N; n++) {
      const i = order[n];
      const z = sz[i];
      const pz = FOV / (FOV + z);
      const size = base * pz;
      // tumbling cubes catch the light now and then
      const glint = Math.sin(t * (1.3 + (seed[i] % 1.7)) + seed[i]) > 0.985;
      const shade = glint ? 3 : z < -0.3 ? 2 : z < 0.4 ? 1 : 0;
      ctx.globalAlpha = alpha * Math.min(1, pz * 0.9) * (release[i] < dissolve ? 0.55 : 1);
      ctx.drawImage(sprites[shade], sx[i] - size / 2, sy[i] - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  /** Settle into the first formation without animating (reduced motion). */
  function still() {
    for (let i = 0; i < 300; i++) step(HOLD * 0.5 + MOVE, 1 / 30);
  }

  return { step, still, resize };
}
