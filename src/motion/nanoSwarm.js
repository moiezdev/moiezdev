/**
 * Nano swarm: metallic micro-cubes, linked by a mesh of hairlines, behind the
 * whole home page.
 *
 * - In the hero, most cubes hold a large formation around the portrait that
 *   bursts and rebuilds (sphere, ring, helix, </>, hollow cube), with a pulse of
 *   light running through its mesh.
 * - The rest drift as a loose plexus across the page. As the hero scrolls
 *   away the formation comes apart and its cubes join that field; scrolling
 *   back pulls them home.
 *
 * Everything is simulated in screen space on one 2D canvas: formation points
 * are projected from 3D and act as spring targets, so cubes can move freely
 * between the formation and the field. No dependencies.
 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------- formations: n points in roughly [-1, 1]^3 ----------

function sphere(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const k = rand(0.9, 1);
    out.push([Math.cos(golden * i) * r * k, y * k, Math.sin(golden * i) * r * k]);
  }
  return out;
}

function ring(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = rand(0, TAU);
    const v = rand(0, TAU);
    const R = 0.74;
    const r = 0.24;
    out.push([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v) * 1.1, (R + r * Math.cos(v)) * Math.sin(u)]);
  }
  return out;
}

function helix(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 - 1;
    const a = t * TAU * 1.5 + (i % 2 ? Math.PI : 0);
    const rr = Math.random() < 0.2 ? rand(-0.45, 0.45) : 0.45; // a few rungs
    out.push([Math.cos(a) * rr + rand(-0.03, 0.03), t * 1.05, Math.sin(a) * rr + rand(-0.03, 0.03)]);
  }
  return out;
}

function hollowCube(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
    p[(Math.random() * 3) | 0] = Math.random() < 0.5 ? -1 : 1;
    out.push(p.map((v) => v * 0.66));
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
    out.push([(x / w) * 2 - 1, ((y / h) * 2 - 1) * (h / w), rand(-0.14, 0.14)]);
  }
  return out;
}

// ---------- look ----------

const LOOK = {
  dark: {
    // [top, left, right, rim] for far, mid, near, and a glint
    cubes: [
      ['#596170', '#363b45', '#23272e', '#6d7584'],
      ['#8e97a6', '#5a616d', '#3b4049', '#aab2bf'],
      ['#d3d9e2', '#8f97a4', '#5b616c', '#eef1f5'],
      ['#ffffff', '#d8dde5', '#8d94a1', '#ffffff'],
    ],
    line: '176, 188, 208',
    pulse: '214, 226, 246',
    glow: 'rgba(196, 214, 255, 0.55)',
    cubeAlpha: 0.9,
    fieldAlpha: 0.62,
    lineAlpha: 0.32,
  },
  light: {
    cubes: [
      ['#c4c8d0', '#aab0ba', '#979ca7', '#d6d9df'],
      ['#9aa1ac', '#7b818d', '#646a75', '#b4bac3'],
      ['#6a717d', '#515762', '#3d424b', '#868c97'],
      ['#2f343c', '#22262c', '#181b20', '#4a505a'],
    ],
    line: '72, 80, 94',
    pulse: '40, 46, 58',
    glow: null,
    cubeAlpha: 0.82,
    fieldAlpha: 0.5,
    lineAlpha: 0.22,
  },
};

function makeSprites(theme) {
  const S = 32;
  const cx = S / 2;
  const q = S / 4;
  const face = (g, pts, fill) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  return LOOK[theme].cubes.map(([top, left, right, rim]) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    face(g, [[cx, 2], [S - 3, q + 2], [cx, 2 * q + 2], [3, q + 2]], top);
    face(g, [[3, q + 2], [cx, 2 * q + 2], [cx, S - 2], [3, 3 * q - 2]], left);
    face(g, [[S - 3, q + 2], [cx, 2 * q + 2], [cx, S - 2], [S - 3, 3 * q - 2]], right);
    // a lit rim on the top edges reads as machined metal at small sizes
    g.beginPath();
    g.moveTo(3, q + 2);
    g.lineTo(cx, 2);
    g.lineTo(S - 3, q + 2);
    g.moveTo(cx, 2 * q + 2);
    g.lineTo(cx, S - 2);
    g.strokeStyle = rim;
    g.lineWidth = 1.2;
    g.stroke();
    return c;
  });
}

function makeGlow(color) {
  if (!color) return null;
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

// ---------- engine ----------

const HOLD = 4.6; // seconds a formation holds
const MOVE = 2.6; // seconds to burst and rebuild
const CYCLE = HOLD + MOVE;
const FOV = 3.4;
const CELL_ROW = 4096; // grid key = column * CELL_ROW + row

const TEXT_DIM = 0.1; // alpha left behind text
const TEXT_MARGIN = 28; // px over which cubes ease back in around text
const FADE_MARGIN = 96; // px over which cubes fade out before an opaque card

/** 0 inside the rect, easing up to 1 at `margin` px outside it (smoothstep). */
function clearance(x, y, r, margin) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  if (dx >= margin || dy >= margin) return 1;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d >= margin) return 1;
  const u = d / margin;
  return u * u * (3 - 2 * u);
}

/**
 * @param {HTMLCanvasElement} canvas  fixed, fills the viewport
 * @param {{
 *   anchor: () => ({x:number,y:number,size:number}|null),
 *   textRects: () => DOMRect[],
 *   fadeRects?: () => DOMRect[],
 *   theme: () => 'dark'|'light',
 *   scroll: () => {progress:number, speed:number, y:number},
 *   pointer?: () => {x:number, y:number, active:boolean},
 * }} opts
 *   anchor: formation centre and radius in viewport px (null: no formation).
 *   textRects: the hero copy and the header, where cubes are dimmed so text stays readable.
 *   fadeRects: opaque things the swarm passes behind (the portrait card). Cubes fade out
 *     softly as they approach, so the card never cuts the swarm off with a hard edge.
 *   scroll.progress: 0 with the hero at the top, 1 once it has scrolled away.
 *   pointer: the cursor (or a finger while it's down), in viewport px.
 */
export function createNanoSwarm(canvas, { anchor, textRects, fadeRects = () => [], theme, scroll, pointer = () => ({ x: 0, y: 0, active: false }) }) {
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let small = false;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    small = W < 1024;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };
  resize();

  // formation cubes first, then free field cubes
  const NF = small ? 300 : 680;
  const N = NF + (small ? 150 : 320);
  const P = new Float32Array(N * 2); // screen position
  const V = new Float32Array(N * 2);
  const Z = new Float32Array(N); // depth, -1 near .. 1 far
  const A = new Float32Array(N); // alpha this frame
  const seed = new Float32Array(N);
  const release = new Float32Array(N); // order in which formation cubes leave
  const fu = new Float32Array(N); // field home, as fractions of the viewport
  const fv = new Float32Array(N);
  const fz = new Float32Array(N);
  const prevTy = new Float32Array(N);
  const order = new Uint16Array(N);
  const count = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    seed[i] = Math.random() * 1000;
    release[i] = Math.random();
    fu[i] = Math.random();
    fv[i] = Math.random();
    fz[i] = rand(-0.6, 1);
    P[i * 2] = fu[i] * W;
    P[i * 2 + 1] = fv[i] * H;
  }
  const shapes = [sphere(NF), ring(NF), helix(NF), glyph(NF, '</>'), hollowCube(NF)];

  let spriteTheme = theme();
  let sprites = makeSprites(spriteTheme);
  let glow = makeGlow(LOOK[spriteTheme].glow);

  const cells = new Map();
  const links = [[], [], []]; // three alpha buckets, flat [x1, y1, x2, y2, ...]
  const pulseLinks = [];
  let lastScrollY = null;
  // the formation leans toward the cursor; eased so it never snaps
  let lean = 0;
  let tilt = 0;
  let near = 0; // how strongly the cursor is pulling the mesh, eased in and out
  const pointerLinks = [];

  /** Advance to time `t` (seconds) by `dt`, and draw. */
  function step(t, dt) {
    const th = theme();
    if (th !== spriteTheme) {
      spriteTheme = th;
      sprites = makeSprites(th);
      glow = makeGlow(LOOK[th].glow);
    }
    const look = LOOK[th];
    const a = anchor();
    const dim = textRects();
    const fade = fadeRects();
    const { progress: sp, speed, y: scrollY } = scroll();

    // the field sits deeper than the content, so it drifts up slower than the page
    const fieldShift = scrollY * 0.12;
    const jumped = lastScrollY != null && Math.abs(scrollY - lastScrollY) > H; // jumps, route changes
    lastScrollY = scrollY;

    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const shape = shapes[k % shapes.length];
    const stir = Math.min(1, Math.abs(speed) / 1800);
    const ptr = pointer();
    const ease = Math.min(1, dt * 2.5);
    lean += ((ptr.active ? (ptr.x / W - 0.5) * 0.9 : 0) - lean) * ease;
    tilt += ((ptr.active ? (ptr.y / H - 0.5) * 0.6 : 0) - tilt) * ease;
    near += ((ptr.active ? 1 : 0) - near) * ease;
    const R = small ? 110 : 150; // cursor's reach
    const ry = t * 0.2 + sp * 2.6 + lean;
    const rx = 0.3 + Math.sin(t * 0.16) * 0.12 - sp * 0.5 + tilt;
    const cY = Math.cos(ry);
    const sY = Math.sin(ry);
    const cX = Math.cos(rx);
    const sX = Math.sin(rx);
    const dissolve = a ? clamp01((sp - 0.15) / 0.6) : 1;
    // a band of light sweeping down through the formation
    const pulseY = ((t * 0.32) % 1.6) * 2 - 1.6;

    for (let i = 0; i < N; i++) {
      const j = i * 2;
      const s = seed[i];
      let tx;
      let ty;
      let tz;
      let pull;
      let swirl;
      let assembling = false;
      const inFormation = i < NF && a && release[i] >= dissolve;

      if (inFormation) {
        const [x0, y0, z0] = shape[i];
        // built in a sweep from top to bottom, not all at once
        assembling = phase > MOVE * 0.2 + (y0 + 1) * 0.45;
        const x1 = x0 * cY - z0 * sY;
        const z1 = x0 * sY + z0 * cY;
        const y2 = y0 * cX - z1 * sX;
        const z2 = y0 * sX + z1 * cX;
        const pz = FOV / (FOV + z2);
        tx = a.x + x1 * a.size * pz;
        ty = a.y + y2 * a.size * pz;
        tz = z2;
        pull = assembling ? 3.4 : 0.3;
        swirl = (assembling ? 0.08 : 0.55) * a.size;
        A[i] = look.cubeAlpha * Math.min(1, pz * 0.95);
        // cubes in the travelling band of light brighten
        if (Math.abs(y0 - pulseY) < 0.12) A[i] = Math.min(1, A[i] * 1.25);
      } else {
        // free field: a slow plexus across the whole viewport
        const span = H * 1.3;
        let fy = (fv[i] * span - fieldShift * (1.2 - fz[i] * 0.5) + Math.sin(t * 0.07 + s) * 30) % span;
        if (fy < 0) fy += span;
        tx = fu[i] * W + Math.sin(t * 0.05 + s * 1.7) * 60;
        ty = fy - H * 0.15;
        tz = fz[i];
        pull = 0.9;
        swirl = 14;
        A[i] = look.fieldAlpha * (0.55 + (1 - tz) * 0.3);
        // a target that wrapped around teleports instead of streaking across the screen
        if (jumped || Math.abs(ty - prevTy[i]) > H * 0.6) {
          P[j] = tx;
          P[j + 1] = ty;
          V[j] = V[j + 1] = 0;
        }
      }
      prevTy[i] = ty;

      swirl *= 1 + stir * 2.2;
      pull *= 1 - stir * 0.6;
      // cheap flow field so motion curls instead of running in straight lines
      const px = P[j] * 0.006;
      const py = P[j + 1] * 0.006;
      const nx = Math.sin(py * 2.1 + t * 0.9 + s) + Math.cos(px * 1.3 + s * 0.3);
      const ny = Math.sin(px * 2.3 + t * 0.8 + s * 1.3) + Math.cos(py * 1.7 - t * 0.5);
      const damp = Math.pow(assembling ? 0.05 : 0.25, dt);
      V[j] = (V[j] + ((tx - P[j]) * pull + nx * swirl * 0.5) * dt) * damp;
      V[j + 1] = (V[j + 1] + ((ty - P[j + 1]) * pull + ny * swirl * 0.5) * dt) * damp;
      // the cursor parts the swarm around it, like a hand through dust
      if (near > 0.01) {
        const dx = P[j] - ptr.x;
        const dy = P[j + 1] - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          const push = (1 - d / R) ** 2 * 900 * near * dt;
          V[j] += (dx / d) * push;
          V[j + 1] += (dy / d) * push;
        }
      }
      P[j] += V[j] * dt;
      P[j + 1] += V[j + 1] * dt;
      Z[i] += (tz - Z[i]) * Math.min(1, dt * 4);

      // keep the hero copy readable: almost gone behind text, eased in over a short margin
      let keep = 1;
      for (let r = 0; r < dim.length; r++) keep = Math.min(keep, TEXT_DIM + (1 - TEXT_DIM) * clearance(P[j], P[j + 1], dim[r], TEXT_MARGIN));
      // and fade out before opaque cards, instead of being clipped by their edge
      for (let r = 0; r < fade.length; r++) keep = Math.min(keep, clearance(P[j], P[j + 1], fade[r], FADE_MARGIN));
      A[i] *= keep;
    }

    // ---- mesh: link nearby cubes at a similar depth, at most 3 links each ----
    const linkD = small ? 44 : 56;
    const maxLinks = 3;
    cells.clear();
    for (let i = 0; i < N; i++) {
      const x = P[i * 2];
      const y = P[i * 2 + 1];
      if (x < -linkD || x > W + linkD || y < -linkD || y > H + linkD) continue;
      const key = Math.floor(x / linkD + 2) * CELL_ROW + Math.floor(y / linkD + 2);
      let c = cells.get(key);
      if (!c) cells.set(key, (c = []));
      c.push(i);
    }
    links[0].length = links[1].length = links[2].length = 0;
    pulseLinks.length = 0;
    count.fill(0);
    const d2max = linkD * linkD;
    const pulseScreenY = a ? a.y + pulseY * a.size * 0.9 : -1e9;
    for (const [key, list] of cells) {
      const col = Math.floor(key / CELL_ROW);
      const row = key - col * CELL_ROW;
      for (let ox = 0; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          if (ox === 0 && oy < 0) continue; // visit each pair of neighbouring cells once
          const other = ox === 0 && oy === 0 ? list : cells.get((col + ox) * CELL_ROW + row + oy);
          if (!other) continue;
          for (let m = 0; m < list.length; m++) {
            const i = list[m];
            if (count[i] >= maxLinks) continue;
            const xi = P[i * 2];
            const yi = P[i * 2 + 1];
            for (let n = other === list ? m + 1 : 0; n < other.length; n++) {
              const q = other[n];
              if (count[q] >= maxLinks || Math.abs(Z[i] - Z[q]) > 0.5) continue;
              const xq = P[q * 2];
              const yq = P[q * 2 + 1];
              const d2 = (xq - xi) ** 2 + (yq - yi) ** 2;
              if (d2 > d2max) continue;
              count[i]++;
              count[q]++;
              const strength = (1 - d2 / d2max) * Math.min(A[i], A[q]);
              const inPulse = i < NF && q < NF && Math.abs((yi + yq) / 2 - pulseScreenY) < 16 && strength > 0.15;
              const arr = inPulse ? pulseLinks : links[strength > 0.45 ? 2 : strength > 0.22 ? 1 : 0];
              arr.push(xi, yi, xq, yq);
              if (count[i] >= maxLinks) break;
            }
          }
        }
      }
    }

    // the cursor joins the mesh: hairlines to the cubes around it
    pointerLinks.length = 0;
    if (near > 0.01) {
      const reach = R * 1.35;
      let made = 0;
      for (let i = 0; i < N && made < 14; i++) {
        const dx = P[i * 2] - ptr.x;
        const dy = P[i * 2 + 1] - ptr.y;
        if (dx * dx + dy * dy < reach * reach && A[i] > 0.15) {
          pointerLinks.push(ptr.x, ptr.y, P[i * 2], P[i * 2 + 1]);
          made++;
        }
      }
    }

    // ---- draw ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const strokeAll = (arr, rgb, alpha, width) => {
      if (!arr.length) return;
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.beginPath();
      for (let n = 0; n < arr.length; n += 4) {
        ctx.moveTo(arr[n], arr[n + 1]);
        ctx.lineTo(arr[n + 2], arr[n + 3]);
      }
      ctx.stroke();
    };
    strokeAll(links[0], look.line, look.lineAlpha * 0.3, 0.6);
    strokeAll(links[1], look.line, look.lineAlpha * 0.6, 0.6);
    strokeAll(links[2], look.line, look.lineAlpha, 0.7);
    strokeAll(pulseLinks, look.pulse, Math.min(1, look.lineAlpha * 2.2), 0.9);
    strokeAll(pointerLinks, look.pulse, look.lineAlpha * 0.9 * near, 0.6);

    // cubes, far to near
    for (let i = 0; i < N; i++) order[i] = i;
    order.sort((p, q) => Z[q] - Z[p]);
    const base = small ? 5.5 : 7.5;
    for (let n = 0; n < N; n++) {
      const i = order[n];
      const x = P[i * 2];
      const y = P[i * 2 + 1];
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      const z = Z[i];
      const pz = FOV / (FOV + z * 1.4);
      const field = !(i < NF && a && release[i] >= dissolve);
      const size = base * pz * (field ? 0.85 : 1);
      // tumbling cubes catch the light now and then
      const glint = Math.sin(t * (1.2 + (seed[i] % 1.7)) + seed[i]) > 0.982;
      const shade = glint ? 3 : z < -0.3 ? 2 : z < 0.35 ? 1 : 0;
      ctx.globalAlpha = A[i];
      ctx.drawImage(sprites[shade], x - size / 2, y - size / 2, size, size);
      if (glint && glow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = A[i] * 0.6;
        ctx.drawImage(glow, x - size * 2, y - size * 2, size * 4, size * 4);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Settle into the first formation without animating (reduced motion). */
  function still() {
    for (let i = 0; i < 260; i++) step(HOLD * 0.5 + MOVE, 1 / 30);
  }

  return { step, still, resize };
}
