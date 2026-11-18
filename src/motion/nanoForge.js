/**
 * Nano forge: a few thousand machined micro-cubes that keep tearing themselves
 * apart and re-assembling into new solid shapes in the hero stage
 * (a voxel cube, a torus knot, </>, a ringed planet, a double helix, "AI").
 *
 * Real 3D on one WebGL2 canvas: one instanced cube mesh, lit as brushed metal,
 * with the whole morph done in the vertex shader. Every shape is a precomputed
 * buffer and the CPU only swaps which two buffers are bound and updates a few
 * uniforms per frame, so it stays cheap on phones. No dependencies.
 *
 * Returns null when WebGL2 isn't available (the stage then keeps its static glow).
 */

const TAU = Math.PI * 2;
const MORPH = 2.6; // seconds to tear down one shape and build the next
const HOLD = 3.4; // seconds a finished shape holds
const CYCLE = MORPH + HOLD;

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
    pts.push([x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)]);
  }
  return pts;
}

function helix(n) {
  const pts = [];
  const rungs = Math.round(n * 0.22);
  const strand = n - rungs;
  for (let i = 0; i < strand; i++) {
    const t = (i / strand) * 2 - 1;
    const a = t * TAU * 1.25 + (i % 2 ? Math.PI : 0);
    const j = () => rand(-0.035, 0.035);
    pts.push([Math.cos(a) * 0.4 + j(), t * 0.95, Math.sin(a) * 0.4 + j()]);
  }
  for (let i = 0; i < rungs; i++) {
    const k = Math.floor(rand(0, 22));
    const t = (k / 21) * 2 - 1;
    const a = t * TAU * 1.25;
    const s = rand(-0.4, 0.4);
    pts.push([Math.cos(a) * s, t * 0.95, Math.sin(a) * s]);
  }
  return pts;
}

/** Text voxelised on the same grid as the cubes, and extruded a few layers deep. */
function glyph(n, text, weight, family, spacing) {
  // draw large, crop to the ink, then let the browser average it down to one pixel per cube
  const big = document.createElement('canvas');
  big.width = 640;
  big.height = 320;
  const g = big.getContext('2d', { willReadFrequently: true });
  g.font = `${weight} 200px ${family}`;
  const fs = Math.min(200 * (600 / Math.max(1, g.measureText(text).width)), 300);
  g.font = `${weight} ${fs}px ${family}`;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 320, 168);
  const ink = g.getImageData(0, 0, 640, 320).data;
  let x0 = 640, x1 = 0, y0 = 320, y1 = 0;
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 640; x++)
      if (ink[(y * 640 + x) * 4 + 3] > 80) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 <= x0) return voxelCube(n, 12);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  // as large as fits in 2.0 wide by 1.35 tall
  const scale = Math.min(2.0 / bw, 1.35 / bh);
  const cols = Math.max(4, Math.round((bw * scale) / spacing));
  const rows = Math.max(4, Math.round((bh * scale) / spacing));
  const sm = document.createElement('canvas');
  sm.width = cols;
  sm.height = rows;
  const sg = sm.getContext('2d', { willReadFrequently: true });
  sg.imageSmoothingQuality = 'high';
  sg.drawImage(big, x0, y0, bw, bh, 0, 0, cols, rows);
  const data = sg.getImageData(0, 0, cols, rows).data;
  const cells = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (data[(y * cols + x) * 4 + 3] > 90) cells.push([x, y]);
  if (!cells.length) return voxelCube(n, 12);
  const layers = Math.max(2, Math.min(4, Math.round(n / cells.length)));
  const pts = [];
  for (const [x, y] of cells)
    for (let l = 0; l < layers; l++)
      pts.push([(x - (cols - 1) / 2) * spacing, -(y - (rows - 1) / 2) * spacing, (l - (layers - 1) / 2) * spacing]);
  return pad(pts, n);
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
  },
  light: {
    base: [0.32, 0.34, 0.39],
    envLow: [0.06, 0.065, 0.075],
    envHigh: [0.68, 0.7, 0.74],
    spec: [0.95, 0.95, 0.97],
    rim: [0.3, 0.33, 0.4],
    edge: [0.2, 0.21, 0.24],
    glow: [0.35, 0.45, 0.62],
  },
};

// ---------- shaders ----------

const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aA;
layout(location=3) in vec4 aB;
layout(location=4) in vec4 aSeed;
uniform mat4 uProj;
uniform mat3 uRot;
uniform float uCamZ, uMix, uTime, uSize, uScatter, uBand, uAspect, uPointerOn;
uniform vec2 uPointer;
out vec3 vN;
out vec3 vLocal;
out vec3 vWorld;
out float vGlow;

mat3 axisAngle(vec3 a, float t) {
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(
    c + a.x*a.x*k,      a.y*a.x*k + a.z*s, a.z*a.x*k - a.y*s,
    a.x*a.y*k - a.z*s,  c + a.y*a.y*k,     a.z*a.y*k + a.x*s,
    a.x*a.z*k + a.y*s,  a.y*a.z*k - a.x*s, c + a.z*a.z*k);
}

void main() {
  // built in a sweep from the bottom up, each cube a little out of step
  float delay = clamp((aB.y + 1.0) * 0.5, 0.0, 1.0) * 0.52 + aSeed.x * 0.16;
  float e = clamp((uMix - delay) / 0.32, 0.0, 1.0);
  e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
  float arc = sin(3.14159265 * e);
  vec3 dir = normalize(aSeed.yzw * 2.0 - 1.0 + vec3(1e-4));

  vec3 p = mix(aA.xyz, aB.xyz, e) + dir * arc * (0.3 + aSeed.x * 0.45);
  p += dir * 0.005 * sin(uTime * 1.6 + aSeed.y * 40.0);
  p += dir * uScatter * (0.7 + aSeed.x * 1.8);
  float s = mix(aA.w, aB.w, e) * (1.0 - 0.45 * arc) * (1.0 - 0.75 * uScatter);

  // whole turns only, so every cube lands square to the grid
  float spin = e * 6.2831853 * floor(1.0 + aSeed.z * 2.99) + uScatter * aSeed.w * 5.0;
  mat3 R = uRot * axisAngle(dir, spin);
  vec3 centre = uRot * p;

  // the pointer parts the shape around it
  vec4 c0 = uProj * vec4(centre - vec3(0.0, 0.0, uCamZ), 1.0);
  vec2 d = c0.xy / c0.w - uPointer;
  d.x *= uAspect;
  float near = uPointerOn * smoothstep(0.42, 0.0, length(d));
  vec2 away = normalize(d + vec2(1e-4));
  away.x /= uAspect;
  centre.xy += away * near * 0.32;
  centre.z += near * 0.25;

  vec3 world = centre + R * (aPos * s * uSize);
  vN = R * aNormal;
  vLocal = aPos;
  vWorld = world;
  float band = exp(-pow((p.y - uBand) / 0.07, 2.0)) * (1.0 - arc);
  vGlow = band * 0.55 + arc * 0.7 + near * 0.35;
  gl_Position = uProj * vec4(world - vec3(0.0, 0.0, uCamZ), 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vLocal;
in vec3 vWorld;
in float vGlow;
uniform vec3 uBase, uEnvLow, uEnvHigh, uSpec, uRim, uEdge, uGlow;
uniform float uCamZ;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vec3(0.0, 0.0, uCamZ) - vWorld);
  vec3 l1 = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 l2 = normalize(vec3(0.8, -0.25, 0.35));
  float d1 = max(dot(n, l1), 0.0);
  float d2 = max(dot(n, l2), 0.0);
  float sp = pow(max(dot(n, normalize(l1 + v)), 0.0), 56.0) + 0.35 * pow(max(dot(n, normalize(l2 + v)), 0.0), 24.0);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  // a studio sky reflected in each face: brushed steel, not plastic
  vec3 r = reflect(-v, n);
  vec3 env = mix(uEnvLow, uEnvHigh, smoothstep(-0.35, 0.75, r.y));
  vec3 col = uBase * (0.12 + 0.78 * d1 + 0.2 * d2) + env * 0.34 + uSpec * sp * 0.8 + uRim * fres * 0.35;
  // machined bevel: light catches where two faces meet
  vec3 a = abs(vLocal) * 2.0;
  float mid = a.x + a.y + a.z - max(a.x, max(a.y, a.z)) - min(a.x, min(a.y, a.z));
  col += uEdge * smoothstep(0.86, 0.96, mid) * (0.35 + 0.65 * d1);
  col += uGlow * vGlow;
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
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn('[nano forge]', err);
    return null;
  }
  gl.useProgram(prog);
  const U = {};
  for (const name of ['uProj', 'uRot', 'uCamZ', 'uMix', 'uTime', 'uSize', 'uScatter', 'uBand', 'uAspect', 'uPointerOn', 'uPointer', 'uBase', 'uEnvLow', 'uEnvHigh', 'uSpec', 'uRim', 'uEdge', 'uGlow'])
    U[name] = gl.getUniformLocation(prog, name);

  // ---- sizes: fewer cubes on small or low-power screens ----
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const g = small ? 15 : 22; // voxel cube edge
  const N = g * g * g - (g - 2) ** 3; // every cube in the hollow cube is used
  const spacing = (2 * 0.62) / (g - 1);
  const size = spacing * 0.86;

  const shapes = [
    { name: 'voxel cube', pts: voxelCube(N, g) },
    { name: 'torus knot', pts: pad(torusKnot(N), N) },
    { name: '</>', flat: true, pts: glyph(N, '</>', 800, 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', spacing) },
    { name: 'planet', pts: pad(planet(N), N) },
    { name: 'double helix', pts: pad(helix(N), N) },
    { name: 'AI', flat: true, pts: glyph(N, 'AI', 900, 'Inter, system-ui, -apple-system, Helvetica, Arial, sans-serif', spacing) },
  ];
  const start = { name: '', pts: cloud(N) };

  // ---- buffers ----
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const mesh = cubeMesh();
  const buf = (data, target = gl.ARRAY_BUFFER) => {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  };
  buf(mesh.P);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  buf(mesh.N);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  buf(mesh.I, gl.ELEMENT_ARRAY_BUFFER);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  buf(seeds);
  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(4, 1);
  const shapeBufs = shapes.map((s) => buf(settle(s.pts)));
  const startBuf = buf(settle(start.pts));
  for (const loc of [2, 3]) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribDivisor(loc, 1);
  }
  let boundA = null;
  let boundB = null;
  const bindPair = (a, b) => {
    if (a === boundA && b === boundB) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, a);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
    boundA = a;
    boundB = b;
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.uniform1f(U.uSize, size);

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
    gl.uniformMatrix4fv(U.uProj, false, perspective(fov, aspect, 0.5, 20));
    gl.uniform1f(U.uAspect, aspect);
  };
  resize();
  gl.uniform1f(U.uCamZ, CAM);

  let lookTheme = null;
  const applyLook = () => {
    const th = theme();
    if (th === lookTheme) return;
    lookTheme = th;
    const L = LOOK[th];
    gl.uniform3fv(U.uBase, L.base);
    gl.uniform3fv(U.uEnvLow, L.envLow);
    gl.uniform3fv(U.uEnvHigh, L.envHigh);
    gl.uniform3fv(U.uSpec, L.spec);
    gl.uniform3fv(U.uRim, L.rim);
    gl.uniform3fv(U.uEdge, L.edge);
    gl.uniform3fv(U.uGlow, L.glow);
  };

  // eased interaction state
  let lean = 0;
  let tilt = 0;
  let near = 0;
  let px = 0;
  let py = 0;
  let scatter = 0;
  let shown = -1;
  let yaw = 0.6;
  let face = 0; // 1 while a flat shape (text) turns to face the viewer

  const draw = ({ A, B, mix, t, yaw, pitch }) => {
    applyLook();
    bindPair(A, B);
    gl.uniformMatrix3fv(U.uRot, false, rotation(yaw, pitch, Math.sin(t * 0.13) * 0.06));
    gl.uniform1f(U.uMix, mix);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uScatter, scatter);
    gl.uniform1f(U.uBand, ((t * 0.38) % 2.6) * 1 - 1.3);
    gl.uniform2f(U.uPointer, px, py);
    gl.uniform1f(U.uPointerOn, near);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElementsInstanced(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0, N);
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
    const k = Math.floor(t / CYCLE);
    const phase = t - k * CYCLE;
    const target = k % shapes.length;
    const from = k === 0 ? startBuf : shapeBufs[(k - 1) % shapes.length];
    // name the shape once it's mostly built
    if (target !== shown && (phase > MORPH * 0.55 || k === 0)) {
      shown = target;
      onShape(target, shapes[target].name, shapes.length);
    }
    const ease = Math.min(1, dt * 3);
    const p = pointer();
    const inside = p.active && p.x > -W * 0.25 && p.x < W * 1.25 && p.y > -H * 0.25 && p.y < H * 1.25;
    lean += ((p.active ? (p.x / Math.max(1, W) - 0.5) * 0.9 : 0) - lean) * ease;
    tilt += ((p.active ? (p.y / Math.max(1, H) - 0.5) * 0.5 : 0) - tilt) * ease;
    near += ((inside ? 1 : 0) - near) * ease;
    if (p.active) {
      px = (p.x / Math.max(1, W)) * 2 - 1;
      py = 1 - (p.y / Math.max(1, H)) * 2;
    }
    // solids keep turning; text swings round to face you, then sways
    face += ((shapes[target].flat && phase > MORPH * 0.15 ? 1 : 0) - face) * Math.min(1, dt * 1.6);
    const facing = Math.round(yaw / TAU) * TAU + Math.sin(t * 0.55) * 0.42;
    yaw += dt * 0.32 * (1 - face) + (facing - yaw) * Math.min(1, dt * 2.2) * face;
    const sp = Math.min(1, Math.max(0, scroll()));
    scatter += (Math.min(1, Math.max(0, (sp - 0.08) / 0.7)) - scatter) * Math.min(1, dt * 8);
    draw({
      A: from,
      B: shapeBufs[target],
      mix: Math.min(1, phase / MORPH),
      t,
      yaw: yaw + lean + sp * 1.6,
      pitch: 0.38 - face * 0.24 + Math.sin(t * 0.21) * 0.08 + tilt,
    });
  }

  /** One finished shape, no motion (reduced motion). */
  function still(index = 1) {
    scatter = 0;
    near = 0;
    shown = index;
    onShape(index, shapes[index].name, shapes.length);
    draw({ A: shapeBufs[index], B: shapeBufs[index], mix: 1, t: 2, yaw: 0.7, pitch: 0.42 });
  }

  function destroy() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { step, still, resize, destroy, count: N };
}
