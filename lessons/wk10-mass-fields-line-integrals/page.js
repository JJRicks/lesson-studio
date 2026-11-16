/* Lessons 28–30: the live explorers. Shares a closure with engine/js/shell.js and plot3d.js. */
const { sin, cos, hypot, abs, min, max, exp } = Math, PI = Math.PI, TAU = 2 * PI;
const MONO = `"JetBrains Mono", ui-monospace, monospace`;
const onSlide = (el, fn) => el.addEventListener("input", fn);
const easeIO = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const num = (v, d = 2) => abs(v) < .5 * Math.pow(10, -d) ? (0).toFixed(d) : fx(v, d);
const vecTex = (v, d = 2) => `\\langle ${num(v[0], d).replace("−", "-")},\\ ${num(v[1], d).replace("−", "-")}\\rangle`;

/* the plane at a fixed zoom: y runs ±yr about (cx, cy), and x fills the width */
function view(W, H, yr, cx = 0, cy = 0) {
  const s = H / (2 * yr), xr = W / (2 * s);
  return { s, W, H, x0: cx - xr, x1: cx + xr, y0: cy - yr, y1: cy + yr, X: x => W / 2 + (x - cx) * s, Y: y => H / 2 - (y - cy) * s, inv: (px, py) => [cx + (px - W / 2) / s, cy - (py - H / 2) / s] };
}
function gridAxes(c, V, T, ticks) {
  c.lineWidth = 1; c.strokeStyle = rgbS(T.grid); c.setLineDash([2, 4]);
  for (let g = Math.ceil(V.x0); g <= V.x1; g++) { c.beginPath(); c.moveTo(V.X(g), 0); c.lineTo(V.X(g), V.H); c.stroke(); }
  for (let g = Math.ceil(V.y0); g <= V.y1; g++) { c.beginPath(); c.moveTo(0, V.Y(g)); c.lineTo(V.W, V.Y(g)); c.stroke(); }
  c.setLineDash([]); c.strokeStyle = rgbS(T.muted, .6); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, V.Y(0)); c.lineTo(V.W, V.Y(0)); c.moveTo(V.X(0), 0); c.lineTo(V.X(0), V.H); c.stroke();
  if (!ticks) return;
  c.font = `10px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "center";
  for (let g = Math.ceil(V.x0); g <= V.x1; g++) if (g) c.fillText(minus(g), V.X(g), V.Y(0) + 13);
  c.textAlign = "right";
  for (let g = Math.ceil(V.y0); g <= V.y1; g++) if (g) c.fillText(minus(g), V.X(0) - 5, V.Y(g) + 3.5);
}
/* an arrow in pixels; (dx, dy) already has y pointing down */
function arrowPx(c, x, y, dx, dy, col, lw = 1.6, hd = 7) {
  const L = hypot(dx, dy); if (L < .8) return;
  const ux = dx / L, uy = dy / L, h = min(hd, L * .45), ex = x + dx, ey = y + dy, w = h * .55;
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y); c.lineTo(ex - ux * h * .7, ey - uy * h * .7); c.stroke();
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - ux * h - uy * w, ey - uy * h + ux * w); c.lineTo(ex - ux * h + uy * w, ey - uy * h - ux * w); c.closePath(); c.fill();
}
/* a field drawn as arrows on a grid, each with its tail on its own point */
function fieldArrows(c, V, F, T, o = {}) {
  const sp = o.sp || .5, pts = []; let mx = 1e-9;
  for (let x = Math.ceil(V.x0 / sp) * sp; x <= V.x1 + 1e-9; x += sp) for (let y = Math.ceil(V.y0 / sp) * sp; y <= V.y1 + 1e-9; y += sp) {
    const f = F(x, y), m = hypot(f[0], f[1]); pts.push([x, y, f, m]); mx = max(mx, m);
  }
  const L = sp * V.s * .84, k = L / mx;
  for (const [x, y, f, m] of pts) {
    if (m < 1e-6) continue;
    const len = o.unit ? L * .62 : m * k, col = o.col || rgbS(ramp(T, .1 + .9 * m / mx), o.a ?? .8);
    arrowPx(c, V.X(x), V.Y(y), f[0] / m * len, -f[1] / m * len, col, o.lw ?? 1.4, 7);
  }
  return { mx, k, L };
}
/* specks of fluid that drift with a field */
class Specks {
  constructor(n) { this.n = n; this.p = []; }
  spawn(V, mid) { return { x: V.x0 + Math.random() * (V.x1 - V.x0), y: V.y0 + Math.random() * (V.y1 - V.y0), age: mid ? Math.random() * 2.5 : 0, life: 2.2 + Math.random() * 2.6 }; }
  fill(V) { this.p = Array.from({ length: this.n }, () => this.spawn(V, true)); }
  step(dt, F, k, V) {
    if (!this.p.length) this.fill(V);
    this.p.forEach((q, i) => {
      const f = F(q.x, q.y); q.x += f[0] * k * dt; q.y += f[1] * k * dt; q.age += dt;
      if (q.age > q.life || q.x < V.x0 - .1 || q.x > V.x1 + .1 || q.y < V.y0 - .1 || q.y > V.y1 + .1) this.p[i] = this.spawn(V, false);
    });
  }
  draw(c, V, col) {
    c.fillStyle = col;
    for (const q of this.p) {
      c.globalAlpha = clamp(min(q.age / .5, (q.life - q.age) / .5), 0, 1) * .85;
      c.beginPath(); c.arc(V.X(q.x), V.Y(q.y), 1.8, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }
}
/* readout tiles with KaTeX keys. items: [[id, tex], ...]. Returns set(id, text, isTex) */
function readBox(el, items) {
  el.innerHTML = items.map(([id]) => `<div data-r="${id}"><div class="k"></div><div class="v"></div></div>`).join("");
  const cell = {};
  items.forEach(([id, t]) => { const d = el.querySelector(`[data-r="${id}"]`); tex(d.querySelector(".k"), t); cell[id] = d; });
  return (id, s, isTex) => { const v = cell[id].querySelector(".v"); if (isTex) tex(v, s); else if (v.textContent !== s) v.textContent = s; };
}
function dragOn(cv, fn) {
  let on = false;
  const at = e => { const r = cv.getBoundingClientRect(); fn(e.clientX - r.left, e.clientY - r.top); };
  cv.style.touchAction = "none";
  cv.addEventListener("pointerdown", e => { on = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} at(e); });
  cv.addEventListener("pointermove", e => { if (on) at(e); });
  const end = () => { on = false; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}
const fastest = (V, F) => { let m = 1e-9; for (let x = V.x0; x <= V.x1; x += .5) for (let y = V.y0; y <= V.y1; y += .5) { const f = F(x, y); m = max(m, hypot(f[0], f[1])); } return m; };

const FIELDS = {
  swirl: { F: (x, y) => [-y, x], tex: String.raw`\mathbf F=\langle -y,\ x\rangle` },
  source: { F: (x, y) => [x, y], tex: String.raw`\mathbf F=\langle x,\ y\rangle` },
  wind: { F: () => [1, .5], tex: String.raw`\mathbf F=\langle 1,\ 0.5\rangle` },
  shear: { F: (x, y) => [y, 0], tex: String.raw`\mathbf F=\langle y,\ 0\rangle` }
};

/* ---------- hero: a bead walks a loop through a moving fluid ---------- */
(function hero() {
  const cv = $("#heroCv"), btn = $("#heroPlay"), R = 1.5, LAP = 7.5, specks = new Specks(230);
  let key = "swirl", th = reduce ? TAU : 2.5, hold = 0, playing = !reduce, T = tokens(TOK), V = null, ks = 1;
  const F = (x, y) => FIELDS[key].F(x, y);
  const totals = t1 => {
    let a = 0, b = 0; const n = max(2, Math.ceil(t1 / .01)), h = t1 / n;
    for (let i = 0; i < n; i++) { const t = (i + .5) * h, f = F(R * cos(t), R * sin(t)); a += (-f[0] * sin(t) + f[1] * cos(t)) * R * h; b += (f[0] * cos(t) + f[1] * sin(t)) * R * h; }
    return [a, b];
  };
  function draw() {
    const { c, W, H } = canvas2d(cv); V = view(W, H, 2.35);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    gridAxes(c, V, T, false);
    const { k } = fieldArrows(c, V, F, T, { a: .5, lw: 1.2 });
    specks.draw(c, V, rgbS(T.ink, .7));
    // the loop, with arrowheads showing which way the bead walks
    c.strokeStyle = rgbS(T.ink, .28); c.lineWidth = 3; c.beginPath(); c.arc(V.X(0), V.Y(0), R * V.s, 0, TAU); c.stroke();
    for (const t of [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4]) arrowPx(c, V.X(R * cos(t)), V.Y(R * sin(t)), -sin(t) * 9, -cos(t) * 9, rgbS(T.ink, .45), 2, 9);
    // the trail: green where the fluid pushes the bead forward, red where it pushes back
    let gm = 1e-9; for (let t = 0; t < TAU; t += .1) { const f = F(R * cos(t), R * sin(t)); gm = max(gm, hypot(f[0], f[1])); }
    c.lineWidth = 5; c.lineCap = "round";
    for (let t = 0; t < th - 1e-9; t += .025) {
      const t2 = min(th, t + .025), m = (t + t2) / 2, f = F(R * cos(m), R * sin(m)), g = -f[0] * sin(m) + f[1] * cos(m);
      c.strokeStyle = g > .06 * gm ? rgbS(T.good) : g < -.06 * gm ? rgbS(T.bad) : rgbS(T.muted, .9);
      c.beginPath(); c.arc(V.X(0), V.Y(0), R * V.s, -t, -t2, true); c.stroke();
    }
    // the bead and the fluid's velocity there
    const bx = V.X(R * cos(th)), by = V.Y(R * sin(th)), f = F(R * cos(th), R * sin(th));
    arrowPx(c, bx, by, f[0] * k * 1.35, -f[1] * k * 1.35, rgbS(T.cursor), 3.2, 11);
    c.fillStyle = rgbS(T.plot); c.strokeStyle = rgbS(T.ink); c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, 7, 0, TAU); c.fill(); c.stroke();
    const [a, b] = totals(th), done = th >= TAU - 1e-6 ? " · full lap" : "";
    $("#hAlong").textContent = num(a) + done; $("#hAcross").textContent = num(b) + done;
  }
  const showField = () => { tex($("#hF"), FIELDS[key].tex); if (V) ks = 1.5 / fastest(V, F); };
  seg("#heroSeg", k => { key = k; th = reduce ? TAU : 0; hold = 0; showField(); if (V) specks.fill(V); draw(); });
  btn.addEventListener("click", () => { playing = !playing; btn.textContent = playing ? "Pause" : "Play"; btn.setAttribute("aria-pressed", String(playing)); });
  if (reduce) { btn.disabled = true; btn.textContent = "Paused"; btn.setAttribute("aria-pressed", "false"); }
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(() => { draw(); if (!specks.p.length) specks.fill(V); }).observe(cv);
  draw(); showField(); specks.fill(V); draw();
  whenVisible(cv, dt => {
    if (!playing) return;
    specks.step(dt, F, ks, V);
    if (hold > 0) { hold -= dt; if (hold <= 0) th = 0; }
    else { th += TAU / LAP * dt; if (th >= TAU) { th = TAU; hold = 1.8; } }
    draw();
  });
})();

/* ---------- balance a plate on a pin ---------- */
(function balance() {
  const cv = $("#balCv"), sa = $("#balA"), sb = $("#balB"), rnd = seeded(28);
  const G = Array.from({ length: 2400 }, () => [rnd() * 4, rnd() * 3, rnd()]);
  let a = +sa.value, b = +sb.value, pin = [1.1, 2.1], T = tokens(TOK), anim = 0, L = null;
  const rho = (x, y) => (1 + a * x / 4) * (1 + b * y / 3);
  const stats = () => {                 // the density splits, so every integral is an x part times a y part
    const mx = 4 + 2 * a, my = 3 + 1.5 * b, xm = 8 + 16 * a / 3, ym = 4.5 + 3 * b;
    return { m: mx * my, My: xm * my, Mx: mx * ym, xb: xm / mx, yb: ym / my };
  };
  const set = readBox($("#balReads"), [["m", String.raw`\text{mass } m=\iint\rho\,dA`], ["My", String.raw`M_y=\iint x\rho\,dA`], ["Mx", String.raw`M_x=\iint y\rho\,dA`], ["xb", String.raw`\bar x=M_y/m`], ["yb", String.raw`\bar y=M_x/m`]]);
  function barText(c, s, x, y) { c.fillText(s, x, y); const w = c.measureText(s).width; c.beginPath(); c.moveTo(x - w / 2 - 1, y - 11); c.lineTo(x + w / 2 + 1, y - 11); c.stroke(); }
  function draw() {
    const { c, W, H } = canvas2d(cv), s = min((W - 90) / 4, (H - 80) / 3), ox = (W - 4 * s) / 2, oy = (H - 3 * s) / 2 - 6;
    L = { s, ox, oy, X: x => ox + x * s, Y: y => oy + (3 - y) * s };
    const S = stats(), rmax = (1 + a) * (1 + b), bot = oy + 3 * s, right = ox + 4 * s;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.fillStyle = rgbS(T.accent, .08); c.fillRect(ox, oy, 4 * s, 3 * s);
    c.fillStyle = rgbS(T.ink, .62);
    for (const g of G) if (g[2] < rho(g[0], g[1]) / rmax) { c.beginPath(); c.arc(L.X(g[0]), L.Y(g[1]), 1.5, 0, TAU); c.fill(); }
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2; c.strokeRect(ox, oy, 4 * s, 3 * s);
    c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "center";
    for (let x = 0; x <= 4; x++) c.fillText(x, L.X(x), bot + 15);
    c.textAlign = "right"; for (let y = 0; y <= 3; y++) c.fillText(y, ox - 7, L.Y(y) + 4);
    // where the balance point sits along each edge
    c.fillStyle = rgbS(T.good); c.strokeStyle = rgbS(T.good); c.lineWidth = 1.3; c.font = `italic 600 13px ${MONO}`; c.textAlign = "center";
    c.beginPath(); c.moveTo(L.X(S.xb), bot + 1); c.lineTo(L.X(S.xb) - 6, bot + 10); c.lineTo(L.X(S.xb) + 6, bot + 10); c.closePath(); c.fill();
    barText(c, "x", L.X(S.xb), bot + 34);
    c.beginPath(); c.moveTo(right + 1, L.Y(S.yb)); c.lineTo(right + 10, L.Y(S.yb) - 6); c.lineTo(right + 10, L.Y(S.yb) + 6); c.closePath(); c.fill();
    c.textAlign = "left"; barText(c, "y", right + 20, L.Y(S.yb) + 5);
    // the plain middle of the rectangle
    c.strokeStyle = rgbS(T.muted); c.lineWidth = 1.5; c.strokeRect(L.X(2) - 5, L.Y(1.5) - 5, 10, 10);
    c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "left"; c.fillText("middle", L.X(2) + 9, L.Y(1.5) - 8);
    // the pin, and which way the plate tips
    const dx = S.xb - pin[0], dy = S.yb - pin[1], ok = hypot(dx, dy) < .05, px = L.X(pin[0]), py = L.Y(pin[1]);
    if (!ok) arrowPx(c, px, py, dx * s, -dy * s, rgbS(T.bad), 3, 12);
    c.fillStyle = rgbS(ok ? T.good : T.cursor, .25); c.strokeStyle = rgbS(ok ? T.good : T.cursor); c.lineWidth = 2.5;
    c.beginPath(); c.arc(px, py, ok ? 13 : 9, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(px - 4, py); c.lineTo(px + 4, py); c.moveTo(px, py - 4); c.lineTo(px, py + 4); c.stroke();
    const words = [];
    if (abs(dx) >= .05) words.push(dx > 0 ? "right" : "left");
    if (abs(dy) >= .05) words.push(dy > 0 ? "top" : "bottom");
    $("#balStatus").textContent = ok ? "balanced on the pin" : "tips toward the " + words.join(" and ");
    set("m", fx(S.m)); set("My", fx(S.My)); set("Mx", fx(S.Mx)); set("xb", fx(S.xb, 3)); set("yb", fx(S.yb, 3));
    $("#balAOut").textContent = fx(a, 1); $("#balBOut").textContent = fx(b, 1);
  }
  onSlide(sa, () => { a = +sa.value; draw(); });
  onSlide(sb, () => { b = +sb.value; draw(); });
  dragOn(cv, (x, y) => { if (!L) return; cancelAnimationFrame(anim); pin = [clamp((x - L.ox) / L.s, 0, 4), clamp(3 - (y - L.oy) / L.s, 0, 3)]; draw(); });
  $("#balSnap").addEventListener("click", () => {
    const S = stats(), p0 = pin.slice(), t0 = performance.now();
    cancelAnimationFrame(anim);
    if (reduce) { pin = [S.xb, S.yb]; return draw(); }
    const go = now => { const u = clamp((now - t0) / 900, 0, 1), e = easeIO(u); pin = [p0[0] + (S.xb - p0[0]) * e, p0[1] + (S.yb - p0[1]) * e]; draw(); if (u < 1) anim = requestAnimationFrame(go); };
    anim = requestAnimationFrame(go);
  });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  draw();
})();

/* ---------- twirl test: the same push, a different spread ---------- */
(function twirl() {
  const cv = $("#twCv"), A = $("#twA"), B = $("#twB"), TQ = .1, PUSH = 3, CYCLE = 5.5;
  let rA = +A.value, rB = +B.value, t = reduce ? PUSH : 1.6, T = tokens(TOK);
  const I = r => 2 * r * r, alpha = r => TQ / I(r);
  const ang = (r, t) => t <= PUSH ? .5 * alpha(r) * t * t : .5 * alpha(r) * PUSH * PUSH + alpha(r) * PUSH * (t - PUSH);
  const set = readBox($("#twReads"), [["IA", String.raw`I_{\text{left}}=2r^2`], ["IB", String.raw`I_{\text{right}}=2r^2`], ["wA", String.raw`\text{left spin after 3 s}`], ["wB", String.raw`\text{right spin after 3 s}`], ["q", String.raw`\text{spin ratio}`]]);
  function rod(c, cx, cy, u, r, th, lab) {
    c.strokeStyle = rgbS(T.muted, .4); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.arc(cx, cy, r * u, 0, TAU); c.stroke(); c.setLineDash([]);
    const ex = cos(th), ey = -sin(th);
    c.strokeStyle = rgbS(T.ink, .55); c.lineWidth = 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx - ex * 1.05 * u, cy - ey * 1.05 * u); c.lineTo(cx + ex * 1.05 * u, cy + ey * 1.05 * u); c.stroke();
    for (const sg of [1, -1]) { c.fillStyle = rgbS(T.accent); c.beginPath(); c.arc(cx + sg * ex * r * u, cy + sg * ey * r * u, 11, 0, TAU); c.fill(); }
    c.fillStyle = rgbS(T.plot); c.strokeStyle = rgbS(T.ink); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill(); c.stroke();
    if (t < PUSH || reduce) {          // the push: a curved arrow around the hub
      c.strokeStyle = rgbS(T.glow); c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 22, -.3, -1.9, true); c.stroke();
      const hx = cx + 22 * cos(-1.9), hy = cy + 22 * sin(-1.9); arrowPx(c, hx + 6, hy + 4, -6, -4, rgbS(T.glow), 3, 9);
    }
    c.font = `12px ${MONO}`; c.fillStyle = rgbS(T.ink); c.textAlign = "center";
    c.fillText(lab, cx, cy + 1.05 * u + 26);
  }
  function draw() {
    const { c, W, H } = canvas2d(cv), u = min(W / 4 - 24, H / 2 - 40);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.strokeStyle = rgbS(T.line); c.lineWidth = 1; c.beginPath(); c.moveTo(W / 2, 14); c.lineTo(W / 2, H - 14); c.stroke();
    rod(c, W / 4, H / 2 - 12, u, rA, ang(rA, t), `weights ${fx(rA, 2)} m out`);
    rod(c, 3 * W / 4, H / 2 - 12, u, rB, ang(rB, t), `weights ${fx(rB, 2)} m out`);
    c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.muted); c.textAlign = "left";
    c.fillText(reduce ? "after the 3 s push" : t < PUSH ? `pushing… ${fx(t, 1)} s` : "push over, coasting", 12, 20);
    const wA = alpha(rA) * PUSH, wB = alpha(rB) * PUSH, q = wA >= wB ? wA / wB : wB / wA;
    set("IA", fx(I(rA), 3) + " kg·m²"); set("IB", fx(I(rB), 3) + " kg·m²");
    set("wA", fx(wA, 2) + " rad/s"); set("wB", fx(wB, 2) + " rad/s");
    set("q", abs(q - 1) < .005 ? "equal" : `${wA >= wB ? "left" : "right"} is ${fx(q, 2)}× faster`);
    $("#twStatus").textContent = `same push for ${PUSH} s`;
    $("#twAOut").textContent = fx(rA, 2) + " m"; $("#twBOut").textContent = fx(rB, 2) + " m";
  }
  onSlide(A, () => { rA = +A.value; if (!reduce) t = 0; draw(); });
  onSlide(B, () => { rB = +B.value; if (!reduce) t = 0; draw(); });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  draw();
  whenVisible(cv, dt => { t += dt; if (t > CYCLE) t = 0; draw(); });
})();

/* ---------- field explorer ---------- */
(function fieldExplorer() {
  const cv = $("#fxCv"), ids = ["A", "B", "C", "D"], sl = ids.map(i => $("#fx" + i)), specks = new Specks(170);
  const PRE = { spiral: [1, -1, 1, 1], out: [1, 0, 0, 1], swirl: [0, -1, 1, 0], shear: [0, 1, 0, 0], saddle: [1, 0, 0, -1] };
  let K = sl.map(s => +s.value), unit = false, probe = [1.5, 1], T = tokens(TOK), V = null, ks = 1;
  const F = (x, y) => [K[0] * x + K[1] * y, K[2] * x + K[3] * y];
  const set = readBox($("#fxReads"), [["p", String.raw`\text{probe point}`], ["f", String.raw`\mathbf F\text{ there}`], ["m", String.raw`\text{length }\|\mathbf F\|`], ["k", String.raw`\text{type}`]]);
  const coef = (k, v, first) => { if (!k) return ""; const a = abs(k), s = (a === 1 ? "" : String(a)) + v; return k < 0 ? "-" + s : (first ? "" : "+") + s; };
  const comp = (p, q) => coef(p, "x", true) + coef(q, "y", !p) || "0";
  function kind() {
    const [a, b, c, d] = K;
    if (!a && !b && !c && !d) return "zero field";
    if (!b && !c && a === d) return a > 0 ? "radial, outward" : "radial, inward";
    if (!a && !d && b === -c) return b > 0 ? "rotational, clockwise" : "rotational, counterclockwise";
    if (a === d && b === -c) return "neither: a spiral";
    return "neither";
  }
  function info() {
    tex($("#fxFormula"), String.raw`\mathbf F(x,y)=\langle ${comp(K[0], K[1])},\ ${comp(K[2], K[3])}\rangle`, true);
    ids.forEach((i, j) => { $(`#fx${i}Out`).textContent = fx(K[j], 1); });
    set("k", kind());
    if (V) ks = 1.4 / fastest(V, F);
  }
  function probeRead() { const f = F(...probe); set("p", `(${fx(probe[0])}, ${fx(probe[1])})`); set("f", vecTex(f), true); set("m", fx(hypot(f[0], f[1]))); }
  function draw() {
    const { c, W, H } = canvas2d(cv); V = view(W, H, 2.4);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    gridAxes(c, V, T, true);
    const { k, L } = fieldArrows(c, V, F, T, { unit, a: .85 });
    specks.draw(c, V, rgbS(T.ink, .55));
    const px = V.X(probe[0]), py = V.Y(probe[1]), f = F(...probe), m = hypot(f[0], f[1]);
    if (m > 1e-9) { const len = unit ? L * .62 * 1.6 / m : k * 1.6; arrowPx(c, px, py, f[0] * len, -f[1] * len, rgbS(T.cursor), 3.4, 12); }
    c.fillStyle = rgbS(T.cursor, .3); c.strokeStyle = rgbS(T.cursor); c.lineWidth = 2.5; c.beginPath(); c.arc(px, py, 8, 0, TAU); c.fill(); c.stroke();
  }
  sl.forEach((s, j) => onSlide(s, () => { K[j] = +s.value; $$("#fxPre button").forEach(b => b.setAttribute("aria-pressed", "false")); info(); probeRead(); draw(); }));
  seg("#fxPre", key => { K = PRE[key].slice(); sl.forEach((s, j) => { s.value = K[j]; }); info(); probeRead(); specks.fill(V); draw(); });
  seg("#fxLen", key => { unit = key === "unit"; draw(); });
  dragOn(cv, (x, y) => { if (!V) return; const p = V.inv(x, y); probe = [clamp(p[0], V.x0, V.x1), clamp(p[1], V.y0, V.y1)]; probeRead(); draw(); });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(() => { draw(); info(); }).observe(cv);
  draw(); info(); probeRead(); specks.fill(V); draw();
  whenVisible(cv, dt => { specks.step(dt, F, ks, V); draw(); });
})();

/* ---------- gradient field over a contour map ---------- */
(function gradExplorer() {
  const cv = $("#grCv"), h = 1e-4;
  const FN = {
    hill: { f: (x, y) => 3 * exp(-(x * x + y * y) / 2), lv: [.25, .6, 1, 1.5, 2, 2.5, 2.85], lo: 0, hi: 3 },
    two: { f: (x, y) => 2.4 * exp(-((x - 1.5) ** 2 + y * y) / 1.2) - 2.4 * exp(-((x + 1.5) ** 2 + y * y) / 1.2), lv: [-2, -1.4, -.8, -.3, .3, .8, 1.4, 2], lo: -2.4, hi: 2.4 },
    saddle: { f: (x, y) => (x * x - y * y) / 2, lv: [-2.4, -1.6, -.9, -.35, .35, .9, 1.6, 2.4, 3.5, 5], lo: -2.6, hi: 2.6 }
  };
  let key = "hill", probe = [-1.2, .8], T = tokens(TOK), V = null, grid = null;
  const fn = () => FN[key].f, grad = (x, y) => { const f = fn(); return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]; };
  const set = readBox($("#grReads"), [["p", String.raw`\text{point}`], ["f", String.raw`f\text{ there}`], ["g", String.raw`\nabla f=\langle f_x,\ f_y\rangle`], ["m", String.raw`\text{steepness }\|\nabla f\|`]]);
  function build(W, H) {
    const Nx = 150, Ny = Math.round(150 * H / W), v = [], f = fn();
    for (let j = 0; j <= Ny; j++) for (let i = 0; i <= Nx; i++) v.push(f(V.x0 + (V.x1 - V.x0) * i / Nx, V.y0 + (V.y1 - V.y0) * j / Ny));
    grid = { Nx, Ny, v, key, W, H };
  }
  function contour(level, cb) {     // marching squares, as in the wk8 gradient explorer
    const { Nx, Ny, v } = grid, X = i => V.x0 + (V.x1 - V.x0) * i / Nx, Y = j => V.y0 + (V.y1 - V.y0) * j / Ny, at = (i, j) => v[j * (Nx + 1) + i];
    const lp = (pa, pb, va, vb) => { const t = (level - va) / ((vb - va) || 1e-12); return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]; };
    const S = { 1: ["da", "ab"], 2: ["ab", "bc"], 3: ["da", "bc"], 4: ["bc", "cd"], 6: ["ab", "cd"], 7: ["da", "cd"], 8: ["cd", "da"], 9: ["cd", "ab"], 11: ["cd", "bc"], 12: ["bc", "da"], 13: ["bc", "ab"], 14: ["ab", "da"] };
    for (let j = 0; j < Ny; j++) for (let i = 0; i < Nx; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const idx = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const pa = [X(i), Y(j)], pb = [X(i + 1), Y(j)], pc = [X(i + 1), Y(j + 1)], pd = [X(i), Y(j + 1)];
      const e = { ab: () => lp(pa, pb, a, b), bc: () => lp(pb, pc, b, c), cd: () => lp(pc, pd, c, d), da: () => lp(pd, pa, d, a) };
      if (idx === 5 || idx === 10) { const mid = (a + b + c + d) / 4 > level, pairs = (idx === 5) === mid ? [["da", "cd"], ["ab", "bc"]] : [["da", "ab"], ["bc", "cd"]]; pairs.forEach(([p, q]) => cb(e[p](), e[q]())); }
      else { const [p, q] = S[idx]; cb(e[p](), e[q]()); }
    }
  }
  function draw() {
    const { c, W, H } = canvas2d(cv); V = view(W, H, 2.4);
    if (!grid || grid.key !== key || grid.W !== W || grid.H !== H) build(W, H);
    const D = FN[key], f = fn(), cs = 6;
    for (let py = 0; py < H; py += cs) for (let px = 0; px < W; px += cs) {
      const [x, y] = V.inv(px + cs / 2, py + cs / 2), t = clamp((f(x, y) - D.lo) / (D.hi - D.lo), 0, 1);
      c.fillStyle = rgbS(lerpC(T.plot, ramp(T, t), .16 + .5 * t)); c.fillRect(px, py, cs + .5, cs + .5);
    }
    gridAxes(c, V, T, true);
    c.strokeStyle = rgbS(T.ink, .32); c.lineWidth = 1.1;
    for (const lv of D.lv) { c.beginPath(); contour(lv, (p, q) => { c.moveTo(V.X(p[0]), V.Y(p[1])); c.lineTo(V.X(q[0]), V.Y(q[1])); }); c.stroke(); }
    const { k } = fieldArrows(c, V, grad, T, { col: rgbS(T.ink, .62), lw: 1.3 });
    const fp = f(...probe), g = grad(...probe), gl = hypot(...g), px = V.X(probe[0]), py = V.Y(probe[1]);
    c.strokeStyle = rgbS(T.cursor, .95); c.lineWidth = 2.2; c.setLineDash([7, 5]); c.beginPath();
    contour(fp, (p, q) => { c.moveTo(V.X(p[0]), V.Y(p[1])); c.lineTo(V.X(q[0]), V.Y(q[1])); }); c.stroke(); c.setLineDash([]);
    if (gl > 1e-6) {
      const len = clamp(gl * k * 1.5, 26, 120);
      arrowPx(c, px, py, g[0] / gl * len, -g[1] / gl * len, rgbS(T.cursor), 3.4, 12);
      c.font = `600 13px ${MONO}`; c.fillStyle = rgbS(T.cursor); c.textAlign = "center";
      c.fillText("∇f", px + g[0] / gl * (len + 16), py - g[1] / gl * (len + 16) + 4);
    }
    c.fillStyle = rgbS(T.cursor, .3); c.strokeStyle = rgbS(T.cursor); c.lineWidth = 2.5; c.beginPath(); c.arc(px, py, 8, 0, TAU); c.fill(); c.stroke();
    set("p", `(${fx(probe[0])}, ${fx(probe[1])})`); set("f", fx(fp)); set("g", vecTex(g), true); set("m", fx(gl));
  }
  seg("#grSeg", k2 => { key = k2; draw(); });
  dragOn(cv, (x, y) => { if (!V) return; const p = V.inv(x, y); probe = [clamp(p[0], V.x0 + .05, V.x1 - .05), clamp(p[1], V.y0 + .05, V.y1 - .05)]; draw(); });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  draw();
})();

/* ---------- curtain builder: a scalar line integral made of panels ---------- */
(function curtain() {
  const cv = $("#cuCv"), sl = $("#cuN"), R = 2, T1 = PI / 2, EXACT = PI / 2 + 2;
  const f = (x, y) => .5 + x * y / 2, r = t => [R * cos(t), R * sin(t)];
  let n = +sl.value;
  const sum = () => { let s = 0; const dt = T1 / n; for (let i = 0; i < n; i++) { const p = r((i + .5) * dt); s += f(p[0], p[1]) * R * dt; } return s; };
  const plot = new Plot3D(cv, {
    yaw: .85, pitch: .42, spin: .06,
    build: T => {
      const groups = [], lines = [], text = [], N = 8, A = 2.3;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x0 = A * i / N, x1 = A * (i + 1) / N, y0 = A * j / N, y1 = A * (j + 1) / N, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        const p = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [x, y, f(x, y)]);
        groups.push({ at: [xm, ym, f(xm, ym)], faces: [{ p, n: [-ym / 2, -xm / 2, 1], two: true, col: T.s2, a: .16, st: T.s2, sa: .35, lw: .5 }] });
      }
      const dt = T1 / n;
      for (let i = 0; i < n; i++) {
        const a = r(i * dt), b = r((i + 1) * dt), m = r((i + .5) * dt), hgt = f(m[0], m[1]);
        const p = [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], hgt], [a[0], a[1], hgt]];
        groups.push({ at: [m[0], m[1], hgt / 2], faces: [{ p, n: [cos((i + .5) * dt), sin((i + .5) * dt), 0], two: true, col: ramp(T, hgt - .5), a: .9, st: T.plot, sa: .9, lw: 1.2 }] });
      }
      const C = Array.from({ length: 61 }, (_, i) => r(T1 * i / 60));
      lines.push({ p: C.map(([x, y]) => [x, y, 0]), col: T.accent, a: 1, w: 3 });
      lines.push({ p: C.map(([x, y]) => [x, y, f(x, y)]), col: T.glow, a: .95, w: 2.4 });
      text.push({ p: [R * cos(.45), R * sin(.45), 0], s: "C", col: T.accent, dx: 14, dy: 16 });
      text.push({ p: [A, A, f(A, A)], s: "z = f(x, y)", col: T.s2, dx: 0, dy: -10 });
      return { bounds: { a: 0, b: A, c: 0, d: A, zlo: 0, zhi: 3.2 }, groups, lines, text };
    }
  });
  function update() {
    n = +sl.value; $("#cuNOut").textContent = n;
    const s = sum();
    $("#cuReadN").textContent = n; $("#cuSum").textContent = fx(s, 3); $("#cuExact").textContent = fx(EXACT, 3); $("#cuLen").textContent = fx(PI, 3);
    $("#cuStatus").textContent = `off by ${fx(abs(s - EXACT), 3)}`;
    plot.rebuild();
  }
  onSlide(sl, update);
  update();
})();

/* ---------- line lab: a bead measures a field along or across a path ---------- */
function lineLab(id, def) {
  const cv = $(`#${id}Cv`), tsl = $(`#${id}T`), specks = new Specks(140);
  let fk = def.field, pk = def.path, mode = def.mode, rev = false, u = +tsl.value / 1000, T = tokens(TOK), V = null, tab = null, ks = 1, set = null;
  const PATHS = {
    arc: { r: s => { const t = -PI / 4 + PI * s; return [1.8 * cos(t), 1.8 * sin(t)]; }, d: s => { const t = -PI / 4 + PI * s; return [-1.8 * PI * sin(t), 1.8 * PI * cos(t)]; } },
    line: { r: s => [-2.4 + 4.8 * s, -1.4 + 2.6 * s], d: () => [4.8, 2.6] },
    loop: { r: s => [1.6 * cos(TAU * s), 1.6 * sin(TAU * s)], d: s => [-1.6 * TAU * sin(TAU * s), 1.6 * TAU * cos(TAU * s)] }
  };
  const F = (x, y) => FIELDS[fk].F(x, y);
  const path = () => { const p = PATHS[pk]; return rev ? { r: s => p.r(1 - s), d: s => p.d(1 - s).map(c => -c) } : p; };
  const dirOf = d => mode === "along" ? d : [d[1], -d[0]];      // the notes' normal: velocity turned a quarter turn clockwise
  function table() {
    const N = 600, p = path(), g = [], cum = [0];
    for (let i = 0; i <= N; i++) { const s = i / N, q = p.r(s), f = F(q[0], q[1]), w = dirOf(p.d(s)); g.push(f[0] * w[0] + f[1] * w[1]); }
    for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + (g[i - 1] + g[i]) / 2 / N);
    let um = 1e-9; for (let i = 0; i <= N; i++) { const d = p.d(i / N); um = max(um, abs(g[i]) / hypot(d[0], d[1])); }
    tab = { N, g, cum, gm: max(1e-9, ...g.map(abs)), um, p };
  }
  function labels() {
    const al = mode === "along";
    set = readBox($(`#${id}Reads`), [["f", String.raw`\text{field}`], ["d", al ? String.raw`\mathbf F\cdot\mathbf T\text{ at the bead}` : String.raw`\mathbf F\cdot\mathbf N\text{ at the bead}`],
      ["s", al ? String.raw`\text{work so far}` : String.raw`\text{flux so far}`], ["t", al ? String.raw`\text{work, whole path}` : String.raw`\text{flux, whole path}`]]);
    set("f", FIELDS[fk].tex, true);
    $(`#${id}Status`).textContent = al ? "measuring along: work" : "measuring across: flux";
  }
  function draw() {
    const { c, W, H } = canvas2d(cv); V = view(W, H, 2.3);
    if (!tab) table();
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    gridAxes(c, V, T, false);
    const { k } = fieldArrows(c, V, F, T, { a: .42, lw: 1.1 });
    specks.draw(c, V, rgbS(T.ink, .5));
    const { N, g, cum, gm, p } = tab, at = s => { const q = p.r(s); return [V.X(q[0]), V.Y(q[1])]; }, iu = Math.round(u * N);
    c.lineCap = "round";
    for (let i = 0; i < N; i++) {
      const gg = (g[i] + g[i + 1]) / 2, col = gg > .04 * gm ? T.good : gg < -.04 * gm ? T.bad : T.muted, done = i < iu;
      c.strokeStyle = rgbS(col, done ? 1 : .28); c.lineWidth = done ? 5 : 3.5;
      const a = at(i / N), b = at((i + 1) / N); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    for (const s of [.18, .43, .68, .93]) { const a = at(s - .004), b = at(s + .004), dx = b[0] - a[0], dy = b[1] - a[1], L = hypot(dx, dy) || 1; arrowPx(c, a[0] - dx / L * 6, a[1] - dy / L * 6, dx / L * 12, dy / L * 12, rgbS(T.ink, .75), 2, 10); }
    const s0 = at(0); c.strokeStyle = rgbS(T.ink); c.lineWidth = 2; c.fillStyle = rgbS(T.plot); c.beginPath(); c.arc(s0[0], s0[1], 5, 0, TAU); c.fill(); c.stroke();
    c.font = `11px ${MONO}`; c.fillStyle = rgbS(T.ink); c.textAlign = "center"; c.fillText("start", s0[0], s0[1] + (pk === "loop" ? -12 : 20));
    // the bead: F in gold, and the unit direction it's measured against in blue
    const q = p.r(u), d = p.d(u), dl = hypot(d[0], d[1]) || 1, w = dirOf(d).map(c2 => c2 / dl), f = F(q[0], q[1]), bx = V.X(q[0]), by = V.Y(q[1]);
    arrowPx(c, bx, by, w[0] * 46, -w[1] * 46, rgbS(T.accent), 3, 11);
    arrowPx(c, bx, by, f[0] * k * 1.25, -f[1] * k * 1.25, rgbS(T.cursor), 3.2, 11);
    c.fillStyle = rgbS(T.plot); c.strokeStyle = rgbS(T.ink); c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, 7, 0, TAU); c.fill(); c.stroke();
    c.font = `600 12px ${MONO}`; c.fillStyle = rgbS(T.accent); c.fillText(mode === "along" ? "T" : "N", bx + w[0] * 58, by - w[1] * 58 + 4);
    // the gauge: F·T or F·N at the bead
    const val = f[0] * w[0] + f[1] * w[1], gx = W - 40, gh = min(110, H / 2 - 36), gy = H / 2, bh = clamp(val / tab.um, -1, 1) * gh;
    c.fillStyle = rgbS(T.plot, .9); c.fillRect(gx - 26, gy - gh - 30, 52, 2 * gh + 52);
    c.strokeStyle = rgbS(T.line); c.lineWidth = 1; c.strokeRect(gx - 9, gy - gh, 18, 2 * gh);
    c.fillStyle = rgbS(val > 0 ? T.good : T.bad); c.fillRect(gx - 8, min(gy, gy - bh), 16, abs(bh));
    c.strokeStyle = rgbS(T.ink, .7); c.beginPath(); c.moveTo(gx - 13, gy); c.lineTo(gx + 13, gy); c.stroke();
    c.font = `600 11px ${MONO}`; c.fillStyle = rgbS(T.ink); c.textAlign = "center"; c.fillText(mode === "along" ? "F·T" : "F·N", gx, gy - gh - 12);
    set("d", num(val)); set("s", num(cum[iu])); set("t", num(cum[N]));
    $(`#${id}TOut`).textContent = Math.round(u * 100) + "%";
  }
  const redo = () => { tab = null; draw(); };
  seg(`#${id}Field`, key => { fk = key; set("f", FIELDS[fk].tex, true); ks = 1.3 / fastest(V, F); specks.fill(V); redo(); });
  seg(`#${id}Path`, key => { pk = key; redo(); });
  seg(`#${id}Mode`, key => { mode = key; labels(); redo(); });
  $(`#${id}Rev`).addEventListener("click", () => { rev = !rev; $(`#${id}Rev`).setAttribute("aria-pressed", String(rev)); redo(); });
  onSlide(tsl, () => { u = +tsl.value / 1000; draw(); });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  labels(); draw(); ks = 1.3 / fastest(V, F); specks.fill(V); draw();
  whenVisible(cv, dt => { specks.step(dt, F, ks, V); draw(); });
}
lineLab("llA", { field: "swirl", path: "arc", mode: "along" });
lineLab("llB", { field: "source", path: "loop", mode: "across" });
