/**
 * Deto: the living liquid behind the home page (Moiz named it after the Pokémon that reshapes itself into anything).
 *
 * One body of liquid metal, floating in space: no cubes, no floor, no gravity. It takes each section's shape and
 * melts from one into the next, and when it moves it moves like a mass with inertia:
 *  - the body follows its target on a soft spring, so it accelerates, coasts and settles with a little give;
 *  - while it moves it stretches along its motion and narrows across it, keeping its volume, and when it stops it
 *    overshoots into a squash and wobbles out over two or three swings (a damped oscillator for that mode);
 *  - its tail is its own lag: a spine of points, each easing after the one in front, so the tail follows the path the
 *    body actually took, is longer the faster it goes, works in any direction, and is pulled back in once it stops.
 *    The tail starts at 75% of the body's width and thins to a fine tip;
 *  - its surface keeps a slow ripple, livelier while it changes shape or is pushed around.
 * Shapes are signed distance fields, so thin parts (helix strands, the Möbius band, the knot) hold their form: a real
 * liquid would pinch them into drops (Plateau-Rayleigh), so the shape is the "will" the liquid follows.
 *
 * Drawn by raymarching one full-screen triangle; pixels far from the body are discarded before any marching.
 * The interface matches the page mode of the nano forge: drive(t, dt, { a, b, m, view }), shapeIndex, resize, destroy.
 */

const SPINE = 14;

const VS = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uP;        // the body's centre, device px (GL: origin bottom left)
uniform float uR;       // device px per body unit
uniform float uTime, uAmp;
uniform int uA, uB;     // shapes being morphed between (equal while one stands)
uniform float uFormB; // how far shape A has turned straight into shape B (0 all A, 1 all B)
uniform vec2 uDir;      // the direction of motion (screen axes, y up)
uniform float uStretch; // along-motion stretch: 0 round, > 0 drawn out, < 0 squashed
uniform vec2 uSpine[${SPINE}]; // the tail's spine, body units, relative to the centre
uniform float uTail;    // 0 no tail .. 1 full
uniform mat3 uRot;      // the shape's slow turn
uniform vec3 uBase, uEnvLow, uEnvHigh, uSpec, uRim;
out vec4 o;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float box2(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
const float PI = 3.14159265;

// ---- the shapes, about a unit in size ----
// the first shape: a plain, still sphere (no ripple, no wobble)
float sludge(vec3 p) {
  return length(p) - 0.66;
}
float cube(vec3 p) {
  vec3 q = abs(p) - vec3(0.5);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.13;
}
vec3 knotAt(float t) {
  float c = 0.62 + 0.27 * cos(3.0 * t);
  return vec3(c * cos(2.0 * t), 0.27 * sin(3.0 * t), c * sin(2.0 * t));
}
float knot(vec3 p) {
  // the (2,3) torus knot passes each angle round the axis twice: check both, and a step either side of each
  float ph = atan(p.z, p.x);
  float d = 1e9;
  for (int k = 0; k < 2; k++) {
    float t = (ph + 2.0 * PI * float(k)) * 0.5;
    for (int j = -1; j <= 1; j++) d = min(d, length(p - knotAt(t + float(j) * 0.07)));
  }
  return d - 0.12;
}
float mobius(vec3 p) {
  float ph = atan(p.z, p.x);
  vec2 w = vec2(length(p.xz) - 0.62, p.y);
  float c = cos(ph * 0.5);
  float s = sin(ph * 0.5);
  w = vec2(c * w.x + s * w.y, -s * w.x + c * w.y);
  return box2(w, vec2(0.13, 0.035), 0.03);
}
float hash1(float n) {
  return fract(sin(n * 127.1 + 311.7) * 43758.5453);
}
// one belt of debris round the planet: rocks of every size in cells round the ring, each a little off the line,
// tumbled its own way, a few cells left empty, the whole belt orbiting at its own speed
float belt(vec3 q, float R, float N, float speed, float seed) {
  float rr = length(q.xz);
  // far from the belt: a cheap bound (the rocks all lie inside this flat band)
  float bound = max(abs(rr - R) - 0.16, abs(q.y) - 0.13);
  if (bound > 0.08) return bound;
  float sa = uTime * speed;
  float cs = cos(sa);
  float sn = sin(sa);
  vec3 o = vec3(cs * q.x - sn * q.z, q.y, sn * q.x + cs * q.z);
  float cell = 2.0 * PI / N;
  float id0 = floor(atan(o.z, o.x) / cell);
  float d = 1e9;
  for (int k = -1; k <= 1; k++) {
    float id = mod(id0 + float(k), N);
    float h = seed + id * 7.13;
    if (hash1(h + 0.9) < 0.18) continue;
    float a = (id + 0.5 + (hash1(h) - 0.5) * 0.5) * cell;
    float r = R + (hash1(h + 0.1) - 0.5) * 0.06;
    vec3 c = vec3(cos(a) * r, (hash1(h + 0.2) - 0.5) * 0.08, sin(a) * r);
    float size = 0.014 + 0.026 * pow(hash1(h + 0.3), 1.8);
    vec3 lp = o - c;
    float t1 = hash1(h + 0.4) * 6.283 + uTime * (hash1(h + 0.5) - 0.5) * 1.4;
    float t2 = hash1(h + 0.6) * 6.283;
    lp.xy = mat2(cos(t1), sin(t1), -sin(t1), cos(t1)) * lp.xy;
    lp.yz = mat2(cos(t2), sin(t2), -sin(t2), cos(t2)) * lp.yz;
    vec3 ext = size * vec3(1.0, 0.5 + 0.6 * hash1(h + 0.7), 0.6 + 0.5 * hash1(h + 0.8));
    // every piece its own kind: a smooth pebble, a lumpy rock or a sharp shard (scaled per axis, so the distance is
    // shrunk by the smallest axis to stay safe for the march)
    float kind = hash1(h + 1.1);
    vec3 sp = lp / ext;
    float sm = min(ext.x, min(ext.y, ext.z));
    float rock;
    if (kind < 0.38) rock = (length(sp) - 1.0) * sm;
    else if (kind < 0.76) {
      rock = length(sp) - 0.8;
      rock = smin(rock, length(sp - vec3(0.55, 0.35, -0.2)) - 0.55, 0.3);
      rock = smin(rock, length(sp - vec3(-0.45, -0.3, 0.35)) - 0.5, 0.3);
      rock *= sm;
    } else rock = ((dot(abs(sp), vec3(1.0)) - 1.15) * 0.577 - 0.06) * sm;
    d = min(d, rock);
  }
  return d;
}
float planet(vec3 p) {
  float globe = length(p) - 0.5;
  float ct = cos(0.42);
  float st = sin(0.42);
  vec3 q = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
  // three rings of debris instead of one solid ring: the inner ones orbit faster
  float debris = min(belt(q, 0.75, 44.0, 0.46, 3.0), min(belt(q, 0.89, 54.0, 0.33, 17.0), belt(q, 1.03, 64.0, 0.24, 31.0)));
  return min(globe, debris);
}
const float HK = 3.0 * PI / 1.64; // the strands' turn per unit of height
// the distance to one strand: the nearest point found by a few Newton steps along the strand's height
float strand(vec3 p, float side) {
  float y = clamp(p.y, -0.82, 0.82);
  for (int i = 0; i < 4; i++) {
    float c = cos(HK * y);
    float s = sin(HK * y);
    vec3 q = vec3(side * 0.42 * c, y, side * 0.42 * s) - p;
    vec3 d1 = vec3(-side * 0.42 * HK * s, 1.0, side * 0.42 * HK * c);
    vec3 d2 = vec3(-side * 0.42 * HK * HK * c, 0.0, -side * 0.42 * HK * HK * s);
    float g = dot(q, d1);
    float h = dot(d1, d1) + dot(q, d2);
    y = clamp(y - g / max(h, 0.2), -0.82, 0.82);
  }
  return length(p - vec3(side * 0.42 * cos(HK * y), y, side * 0.42 * sin(HK * y)));
}
float helix(vec3 p) {
  float strands = min(strand(p, 1.0), strand(p, -1.0));
  strands -= 0.085;
  // the nearest rung, flaring into the strands
  float step_ = 1.5 / 8.0;
  float ry = clamp(floor((p.y + 0.75) / step_ + 0.5), 0.0, 8.0) * step_ - 0.75;
  float ra = ry * HK;
  vec3 r1 = vec3(0.42 * cos(ra), ry, 0.42 * sin(ra));
  vec3 ba = vec3(-2.0 * r1.x, 0.0, -2.0 * r1.z);
  vec3 pa = p - r1;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float rung = length(pa - ba * h) - 0.035;
  return smin(strands, rung, 0.06);
}
float shapeOf(int i, vec3 p) {
  if (i == 0) return sludge(p);
  if (i == 1) return cube(p);
  if (i == 2) return knot(p);
  if (i == 3) return mobius(p);
  if (i == 4) return planet(p);
  return helix(p);
}

// ---- the whole body ----
float body(vec3 p) {
  // volume-keeping stretch along the motion (and squash when negative)
  vec3 d = vec3(uDir, 0.0);
  float a = 1.0 + uStretch;
  float b = inversesqrt(a);
  float pd = dot(p, d);
  vec3 q = (pd / a) * d + (p - pd * d) / b;
  q = uRot * q;
  // one shape turns straight into the next (no round liquid in between)
  float s = shapeOf(uA, q);
  if (uFormB > 0.001) s = mix(s, shapeOf(uB, q), uFormB);
  // a ripple across the surface, livelier while it is changing or being pushed
  vec3 n = normalize(q + 1e-5);
  s -= uAmp * (0.6 * sin(n.x * 5.0 + uTime * 1.9) * sin(n.y * 4.0 - uTime * 1.4) + 0.4 * sin(n.z * 7.0 + n.x * 3.0 + uTime * 2.6));
  return s * min(a, b);
}
float tail(vec3 p) {
  float d = 1e9;
  for (int i = 0; i < ${SPINE - 1}; i++) {
    float f0 = float(i) / ${(SPINE - 1).toFixed(1)};
    float f1 = float(i + 1) / ${(SPINE - 1).toFixed(1)};
    float r0 = uTail * (0.555 * pow(1.0 - f0, 0.85) + 0.012);
    float r1 = uTail * (0.555 * pow(1.0 - f1, 0.85) + 0.012);
    vec3 a = vec3(uSpine[i], 0.0);
    vec3 ba = vec3(uSpine[i + 1], 0.0) - a;
    vec3 pa = p - a;
    float h = clamp(dot(pa, ba) / max(1e-6, dot(ba, ba)), 0.0, 1.0);
    d = min(d, length(pa - ba * h) - mix(r0, r1, h));
  }
  return d;
}
float field(vec3 p) {
  float s = body(p);
  if (uTail > 0.01) s = smin(s, tail(p), 0.22);
  return s;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0025, 0.0);
  return normalize(vec3(field(p + e.xyy) - field(p - e.xyy), field(p + e.yxy) - field(p - e.yxy), field(p + e.yyx) - field(p - e.yyx)));
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
  // wet: a tight bright glint and a soft sheen
  col += uSpec * (pow(max(dot(r, l1), 0.0), 120.0) * 0.7 + pow(max(dot(r, l1), 0.0), 18.0) * 0.08);
  return col;
}
void main() {
  vec2 q = (gl_FragCoord.xy - uP) / uR;
  // nothing to march far from the body and its tail
  float reach = length(q) - 1.25 * (1.0 + max(uStretch, 0.0)) - 0.1;
  if (uTail > 0.01) {
    for (int i = 0; i < ${SPINE - 1}; i++) {
      vec2 a = uSpine[i];
      vec2 ba = uSpine[i + 1] - a;
      vec2 pa = q - a;
      float h = clamp(dot(pa, ba) / max(1e-6, dot(ba, ba)), 0.0, 1.0);
      reach = min(reach, length(pa - ba * h) - 0.75);
    }
  }
  if (reach > 0.0) discard;
  vec3 ro = vec3(q, 2.4);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float t = 0.0;
  float best = 1e9;
  float tb = 0.0;
  bool hit = false;
  for (int i = 0; i < 80; i++) {
    float d = field(ro + rd * t);
    if (d < best) {
      best = d;
      tb = t;
    }
    if (d < 0.0015) {
      hit = true;
      break;
    }
    t += d * 0.75;
    if (t > 4.8) break;
  }
  float px = 1.0 / uR;
  if (!hit) {
    // a soft silhouette instead of jaggies
    float a = 1.0 - smoothstep(0.0, px * 1.6, best);
    if (a <= 0.0) discard;
    o = vec4(shade(normalAt(ro + rd * tb), -rd) * a, a);
    return;
  }
  o = vec4(shade(normalAt(ro + rd * t), -rd), 1.0);
}`;

const LOOK = {
  dark: { base: [0.66, 0.67, 0.69], envLow: [0.1, 0.1, 0.11], envHigh: [0.92, 0.93, 0.95], spec: [1, 1, 1], rim: [0.7, 0.72, 0.75] },
  light: { base: [0.09, 0.095, 0.1], envLow: [0.01, 0.01, 0.012], envHigh: [0.42, 0.43, 0.45], spec: [0.85, 0.85, 0.87], rim: [0.22, 0.23, 0.25] },
};

const NAMES = ['toxic sludge', 'cube', 'torus knot', 'möbius loop', 'planet', 'double helix'];
const PLANET = NAMES.indexOf('planet');
const HELIX = NAMES.indexOf('double helix');

const ss = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

function rotation(yaw, pitch) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  // turn about y by yaw, then tip about x by pitch (column-major, as GLSL reads it)
  return new Float32Array([cy, sp * sy, -cp * sy, 0, cp, sp, sy, -sp * cy, cp * cy]);
}

export function createDeto(canvas, { theme, gentle = false } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  const locs = {};
  const u = (n) => (n in locs ? locs[n] : (locs[n] = gl.getUniformLocation(prog, n)));
  const vao = gl.createVertexArray();
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // ---- resolution: the liquid is smooth, so it doesn't need the full pixel density ----
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  let dprCap = small ? 1 : 1.25;
  let dpr = 1;
  let W = 0;
  let H = 0;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  let lookTheme = null;
  const applyLook = () => {
    const th = theme ? theme() : 'dark';
    if (th === lookTheme) return;
    lookTheme = th;
    const L = LOOK[th];
    gl.uniform3fv(u('uBase'), L.base);
    gl.uniform3fv(u('uEnvLow'), L.envLow);
    gl.uniform3fv(u('uEnvHigh'), L.envHigh);
    gl.uniform3fv(u('uSpec'), L.spec);
    gl.uniform3fv(u('uRim'), L.rim);
  };

  // ---- the body's physics, in CSS px and seconds ----
  let body = null; // { x, y, vx, vy, r, vr }
  let stretch = 0; // the along-motion mode: > 0 drawn out, < 0 squashed
  let dirX = 1;
  let dirY = 0;
  let agitation = 0;
  let lastM = 1;
  const spine = Array.from({ length: SPINE }, () => [0, 0]);
  const spineU = new Float32Array(SPINE * 2);
  let yaw = 0.6;
  let spin = 1;
  let pitch = 0.5;

  // frame-time watchdog: a phone that can't keep up drops to a lower resolution once
  let slow = 0;
  let checkedAt = 0;
  let checked = false;

  function drive(time, dtRaw, { a, b, m, view, snap }) {
    const ts = gentle ? 0.5 : 1;
    const dt = Math.min(0.05, Math.max(0, dtRaw)) * ts;
    const t = time * ts;
    if (!checked) {
      if (dtRaw > 0.034) slow += dtRaw;
      checkedAt += dtRaw;
      if (checkedAt > 4) {
        checked = true;
        if (slow > 1.4 && dprCap > 0.75) {
          dprCap = 0.75;
          resize();
        }
      }
    }
    applyLook();
    if (!view) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    const moving = a !== b && m < 1;
    const tr = view.size * 0.38;
    // a jump to a new place (the hero scrolled away and Contact came in): start there, nothing flies across
    if (snap) body = null;
    if (!body) {
      body = { x: view.x, y: view.y, vx: 0, vy: 0, r: tr, vr: 0 };
      for (const s of spine) {
        s[0] = view.x;
        s[1] = view.y;
      }
    }
    // it stays exactly where it is put, at full size from the first frame (no drop-in, no grow, no jiggle)
    body.x = view.x;
    body.y = view.y;
    body.vx = 0;
    body.vy = 0;
    body.r = tr;
    const ax = 0;
    const ay = 0;
    const R = Math.max(1, body.r);
    // in body units per second
    const speed = Math.hypot(body.vx, body.vy) / R;
    if (speed > 0.08) {
      // the stretch runs along an axis, not an arrow: a stretch along -d is the same as along d. So the axis
      // only ever turns the short way. Turning it the long way (when the body swings back past its place on
      // arriving) took it through zero, where it snapped round sideways: the sudden flip of the liquid.
      let tx = body.vx / (speed * R);
      let ty = -body.vy / (speed * R);
      if (tx * dirX + ty * dirY < 0) {
        tx = -tx;
        ty = -ty;
      }
      const f = 1 - Math.exp(-dt * 9);
      dirX += (tx - dirX) * f;
      dirY += (ty - dirY) * f;
      const l = Math.hypot(dirX, dirY) || 1;
      dirX /= l;
      dirY /= l;
    }
    // the stretch mode: pulled towards a stretch that grows with speed, on a lightly damped spring, so it draws out as
    // the body speeds up and swings back through a squash, two or three times, when it stops
    // no stretch or squash wobble (Moiz, 2026-11-20: no jiggle)
    stretch = 0;
    // the tail: each point of the spine eases after the one in front, so it lies along the way the body came
    const pull = 1 - Math.exp(-dt / 0.045);
    spine[0][0] = body.x;
    spine[0][1] = body.y;
    for (let i = 1; i < SPINE; i++) {
      spine[i][0] += (spine[i - 1][0] - spine[i][0]) * pull;
      spine[i][1] += (spine[i - 1][1] - spine[i][1]) * pull;
    }
    for (let i = 0; i < SPINE; i++) {
      spineU[i * 2] = (spine[i][0] - body.x) / R;
      spineU[i * 2 + 1] = -(spine[i][1] - body.y) / R;
    }
    const tailLen = Math.hypot(spineU[(SPINE - 1) * 2], spineU[(SPINE - 1) * 2 + 1]);
    // the tail shows only while it is drawn out (gathered up it would sit inside a standing shape)
    const tailAmt = ss(0.15, 0.9, tailLen);
    // the shape: A turns straight into B, easing in and out
    const formB = moving ? ss(0, 1, m) : 0;
    // the surface is livelier while it is changing shape or being pushed about
    const changing = moving ? Math.min(1, Math.abs(m - lastM) / Math.max(1e-4, dt) * 0.6) : 0;
    lastM = m;
    const push = Math.min(1, Math.hypot(ax, ay) / R / 40);
    agitation += (Math.max(changing, push, moving ? 0.35 : 0) - agitation) * (1 - Math.exp(-dt * 3));
    // its slow turn, per shape: the planet holds still (only its debris orbits), the double helix stands straight
    // upright (turning only about its own axis); the change eases in, never snaps
    const shown = moving && m < 0.5 ? a : b;
    const settle = snap ? 1 : 1 - Math.exp(-dt * 2);
    spin += ((shown === PLANET ? 0 : 1) - spin) * settle;
    pitch += ((shown === HELIX ? 0 : 0.5 + Math.sin(t * 0.13) * 0.08) - pitch) * settle;
    yaw += dt * 0.08 * spin;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(u('uP'), body.x * dpr, (H - body.y) * dpr);
    gl.uniform1f(u('uR'), R * dpr);
    gl.uniform1f(u('uTime'), t);
    // no jiggle: the surface stays still (Moiz, 2026-11-20)
    gl.uniform1f(u('uAmp'), 0);
    gl.uniform1i(u('uA'), Math.max(0, a));
    gl.uniform1i(u('uB'), Math.max(0, b));
    gl.uniform1f(u('uFormB'), formB);
    gl.uniform2f(u('uDir'), dirX, dirY);
    gl.uniform1f(u('uStretch'), stretch);
    gl.uniform2fv(u('uSpine[0]'), spineU);
    gl.uniform1f(u('uTail'), tailAmt);
    gl.uniformMatrix3fv(u('uRot'), false, rotation(yaw, pitch));
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const shapeIndex = (name) => NAMES.indexOf(name);
  const destroy = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { drive, shapeIndex, resize, destroy };
}
