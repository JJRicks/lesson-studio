/* Lessons 25–27: the live explorers. Shares a closure with engine/js/shell.js and plot3d.js. */
const { sin, cos, sqrt, hypot, abs, floor, min, max, ceil } = Math, PI = Math.PI, TAU = 2 * PI;
const mix = (a, b, t) => a + (b - a) * t;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const centroid = ps => ps.reduce((s, p) => [s[0] + p[0] / ps.length, s[1] + p[1] / ps.length, s[2] + p[2] / ps.length], [0, 0, 0]);
const quadNormal = p => cross(sub(p[2], p[0]), sub(p[3], p[1]));
const rad = a => fx(a, 2) + " rad";
const MONO = `"JetBrains Mono", ui-monospace, monospace`;

/* a parametric surface, cut into small faces the painter can sort */
function meshGroups(fn, U, V, o) {
  const [u0, u1, nu] = U, [v0, v1, nv] = V, out = [], at = (i, j) => fn(u0 + (u1 - u0) * i / nu, v0 + (v1 - v0) * j / nv);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const p = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], m = centroid(p);
    out.push({ at: m, faces: [{ p, n: quadNormal(p), two: true, col: typeof o.col === "function" ? o.col(m) : o.col, a: o.a ?? 1, st: o.st, sa: o.sa ?? .3, lw: o.lw ?? .5 }] });
  }
  return out;
}

/* a brick bent by any map (u, v, w in 0..1 to a point): six outward-facing sides in one group */
function curvedBrick(fn, N, o) {
  const [nu, nv, nw] = N, mid = fn(.5, .5, .5), faces = [];
  const side = (g, n1, n2) => {
    for (let i = 0; i < n1; i++) for (let j = 0; j < n2; j++) {
      const p = [g(i / n1, j / n2), g((i + 1) / n1, j / n2), g((i + 1) / n1, (j + 1) / n2), g(i / n1, (j + 1) / n2)];
      let n = quadNormal(p);
      if (dot3(n, sub(centroid(p), mid)) < 0) n = n.map(c => -c);
      faces.push({ p, n, col: o.col, a: o.a ?? 1, st: o.st, sa: o.sa ?? .6, lw: o.lw ?? .6 });
    }
  };
  side((a, b) => fn(0, a, b), nv, nw); side((a, b) => fn(1, a, b), nv, nw);
  side((a, b) => fn(a, 0, b), nu, nw); side((a, b) => fn(a, 1, b), nu, nw);
  side((a, b) => fn(a, b, 0), nu, nv); side((a, b) => fn(a, b, 1), nu, nv);
  return { at: mid, faces };
}
const polarBrick = (r0, r1, t0, t1, z0, z1, col, T) => curvedBrick((u, v, w) => { const r = mix(r0, r1, u), t = mix(t0, t1, v); return [r * cos(t), r * sin(t), mix(z0, z1, w)]; }, [1, max(1, ceil((t1 - t0) / .22)), 1], { col, st: T.plot });
const brick = (x0, x1, y0, y1, z0, z1, col, T) => curvedBrick((u, v, w) => [mix(x0, x1, u), mix(y0, y1, v), mix(z0, z1, w)], [1, 1, 1], { col, st: T.plot });

/* axes for scenes with frame:false. segs: [[from, to, "label"], ...] */
const axes3 = (T, segs) => ({
  lines: segs.map(([a, b]) => ({ p: [a, b], col: T.ink, a: .55, w: 1.2 })),
  text: segs.filter(s => s[2]).map(([, b, s]) => ({ p: b, s, col: T.ink, dy: -5 }))
});
const arc3 = (fn, a, b, n = 40) => Array.from({ length: n + 1 }, (_, i) => fn(mix(a, b, i / n)));
const floorDisk = (R, col, a, z = 0) => ({ at: [0, 0, -50], faces: [{ p: arc3(t => [R * cos(t), R * sin(t), z], 0, TAU, 64), col, a }] });

/* a 2D canvas that repaints on theme change and resize */
function panel2D(cv, paint) {
  let T = tokens(TOK);
  const draw = () => { const { c, W, H } = canvas2d(cv); c.clearRect(0, 0, W, H); c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H); paint(c, W, H, T); };
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  return draw;
}
function polarGrid(c, X, Y, s, T, rs) {
  c.strokeStyle = rgbS(T.grid); c.lineWidth = 1;
  rs.forEach(r => { c.beginPath(); c.arc(X(0), Y(0), r * s, 0, TAU); c.stroke(); });
  c.strokeStyle = rgbS(T.muted, .55);
  c.beginPath(); c.moveTo(X(-rs[rs.length - 1] - .3), Y(0)); c.lineTo(X(rs[rs.length - 1] + .3), Y(0)); c.moveTo(X(0), Y(-rs[rs.length - 1] - .3)); c.lineTo(X(0), Y(rs[rs.length - 1] + .3)); c.stroke();
  c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "center";
  rs.forEach(r => c.fillText(r, X(r), Y(0) + 13));
}
const onSlide = (el, fn) => el.addEventListener("input", fn);

/* ---------- hero: one ball, three ways to chop it ---------- */
(function hero() {
  const seq = [2, 3, 4, 6, 8], order = ["cube", "cyl", "sph"], EXACT = 4 * PI / 3;
  const LAT = {
    cube(n) { const h = 1 / n; return { dims: [2 * n, 2 * n, 2 * n], wrap: false, corner: (i, j, k) => [-1 + i * h, -1 + j * h, -1 + k * h], dV: () => h * h * h, inside: m => dot3(m, m) <= 1 }; },
    cyl(n) {
      const dr = 1 / n, dt = TAU / (4 * n), dz = 1 / n;
      return { dims: [n, 4 * n, 2 * n], wrap: true, corner: (i, j, k) => { const r = i * dr, t = j * dt; return [r * cos(t), r * sin(t), -1 + k * dz]; }, dV: i => (i + .5) * dr * dr * dt * dz, inside: m => dot3(m, m) <= 1 };
    },
    sph(n) {
      const dp = 1 / n, dt = TAU / (4 * n), df = PI / (2 * n);
      return { dims: [n, 4 * n, 2 * n], wrap: true, corner: (i, j, k) => { const p = i * dp, t = j * dt, f = k * df; return [p * sin(f) * cos(t), p * sin(f) * sin(t), p * cos(f)]; }, dV: (i, j, k) => ((i + .5) * dp) ** 2 * sin((k + .5) * df) * dp * dt * df, inside: () => true };
    }
  };
  function chop(kind, n, T) {
    const L = LAT[kind](n), [A, B, C] = L.dims, id = (i, j, k) => i + A * (j + B * k), keep = new Set(), cells = [];
    let sum = 0, count = 0;
    for (let k = 0; k < C; k++) for (let j = 0; j < B; j++) for (let i = 0; i < A; i++) {
      const m = L.corner(i + .5, j + .5, k + .5);
      if (!L.inside(m)) continue;
      sum += L.dV(i, j, k); count++;
      if (m[0] > 0 && m[1] < 0 && m[2] > 0) continue;   // the corner cut away so you can see inside
      keep.add(id(i, j, k)); cells.push([i, j, k, m]);
    }
    const has = (i, j, k) => {
      if (L.wrap) j = (j + B) % B;
      return i >= 0 && i < A && j >= 0 && j < B && k >= 0 && k < C && keep.has(id(i, j, k));
    };
    const groups = [];
    for (const [i, j, k, m] of cells) {
      const c = (a, b, d) => L.corner(i + a, j + b, k + d), faces = [], col = ramp(T, .04 + .96 * hypot(m[0], m[1], m[2]));
      const add = (p, there) => {
        if (there) return;
        let nv = quadNormal(p);
        if (dot3(nv, sub(centroid(p), m)) < 0) nv = nv.map(q => -q);
        faces.push({ p, n: nv, col, st: T.plot, sa: .55, lw: .6 });
      };
      add([c(0, 0, 0), c(0, 1, 0), c(0, 1, 1), c(0, 0, 1)], has(i - 1, j, k));
      add([c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)], has(i + 1, j, k));
      add([c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)], has(i, j - 1, k));
      add([c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)], has(i, j + 1, k));
      add([c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0)], has(i, j, k - 1));
      add([c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)], has(i, j, k + 1));
      if (faces.length) groups.push({ at: m, faces });
    }
    return { groups, sum, count };
  }
  const box = $("#heroSeg"), btn = $("#heroPlay");
  let kind = "cube", lev = 2, timer = 0, playing = !reduce, clock = 0;
  const reads = R => { $("#hN").textContent = R.count.toLocaleString("en-US"); $("#hSum").textContent = fx(R.sum, 3); $("#hErr").textContent = fx(abs(R.sum - EXACT), 3); };
  const p = new Plot3D($("#heroCv"), {
    pitch: .5, spin: 0,
    build(T) { const R = chop(kind, seq[lev], T); reads(R); return { bounds: { a: -.85, b: .85, c: -.85, d: .85, zlo: -.85, zhi: .85, iso: true }, frame: false, groups: R.groups }; },
    tick(dt) {
      clock += dt;
      if (!p.drag && performance.now() > p.hold) p.yaw += .12 * cos(clock * .35) * dt;
      if (!playing) return;
      timer += dt;
      if (timer > (lev === seq.length - 1 ? 3 : 1.5)) {
        timer = 0;
        if (lev === seq.length - 1) { lev = 0; kind = order[(order.indexOf(kind) + 1) % 3]; $$("button", box).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === kind))); }
        else lev++;
        p.rebuild();
      }
    }
  });
  p.rebuild();
  seg("#heroSeg", k => { kind = k; lev = reduce ? 3 : 0; timer = 0; p.rebuild(); });
  if (reduce) btn.hidden = true;
  btn.addEventListener("click", () => { playing = !playing; btn.textContent = playing ? "Pause" : "Play"; btn.setAttribute("aria-pressed", String(playing)); });
})();

/* ---------- one cell, two views ---------- */
(function cell() {
  const R0 = .5, DR = .5, DT = PI / 8, RINGS = 6, WEDGES = 8, iS = $("#cellI"), jS = $("#cellJ");
  let ci = +iS.value, cj = +jS.value;
  const edges = () => ({ r0: R0 + (ci - 1) * DR, r1: R0 + ci * DR, t0: (cj - 1) * DT, t1: cj * DT });
  const map = panel2D($("#cellMap"), (c, W, H, T) => {
    const L = 34, B = 26, TP = 10, RT = 14, gw = (W - L - RT) / RINGS, gh = (H - B - TP) / WEDGES, X = i => L + i * gw, Y = j => H - B - j * gh;
    c.strokeStyle = rgbS(T.accent, .45); c.lineWidth = 1;
    for (let i = 0; i <= RINGS; i++) { c.beginPath(); c.moveTo(X(i), Y(0)); c.lineTo(X(i), Y(WEDGES)); c.stroke(); }
    for (let j = 0; j <= WEDGES; j++) { c.beginPath(); c.moveTo(X(0), Y(j)); c.lineTo(X(RINGS), Y(j)); c.stroke(); }
    c.fillStyle = rgbS(T.glow, .9); c.fillRect(X(ci - 1), Y(cj), gw, gh);
    c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "center";
    for (let i = 0; i <= RINGS; i += 2) c.fillText((R0 + i * DR).toFixed(1), X(i), H - 11);
    c.fillStyle = rgbS(T.ink); c.font = `600 12px ${MONO}`; c.fillText("r", X(RINGS / 2) + 34, H - 11);
    c.textAlign = "right"; c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted);
    c.fillText("0", L - 6, Y(0) + 4); c.fillText("π", L - 6, Y(WEDGES) + 9);
    c.fillStyle = rgbS(T.ink); c.font = `600 12px ${MONO}`; c.fillText("θ", L - 8, Y(WEDGES / 2));
  });
  const xy = panel2D($("#cellXY"), (c, W, H, T) => {
    const s = min((W - 28) / 7, (H - 34) / 3.5), cx = W / 2, cy = H - 22, e = edges();
    c.strokeStyle = rgbS(T.accent, .45); c.lineWidth = 1;
    for (let i = 0; i <= RINGS; i++) { c.beginPath(); c.arc(cx, cy, (R0 + i * DR) * s, -PI, 0); c.stroke(); }
    for (let j = 0; j <= WEDGES; j++) { const t = j * DT; c.beginPath(); c.moveTo(cx + R0 * s * cos(t), cy - R0 * s * sin(t)); c.lineTo(cx + 3.5 * s * cos(t), cy - 3.5 * s * sin(t)); c.stroke(); }
    c.beginPath(); c.arc(cx, cy, e.r1 * s, -e.t0, -e.t1, true); c.arc(cx, cy, e.r0 * s, -e.t1, -e.t0, false); c.closePath(); c.fillStyle = rgbS(T.glow, .9); c.fill();
    c.fillStyle = rgbS(T.ink); c.font = `600 12px ${MONO}`; c.textAlign = "center"; c.fillText("x", cx + 3.5 * s + 6, cy + 14); c.fillText("y", cx - 11, cy - 3.5 * s + 6);
    c.fillStyle = rgbS(T.muted); c.beginPath(); c.arc(cx, cy, 2.5, 0, TAU); c.fill();
  });
  const paint = () => { map(); xy(); };
  function reads() {
    const I = +iS.value, J = +jS.value, rs = R0 + (I - .5) * DR, mapA = DR * DT;
    $("#cellIOut").textContent = `${I} of ${RINGS}`; $("#cellJOut").textContent = `${J} of ${WEDGES}`;
    $("#cellR").textContent = fx(rs, 2); $("#cellMapA").textContent = fx(mapA, 3); $("#cellA").textContent = fx(rs * mapA, 3); $("#cellRatio").textContent = fx(rs, 2);
    $("#cellStatus").textContent = `Δr = 0.50 · Δθ = ${fx(DT, 3)}`;
  }
  const update = () => { reads(); if (reduce) { ci = +iS.value; cj = +jS.value; } paint(); };
  onSlide(iS, update); onSlide(jS, update);
  whenVisible($("#cellXY"), dt => {
    const a = min(1, dt * 14), I = +iS.value, J = +jS.value;
    if (abs(ci - I) + abs(cj - J) < .002) { if (ci !== I || cj !== J) { ci = I; cj = J; paint(); } return; }
    ci += (I - ci) * a; cj += (J - cj) * a; paint();
  });
  reads(); paint();
})();

/* ---------- polar boxes ---------- */
(function polarBoxes() {
  const f = r => 5 - r * r, RMAX = 2, TH = 3 * PI / 2, mS = $("#pbM"), nS = $("#pbN");
  const p = new Plot3D($("#pbCv"), {
    pitch: .6, spin: .1,
    build(T) {
      const m = +mS.value, n = +nS.value, dr = RMAX / m, dt = TH / n, groups = [];
      let withR = 0, without = 0;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const rs = (i + .5) * dr, h = f(rs);
        withR += h * rs * dr * dt; without += h * dr * dt;
        groups.push(polarBrick(i * dr, (i + 1) * dr, j * dt, (j + 1) * dt, 0, h, ramp(T, h / 5), T));
      }
      $("#pbMOut").textContent = m; $("#pbNOut").textContent = n; $("#pbCount").textContent = m * n; $("#pbWith").textContent = fx(withR, 3); $("#pbWithout").textContent = fx(without, 3);
      const ax = axes3(T, [[[0, 0, 0], [2.6, 0, 0], "x"], [[0, 0, 0], [0, -2.6, 0]], [[0, 2, 0], [0, 2.6, 0], "y"], [[0, 0, 5], [0, 0, 5.7], "z"]]);
      groups.unshift(floorDisk(RMAX, T.accent, .12));
      return { bounds: { a: -2.05, b: 2.05, c: -2.05, d: 2.05, zlo: 0, zhi: 5.2 }, frame: false, groups, ...ax };
    }
  });
  p.rebuild();
  [mS, nS].forEach(s => onSlide(s, () => p.rebuild()));
})();

/* ---------- beam explorer ---------- */
(function beam() {
  const R = {
    bean: { t0: 0, t1: TAU, h1: () => 0, h2: t => 2 + cos(t), tex: "\\int_{0}^{2\\pi}\\!\\!\\int_{0}^{2+\\cos\\theta} f\\,r\\,dr\\,d\\theta" },
    circle: { t0: -PI / 2, t1: PI / 2, h1: () => 0, h2: t => 3 * cos(t), tex: "\\int_{-\\pi/2}^{\\pi/2}\\!\\!\\int_{0}^{3\\cos\\theta} f\\,r\\,dr\\,d\\theta" },
    ring: { t0: 0, t1: TAU, h1: () => 1, h2: t => 2.4 + .4 * cos(5 * t), tex: "\\int_{0}^{2\\pi}\\!\\!\\int_{1}^{2.4+0.4\\cos 5\\theta} f\\,r\\,dr\\,d\\theta" },
    petal: { t0: 0, t1: PI / 2, h1: () => 0, h2: t => 3 * sin(2 * t), tex: "\\int_{0}^{\\pi/2}\\!\\!\\int_{0}^{3\\sin 2\\theta} f\\,r\\,dr\\,d\\theta" }
  };
  const S = $("#rayT"), setup = $("#raySetup");
  let key = "bean", touched = false;
  setup.innerHTML = `<div id="rayTex"></div><p class="note" id="rayNote"></p>`;
  const angle = () => { const q = R[key]; return mix(q.t0, q.t1, +S.value / 1000); };
  const draw = panel2D($("#rayCv"), (c, W, H, T) => {
    const q = R[key], s = min(W, H) / 7.2, cx = W / 2, cy = H / 2, X = x => cx + x * s, Y = y => cy - y * s, N = 240, t = angle(), a = q.h1(t), b = q.h2(t);
    polarGrid(c, X, Y, s, T, [1, 2, 3]);
    c.beginPath();
    for (let i = 0; i <= N; i++) { const u = mix(q.t0, q.t1, i / N), r = q.h2(u), px = X(r * cos(u)), py = Y(r * sin(u)); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    if (key === "ring") { for (let i = N; i >= 0; i--) { const u = mix(q.t0, q.t1, i / N); c.lineTo(X(cos(u)), Y(sin(u))); } }
    c.closePath(); c.fillStyle = rgbS(T.accent, .24); c.fill("evenodd"); c.strokeStyle = rgbS(T.accent); c.lineWidth = 2; c.stroke();
    const ex = 3.5 * cos(t), ey = 3.5 * sin(t);
    c.strokeStyle = rgbS(T.muted, .9); c.lineWidth = 1.3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(ex), Y(ey)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = rgbS(T.glow); c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(X(a * cos(t)), Y(a * sin(t))); c.lineTo(X(b * cos(t)), Y(b * sin(t))); c.stroke(); c.lineCap = "butt";
    [[a, T.s1], [b, T.cursor]].forEach(([r, col]) => { c.beginPath(); c.arc(X(r * cos(t)), Y(r * sin(t)), 5.5, 0, TAU); c.fillStyle = rgbS(col); c.fill(); c.strokeStyle = rgbS(T.plot); c.lineWidth = 1.5; c.stroke(); });
    c.fillStyle = rgbS(T.ink); c.beginPath(); c.arc(X(0), Y(0), 3, 0, TAU); c.fill();
  });
  function reads() {
    const q = R[key], t = angle();
    $("#rayTOut").textContent = rad(t);
    $("#rayNote").textContent = `At this angle the beam enters at r = ${fx(q.h1(t), 2)} and leaves at r = ${fx(q.h2(t), 2)}.`;
  }
  const setTex = () => tex($("#rayTex"), R[key].tex, true);
  const update = () => { reads(); draw(); };
  onSlide(S, () => { touched = true; update(); });
  seg("#raySeg", k => { key = k; setTex(); update(); });
  whenVisible($("#rayCv"), dt => { if (touched) return; S.value = (+S.value + dt * 90) % 1000; update(); });
  setTex(); update();
})();

/* ---------- rose tracer ---------- */
(function rose() {
  const S = $("#roseT"), btn = $("#rosePlay"), STEPS = 700;
  let n = 3, sgn = 1, playing = false, auto = false;
  const rOf = t => sgn * 3 * sin(n * t), theta = () => +S.value / 1000 * TAU;
  const area = t => 4.5 * (t / 2 - sin(2 * n * t) / (4 * n));
  const draw = panel2D($("#roseCv"), (c, W, H, T) => {
    const s = min(W, H) / 7.2, cx = W / 2, cy = H / 2, X = x => cx + x * s, Y = y => cy - y * s, t1 = theta(), dt = TAU / STEPS;
    polarGrid(c, X, Y, s, T, [1, 2, 3]);
    c.strokeStyle = rgbS(T.muted, .55); c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= STEPS; i++) { const t = i * dt, r = rOf(t), px = X(r * cos(t)), py = Y(r * sin(t)); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    c.fillStyle = rgbS(T.accent, .3);
    const last = floor(t1 / dt);
    for (let i = 0; i < last; i++) {
      const a = i * dt, b = (i + 1) * dt, ra = rOf(a), rb = rOf(b);
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(ra * cos(a)), Y(ra * sin(a))); c.lineTo(X(rb * cos(b)), Y(rb * sin(b))); c.closePath(); c.fill();
    }
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2.2; c.beginPath();
    for (let i = 0; i <= last; i++) { const u = i * dt, r = rOf(u), px = X(r * cos(u)), py = Y(r * sin(u)); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    const r = rOf(t1), neg = r < -1e-6, px = X(r * cos(t1)), py = Y(r * sin(t1));
    c.strokeStyle = rgbS(T.muted); c.lineWidth = 1.3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(3.5 * cos(t1)), Y(3.5 * sin(t1))); c.stroke(); c.setLineDash([]);
    c.strokeStyle = rgbS(neg ? T.bad : T.glow); c.lineWidth = 3; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(px, py); c.stroke();
    c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fillStyle = rgbS(neg ? T.bad : T.glow); c.fill(); c.strokeStyle = rgbS(T.plot); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = rgbS(T.ink); c.font = `600 12px ${MONO}`; c.textAlign = "center"; c.fillText("θ", X(3.72 * cos(t1)), Y(3.72 * sin(t1)) + 4);
  });
  function reads() {
    const t = theta(), r = rOf(t);
    $("#roseTOut").textContent = rad(t); $("#roseR").textContent = fx(r, 2);
    $("#roseWhere").textContent = abs(r) < .005 ? "at the origin" : r > 0 ? "on the ray" : "opposite the ray";
    $("#roseA").textContent = fx(area(t), 2);
  }
  const update = () => { reads(); draw(); };
  const setPlay = on => { playing = on; btn.textContent = on ? "❚❚ Pause" : "▶ Trace"; };
  onSlide(S, () => { setPlay(false); auto = true; update(); });
  btn.addEventListener("click", () => { if (!playing && +S.value >= 1000) S.value = 0; setPlay(!playing); auto = true; update(); });
  seg("#roseN", k => { n = +k; update(); });
  seg("#roseS", k => { sgn = +k; update(); });
  whenVisible($("#roseCv"), dt => {
    if (!auto) { auto = true; setPlay(true); }
    if (!playing) return;
    const v = +S.value + dt * 100;
    if (v >= 1000) { S.value = 1000; setPlay(false); } else S.value = v;
    update();
  });
  if (reduce) btn.hidden = true;
  update();
})();

/* ---------- fill a box with values ---------- */
(function tripleBoxes() {
  const f = (x, y, z) => x * x + y * z, X = 2, Y = 1, Z = 2, lS = $("#tbL"), mS = $("#tbM"), nS = $("#tbN");
  const p = new Plot3D($("#tbCv"), {
    pitch: .5, spin: .1,
    build(T) {
      const l = +lS.value, m = +mS.value, n = +nS.value, dx = X / l, dy = Y / m, dz = Z / n, g = .09, groups = [];
      let sum = 0;
      for (let i = 0; i < l; i++) for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) {
        const v = f((i + 1) * dx, (j + 1) * dy, (k + 1) * dz);
        sum += v * dx * dy * dz;
        groups.push(brick((i + g) * dx, (i + 1 - g) * dx, (j + g) * dy, (j + 1 - g) * dy, (k + g) * dz, (k + 1 - g) * dz, ramp(T, v / 6), T));
      }
      $("#tbLOut").textContent = l; $("#tbMOut").textContent = m; $("#tbNOut").textContent = n; $("#tbCount").textContent = l * m * n; $("#tbSum").textContent = fx(sum, 3);
      const ax = axes3(T, [[[0, 0, 0], [2.5, 0, 0], "x"], [[0, 0, 0], [0, 1.5, 0], "y"], [[0, 0, 0], [0, 0, 2.5], "z"]]);
      return { bounds: { a: -.2, b: 2.2, c: -.7, d: 1.7, zlo: 0, zhi: 2.2, iso: true }, frame: false, groups, ...ax };
    }
  });
  p.rebuild();
  [lS, mS, nS].forEach(s => onSlide(s, () => p.rebuild()));
})();

/* ---------- stick through a solid ---------- */
(function stick() {
  const SOL = {
    bowl: {
      xr: [-1.5, 1.5], yr: x => { const s = sqrt(max(0, 2.25 - x * x)); return [-s, s]; }, u1: (x, y) => x * x + y * y, u2: () => 2.25,
      bounds: { a: -1.7, b: 1.7, c: -1.7, d: 1.7, zlo: 0, zhi: 2.5, iso: true },
      tex: "\\int_{-3/2}^{3/2}\\!\\int_{-\\sqrt{9/4-x^2}}^{\\sqrt{9/4-x^2}}\\!\\int_{x^2+y^2}^{9/4} f\\,dz\\,dy\\,dx",
      make(T) {
        return [floorDisk(1.5, T.accent, .3), ...meshGroups((r, t) => [r * cos(t), r * sin(t), r * r], [0, 1.5, 7], [0, TAU, 32], { col: T.s1, a: .45, st: T.s1, sa: .25 }), ...meshGroups((r, t) => [r * cos(t), r * sin(t), 2.25], [0, 1.5, 3], [0, TAU, 32], { col: T.s3, a: .3, st: T.s3, sa: .2 })];
      }
    },
    roof: {
      xr: [0, 2], yr: x => [0, 2 - x * x / 2], u1: x => .25 + .25 * x, u2: (x, y) => 2.5 - .4 * y,
      bounds: { a: -.5, b: 2.5, c: -.5, d: 2.5, zlo: 0, zhi: 2.7, iso: true },
      tex: "\\int_{0}^{2}\\!\\int_{0}^{2-x^2/2}\\!\\int_{(1+x)/4}^{5/2-2y/5} f\\,dz\\,dy\\,dx",
      make(T) {
        const g = x => 2 - x * x / 2, u1 = x => .25 + .25 * x, u2 = y => 2.5 - .4 * y, pts = [[0, 0, 0], ...arc3(x => [x, 0, 0], 0, 2, 2), ...arc3(x => [x, g(x), 0], 2, 0, 28)];
        return [
          { at: [1, 1, -50], faces: [{ p: pts, col: T.accent, a: .3 }] },
          ...meshGroups((x, v) => [x, v * g(x), u1(x)], [0, 2, 14], [0, 1, 7], { col: T.s1, a: .45, st: T.s1, sa: .25 }),
          ...meshGroups((x, v) => [x, v * g(x), u2(v * g(x))], [0, 2, 14], [0, 1, 7], { col: T.s3, a: .4, st: T.s3, sa: .2 }),
          ...meshGroups((x, w) => [x, 0, mix(u1(x), u2(0), w)], [0, 2, 10], [0, 1, 3], { col: T.s2, a: .22 }),
          ...meshGroups((y, w) => [0, y, mix(u1(0), u2(y), w)], [0, 2, 10], [0, 1, 3], { col: T.s2, a: .22 }),
          ...meshGroups((x, w) => [x, g(x), mix(u1(x), u2(g(x)), w)], [0, 2, 12], [0, 1, 3], { col: T.s2, a: .22 })
        ];
      }
    }
  };
  const xS = $("#stX"), yS = $("#stY"), setup = $("#stSetup");
  setup.innerHTML = `<div id="stTex"></div>`;
  let key = "bowl", cK = "", cT = null, cached = null;
  const pos = () => { const q = SOL[key], x = mix(q.xr[0], q.xr[1], +xS.value / 1000), [y0, y1] = q.yr(x), y = mix(y0, y1, +yS.value / 1000); return { q, x, y, y0, y1, a: q.u1(x, y), b: q.u2(x, y) }; };
  const p = new Plot3D($("#stCv"), {
    pitch: .4, spin: 0, yaw: -.75,
    build(T) {
      if (cK !== key || cT !== T) { cK = key; cT = T; cached = SOL[key].make(T); }
      const { q, x, y, y0, y1, a, b } = pos();
      const H = 2.75, lines = [
        { p: [[x, y0, 0], [x, y1, 0]], col: T.t2, a: 1, w: 3 },
        { p: [[x, y, 0], [x, y, a]], col: T.muted, a: .8, w: 1 },
        { p: [[x, y, a], [x, y, b]], col: T.glow, a: 1, w: 5 }
      ];
      const ax = axes3(T, [[[0, 0, 0], [H * .95, 0, 0], "x"], [[0, 0, 0], [0, H * .95, 0], "y"], [[0, 0, 2.3], [0, 0, 2.75], "z"]]);
      const text = [...ax.text, { p: [x, y, a], s: "●", col: T.s1, dy: 5 }, { p: [x, y, b], s: "●", col: T.cursor, dy: 5 }, { p: [x, y, a], s: "enters", col: T.ink, dx: 38, dy: 8 }, { p: [x, y, b], s: "leaves", col: T.cursor, dx: 34, dy: 2 }];
      return { bounds: q.bounds, frame: false, groups: cached, lines: [...ax.lines, ...lines], text };
    }
  });
  function update() {
    const { x, y, a, b } = pos();
    $("#stXOut").textContent = "x = " + fx(x, 2); $("#stYOut").textContent = "y = " + fx(y, 2);
    $("#stU1").textContent = fx(a, 2); $("#stU2").textContent = fx(b, 2); $("#stLen").textContent = fx(b - a, 2);
    p.rebuild();
  }
  const setTex = () => tex($("#stTex"), SOL[key].tex, true);
  seg("#stSeg", k => { key = k; setTex(); update(); });
  [xS, yS].forEach(s => onSlide(s, update));
  setTex(); update();
})();

/* ---------- stir it ---------- */
(function stirBlock() {
  const N = 5, H = 1 / N, S = $("#stirS"), btn = $("#stirPlay"), cells = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) { const x = (i + .5) * H, y = (j + .5) * H, z = (k + .5) * H; cells.push([x, y, z, 10 + 60 * x * y]); }
  const v0 = cells.map(c => c[3]), lo0 = min(...v0), hi0 = max(...v0);
  let playing = false;
  const p = new Plot3D($("#stirCv"), {
    pitch: .5, spin: .1,
    build(T) {
      const s = +S.value, g = H * .42, swirl = sin(PI * s) * 3;
      const groups = cells.map(([x, y, z, v]) => {
        const dx = x - .5, dy = y - .5, d = hypot(dx, dy), a = swirl * (1 - d / .72), X = .5 + dx * cos(a) - dy * sin(a), Y = .5 + dx * sin(a) + dy * cos(a);
        return brick(X - g, X + g, Y - g, Y + g, z - g, z + g, ramp(T, (mix(v, 25, s) - 10) / 50), T);
      });
      return { bounds: { a: 0, b: 1, c: 0, d: 1, zlo: 0, zhi: 1, iso: true }, frame: false, groups };
    },
    tick(dt) {
      if (!playing) return;
      const v = +S.value + dt / 3.2;
      if (v >= 1) { S.value = 1; setPlay(false); } else S.value = v;
      update();
    }
  });
  function update() {
    const s = +S.value;
    $("#stirOut").textContent = Math.round(s * 100) + "%"; $("#stirLo").textContent = fx(mix(lo0, 25, s), 1) + "°"; $("#stirHi").textContent = fx(mix(hi0, 25, s), 1) + "°";
    p.rebuild();
  }
  function setPlay(on) { playing = on; btn.textContent = on ? "❚❚ Pause" : (+S.value >= 1 ? "↻ Stir again" : "▶ Stir"); }
  btn.addEventListener("click", () => { if (+S.value >= 1) S.value = 0; setPlay(!playing); update(); });
  onSlide(S, () => { setPlay(false); update(); });
  if (reduce) btn.hidden = true;
  update();
})();

/* ---------- cylindrical point ---------- */
(function cylPoint() {
  const rS = $("#cpR"), tS = $("#cpT"), zS = $("#cpZ");
  let show = "all";
  const p = new Plot3D($("#cpCv"), {
    pitch: .42, spin: 0, yaw: -.62,
    build(T) {
      const r = +rS.value, th = +tS.value, z = +zS.value, on = k => show === "all" || show === k, a = show === "all" ? .3 : .5, groups = [];
      if (on("r")) groups.push(...meshGroups((t, h) => [r * cos(t), r * sin(t), h], [0, TAU, 36], [-1.6, 2, 6], { col: T.t1, a, st: T.t1, sa: .2 }));
      if (on("t")) groups.push(...meshGroups((u, h) => [u * cos(th), u * sin(th), h], [0, 2.4, 6], [-1.6, 2, 6], { col: T.t2, a, st: T.t2, sa: .2 }));
      if (on("z")) groups.push(...meshGroups((u, t) => [u * cos(t), u * sin(t), z], [0, 2.4, 5], [0, TAU, 36], { col: T.t3, a, st: T.t3, sa: .2 }));
      const x = r * cos(th), y = r * sin(th), ax = axes3(T, [[[-2.5, 0, 0], [2.6, 0, 0], "x"], [[0, -2.5, 0], [0, 2.6, 0], "y"], [[0, 0, -1.7], [0, 0, 2.3], "z"]]);
      const lines = [
        ...ax.lines,
        { p: [[0, 0, 0], [x, y, 0]], col: T.t1, a: 1, w: 3 },
        { p: [[x, y, 0], [x, y, z]], col: T.t3, a: 1, w: 3 },
        { p: arc3(t => [.55 * cos(t), .55 * sin(t), 0], 0, th), col: T.t2, a: 1, w: 3 }
      ];
      const text = [...ax.text, { p: [x / 2, y / 2, 0], s: "r", col: T.t1, dy: 15 }, { p: [x, y, z / 2], s: "z", col: T.t3, dx: 13 }, { p: [.8 * cos(th / 2), .8 * sin(th / 2), 0], s: "θ", col: T.t2, dy: 15 }, { p: [x, y, z], s: "●", col: T.glow, dy: 5 }];
      return { bounds: { a: -2.4, b: 2.4, c: -2.4, d: 2.4, zlo: -1.7, zhi: 2.1, iso: true }, frame: false, groups, lines, text };
    }
  });
  function update() {
    const r = +rS.value, th = +tS.value, z = +zS.value;
    $("#cpROut").textContent = fx(r, 2); $("#cpTOut").textContent = rad(th); $("#cpZOut").textContent = fx(z, 2);
    $("#cpX").textContent = fx(r * cos(th), 2); $("#cpY").textContent = fx(r * sin(th), 2); $("#cpZv").textContent = fx(z, 2);
    p.rebuild();
  }
  seg("#cpSeg", k => { show = k; update(); });
  [rS, tS, zS].forEach(s => onSlide(s, update));
  update();
})();

/* ---------- a cylindrical piece ---------- */
(function cylElement() {
  const S = $("#ceR"), DR = .5, DT = .6, DZ = .8, T0 = -.85, T1 = T0 + DT;
  const p = new Plot3D($("#ceCv"), {
    pitch: .55, spin: 0, yaw: -.62,
    build(T) {
      const r = +S.value, r0 = r - DR / 2, r1 = r + DR / 2, at = (q, t, z) => [q * cos(t), q * sin(t), z];
      const groups = [floorDisk(2.45, T.accent, .07), curvedBrick((u, v, w) => at(mix(r0, r1, u), mix(T0, T1, v), mix(0, DZ, w)), [2, 12, 2], { col: T.s2, st: T.plot, sa: .35, lw: .5 })];
      const ax = axes3(T, [[[0, 0, 0], [2.7, 0, 0], "x"], [[0, -2.6, 0], [0, 2.6, 0], "y"], [[0, 0, 0], [0, 0, 1.5], "z"]]);
      const lines = [
        ...ax.lines,
        { p: arc3(t => at(r, t, 0), 0, TAU, 72), col: T.muted, a: .5, w: 1 },
        { p: [at(0, T0, 0), at(r1, T0, 0)], col: T.muted, a: .8, w: 1 }, { p: [at(0, T1, 0), at(r1, T1, 0)], col: T.muted, a: .8, w: 1 },
        { p: [at(r0, T0, DZ), at(r1, T0, DZ)], col: T.t1, a: 1, w: 4 },
        { p: arc3(t => at(r1, t, DZ), T0, T1, 16), col: T.glow, a: 1, w: 4 },
        { p: [at(r1, T0, 0), at(r1, T0, DZ)], col: T.t3, a: 1, w: 4 }
      ];
      const tm = (T0 + T1) / 2, text = [...ax.text, { p: at(r, T0, DZ), s: "Δr", col: T.t1, dx: -18, dy: -6 }, { p: at(r1, tm, DZ), s: "r Δθ", col: T.cursor, dx: 48, dy: -8 }, { p: at(r1, T0, DZ / 2), s: "Δz", col: T.t3, dx: -20 }];
      return { bounds: { a: -1.25, b: 1.25, c: -1.25, d: 1.25, zlo: -.2, zhi: 1.4, iso: true }, frame: false, groups, lines, text };
    }
  });
  function update() {
    const r = +S.value;
    $("#ceROut").textContent = fx(r, 2); $("#ceDr").textContent = fx(DR, 2); $("#ceArc").textContent = fx(r * DT, 3); $("#ceDz").textContent = fx(DZ, 2); $("#ceV").textContent = fx(r * DR * DT * DZ, 3);
    p.rebuild();
  }
  onSlide(S, update);
  update();
})();

/* ---------- spherical point ---------- */
(function sphPoint() {
  const rS = $("#spR"), tS = $("#spT"), fS = $("#spP");
  let show = "all";
  const sp = (p, t, f) => [p * sin(f) * cos(t), p * sin(f) * sin(t), p * cos(f)];
  const v = new Plot3D($("#spCv"), {
    pitch: .4, spin: 0, yaw: -.62,
    build(T) {
      const p = +rS.value, th = +tS.value, ph = +fS.value, on = k => show === "all" || show === k, a = show === "all" ? .3 : .5, groups = [];
      if (on("r")) groups.push(...meshGroups((t, f) => sp(p, t, f), [0, TAU, 32], [.001, PI - .001, 16], { col: T.t1, a, st: T.t1, sa: .2 }));
      if (on("t")) groups.push(...meshGroups((u, h) => [u * cos(th), u * sin(th), h], [0, 2.3, 6], [-2.2, 2.2, 8], { col: T.t2, a, st: T.t2, sa: .2 }));
      if (on("p")) groups.push(...meshGroups((q, t) => sp(q, t, ph), [0, 2.4, 6], [0, TAU, 36], { col: T.t3, a, st: T.t3, sa: .2 }));
      const P = sp(p, th, ph), ax = axes3(T, [[[-2.5, 0, 0], [2.6, 0, 0], "x"], [[0, -2.5, 0], [0, 2.6, 0], "y"], [[0, 0, -2.3], [0, 0, 2.5], "z"]]);
      const lines = [
        ...ax.lines,
        { p: [[0, 0, 0], P], col: T.t1, a: 1, w: 3 },
        { p: [[P[0], P[1], 0], P], col: T.muted, a: .8, w: 1 }, { p: [[0, 0, 0], [P[0], P[1], 0]], col: T.muted, a: .8, w: 1 },
        { p: arc3(t => [.5 * cos(t), .5 * sin(t), 0], 0, th), col: T.t2, a: 1, w: 3 },
        { p: arc3(f => sp(.72, th, f), 0, ph), col: T.t3, a: 1, w: 3 }
      ];
      const text = [...ax.text, { p: sp(p * .55, th, ph), s: "ρ", col: T.t1, dx: 12, dy: -2 }, { p: [.74 * cos(th / 2), .74 * sin(th / 2), 0], s: "θ", col: T.t2, dy: 15 }, { p: sp(.98, th, ph / 2), s: "φ", col: T.t3 }, { p: P, s: "●", col: T.glow, dy: 5 }];
      return { bounds: { a: -2.4, b: 2.4, c: -2.4, d: 2.4, zlo: -2.3, zhi: 2.3, iso: true }, frame: false, groups, lines, text };
    }
  });
  function update() {
    const p = +rS.value, th = +tS.value, ph = +fS.value, q = sp(p, th, ph);
    $("#spROut").textContent = fx(p, 2); $("#spTOut").textContent = rad(th); $("#spPOut").textContent = rad(ph);
    $("#spX").textContent = fx(q[0], 2); $("#spY").textContent = fx(q[1], 2); $("#spZ").textContent = fx(q[2], 2); $("#spRr").textContent = fx(p * sin(ph), 2);
    v.rebuild();
  }
  seg("#spSeg", k => { show = k; update(); });
  [rS, tS, fS].forEach(s => onSlide(s, update));
  update();
})();

/* ---------- a spherical piece ---------- */
(function sphElement() {
  const rS = $("#seR"), fS = $("#seP"), DP = .35, DF = .4, DT = .6, T0 = -.85, T1 = T0 + DT;
  const sp = (p, t, f) => [p * sin(f) * cos(t), p * sin(f) * sin(t), p * cos(f)];
  const v = new Plot3D($("#seCv"), {
    pitch: .4, spin: 0, yaw: -.62,
    build(T) {
      const p = +rS.value, ph = +fS.value, p0 = p - DP / 2, p1 = p + DP / 2, f0 = ph - DF / 2, f1 = ph + DF / 2, tm = (T0 + T1) / 2;
      const groups = [curvedBrick((u, w, x) => sp(mix(p0, p1, u), mix(T0, T1, x), mix(f0, f1, w)), [2, 8, 8], { col: T.s2, st: T.plot, sa: .3, lw: .4 })];
      const ax = axes3(T, [[[0, 0, 0], [2.1, 0, 0], "x"], [[0, -2, 0], [0, 2.5, 0], "y"], [[0, 0, -1.8], [0, 0, 1.9], "z"]]);
      const R = p * sin(ph), Z = p * cos(ph), lines = [
        ...ax.lines,
        { p: arc3(t => [R * cos(t), R * sin(t), Z], 0, TAU, 72), col: T.muted, a: .7, w: 1 },
        { p: arc3(f => sp(p, tm, f), 0, PI, 60), col: T.muted, a: .5, w: 1 },
        { p: [[0, 0, Z], [R * cos(tm), R * sin(tm), Z]], col: T.muted, a: .8, w: 1 },
        { p: [[0, 0, 0], sp(p0, T0, f0)], col: T.muted, a: .6, w: 1 },
        { p: [sp(p0, T0, f0), sp(p1, T0, f0)], col: T.t1, a: 1, w: 4 },
        { p: arc3(f => sp(p1, T0, f), f0, f1, 14), col: T.t3, a: 1, w: 4 },
        { p: arc3(t => sp(p1, t, f0), T0, T1, 14), col: T.glow, a: 1, w: 4 }
      ];
      const text = [...ax.text, { p: sp(p, T0, f0), s: "Δρ", col: T.t1, dx: -6, dy: -14 }, { p: sp(p1, T0, ph), s: "ρ Δφ", col: T.t3, dx: -32 }, { p: sp(p1, tm, f0), s: "ρ sin φ Δθ", col: T.cursor, dx: 52, dy: -12 }, { p: [R * cos(-2.6), R * sin(-2.6), Z], s: "radius ρ sin φ", col: T.muted, dx: -56, dy: -4 }];
      return { bounds: { a: -1.18, b: 1.18, c: -1.18, d: 1.18, zlo: -1.2, zhi: 1.2, iso: true }, frame: false, groups, lines, text };
    }
  });
  function update() {
    const p = +rS.value, ph = +fS.value;
    $("#seROut").textContent = fx(p, 2); $("#sePOut").textContent = rad(ph);
    $("#seDr").textContent = fx(DP, 2); $("#seA1").textContent = fx(p * DF, 3); $("#seA2").textContent = fx(p * sin(ph) * DT, 3); $("#seV").textContent = fx(p * p * sin(ph) * DP * DF * DT, 3);
    v.rebuild();
  }
  [rS, fS].forEach(s => onSlide(s, update));
  update();
})();
