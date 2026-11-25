/* MOSFET Playground. One live device model drives every picture, plot, readout and circuit on the page.
   Model: Sah's equations with channel-length modulation (SPICE level 1), with optional subthreshold smoothing in the
   LTspice VDMOS form, and temperature-dependent mobility and threshold. verify.py checks the formulas. */
let T = tokens(TOK);
const redraws = [];
themeListeners.push(() => { T = tokens(TOK); redraws.forEach(f => f()); });
const QE = 1.602176634e-19, KB = 1.380649e-23, EPS0 = 8.8541878128e-12, KOX = 3.9;
const MONO = css("--f-mono") || "monospace";
const SIM = { speed: 1, paused: false, get k() { return this.paused ? 0 : this.speed; } };

/* ---------- formatting ---------- */
function eng(v, u = "", d = 4, gap = "") {
  if (!isFinite(v)) return "–";
  if (v === 0) return "0" + gap + u;
  const a = Math.abs(v), P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
  for (const [f, p] of P) if (a >= f * .9995 || f === 1e-15) { const s = (v / f).toPrecision(d); return (s.includes("e") ? String(+s) : s).replace("-", "−") + gap + p + u; }
}
const E3 = (v, u) => eng(v, u, 3, " ");
const fV = v => minus((+v).toFixed(2)) + " V";
function sciH(v, d = 2) {
  if (!isFinite(v)) return "–"; if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v))); return `${minus((v / 10 ** e).toFixed(d))} × 10<sup>${minus(String(e))}</sup>`;
}
/* a number with a unit, for KaTeX: 0.0472 A -> 47.2\,\text{mA} */
function tn(v, u = "", d = 4) {
  if (!isFinite(v)) return "\\infty";
  const uu = u === "Ω" ? "\\Omega" : u === "A/V²" ? "\\text{A/V}^2" : u ? `\\text{${u}}` : "";
  if (v === 0) return "0" + (uu ? "\\," + uu : "");
  const a = Math.abs(v), P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "\\mu"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
  for (const [f, p] of P) if (a >= f * .9995 || f === 1e-15) {
    let s = (v / f).toPrecision(d); if (s.includes("e")) s = String(+s);
    const pp = p === "\\mu" ? "\\mu" : p ? `\\text{${p}}` : "";
    return s + (pp || uu ? "\\," + pp + uu : "");
  }
}
const E6 = [1, 1.5, 2.2, 3.3, 4.7, 6.8, 10];
function e6(v) { const e = Math.floor(Math.log10(v)), m = v / 10 ** e; let b = 1; for (const x of E6) if (Math.abs(Math.log(x / m)) < Math.abs(Math.log(b / m))) b = x; return +(b * 10 ** e).toPrecision(3); }
function nceil(v) { const e = Math.floor(Math.log10(v)), m = v / 10 ** e; for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s >= m - 1e-9) return s * 10 ** e; return 10 ** (e + 1); }
function root(f, lo, hi, n = 64) {          // f increasing; returns where it crosses zero
  if (f(lo) >= 0) return lo; if (f(hi) <= 0) return hi;
  for (let k = 0; k < n; k++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- the device model ---------- */
const coxOf = tox => EPS0 * KOX / (tox * 1e-9);          // F/m² for an oxide tox nm thick
const VSAT = { n: 1e5, p: 8e4 };                           // carrier saturation velocity, m/s
/* c: { mu cm²/V·s, tox nm, W µm, L µm, VT V (its size), lam 1/V }; env: { T kelvin, sub (subthreshold on), nss (slope factor n) } */
function makeDev(c, type, env) {
  const cox = coxOf(c.tox), mu = c.mu * Math.pow(env.T / 300, -1.5), kp = mu * 1e-4 * cox, phit = KB * env.T / QE;
  return { type, c, cox, mu, kp, beta: kp * c.W / c.L, vt: Math.max(.02, c.VT - .002 * (env.T - 300)), lam: c.lam, W: c.W * 1e-6, L: c.L * 1e-6,
    phit, n: env.nss, ks: 2 * env.nss * phit, sub: env.sub, T: env.T, vsat: VSAT[type] };
}
function vovE(d, vgs) { const x = vgs - d.vt; if (!d.sub) return Math.max(0, x); return x / d.ks > 40 ? x : d.ks * Math.log1p(Math.exp(x / d.ks)); }
/* drain current for a device d. vgs, vds are VGS and VDS (n) or VSG and VSD (p): always the positive "flipped" quantities */
function idOf(d, vgs, vds) {
  if (vds < 0) return -idOf(d, vgs - vds, -vds);
  const v = vovE(d, vgs); if (v <= 0) return 0;
  const c = 1 + d.lam * vds;
  return vds < v ? d.beta * (v * vds - vds * vds / 2) * c : d.beta / 2 * v * v * c;
}
function regionOf(d, vgs, vds) {
  if (vgs - d.vt <= 0) return d.sub ? "subthreshold" : "cutoff";
  return vds < vovE(d, vgs) ? "triode" : "saturation";
}
/* the channel from the source (x = 0) to the drain (x = 1, in units of L). V: channel voltage above the source.
   q: the local overdrive Vov − V(x), which is the channel's charge per area divided by Cox. E: dV/dx, in volts per L.
   In saturation the channel ends at the pinch-off point xp; the rest of VDS drops across the depleted gap to the drain. */
function profile(d, vgs, vds, n = 120) {
  const v = vovE(d, vgs), vd = Math.max(0, vds), o = { xs: [], V: [], q: [], E: [], xp: 1, sat: false, v, on: v > 1e-9 };
  if (!o.on) return o;
  const sat = vd >= v, ve = sat ? v : vd, xp = sat ? 1 / (1 + d.lam * (vd - v)) : 1, K = 2 * v * ve - ve * ve;
  o.sat = sat; o.xp = xp;
  for (let i = 0; i <= n; i++) {
    const x = i / n; o.xs.push(x);
    if (x <= xp || xp >= 1) { const r = Math.sqrt(Math.max(0, v * v - Math.min(1, x / xp) * K)); o.V.push(v - r); o.q.push(r); o.E.push(K / (2 * xp * Math.max(r, .02 * v))); }
    else { o.V.push(v + (vd - v) * (x - xp) / (1 - xp)); o.q.push(0); o.E.push((vd - v) / (1 - xp)); }
  }
  o.qavg = sat ? xp * 2 / 3 * v : K < 1e-12 * v * v ? v : 2 * (v ** 3 - (v - ve) ** 3) / (3 * K);
  o.E0 = K / (2 * xp * v);
  return o;
}
/* everything about one operating point */
function opState(d, vgs, vds) {
  const id = idOf(d, vgs, vds), h = 1e-4;
  const gm = (idOf(d, vgs + h, vds) - idOf(d, vgs - h, vds)) / (2 * h), gds = (idOf(d, vgs, vds + h) - idOf(d, vgs, vds - h)) / (2 * h);
  const reg = regionOf(d, vgs, vds), vove = vovE(d, vgs), pr = profile(d, vgs, vds), WLC = d.W * d.L * d.cox;
  const cg = reg === "triode" ? WLC : 2 / 3 * WLC, Q = pr.on ? d.W * d.L * d.cox * pr.qavg : 0;
  return { d, vgs, vds, id, gm, gds, ro: gds > 1e-30 ? 1 / gds : Infinity, reg, vove, x: vgs - d.vt, P: id * vds, rds: id > 0 ? vds / id : Infinity, pr,
    WLC, cg, Q, N: Q / QE, ns: d.cox * vove / QE * 1e-4, vel: pr.on && vove > 0 ? id / (d.W * d.cox * vove) : 0, tau: id > 0 ? Q / id : Infinity,
    fT: cg > 0 ? gm / (2 * Math.PI * cg) : 0, eox: Math.abs(vgs) / (d.c.tox * 1e-9) / 1e8, elat: vds / d.L / 1e6, ec: d.vsat / (d.mu * 1e-4) / 1e6,
    theta: vove / (d.vsat / (d.mu * 1e-4) * d.L), ss: d.n * d.phit * Math.log(10) * 1e3 };
}

/* ---------- canvas helpers ---------- */
function tag(c, x, y, s, col, align = "left", size = 11, w = 600) { c.font = `${w} ${size}px ${MONO}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }
function pill(c, x, y, s, col, align = "left", size = 11) {
  c.font = `600 ${size}px ${MONO}`; const w = c.measureText(s).width, x0 = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
  c.fillStyle = rgbS(T.plot, .86); c.fillRect(x0 - 4, y - size + 1, w + 8, size + 5); tag(c, x, y, s, col, align, size);
}
function line(c, pts, col, w = 2, dash) { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); let on = false; for (const p of pts) { if (!p || !isFinite(p[1])) { on = false; continue; } if (on) c.lineTo(p[0], p[1]); else { c.moveTo(p[0], p[1]); on = true; } } c.stroke(); c.setLineDash([]); }
function dot(c, x, y, col, r = 5.5) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); c.strokeStyle = rgbS(T.plot); c.lineWidth = 1.5; c.stroke(); }
function nice(lo, hi, n = 6) {
  const span = hi - lo || 1, s0 = span / n, p = 10 ** Math.floor(Math.log10(s0)), m = s0 / p, st = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, t = [];
  for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + st * 1e-9; v += st) t.push(+v.toPrecision(12));
  return t;
}
function decs(lo, hi) { const a = Math.ceil(Math.log10(lo) - 1e-9), b = Math.floor(Math.log10(hi) + 1e-9), st = b - a > 9 ? 3 : b - a > 6 ? 2 : 1, t = []; for (let k = a; k <= b; k += st) t.push(10 ** k); return t; }
const PFX = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
function pfx(m) { for (const [f, p] of PFX) if (m >= f * .999) return [f, p]; return [1e-15, "f"]; }
const tickTxt = v => minus(String(+v.toPrecision(5)));
/* a plot frame. o.x / o.y / o.y2 = { lo, hi, log, name, unit, fixed (no SI prefix), n, col }; o.area = [top, bot] draws into a band.
   keep = an existing canvas2d() result: draw on top without clearing. */
function frame(cv, o, keep) {
  const g = keep || canvas2d(cv), { c, W, H } = g, l = 64, r = W - (o.y2 ? 62 : 18), top = o.area ? o.area[0] : 30, bot = o.area ? o.area[1] : H - 38;
  const map = (a, p0, p1) => a.log ? (v => p0 + (Math.log10(Math.max(v, a.lo / 1e4)) - Math.log10(a.lo)) / (Math.log10(a.hi) - Math.log10(a.lo)) * (p1 - p0))
    : (v => p0 + (v - a.lo) / (a.hi - a.lo) * (p1 - p0));
  const X = map(o.x, l, r), Y = map(o.y, bot, top), Y2 = o.y2 ? map(o.y2, bot, top) : null;
  if (!keep) { c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H); }
  const tk = a => a.log ? decs(a.lo, a.hi) : nice(a.lo, a.hi, a.n || 6);
  const lab = a => { if (a.log) return t => eng(t, "", 1); const [f] = a.fixed ? [1] : pfx(Math.max(Math.abs(a.lo), Math.abs(a.hi))); return t => tickTxt(t / f); };
  const ttl = a => { if (a.log) return `${a.name}, ${a.unit || ""} (log)`; const [, p] = pfx(Math.max(Math.abs(a.lo), Math.abs(a.hi))); return a.unit ? `${a.name}, ${a.fixed ? "" : p}${a.unit}` : a.name; };
  const xt = tk(o.x), yt = tk(o.y), lx = lab(o.x), ly = lab(o.y);
  c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath();
  for (const t of xt) { c.moveTo(X(t), top); c.lineTo(X(t), bot); } for (const t of yt) { c.moveTo(l, Y(t)); c.lineTo(r, Y(t)); }
  c.stroke(); c.setLineDash([]);
  c.strokeStyle = rgbS(T.muted, .7); c.lineWidth = 1; c.strokeRect(l + .5, top + .5, r - l, bot - top);
  if (!o.noX) for (const t of xt) tag(c, X(t), bot + 15, lx(t), rgbS(T.muted), "center", 10.5, 500);
  for (const t of yt) tag(c, l - 6, Y(t) + 4, ly(t), rgbS(o.y.col || T.muted), "right", 10.5, 500);
  if (o.y2) { const l2 = lab(o.y2); for (const t of tk(o.y2)) tag(c, r + 6, Y2(t) + 4, l2(t), rgbS(o.y2.col || T.muted), "left", 10.5, 500); tag(c, W - 6, top - 9, ttl(o.y2), rgbS(o.y2.col || T.muted), "right", 11, 600); }
  if (!o.noX) tag(c, (l + r) / 2, o.area ? bot + 31 : H - 6, ttl(o.x), rgbS(T.muted), "center", 11, 600);
  tag(c, 8, top - 9, ttl(o.y), rgbS(o.y.col || T.muted), "left", 11, 600);
  const clip = () => { c.save(); c.beginPath(); c.rect(l, top, r - l, bot - top); c.clip(); };
  const ix = px => o.x.lo + (px - l) / (r - l) * (o.x.hi - o.x.lo), iy = py => o.y.lo + (bot - py) / (bot - top) * (o.y.hi - o.y.lo);
  return { c, W, H, l, r, top, bot, X, Y, Y2, clip, ix, iy, g };
}
function curve(P, f, x0, x1, n = 200, Y = P.Y) { const pts = []; for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = f(x); pts.push(isFinite(y) ? [P.X(x), Y(y)] : null); } return pts; }
/* drag on a canvas: fn(px, py) in CSS pixels */
function dragOn(cv, fn) {
  let on = false;
  const at = e => { const r = cv.getBoundingClientRect(); fn(e.clientX - r.left, e.clientY - r.top); };
  cv.addEventListener("pointerdown", e => { on = true; cv.setPointerCapture(e.pointerId); at(e); });
  cv.addEventListener("pointermove", e => { if (on) at(e); });
  cv.addEventListener("pointerup", () => { on = false; }); cv.addEventListener("pointercancel", () => { on = false; });
}

/* ---------- sliders ---------- */
/* s = { id, label, min, max, log, zero (a log slider whose far left is exactly 0), step, fmt, get, set, hint, on } */
function mkSl(host, s) {
  const w = document.createElement("div"); w.className = "sl";
  w.innerHTML = `<label for="${s.id}"><span>${s.label}</span> <b id="${s.id}Out"></b></label><input type="range" id="${s.id}">${s.hint ? `<small class="hint">${s.hint}</small>` : ""}`;
  host.appendChild(w);
  const inp = w.querySelector("input"), out = w.querySelector("b");
  const toV = x => s.log ? (s.zero && x <= 0 ? 0 : s.min * Math.pow(s.max / s.min, x / 1000)) : x;
  const toX = v => s.log ? (v <= 0 ? 0 : clamp(1000 * Math.log(v / s.min) / Math.log(s.max / s.min), s.zero ? 1 : 0, 1000)) : v;
  const o = {
    inp, s, show() { out.textContent = s.fmt(s.get()); },
    range(min, max) { s.min = min; s.max = max; o.sync(); },
    sync() { if (!s.log) { inp.min = s.min; inp.max = s.max; inp.step = s.step || .01; } else { inp.min = 0; inp.max = 1000; inp.step = 1; } inp.value = toX(s.get()); o.show(); }
  };
  inp.addEventListener("input", () => { s.set(toV(+inp.value)); o.show(); if (s.on) s.on(); });
  o.sync(); return o;
}
const cell = (k, v, o = {}) => `<button type="button" class="read${o.on ? " on" : ""}" data-r="${o.r || ""}"><span class="k">${k}</span><span class="v">${v}</span></button>`;
const lc = (k, v) => `<div class="read"><span class="k">${k}</span><span class="v">${v}</span></div>`;

/* ---------- presets: real classes of part, never a homework's numbers ---------- */
const PRE = {
  practice: { name: "Practice switch part", blurb: "The Switches page's demo part: VT = 1.5 V, βn = 0.18 A/V², βp = 0.08 A/V², λ = 0, so it follows Sah's equations exactly.",
    n: { mu: 500, tox: 50, L: 2, beta: .18, VT: 1.5, lam: 0 }, p: { mu: 200, tox: 50, L: 2, beta: .08, VT: 1.5, lam: 0 },
    rate: { VDS: 30, VGS: 20, ID: 2, P: 1.25 }, rng: { vgs: 8, vds: 8 }, op: { vgs: 4, vds: 1.5 }, env: { T: 300, sub: false, nss: 1.5 }, vdd: 5 },
  small: { name: "Small-signal MOSFET (SOT-23 class)", blurb: "A tiny discrete part for logic-level loads: 60 V, but only 300 mA and 350 mW. The square law happily predicts far more than it can survive.",
    n: { mu: 600, tox: 40, L: 1.5, beta: .25, VT: 2, lam: .02 }, p: { mu: 250, tox: 40, L: 1.5, beta: .1, VT: 2, lam: .03 },
    rate: { VDS: 60, VGS: 20, ID: .3, P: .35 }, rng: { vgs: 10, vds: 20 }, op: { vgs: 2.6, vds: 5 }, env: { T: 300, sub: true, nss: 1.6 }, vdd: 12 },
  power: { name: "Logic-level power MOSFET (TO-220 class)", blurb: "Millions of cells in parallel: about a metre of total channel width, so β is huge and RDS(on) is milliohms.",
    n: { mu: 450, tox: 50, L: 1, beta: 40, VT: 1.8, lam: .004 }, p: { mu: 180, tox: 50, L: 1, beta: 16, VT: 1.9, lam: .005 },
    rate: { VDS: 30, VGS: 20, ID: 60, P: 60 }, rng: { vgs: 10, vds: 30 }, op: { vgs: 4.5, vds: .1 }, env: { T: 300, sub: true, nss: 1.8 }, vdd: 12 },
  chip: { name: "Chip transistor (180 nm CMOS)", blurb: "One transistor inside an IC: 4 nm oxide, 0.18 µm channel, a 1.8 V supply. Short channels mean a big λ and velocity saturation.",
    n: { mu: 350, tox: 4, L: .18, W: 2, VT: .45, lam: .1 }, p: { mu: 100, tox: 4, L: .18, W: 4, VT: .45, lam: .12 },
    rate: { VDS: 1.8, VGS: 1.8, ID: 1.5e-3, P: 3e-3 }, rng: { vgs: 1.8, vds: 1.8 }, op: { vgs: 1, vds: .9 }, env: { T: 300, sub: true, nss: 1.4 }, vdd: 1.8 },
  textbook: { name: "Textbook long-channel (k′n = 100 µA/V²)", blurb: "The classic textbook amplifier device: W/L = 10, β = 1 mA/V², VT = 0.7 V. Good for kΩ-scale amplifiers and mirrors.",
    n: { mu: 500, tox: 17.266, L: 1, W: 10, VT: .7, lam: .02 }, p: { mu: 200, tox: 17.266, L: 1, W: 25, VT: .8, lam: .03 },
    rate: { VDS: 5, VGS: 5, ID: 10e-3, P: 25e-3 }, rng: { vgs: 5, vds: 5 }, op: { vgs: 1.2, vds: 2.5 }, env: { T: 300, sub: false, nss: 1.5 }, vdd: 5 }
};

/* ---------- workbench state ---------- */
const B = { type: "n", pre: "practice", dev: {}, env: {}, rate: {}, rng: {}, op: {}, past: false, pins: [], tr: "lin", fz: "fit", famY: 0, sweep: null, ex: "id", edited: false };
let D, ST;
function loadPreset(k) {
  const p = PRE[k]; B.pre = k;
  for (const t of ["n", "p"]) { const c = { ...p[t] }; if (c.beta) { c.W = c.beta * c.L / (c.mu * 1e-4 * coxOf(c.tox)); delete c.beta; } B.dev[t] = c; }
  B.env = { ...p.env }; B.rate = { ...p.rate }; B.rng = { ...p.rng }; B.op = { ...p.op }; B.edited = false; B.famY = 0;
}
const opMax = k => B.past ? Math.max(B.rng[k], 1.3 * B.rate[k === "vgs" ? "VGS" : "VDS"]) : B.rng[k];
const NM = () => B.type === "n"
  ? { gs: "V<sub>GS</sub>", ds: "V<sub>DS</sub>", id: "I<sub>D</sub>", car: "electrons", cgs: "VGS", cds: "VDS", cid: "ID", cvt: "VT", tgs: "V_{GS}", tds: "V_{DS}", tid: "I_D", tvt: "V_T", vt: "V<sub>T</sub>" }
  : { gs: "V<sub>SG</sub>", ds: "V<sub>SD</sub>", id: "|I<sub>D</sub>|", car: "holes", cgs: "VSG", cds: "VSD", cid: "|ID|", cvt: "|VT|", tgs: "V_{SG}", tds: "V_{SD}", tid: "|I_D|", tvt: "|V_T|", vt: "|V<sub>T</sub>|" };

/* ---------- workbench controls ---------- */
const SL = {};
function buildBench() {
  const op = $("#bOp"), bd = $("#bBuild"), en = $("#bEnv"), rt = $("#bRate"), cfg = () => B.dev[B.type], on = () => { B.edited = true; benchUpdate(); };
  SL.vgs = mkSl(op, { id: "bVGS", label: "V<sub>GS</sub>, gate to source", min: 0, max: 8, step: .01, fmt: fV, get: () => B.op.vgs, set: v => { B.op.vgs = v; }, on: benchUpdate,
    hint: "How hard the gate pulls carriers up against the oxide." });
  SL.vds = mkSl(op, { id: "bVDS", label: "V<sub>DS</sub>, drain to source", min: 0, max: 8, step: .01, fmt: fV, get: () => B.op.vds, set: v => { B.op.vds = v; }, on: benchUpdate,
    hint: "How hard the drain pulls those carriers across." });
  SL.mu = mkSl(bd, { id: "bMu", label: "Mobility μ (at 300 K)", min: 20, max: 1500, log: true, fmt: v => v.toFixed(0) + " cm²/V·s", get: () => cfg().mu, set: v => { cfg().mu = v; }, on,
    hint: "How easily carriers drift. Electrons in a channel: about 300 to 600. Holes: 2 to 3 times less." });
  SL.tox = mkSl(bd, { id: "bTox", label: "Oxide thickness t<sub>ox</sub>", min: 1, max: 200, log: true, fmt: v => eng(v * 1e-9, "m", 3, " "), get: () => cfg().tox, set: v => { cfg().tox = v; }, on,
    hint: "Thinner oxide, more capacitance per area, more channel charge per volt." });
  SL.W = mkSl(bd, { id: "bW", label: "Width W", min: .1, max: 3e6, log: true, fmt: v => eng(v * 1e-6, "m", 3, " "), get: () => cfg().W, set: v => { cfg().W = v; }, on,
    hint: "Into the screen. More width is more channel side by side." });
  SL.L = mkSl(bd, { id: "bL", label: "Length L", min: .02, max: 50, log: true, fmt: v => eng(v * 1e-6, "m", 3, " "), get: () => cfg().L, set: v => { cfg().L = v; }, on,
    hint: "Source to drain. Shorter is stronger and faster, until short-channel effects bite." });
  SL.VT = mkSl(bd, { id: "bVT", label: "Threshold V<sub>T</sub> (at 300 K)", min: .1, max: 5, step: .01, fmt: fV, get: () => cfg().VT, set: v => { cfg().VT = v; }, on,
    hint: "Set by doping and the gate material: the gate voltage where a channel forms." });
  SL.lam = mkSl(bd, { id: "bLam", label: "Channel-length modulation λ", min: 0, max: .3, step: .001, fmt: v => v.toFixed(3) + " /V", get: () => cfg().lam, set: v => { cfg().lam = v; }, on,
    hint: "How much the saturated current still creeps up with VDS. 0 is an ideal current source." });
  SL.T = mkSl(en, { id: "bT", label: "Temperature", min: 220, max: 450, step: 1, fmt: v => `${v.toFixed(0)} K (${(v - 273.15).toFixed(0)} °C)`, get: () => B.env.T, set: v => { B.env.T = v; }, on,
    hint: "Mobility falls as T<sup>−1.5</sup>; VT drops about 2 mV per kelvin." });
  SL.nss = mkSl(en, { id: "bN", label: "Subthreshold slope factor n", min: 1, max: 2.5, step: .01, fmt: v => v.toFixed(2), get: () => B.env.nss, set: v => { B.env.nss = v; }, on,
    hint: "1 is the physical best. Real parts: 1.2 to 1.8." });
  const rate = (k, id, label, min, max, u, hint) => { SL[id] = mkSl(rt, { id, label, min, max, log: true, fmt: v => E3(v, u), get: () => B.rate[k], set: v => { B.rate[k] = v; }, on: () => { if (B.past) setOpRanges(); on(); }, hint }); };
  rate("VDS", "bRVDS", "V<sub>DS(max)</sub>", .5, 200, "V", "Past this the drain junction avalanches.");
  rate("VGS", "bRVGS", "V<sub>GS(max)</sub>", .5, 40, "V", "Past this the gate oxide punctures.");
  rate("ID", "bRID", "I<sub>D(max)</sub>", 1e-6, 300, "A", "Bond wires, metal and the die's current limit.");
  rate("P", "bRP", "P<sub>max</sub>", 1e-6, 300, "W", "The heat that takes the die from 25 °C to 150 °C.");
  $("#bSub").addEventListener("change", e => { B.env.sub = e.target.checked; on(); });
  $("#bPast").addEventListener("change", e => { B.past = e.target.checked; setOpRanges(); benchUpdate(); });
  const sel = $("#bPre"); sel.innerHTML = Object.entries(PRE).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("");
  sel.addEventListener("change", () => applyPreset(sel.value));
  seg("#bType", k => { B.type = k; B.famY = 0; syncAll(); benchUpdate(); });
  seg("#trSeg", k => { B.tr = k; drawTr(); });
  seg("#famSeg", k => { B.fz = k; B.famY = 0; drawFam(); });
  $("#bSwG").addEventListener("click", () => toggleSweep("vgs"));
  $("#bSwD").addEventListener("click", () => toggleSweep("vds"));
  $("#bPin").addEventListener("click", pinNow);
  $("#bUnpin").addEventListener("click", () => { B.pins = []; benchUpdate(); });
  speedUI("#simSpd", "#simPause");
  $("#bReads").addEventListener("click", e => { const b = e.target.closest("button.read"); if (b && b.dataset.r) { B.ex = b.dataset.r; readouts(); } });
  dragOn($("#famCv"), px => { if (!PF.fam) return; B.op.vds = clamp(PF.fam.ix(px), 0, opMax("vds")); SL.vds.sync(); benchUpdate(); });
  dragOn($("#trCv"), px => { if (!PF.tr) return; B.op.vgs = clamp(PF.tr.ix(px), 0, opMax("vgs")); SL.vgs.sync(); benchUpdate(); });
  dragOn($("#mapCv"), (px, py) => { if (!PF.map) return; B.op.vgs = clamp(PF.map.ix(px), 0, opMax("vgs")); B.op.vds = clamp(PF.map.iy(py), 0, opMax("vds")); SL.vgs.sync(); SL.vds.sync(); benchUpdate(); });
}
function setOpRanges() {
  B.op.vgs = Math.min(B.op.vgs, opMax("vgs")); B.op.vds = Math.min(B.op.vds, opMax("vds"));
  SL.vgs.range(0, opMax("vgs")); SL.vds.range(0, opMax("vds"));
}
function syncAll() {
  const n = NM(), lab = id => $(id).previousElementSibling.firstElementChild;
  lab("#bVGS").innerHTML = `${n.gs}, ${B.type === "n" ? "gate to source" : "source to gate"}`;
  lab("#bVDS").innerHTML = `${n.ds}, ${B.type === "n" ? "drain to source" : "source to drain"}`;
  lab("#bVT").innerHTML = `Threshold ${n.vt} (at 300 K)`;
  Object.values(SL).forEach(s => s.sync()); setOpRanges(); sweepUI();
  $("#bSub").checked = B.env.sub; $("#bPast").checked = B.past; $("#bPre").value = B.pre;
  $$("#bType button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === B.type)));
  $$("#trSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === B.tr)));
  $("#bPreNote").textContent = PRE[B.pre].blurb;
  $("#famT").innerHTML = `Output curves · ${n.id} against ${n.ds}`; $("#trT").innerHTML = `Transfer curve · ${n.id} against ${n.gs}`; $("#mapT").innerHTML = `Region map · ${n.ds} against ${n.gs}`;
}
function applyPreset(k) { loadPreset(k); B.pins = []; B.sweep = null; syncAll(); benchUpdate(); labReset(); }
function speedUI(sId, pId) {
  const s = $(sId), p = $(pId), toV = x => .1 * Math.pow(50, x / 1000), toX = v => 1000 * Math.log(v / .1) / Math.log(50);
  const show = () => {
    $$(".spdOut").forEach(e => { e.textContent = SIM.speed.toFixed(SIM.speed < 1 ? 2 : 1) + "×"; });
    $$(".spdIn").forEach(e => { if (e !== document.activeElement) e.value = toX(SIM.speed); });
    $$(".spdPause").forEach(b => { b.textContent = SIM.paused ? "Play" : "Pause"; b.setAttribute("aria-pressed", String(SIM.paused)); });
  };
  s.classList.add("spdIn"); p.classList.add("spdPause"); s.min = 0; s.max = 1000; s.step = 1;
  s.addEventListener("input", () => { SIM.speed = toV(+s.value); show(); });
  p.addEventListener("click", () => { SIM.paused = !SIM.paused; show(); });
  show();
}
function toggleSweep(k) {
  if (B.sweep && B.sweep.k === k) B.sweep = null;
  else { B.sweep = { k, dir: 1 }; if (B.op[k] > opMax(k) * .98) B.op[k] = 0; }
  sweepUI();
}
function sweepUI() {
  const n = NM(), on = k => !!B.sweep && B.sweep.k === k;
  $("#bSwG").setAttribute("aria-pressed", String(on("vgs"))); $("#bSwD").setAttribute("aria-pressed", String(on("vds")));
  $("#bSwG").textContent = (on("vgs") ? "Stop " : "Sweep ") + n.cgs; $("#bSwD").textContent = (on("vds") ? "Stop " : "Sweep ") + n.cds;
}
const PIN_C = ["t4", "t1", "s3"];
function pinNow() {
  if (B.pins.length >= 3) B.pins.shift();
  const c = B.dev[B.type], used = B.pins.map(p => p.col), col = PIN_C.find(x => !used.includes(x)) || "t4", d = makeDev({ ...c }, B.type, { ...B.env });
  B.pins.push({ d, col, label: `${B.type}-channel, β ${eng(d.beta, "A/V²", 3, " ")}, VT ${d.vt.toFixed(2)} V, λ ${d.lam.toFixed(3)}, ${B.env.T.toFixed(0)} K` });
  benchUpdate();
}

/* ---------- workbench update ---------- */
const PF = {};
function benchUpdate() {
  D = makeDev(B.dev[B.type], B.type, B.env); ST = opState(D, B.op.vgs, B.op.vds);
  xsStep(0); drawFam(); drawTr(); drawMap(); drawProf(); readouts(); cons(); story(); drawXs();
  const n = NM();
  $("#bStatus").textContent = `${ST.reg} · ${n.cid} = ${E3(ST.id, "A")}${B.edited ? " · edited" : ""}`;
  $("#pinList").innerHTML = B.pins.map(p => `<li><span class="sw" style="background:var(--${p.col})"></span>${p.label}</li>`).join("");
  labRefresh();
}

/* ---------- plot: the output family, ID against VDS ---------- */
function drawFam() {
  const cv = $("#famCv"), d = D, n = NM(), xm = opMax("vds"), gmax = opMax("vgs"), cur = x => idOf(d, B.op.vgs, x);
  let ym = 1.08 * idOf(d, gmax, xm) || 1e-9;
  if (B.fz === "fit") {
    const want = Math.max(cur(xm), ST.id, ...B.pins.map(p => idOf(p.d, B.op.vgs, xm)), 1e-12);
    if (!B.famY || want > .95 * B.famY || want < .3 * B.famY) B.famY = nceil(want * 1.35);
    ym = B.famY;
  }
  const P = PF.fam = frame(cv, { x: { lo: 0, hi: xm, name: n.cds, unit: "V" }, y: { lo: 0, hi: ym, name: n.cid, unit: "A" } }), c = P.c;
  P.clip();
  /* regions: the pinch-off locus ID = (β/2) VDS² (1 + λ VDS) splits triode (above it) from saturation (below it) */
  c.fillStyle = css("--act"); c.globalAlpha = .55; c.fillRect(P.l, P.top, P.r - P.l, P.bot - P.top);
  const poly = curve(P, x => idOf(d, d.vt + x, x), 0, xm, 160).filter(Boolean);
  c.fillStyle = css("--nreg"); c.globalAlpha = .7; c.beginPath(); c.moveTo(P.l, P.top); poly.forEach(p => c.lineTo(p[0], Math.max(P.top, p[1]))); c.lineTo(P.r, P.top); c.closePath(); c.fill(); c.globalAlpha = 1;
  line(c, poly, rgbS(T.ink, .5), 1.3, [5, 4]);
  /* safe-operating-area limits */
  const R = B.rate, bad = rgbS(T.bad, .85);
  line(c, curve(P, x => R.P / x, xm * .002, xm, 200), bad, 1.4, [2, 3]);
  line(c, [[P.l, P.Y(R.ID)], [P.r, P.Y(R.ID)]], bad, 1.4, [2, 3]);
  if (R.VDS < xm) line(c, [[P.X(R.VDS), P.top], [P.X(R.VDS), P.bot]], bad, 1.4, [2, 3]);
  /* the family */
  for (const g of nice(0, gmax, 6).filter(v => v > d.vt + .02 && Math.abs(v - B.op.vgs) > .04)) {
    line(c, curve(P, x => idOf(d, g, x), 0, xm, 160), rgbS(T.muted, .75), 1.3);
    const yE = P.Y(idOf(d, g, xm)); if (yE > P.top + 44 && yE < P.bot - 6) tag(c, P.r - 4, yE - 4, `${g} V`, rgbS(T.muted), "right", 10, 500);
  }
  for (const p of B.pins) line(c, curve(P, x => idOf(p.d, B.op.vgs, x), 0, xm, 160), rgbS(T[p.col]), 2.2, [7, 5]);
  line(c, curve(P, cur, 0, xm, 240), rgbS(T.accent), 3);
  /* the slope at the operating point: gds = 1/ro */
  const x0 = B.op.vds, y0 = ST.id, dx = xm * .14;
  if (ST.id > 0) line(c, [[P.X(x0 - dx), P.Y(y0 - ST.gds * dx)], [P.X(x0 + dx), P.Y(y0 + ST.gds * dx)]], rgbS(T.cursor, .9), 1.6, [4, 3]);
  line(c, [[P.X(x0), P.bot], [P.X(x0), P.Y(y0)], [P.l, P.Y(y0)]], rgbS(T.ink, .45), 1, [3, 3]);
  dot(c, P.X(x0), P.Y(y0), rgbS(T.cursor), 6.5);
  c.restore();
  pill(c, P.l + 8, P.top + 16, "triode", rgbS(T.ink), "left", 10.5);
  pill(c, P.r - 8, P.bot - 10, "saturation", rgbS(T.ink), "right", 10.5);
  pill(c, P.r - 8, clamp(P.Y(cur(xm)) - 8, P.top + 34, P.bot - 28), `${n.cgs} = ${B.op.vgs.toFixed(2)} V`, rgbS(T.accent), "right", 11);
  if (R.P / xm < ym) pill(c, P.r - 8, P.top + 16, "red dots: power and current limits", bad, "right", 10);
}

/* ---------- plot: the transfer curve, ID against VGS ---------- */
function drawTr() {
  const cv = $("#trCv"), d = D, n = NM(), xm = opMax("vgs"), vds = B.op.vds, f = x => idOf(d, x, vds), mode = B.tr;
  const hot = Math.abs(B.env.T - 300) > .5 ? makeDev(B.dev[B.type], B.type, { ...B.env, T: 300 }) : null;
  const top = Math.max(f(xm), hot ? idOf(hot, xm, vds) : 0, ...B.pins.map(p => idOf(p.d, xm, vds)), 1e-12);
  const xa = { lo: 0, hi: xm, name: n.cgs, unit: "V" };
  let o;
  if (mode === "log") { const hi = 10 ** Math.ceil(Math.log10(top * 1.5)); o = { x: xa, y: { lo: hi / 1e10, hi, log: true, name: n.cid, unit: "A" } }; }
  else if (mode === "sqrt") o = { x: xa, y: { lo: 0, hi: Math.sqrt(top) * 1.08, name: "√" + n.cid, unit: "√A", fixed: true } };
  else o = { x: xa, y: { lo: 0, hi: top * 1.08, name: n.cid, unit: "A" } };
  const P = PF.tr = frame(cv, o), c = P.c, Yv = mode === "sqrt" ? v => P.Y(Math.sqrt(Math.max(0, v))) : P.Y;
  P.clip();
  c.fillStyle = rgbS(T.muted, .08); c.fillRect(P.l, P.top, P.X(d.vt) - P.l, P.bot - P.top);
  line(c, [[P.X(d.vt), P.top], [P.X(d.vt), P.bot]], rgbS(T.ink, .5), 1.2, [3, 3]);
  if (hot) line(c, curve(P, x => idOf(hot, x, vds), 0, xm, 260, Yv), rgbS(T.muted), 2, [6, 4]);
  for (const p of B.pins) line(c, curve(P, x => idOf(p.d, x, vds), 0, xm, 260, Yv), rgbS(T[p.col]), 2.2, [7, 5]);
  line(c, curve(P, f, 0, xm, 400, Yv), rgbS(T.accent), 3);
  const x0 = B.op.vgs, y0 = ST.id;
  if (mode === "lin" && ST.gm > 0) { const dx = xm * .12; line(c, [[P.X(x0 - dx), P.Y(y0 - ST.gm * dx)], [P.X(x0 + dx), P.Y(y0 + ST.gm * dx)]], rgbS(T.cursor, .95), 1.8, [4, 3]); }
  if (mode === "sqrt") { const s = Math.sqrt(d.beta / 2 * (1 + d.lam * vds)); line(c, [[P.X(d.vt), P.bot], [P.X(xm), P.Y(s * (xm - d.vt))]], rgbS(T.cursor, .9), 1.5, [4, 3]); }
  line(c, [[P.X(x0), P.bot], [P.X(x0), Yv(y0)]], rgbS(T.ink, .4), 1, [3, 3]);
  if (y0 > 0 || mode !== "log") dot(c, P.X(x0), Yv(y0), rgbS(T.cursor), 6.5);
  c.restore();
  pill(c, P.X(d.vt) + 6, P.top + 16, `${n.cvt} = ${d.vt.toFixed(3)} V`, rgbS(T.ink), "left", 10.5);
  pill(c, P.X(d.vt) + 6, P.top + 33, `at ${n.cds} = ${vds.toFixed(2)} V`, rgbS(T.accent), "left", 10.5);
  if (hot) pill(c, P.X(d.vt) + 6, P.top + 50, "grey dash: the same part at 300 K", rgbS(T.muted), "left", 10);
  if (mode === "lin" && ST.gm > 0) pill(c, P.r - 8, P.bot - 10, "orange dash: slope = gm", rgbS(T.cursor), "right", 10);
  if (mode === "sqrt") pill(c, P.r - 8, P.bot - 10, "dash: the saturation line, crossing zero at VT", rgbS(T.cursor), "right", 10);
  if (mode === "log") pill(c, P.r - 8, P.bot - 10, d.sub ? `below VT: ${ST.ss.toFixed(0)} mV per decade` : "subthreshold off: the square law says exactly 0", rgbS(d.sub ? T.cursor : T.muted), "right", 10);
}

/* ---------- plot: the region map, VDS against VGS ---------- */
const MAPOFF = document.createElement("canvas");
function drawMap() {
  const cv = $("#mapCv"), d = D, n = NM(), xm = opMax("vgs"), ym = opMax("vds");
  const P = PF.map = frame(cv, { x: { lo: 0, hi: xm, name: n.cgs, unit: "V" }, y: { lo: 0, hi: ym, name: n.cds, unit: "V" } }), c = P.c;
  const gw = Math.max(20, Math.round((P.r - P.l) / 3)), gh = Math.max(16, Math.round((P.bot - P.top) / 3));
  MAPOFF.width = gw; MAPOFF.height = gh; const mc = MAPOFF.getContext("2d"), img = mc.createImageData(gw, gh), R = B.rate;
  const cCut = T.surface_2, cTri = hexRgb(css("--nreg")), cSat = hexRgb(css("--act")), cBad = T.bad;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const vg = (i + .5) / gw * xm, vd = (1 - (j + .5) / gh) * ym;
    let col = vg - d.vt <= 0 ? cCut : vd < vovE(d, vg) ? cTri : cSat;
    const id = idOf(d, vg, vd);
    if (id * vd > R.P || id > R.ID || vd > R.VDS || vg > R.VGS) col = lerpC(col, cBad, (i + j) % 4 < 2 ? .42 : .2);
    const k = 4 * (j * gw + i); img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
  }
  mc.putImageData(img, 0, 0);
  c.imageSmoothingEnabled = false; c.drawImage(MAPOFF, P.l + 1, P.top + 1, P.r - P.l - 1, P.bot - P.top - 1); c.imageSmoothingEnabled = true;
  P.clip();
  /* lines of constant current: every (VGS, VDS) pair on one line gives the same ID */
  const iso = I => { const pts = []; for (let k = 0; k <= 90; k++) { const vd = k / 90 * ym; if (idOf(d, xm, vd) < I) { pts.push(null); continue; } pts.push([P.X(root(v => idOf(d, v, vd) - I, 0, xm, 40)), P.Y(vd)]); } return pts; };
  const imax = idOf(d, xm, ym);
  for (const I of nice(0, imax, 4).filter(v => v > 0 && v < imax)) line(c, iso(I), rgbS(T.ink, .22), 1);
  if (ST.id > 0) line(c, iso(ST.id), rgbS(T.cursor, .9), 1.6, [5, 4]);
  const edge = []; for (let k = 0; k <= 120; k++) { const vg = d.vt + k / 120 * (xm - d.vt); edge.push([P.X(vg), P.Y(vovE(d, vg))]); }
  line(c, edge, rgbS(T.ink, .7), 1.6);
  line(c, [[P.X(d.vt), P.top], [P.X(d.vt), P.bot]], rgbS(T.ink, .7), 1.6);
  dot(c, P.X(B.op.vgs), P.Y(B.op.vds), rgbS(T.cursor), 7);
  c.restore();
  if (P.X(d.vt) - P.l > 60) pill(c, P.l + 6, P.top + 16, "cutoff", rgbS(T.ink), "left", 10.5);
  pill(c, P.r - 8, P.bot - 10, "triode", rgbS(T.ink), "right", 10.5);
  pill(c, P.X(d.vt) + 6, P.top + 16, "saturation", rgbS(T.ink), "left", 10.5);
  pill(c, P.r - 8, P.top + 16, "red hatch: past a rating", rgbS(T.bad), "right", 10);
}

/* ---------- plot: inside the channel, from source to drain ---------- */
function drawProf() {
  const cv = $("#prCv"), d = D, pr = ST.pr, n = NM(), Lu = d.L * 1e6, vm = Math.max(B.op.vds, pr.v || 0, .1) * 1.15;
  const em = Math.max(3 * B.op.vds / Lu, 1.4 * ST.ec, .1), car = B.type === "n" ? T.t2 : T.t3;
  const P = PF.pr = frame(cv, { x: { lo: 0, hi: d.L, name: "position, source to drain", unit: "m" }, y: { lo: 0, hi: vm, name: "volts", unit: "V", fixed: true }, y2: { lo: 0, hi: em, name: "field", unit: "V/µm", col: T.t3, fixed: true } }), c = P.c;
  if (!pr.on) { pill(c, (P.l + P.r) / 2, (P.top + P.bot) / 2, `no channel: ${n.cgs} is below ${n.cvt}`, rgbS(T.muted), "center", 12); return; }
  P.clip();
  const X = x => P.X(x * d.L), m = pr.xs.length;
  c.fillStyle = rgbS(car, .22); c.beginPath(); c.moveTo(X(0), P.bot);
  for (let i = 0; i < m; i++) c.lineTo(X(pr.xs[i]), P.Y(pr.q[i])); c.lineTo(X(1), P.bot); c.closePath(); c.fill();
  line(c, pr.xs.map((x, i) => [X(x), P.Y(pr.q[i])]), rgbS(car), 2);
  line(c, pr.xs.map((x, i) => [X(x), P.Y(pr.V[i])]), rgbS(T.accent), 2.8);
  line(c, pr.xs.map((x, i) => [X(x), P.Y2(pr.E[i] / Lu)]), rgbS(T.t3), 1.6, [6, 4]);
  line(c, [[P.l, P.Y2(ST.ec)], [P.r, P.Y2(ST.ec)]], rgbS(T.t3, .6), 1, [2, 3]);
  if (pr.sat && ST.x > 0) line(c, [[X(pr.xp), P.top], [X(pr.xp), P.bot]], rgbS(T.cursor), 1.5, [3, 3]);
  c.restore();
  pill(c, P.l + 8, P.top + 16, "V(x): the channel's voltage", rgbS(T.accent), "left", 10.5);
  pill(c, P.l + 8, P.top + 33, "shaded: charge ÷ Cox = Vov − V(x)", rgbS(car), "left", 10.5);
  pill(c, P.l + 8, P.top + 50, "red dash: the field along it", rgbS(T.t3), "left", 10.5);
  pill(c, P.r - 8, clamp(P.Y2(ST.ec) - 6, P.top + 66, P.bot - 26), "Ec: speed limit field", rgbS(T.t3), "right", 10);
  if (pr.sat && ST.x > 0) pill(c, clamp(X(pr.xp) - 6, P.l + 80, P.r), P.bot - 10, "pinch-off", rgbS(T.cursor), "right", 10.5);
}

/* ---------- the cross-section ---------- */
const XS = { parts: [], acc: 0 };
(function seeds() {
  const r = rng(11);
  XS.wS = Array.from({ length: 46 }, () => [r(), r(), r() * 6.28]); XS.wD = Array.from({ length: 46 }, () => [r(), r(), r() * 6.28]);
  XS.body = Array.from({ length: 110 }, () => [r(), r(), r() * 6.28]); XS.ions = Array.from({ length: 120 }, () => [r(), r()]);
})();
function xsGeo(W, H) {
  const c = B.dev[B.type], Lw = clamp((Math.log10(c.L) + 1.7) / 3.4, 0, 1), Lpx = W * (.18 + .2 * Lw), mid = W * .5;
  const xs = mid - Lpx / 2, xd = mid + Lpx / 2, ww = Math.min(W * .2, xs - 30), surf = Math.round(H * .39);
  const ox = 3 + 11 * clamp(Math.log10(c.tox) / Math.log10(200), 0, 1);
  return { xs, xd, sL: xs - ww, dR: xd + ww, surf, ox, wd: 78, gT: surf - ox - 38 };
}
const xsQ = (pr, x) => { if (!pr.on) return 0; const m = pr.xs.length - 1; return pr.q[clamp(Math.round(x * m), 0, m)]; };
/* carriers in the channel: density follows the charge, speed follows the field, so the flow is the same everywhere */
function xsStep(dt) {
  const pr = ST.pr, d = D, qRef = Math.max(opMax("vgs") - d.vt, .3), q0 = pr.on ? pr.v : 0, Pt = XS.parts, r = Math.random;
  const g0 = pr.on ? pr.E0 : 0, vmax = 4.5;
  let dens = 150 * clamp(q0 / qRef, 0, 1), vv = .9 * g0 / (g0 + .6 * Math.max(.2, pr.v || .2));
  if (q0 / qRef < .015 && ST.id > 0) { dens = Math.max(dens, 3 * clamp((Math.log10(ST.id) + 13) / 10, 0, 1)); vv = .35 * clamp(B.op.vds / .1, 0, 1); }
  if (dens < .2) { Pt.length = 0; return; }
  const exp = pr.on && q0 / qRef >= .015 ? dens * pr.qavg / q0 : dens;
  if (Pt.length < .55 * exp) while (Pt.length < exp) Pt.push({ x: r() * (pr.on ? pr.xp : 1), u: r(), j: r() * 6.28 });
  if (Pt.length > 1.5 * exp + 2) Pt.splice(0, Pt.length - Math.ceil(exp));
  XS.acc += dens * vv * dt; while (XS.acc >= 1) { XS.acc -= 1; Pt.push({ x: 0, u: r(), j: r() * 6.28 }); }
  for (const p of Pt) {
    const q = xsQ(pr, p.x), v = pr.on && q0 / qRef >= .015 ? (q > 1e-9 ? Math.min(vmax, vv * q0 / Math.max(q, .06 * q0)) : vmax) : vv;
    p.x += v * dt; p.j += dt * 9 * Math.sqrt(d.T / 300);
  }
  for (let i = Pt.length - 1; i >= 0; i--) if (Pt[i].x >= 1) Pt.splice(i, 1);
}
function drawXs(t = performance.now() / 1000) {
  const cv = $("#xsCv"), { c, W, H } = canvas2d(cv), G = xsGeo(W, H), d = D, pr = ST.pr, n = B.type === "n", N = NM();
  const body = hexRgb(css(n ? "--preg" : "--nreg")), well = hexRgb(css(n ? "--nreg" : "--preg")), car = n ? T.t2 : T.t3, maj = n ? T.t3 : T.t2;
  const qRef = Math.max(opMax("vgs") - d.vt, .3), th = x => 34 * clamp(xsQ(pr, x) / qRef, 0, 1.2), jit = .9 * Math.sqrt(d.T / 300);
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
  c.fillStyle = rgbS(body); c.fillRect(0, G.surf, W, H - G.surf);
  /* depletion: the gate pushes the body's majority carriers away until VT; the drain's reverse bias widens its junction */
  const dep0 = 12 + 26 * Math.sqrt(clamp(Math.max(0, B.op.vgs) / Math.max(d.vt, .05), 0, 1)), vr = Math.max(opMax("vds"), .5);
  const depX = x => dep0 + 22 * Math.sqrt(clamp((pr.on ? pr.V[Math.round(x * (pr.xs.length - 1))] : 0) / vr, 0, 1));
  const hS = 7, hD = 7 + 26 * Math.sqrt(clamp(B.op.vds / vr, 0, 1));
  const wellPath = (x0, x1, r) => { const b = G.surf + G.wd; c.beginPath(); c.moveTo(x0 - r, G.surf); c.lineTo(x0 - r, b - 16); c.quadraticCurveTo(x0 - r, b + r, x0 + 16, b + r); c.lineTo(x1 - 16, b + r); c.quadraticCurveTo(x1 + r, b + r, x1 + r, b - 16); c.lineTo(x1 + r, G.surf); c.closePath(); };
  c.fillStyle = rgbS(T.plot, .62); wellPath(G.sL, G.xs, hS); c.fill(); wellPath(G.xd, G.dR, hD); c.fill();
  c.beginPath(); c.moveTo(G.xs, G.surf);
  for (let k = 0; k <= 60; k++) { const x = k / 60; c.lineTo(G.xs + x * (G.xd - G.xs), G.surf + th(x) + depX(x)); }
  c.lineTo(G.xd, G.surf); c.closePath(); c.fill();
  c.strokeStyle = rgbS(T.muted, .55); c.setLineDash([4, 4]); c.lineWidth = 1; wellPath(G.sL, G.xs, hS); c.stroke(); wellPath(G.xd, G.dR, hD); c.stroke(); c.setLineDash([]);
  const inW = (x, y, x0, x1, r) => x > x0 - r && x < x1 + r && y < G.surf + G.wd + r;
  const inDep = (x, y) => {
    if (x > G.xs && x < G.xd) { const f = (x - G.xs) / (G.xd - G.xs); if (y < G.surf + th(f) + depX(f)) return true; }
    return inW(x, y, G.sL, G.xs, hS) || inW(x, y, G.xd, G.dR, hD);
  };
  /* fixed ions in the depleted silicon, and the body's free majority carriers outside it */
  c.fillStyle = rgbS(T.ink, .55); c.font = `700 10px ${MONO}`; c.textAlign = "center";
  for (const [a, b] of XS.ions) { const x = G.sL - 30 + a * (G.dR - G.sL + 60), y = G.surf + 5 + b * (G.wd + 40); if (inDep(x, y) && !inW(x, y, G.sL, G.xs, 0) && !inW(x, y, G.xd, G.dR, 0)) c.fillText(n ? "−" : "+", x, y + 3); }
  c.textAlign = "left";
  c.strokeStyle = rgbS(maj, .9); c.fillStyle = rgbS(maj, .9); c.lineWidth = 1.3; c.beginPath();
  for (const [a, b, ph] of XS.body) {
    const x = 6 + a * (W - 12) + jit * 2 * Math.sin(t * 2.1 + ph), y = G.surf + 6 + b * (H - G.surf - 30) + jit * 2 * Math.cos(t * 1.7 + ph);
    if (inDep(x, y) || inW(x, y, G.sL, G.xs, 3) || inW(x, y, G.xd, G.dR, 3)) continue;
    c.moveTo(x + 2.6, y); c.arc(x, y, 2.6, 0, 6.2832);
  }
  if (n) c.stroke(); else c.fill();
  /* the source and drain wells, full of free carriers */
  c.fillStyle = rgbS(well); c.strokeStyle = rgbS(car, .6); c.lineWidth = 1.2;
  wellPath(G.sL, G.xs, 0); c.fill(); c.stroke(); wellPath(G.xd, G.dR, 0); c.fill(); c.stroke();
  const wellDots = (pts, x0, x1) => { c.beginPath(); for (const [a, b, ph] of pts) { const x = x0 + 8 + a * (x1 - x0 - 16) + jit * 1.6 * Math.sin(t * 2.3 + ph), y = G.surf + 8 + b * (G.wd - 14) + jit * 1.6 * Math.cos(t * 1.9 + ph); c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, 6.2832); } };
  c.fillStyle = rgbS(car, .85); c.strokeStyle = rgbS(car, .95); c.lineWidth = 1.2;
  wellDots(XS.wS, G.sL, G.xs); if (n) c.fill(); else c.stroke(); wellDots(XS.wD, G.xd, G.dR); if (n) c.fill(); else c.stroke();
  pill(c, (G.sL + G.xs) / 2, G.surf + G.wd + 22, n ? "n+ source" : "p+ source", rgbS(T.ink), "center", 11);
  pill(c, (G.xd + G.dR) / 2, G.surf + G.wd + 15 + hD, n ? "n+ drain" : "p+ drain", rgbS(T.ink), "center", 11);
  /* the channel: a sheet of carriers whose thickness shows the charge per area */
  if (pr.on) {
    c.fillStyle = rgbS(car, .26); c.beginPath(); c.moveTo(G.xs, G.surf);
    for (let k = 0; k <= 80; k++) { const x = k / 80; c.lineTo(G.xs + x * (G.xd - G.xs), G.surf + th(x)); }
    c.lineTo(G.xd, G.surf); c.closePath(); c.fill();
    line(c, Array.from({ length: 81 }, (_, k) => [G.xs + k / 80 * (G.xd - G.xs), G.surf + th(k / 80)]), rgbS(car, .8), 1.3);
  }
  c.beginPath();
  for (const p of XS.parts) {
    const x = G.xs + p.x * (G.xd - G.xs), q = th(Math.min(p.x, 1)), y = G.surf + 2 + p.u * Math.max(2.5, q - 3) + jit * .8 * Math.sin(p.j);
    c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, 6.2832);
  }
  c.fillStyle = rgbS(car); c.strokeStyle = rgbS(car); c.lineWidth = 1.3; if (n) c.fill(); else c.stroke();
  if (pr.on && pr.sat && ST.x > 0) {
    const xp = G.xs + pr.xp * (G.xd - G.xs);
    line(c, [[xp, G.surf + 2], [xp, G.surf + 40]], rgbS(T.cursor), 1.4, [3, 3]);
    pill(c, Math.min(xp, G.xd - 4) - 4, G.surf + 54, "pinch-off", rgbS(T.cursor), "right", 10.5);
  }
  /* oxide and gate */
  const gx0 = G.xs - 14, gx1 = G.xd + 14, metal = rgbS(lerpC(T.muted, T.plot, .45));
  c.fillStyle = rgbS(lerpC(T.surface_2, T.t4, .3)); c.fillRect(gx0, G.surf - G.ox, gx1 - gx0, G.ox);
  c.strokeStyle = rgbS(T.muted, .7); c.lineWidth = 1; c.strokeRect(gx0 + .5, G.surf - G.ox + .5, gx1 - gx0 - 1, G.ox - 1);
  c.fillStyle = metal; c.fillRect(gx0, G.gT, gx1 - gx0, 37.5);
  c.strokeStyle = rgbS(T.ink, .5); c.strokeRect(gx0 + .5, G.gT + .5, gx1 - gx0 - 1, 37);
  const gq = Math.round(18 * clamp(B.op.vgs / opMax("vgs"), 0, 1.3));
  c.fillStyle = rgbS(n ? T.t3 : T.t2); c.font = `700 13px ${MONO}`; c.textAlign = "center";
  for (let k = 0; k < gq; k++) c.fillText(n ? "+" : "−", gx0 + 10 + (k + .5) * (gx1 - gx0 - 20) / gq, G.gT + 33);
  c.textAlign = "left";
  tag(c, (gx0 + gx1) / 2, G.gT + 16, `gate, on ${eng(d.c.tox * 1e-9, "m", 3, " ")} of oxide`, rgbS(T.ink), "center", 11);
  /* contacts, leads and terminal labels */
  const sx = (G.sL + G.xs) / 2, dx = (G.xd + G.dR) / 2, gxm = (gx0 + gx1) / 2;
  c.fillStyle = metal; c.fillRect(sx - 26, G.surf - 10, 52, 10); c.fillRect(dx - 26, G.surf - 10, 52, 10);
  for (const [x, y0] of [[sx, G.surf - 10], [dx, G.surf - 10], [gxm, G.gT]]) line(c, [[x, y0], [x, 44]], rgbS(T.accent), 2.2);
  tag(c, sx, 20, "S  source", rgbS(T.ink), "center", 12); tag(c, sx, 36, n ? "0 V, the reference" : "the reference", rgbS(T.muted), "center", 10.5, 500);
  tag(c, gxm, 20, "G  gate", rgbS(T.ink), "center", 12); tag(c, gxm, 36, `${N.cgs} = ${B.op.vgs.toFixed(2)} V`, rgbS(T.accent), "center", 10.5);
  tag(c, dx, 20, "D  drain", rgbS(T.ink), "center", 12); tag(c, dx, 36, `${N.cds} = ${B.op.vds.toFixed(2)} V`, rgbS(T.accent), "center", 10.5);
  /* conventional current at the drain lead: into an n-channel drain, out of a p-channel one */
  if (ST.id > 1e-15) {
    const ay = (44 + G.surf - 10) / 2, s = n ? 1 : -1, a1 = ay + 14 * s;
    line(c, [[dx + 16, ay - 14 * s], [dx + 16, a1 - 4 * s]], rgbS(T.cursor), 2.4);
    c.fillStyle = rgbS(T.cursor); c.beginPath(); c.moveTo(dx + 16, a1); c.lineTo(dx + 11, a1 - 9 * s); c.lineTo(dx + 21, a1 - 9 * s); c.closePath(); c.fill();
    pill(c, dx + 28, ay + 4, `${N.cid} ${E3(ST.id, "A")}`, rgbS(T.cursor), "left", 11);
  }
  /* dimensions and legend */
  const ly = G.surf + G.wd + 30 + hD;
  line(c, [[G.xs, ly], [G.xd, ly]], rgbS(T.ink, .55), 1); line(c, [[G.xs, ly - 5], [G.xs, ly + 5]], rgbS(T.ink, .55), 1); line(c, [[G.xd, ly - 5], [G.xd, ly + 5]], rgbS(T.ink, .55), 1);
  pill(c, (G.xs + G.xd) / 2, ly + 4, `L = ${eng(d.L, "m", 3, " ")}`, rgbS(T.ink), "center", 10.5);
  pill(c, (G.xs + G.xd) / 2, ly + 21, `W = ${eng(d.W, "m", 3, " ")}, into the screen`, rgbS(T.muted), "center", 10);
  pill(c, W / 2, H - 9, n ? "p-type body (B), tied to the source" : "n-type body (B), tied to the source", rgbS(T.ink), "center", 10.5);
  const lx = 14, lgy = H - 50;
  c.fillStyle = rgbS(T.plot, .85); c.fillRect(lx - 6, lgy - 13, 168, 48);
  c.fillStyle = rgbS(T.t2); c.beginPath(); c.arc(lx + 4, lgy - 3, 2.6, 0, 6.2832); c.fill(); tag(c, lx + 14, lgy + 1, "free electron", rgbS(T.ink), "left", 10, 500);
  c.strokeStyle = rgbS(T.t3); c.lineWidth = 1.3; c.beginPath(); c.arc(lx + 4, lgy + 11, 2.6, 0, 6.2832); c.stroke(); tag(c, lx + 14, lgy + 15, "free hole", rgbS(T.ink), "left", 10, 500);
  tag(c, lx + 1, lgy + 29, n ? "−" : "+", rgbS(T.ink, .7), "left", 11, 700); tag(c, lx + 14, lgy + 29, "fixed ion, depleted", rgbS(T.ink), "left", 10, 500);
}

/* ---------- readouts, each with its own explanation ---------- */
const RD = {
  id: { k: n => `Drain current ${n.id}`, v: s => E3(s.id, "A"),
    what: "The current through the channel: into the drain of an n-channel part, out of the drain of a p-channel one (so a p-channel ID is negative).",
    why: "It's the number the circuit feels: the load's current, the switch's current, the amplifier's bias.",
    eq: (s, n) => s.reg === "triode" ? `${n.tid} = \\beta\\left[V_{ov}${n.tds} - \\tfrac{${n.tds}^2}{2}\\right](1+\\lambda ${n.tds}) = ${tn(s.id, "A")}`
      : s.reg === "saturation" ? `${n.tid} = \\tfrac{\\beta}{2}V_{ov}^2(1+\\lambda ${n.tds}) = \\tfrac{${tn(s.d.beta, "A/V²", 3)}}{2}(${tn(s.vove, "V", 3)})^2(1+${s.d.lam.toFixed(3)}\\cdot${tn(s.vds, "V", 3)}) = ${tn(s.id, "A")}`
      : s.reg === "subthreshold" ? `${n.tid} \\propto e^{(${n.tgs} - ${n.tvt})/(n kT/q)} \\Rightarrow ${tn(s.id, "A")}` : `${n.tgs} < ${n.tvt} \\Rightarrow ${n.tid} = 0` },
  reg: { k: () => "Region", v: s => s.reg,
    what: "Which of Sah's two equations applies, or neither (cutoff).",
    why: "Every hand calculation starts here. Use the triode formula in saturation and you get a current that bends back down, sometimes to an impossible negative number.",
    eq: (s, n) => `${n.tgs} - ${n.tvt} = ${tn(s.x, "V", 3)}\\ ${s.x > 0 ? "> 0" : "\\le 0"},\\qquad ${n.tds} = ${tn(s.vds, "V", 3)}\\ ${s.vds < s.vove ? "<" : "\\ge"}\\ V_{ov} = ${tn(s.vove, "V", 3)}` },
  vov: { k: () => "Overdrive V<sub>ov</sub>", v: s => E3(s.vove, "V"),
    what: "How far the gate is past threshold. With subthreshold on it's a smoothed version, which never quite reaches zero.",
    why: "The channel's charge per area at the source is Cox × Vov. It sets the current, gm, and where saturation starts.",
    eq: (s, n) => `V_{ov} = ${n.tgs} - ${n.tvt} = ${tn(s.vgs, "V", 3)} - ${tn(s.d.vt, "V", 3)} = ${tn(s.x, "V", 3)}` },
  vdsat: { k: n => `Saturation edge ${n.ds.replace("</sub>", ",sat</sub>")}`, v: s => E3(s.vove, "V"),
    what: "The drain voltage at which the channel pinches off at its drain end.",
    why: "Below it the MOSFET behaves like a resistor; above it, like a current source. In an amplifier it's the least voltage the drain needs: its headroom.",
    eq: (s, n) => `${n.tds}{}_{,\\text{sat}} = V_{ov} = ${tn(s.vove, "V", 3)}\\qquad(\\text{now } ${n.tds} = ${tn(s.vds, "V", 3)})` },
  p: { k: () => "Heat in the channel", v: s => E3(s.P, "W"),
    what: "Power turned into heat: the voltage across the channel times the current through it.",
    why: "This is what kills MOSFETs. A switch stays cool by sitting at very low VDS (on) or at zero current (off), never in between.",
    eq: (s, n) => `P = ${n.tds}\\,${n.tid} = ${tn(s.vds, "V", 3)}\\times${tn(s.id, "A", 3)} = ${tn(s.P, "W", 3)}` },
  rds: { k: () => "Resistance V/I", v: s => E3(s.rds, "Ω"),
    what: "The large-signal resistance between drain and source at this point: voltage across over current through.",
    why: "For a switch this is RDS(on), the I²R loss. Near VDS = 0 it's 1/(β Vov), so a harder gate drive makes a better switch.",
    eq: (s, n) => `R = \\tfrac{${n.tds}}{${n.tid}} = ${tn(s.rds, "Ω", 4)},\\qquad \\tfrac{1}{\\beta V_{ov}} = ${tn(1 / (s.d.beta * s.vove), "Ω", 4)}` },
  gm: { k: () => "Transconductance g<sub>m</sub>", v: s => E3(s.gm, "S"),
    what: "How much the drain current changes per volt of gate voltage: the slope of the transfer curve (its orange dash).",
    why: "It's the MOSFET's gain knob. A common-source amplifier's gain is about gm times its drain resistance.",
    eq: (s, n) => s.reg === "saturation" ? `g_m = \\beta V_{ov}(1+\\lambda ${n.tds}) = \\tfrac{2${n.tid}}{V_{ov}} = ${tn(s.gm, "S")}` : s.reg === "triode" ? `g_m = \\beta ${n.tds}(1+\\lambda ${n.tds}) = ${tn(s.gm, "S")}\\quad(\\text{small in triode})` : `g_m \\approx \\tfrac{${n.tid}}{n kT/q} = ${tn(s.gm, "S")}` },
  ro: { k: () => "Output resistance r<sub>o</sub>", v: s => E3(s.ro, "Ω"),
    what: "1 over the slope of the output curve at the operating point (its orange dash): how little the current changes with drain voltage.",
    why: "An ideal current source has ro = ∞. A finite ro caps an amplifier's gain at gm·ro and makes a current mirror's copy drift with voltage.",
    eq: (s, n) => s.reg === "saturation" ? (s.d.lam > 0 ? `r_o = \\tfrac{1/\\lambda + ${n.tds}}{${n.tid}} = ${tn(s.ro, "Ω")}` : `\\lambda = 0 \\Rightarrow r_o = \\infty`) : `r_o = 1\\big/\\tfrac{\\partial ${n.tid}}{\\partial ${n.tds}} = ${tn(s.ro, "Ω")}` },
  av: { k: () => "Intrinsic gain g<sub>m</sub>r<sub>o</sub>", v: s => isFinite(s.gm * s.ro) ? (s.gm * s.ro).toPrecision(3) : "∞",
    what: "The most voltage gain one transistor can give, when its drain sees an ideal current-source load.",
    why: "It's why short channels are bad for analog: λ grows as L shrinks, and gm·ro falls from thousands to tens.",
    eq: s => `g_m r_o = ${tn(s.gm, "S", 3)}\\times${tn(s.ro, "Ω", 3)} = ${isFinite(s.gm * s.ro) ? (s.gm * s.ro).toPrecision(3) : "\\infty"}` },
  gmid: { k: () => "Efficiency g<sub>m</sub>/I<sub>D</sub>", v: s => s.id > 0 ? (s.gm / s.id).toPrecision(3) + " /V" : "–",
    what: "Transconductance per amp of bias current.",
    why: "It's how well a bias point turns current into gain. A small overdrive gives more gm per amp, up to about 1/(n kT/q), 25 to 40 per volt, in weak inversion. The price is a wider, slower transistor.",
    eq: (s, n) => `\\tfrac{g_m}{${n.tid}} = ${s.id > 0 ? (s.gm / s.id).toPrecision(3) : "-"}\\,\\text{/V}\\qquad\\left(\\tfrac{2}{V_{ov}} = ${s.vove > 0 ? (2 / s.vove).toPrecision(3) : "\\infty"}\\right)` },
  va: { k: () => "Early voltage 1/λ", v: s => s.d.lam > 0 ? E3(1 / s.d.lam, "V") : "∞",
    what: "Extend the saturated curves backwards and they meet the voltage axis near −1/λ.",
    why: "One number for how good a current source the device is. Bigger is better.",
    eq: s => `V_A = 1/\\lambda = ${s.d.lam > 0 ? tn(1 / s.d.lam, "V", 3) : "\\infty"}` },
  cox: { k: () => "Oxide capacitance C<sub>ox</sub>", v: s => (s.d.cox * 1e3).toPrecision(3) + " fF/µm²",
    what: "Gate capacitance per area: the oxide's permittivity over its thickness.",
    why: "More Cox puts more channel charge under the gate per volt, so more current. Thinner oxide in every process generation is how chips got stronger.",
    eq: s => `C_{ox} = \\tfrac{3.9\\,\\varepsilon_0}{t_{ox}} = \\tfrac{3.9\\,(8.854\\times10^{-12})}{${tn(s.d.c.tox * 1e-9, "m", 3)}} = ${(s.d.cox * 1e3).toPrecision(3)}\\,\\text{fF}/\\mu\\text{m}^2` },
  kp: { k: () => "Process strength k′ = μC<sub>ox</sub>", v: s => E3(s.d.kp, "A/V²"),
    what: "The current strength of one square of channel (W = L): the process transconductance parameter.",
    why: "The fab fixes it. A designer only picks W/L.",
    eq: s => `k' = \\mu C_{ox} = (${s.d.mu.toFixed(0)}\\,\\text{cm}^2/\\text{V s})(${(s.d.cox * 1e3).toPrecision(3)}\\,\\text{fF}/\\mu\\text{m}^2) = ${tn(s.d.kp, "A/V²", 3)}` },
  beta: { k: () => "Device strength β", v: s => E3(s.d.beta, "A/V²"),
    what: "k′ times W/L: the number Sah's equations use. It's the βn and βp of the Switches homework.",
    why: "Double β and every current doubles at the same voltages. One datasheet test point pins it down.",
    eq: s => `\\beta = k'\\,\\tfrac{W}{L} = ${tn(s.d.kp, "A/V²", 3)}\\times${(s.d.W / s.d.L).toPrecision(4)} = ${tn(s.d.beta, "A/V²", 4)}` },
  wl: { k: () => "Shape W/L", v: s => (s.d.W / s.d.L).toPrecision(4),
    what: "How many squares of channel sit side by side.",
    why: "The designer's main knob. A power MOSFET's W/L is near a million; a logic gate's is about 2 to 10.",
    eq: s => `\\tfrac{W}{L} = \\tfrac{${tn(s.d.W, "m", 3)}}{${tn(s.d.L, "m", 3)}} = ${(s.d.W / s.d.L).toPrecision(4)}` },
  vt: { k: n => `Threshold now ${n.vt}`, v: s => E3(s.d.vt, "V"),
    what: "The threshold at this temperature. It falls about 2 mV for every kelvin of heating.",
    why: "Hot parts turn on earlier, and leak more when they're off.",
    eq: s => `V_T(T) = V_T(300\\,\\text{K}) - 2\\,\\text{mV/K}\\times(T - 300) = ${tn(s.d.vt, "V", 4)}` },
  mu: { k: () => "Mobility now μ", v: s => s.d.mu.toFixed(0) + " cm²/V·s",
    what: "How fast carriers drift per volt per metre of field, at this temperature.",
    why: "A hotter lattice vibrates more and scatters carriers, so μ falls as T^−1.5, and β falls with it.",
    eq: s => `\\mu(T) = \\mu_{300}\\,(T/300)^{-1.5} = ${s.d.mu.toFixed(0)}\\,\\text{cm}^2/\\text{V s}` },
  N: { k: n => `${n.car[0].toUpperCase() + n.car.slice(1)} in the channel`, v: s => s.N > 0 ? sciH(s.N) : "0",
    what: "How many carriers are in the inversion layer right now: the area under the shaded charge curve, times W, over q.",
    why: "Current is this charge crossing the channel: I = Q/τ. Fewer carriers, or a longer trip, means less current.",
    eq: s => `N = \\tfrac{W\\int_0^L Q_n\\,dx}{q} = \\tfrac{${tn(s.Q, "C", 3)}}{1.602\\times10^{-19}\\,\\text{C}}` },
  ns: { k: () => "Density at the source", v: s => s.ns > 0 ? sciH(s.ns) + " /cm²" : "0",
    what: "Carriers per square centimetre at the source end of the channel: Cox Vov / q.",
    why: "It sounds like a lot, but it's sparse: the carriers sit a few nanometres apart, in a layer only a few nanometres thick.",
    eq: s => `n_s = \\tfrac{C_{ox}V_{ov}}{q},\\qquad \\text{spacing} \\approx \\tfrac{1}{\\sqrt{n_s}} = ${s.ns > 0 ? tn(1 / Math.sqrt(s.ns * 1e4), "m", 3) : "\\infty"}` },
  vel: { k: () => "Drift speed at the source", v: s => E3(s.vel, "m/s"),
    what: "How fast the carriers move at the source end: current over (width × charge per area).",
    why: "Carriers can't go much faster than 10⁵ m/s in silicon. When the formula asks for more, velocity saturation takes over and the square law overestimates the current.",
    eq: s => `v = \\tfrac{I_D}{W C_{ox}V_{ov}} = ${tn(s.vel, "m/s", 3)}\\qquad(v_{sat} = ${tn(s.d.vsat, "m/s", 2)})` },
  tau: { k: () => "Transit time τ", v: s => E3(s.tau, "s"),
    what: "How long a carrier takes to cross the channel: the channel's charge over the current.",
    why: "The device can't respond much faster than this. In saturation τ = (4/3)L²/(μ Vov), so halving L makes it four times faster.",
    eq: s => `\\tau = \\tfrac{Q}{I_D} = \\tfrac{${tn(s.Q, "C", 3)}}{${tn(s.id, "A", 3)}} = ${tn(s.tau, "s", 3)}` },
  ft: { k: () => "Transition frequency f<sub>T</sub>", v: s => E3(s.fT, "Hz"),
    what: "The frequency where the transistor's current gain falls to 1: gm over 2π times the gate capacitance.",
    why: "The figure of merit for speed. It grows as μVov/L², which is why shrinking L made chips faster.",
    eq: s => `f_T = \\tfrac{g_m}{2\\pi C_{gs}},\\quad C_{gs} = ${s.reg === "triode" ? "" : "\\tfrac23"}WLC_{ox} = ${tn(s.cg, "F", 3)}\\ \\Rightarrow\\ f_T = ${tn(s.fT, "Hz", 3)}` },
  cg: { k: () => "Gate capacitance WLC<sub>ox</sub>", v: s => E3(s.WLC, "F"),
    what: "The whole oxide capacitor between the gate and the channel.",
    why: "A gate driver has to fill it every time it switches on. For a power MOSFET it's nanofarads, which is why gate-driver chips exist.",
    eq: s => `W L C_{ox} = ${tn(s.d.W, "m", 3)}\\times${tn(s.d.L, "m", 3)}\\times C_{ox} = ${tn(s.WLC, "F", 3)}` },
  eox: { k: () => "Oxide field", v: s => s.eox.toPrecision(3) + " MV/cm",
    what: "The gate voltage divided by the oxide thickness.",
    why: "SiO₂ breaks down near 10 MV/cm, and reliable designs stay below about 5. This is the physics behind the VGS(max) rating.",
    eq: (s, n) => `E_{ox} = \\tfrac{${n.tgs}}{t_{ox}} = \\tfrac{${tn(s.vgs, "V", 3)}}{${tn(s.d.c.tox * 1e-9, "m", 3)}} = ${s.eox.toPrecision(3)}\\,\\text{MV/cm}` },
  elat: { k: () => "Lateral field V/L", v: s => s.elat.toPrecision(3) + " V/µm",
    what: "The average field along the channel: drain voltage over channel length.",
    why: "Compare it with Ec. Far above Ec, carriers stop speeding up, and 'hot' carriers start to damage the oxide.",
    eq: (s, n) => `\\bar E = \\tfrac{${n.tds}}{L} = ${s.elat.toPrecision(3)}\\,\\text{V}/\\mu\\text{m}` },
  ec: { k: () => "Speed-limit field E<sub>c</sub>", v: s => s.ec.toPrecision(3) + " V/µm",
    what: "The field at which the drift speed μE would reach the saturation velocity.",
    why: "When Vov/L approaches Ec, the square law overestimates the current by about (1 + Vov/(Ec L)).",
    eq: s => `E_c = \\tfrac{v_{sat}}{\\mu} = ${s.ec.toPrecision(3)}\\,\\text{V}/\\mu\\text{m},\\qquad \\tfrac{V_{ov}}{E_c L} = ${s.theta.toPrecision(2)}` },
  ss: { k: () => "Subthreshold swing S", v: s => s.ss.toFixed(1) + " mV/dec",
    what: "How many millivolts of gate voltage change the current tenfold, below threshold: n (kT/q) ln 10.",
    why: "At room temperature it can't beat 60 mV per decade. That limits how low VT, and so the supply voltage, can go before 'off' leaks too much.",
    eq: s => `S = n\\,\\tfrac{kT}{q}\\ln 10 = ${s.d.n.toFixed(2)}\\times${tn(s.d.phit, "V", 3)}\\times2.303 = ${s.ss.toFixed(1)}\\,\\text{mV/dec}` },
  vth: { k: () => "Thermal voltage kT/q", v: s => (s.d.phit * 1e3).toFixed(2) + " mV",
    what: "The energy of thermal jiggling, in volts.",
    why: "It sets the subthreshold slope, the softest possible turn-on: 25.9 mV at 300 K.",
    eq: s => `\\tfrac{kT}{q} = \\tfrac{(1.381\\times10^{-23})(${s.d.T.toFixed(0)})}{1.602\\times10^{-19}} = ${(s.d.phit * 1e3).toFixed(2)}\\,\\text{mV}` }
};
const RGROUPS = [["The operating point", ["id", "reg", "vov", "vdsat", "p", "rds"]], ["Small-signal slopes", ["gm", "ro", "av", "gmid", "va"]],
  ["Built from the construction", ["cox", "kp", "beta", "wl", "vt", "mu"]], ["Inside the channel", ["N", "ns", "vel", "tau", "ft", "cg"]], ["Fields and temperature", ["eox", "elat", "ec", "ss", "vth"]]];
function readouts() {
  const n = NM(), s = ST;
  $("#bReads").innerHTML = RGROUPS.map(([h, ks]) => `<div class="rg"><h5>${h}</h5><div class="tiles">${ks.map(k => cell(RD[k].k(n), RD[k].v(s), { r: k, on: k === B.ex })).join("")}</div></div>`).join("");
  const r = RD[B.ex];
  $("#bExK").innerHTML = r.k(n) + ` <span class="exv">${r.v(s)}</span>`; $("#bExW").textContent = r.what; $("#bExY").textContent = r.why;
  tex($("#bExE"), r.eq(s, n), true);
}

/* ---------- constraints ---------- */
function crow(o) {
  const f = o.f === null ? 0 : clamp(o.f, 0, 1);
  return `<div class="crow ${o.st}"><div class="nm">${o.nm}</div><div class="meter"${o.f === null ? " hidden" : ""}><i style="width:${(f * 100).toFixed(1)}%"></i>${o.mk ? `<b style="left:${(clamp(o.mk, 0, 1) * 100).toFixed(1)}%"></b>` : ""}</div>
    <div class="val">${o.val}</div><div class="st">${(o.words || { ok: "OK", warn: "close", bad: "exceeded", info: "note", off: "–" })[o.st]}</div>${o.why ? `<div class="why">${o.why}</div>` : ""}</div>`;
}
const lim = (v, m, w = .8) => v > m ? "bad" : v > w * m ? "warn" : "ok";
function constraintsOf(s, n, R) {
  const rows = [], tj = 25 + s.P * (125 / R.P);
  rows.push({ nm: `Is there a channel? ${n.gs} &gt; ${n.vt}`, f: s.vgs / Math.max(1e-9, opMax("vgs")), mk: s.d.vt / opMax("vgs"), st: s.x > 0 ? "ok" : "info",
    val: `${fV(s.vgs)} vs ${fV(s.d.vt)}`, why: s.x > 0 ? `Yes, by ${fV(s.x)}. The gate has pulled a layer of ${n.car} up against the oxide.` : `No. ${s.d.sub ? "Only a subthreshold trickle flows." : "Sah's equations say ID = 0."}` });
  rows.push({ nm: `Does it reach the drain? ${n.ds} &lt; V<sub>ov</sub>`, f: s.vds / Math.max(1e-9, opMax("vds")), mk: s.vove / opMax("vds"), st: s.x > 0 ? "info" : "off",
    val: `${fV(s.vds)} vs ${fV(s.vove)}`, why: s.x <= 0 ? "No channel to reach anything." : s.vds < s.vove ? "Yes: triode. The channel runs end to end, and the device acts like a resistor." : "No: saturation. It pinches off before the drain, and the device acts like a current source." });
  rows.push({ nm: `${n.ds} rating`, f: s.vds / R.VDS, st: lim(s.vds, R.VDS), val: `${fV(s.vds)} of ${E3(R.VDS, "V")}`, why: s.vds > R.VDS ? "Past V(BR)DSS the drain junction avalanches. The square law knows nothing about it." : "" });
  rows.push({ nm: `${n.gs} rating`, f: s.vgs / R.VGS, st: lim(s.vgs, R.VGS), val: `${fV(s.vgs)} of ${E3(R.VGS, "V")}`, why: s.vgs > R.VGS ? "The oxide punctures, and the damage is permanent." : "" });
  rows.push({ nm: "Current rating", f: s.id / R.ID, st: lim(s.id, R.ID), val: `${E3(s.id, "A")} of ${E3(R.ID, "A")}`, why: s.id > R.ID ? "Bond wires and metal fuse, even if the die stays cool." : "" });
  rows.push({ nm: "Power rating", f: s.P / R.P, st: lim(s.P, R.P), val: `${E3(s.P, "W")} of ${E3(R.P, "W")}`, why: `The die would sit near ${tj > 999 ? "999+" : tj.toFixed(0)} °C in 25 °C air (${(125 / R.P).toPrecision(3)} °C per watt).${tj > 150 ? " Past 150 °C it fails." : ""}` });
  rows.push({ nm: "Oxide field (the physics)", f: s.eox / 10, mk: .5, st: s.eox > 10 ? "bad" : s.eox > 5 ? "warn" : "ok", val: `${s.eox.toPrecision(3)} of 10 MV/cm`, why: s.eox > 5 ? "Above about 5 MV/cm the oxide wears out over time; near 10 it breaks down at once." : "" });
  rows.push({ nm: "Square law still accurate?", words: { ok: "good", warn: "rough", bad: "poor", off: "–" }, f: s.x > 0 ? s.theta / 1.5 : 0, mk: .2, st: s.x <= 0 ? "off" : s.theta > 1 ? "bad" : s.theta > .3 ? "warn" : "ok",
    val: s.x > 0 ? `V<sub>ov</sub>/(E<sub>c</sub>L) = ${s.theta.toPrecision(2)}` : "–",
    why: s.x > 0 && s.theta > .3 ? `The channel is short enough for velocity saturation. A better model would give about ${E3(s.id / (1 + s.theta), "A")}, not ${E3(s.id, "A")}.` : "" });
  if (s.x > 0 && s.x < 3 * s.d.n * s.d.phit) rows.push({ nm: "Near threshold", f: null, st: "warn", val: `V<sub>ov</sub> = ${E3(s.x, "V")}`, why: "Within a few kT/q of VT, real current is part square law, part exponential. Tick subthreshold conduction for a smooth handover." });
  if (s.x <= 0 && !s.d.sub) rows.push({ nm: "Leakage", f: null, st: "info", val: "I<sub>D</sub> = 0 exactly", why: "That's an idealisation: real parts leak exponentially below VT. Tick subthreshold conduction and use the log plot to see it." });
  return rows;
}
function cons() {
  const rows = constraintsOf(ST, NM(), B.rate), bad = rows.filter(r => r.st === "bad").length;
  $("#bCons").innerHTML = rows.map(crow).join("");
  $("#bConsSum").innerHTML = bad ? `<span class="badge bad">${bad} limit${bad > 1 ? "s" : ""} exceeded</span>` : `<span class="badge ok">inside every limit</span>`;
}

/* ---------- what's happening, in words ---------- */
function story() {
  const s = ST, d = D, n = NM(), N = n.car, R = B.rate, ov = s.x;
  let h;
  if (s.reg === "cutoff") h = `<p><b>Off: no channel.</b> ${n.gs} = ${fV(s.vgs)} is below the threshold, ${n.vt} = ${fV(d.vt)}. The gate's field pushes the body's ${B.type === "n" ? "holes" : "electrons"} away from the surface (the depleted layer under the oxide), but it can't yet gather ${N} there.</p>
    <p>Source and drain are two islands in oppositely doped silicon: two diodes back to back. Nothing flows.</p><p class="tip">Raise ${n.gs} past ${fV(d.vt)}, or press Sweep ${n.cgs}.</p>`;
  else if (s.reg === "subthreshold") h = `<p><b>Below threshold, but leaking.</b> ${n.gs} is ${fV(-ov)} short of ${n.vt}. There's no proper channel, only a thin film of ${N} diffusing across: ${E3(s.id, "A")}.</p>
    <p>Every ${s.ss.toFixed(0)} mV of gate voltage changes it tenfold. That's why 'off' is never zero, and why a chip with a low threshold leaks.</p><p class="tip">Switch the transfer plot to log to see the straight line.</p>`;
  else {
    const dots = XS.parts.length;
    h = `<p><b>${fV(ov)} of overdrive.</b> The gate holds about ${sciH(s.N, 1)} ${N} in the channel${dots > 3 ? `, so each dot stands for about ${sciH(s.N / dots, 1)}` : ""}.</p>`;
    if (s.reg === "triode") h += `<p><b>Triode: a resistor.</b> ${n.ds} = ${fV(s.vds)} is less than the overdrive, so the channel reaches the drain. It thins toward the drain, where the gate's grip is only V<sub>ov</sub> − ${n.ds} = ${fV(s.vove - s.vds)}. Right now it acts like ${E3(s.rds, "Ω")}; at tiny ${n.ds}, 1/(βV<sub>ov</sub>) = ${E3(1 / (d.beta * s.vove), "Ω")}.</p>`;
    else h += `<p><b>Saturation: a current source.</b> ${n.ds} = ${fV(s.vds)} is past V<sub>ov</sub> = ${fV(s.vove)}. At the drain end the gate's grip has run out, so the channel pinches off. More ${n.ds} only widens the depleted gap, where the field sweeps ${N} straight into the drain, so the current barely changes${d.lam > 0 ? `: λ adds ${(100 * d.lam / (1 + d.lam * s.vds)).toFixed(1)}% per volt` : " (with λ = 0, not at all)"}.</p>`;
    h += `<p>They take ${E3(s.tau, "s")} to cross${s.vel > .8 * d.vsat ? ", near their speed limit" : ""}, and the channel turns ${E3(s.P, "W")} into heat${s.P > R.P ? `: <b class="badtxt">more than the part can shed</b>` : ""}.</p>`;
  }
  $("#story").innerHTML = h;
}

/* ---------- the bench's animation loop ---------- */
function benchTick(dt) {
  const k = SIM.k;
  if (B.sweep && k > 0) {
    const key = B.sweep.k, m = opMax(key); B.op[key] += B.sweep.dir * m / 7 * dt * k;
    if (B.op[key] >= m) { B.op[key] = m; B.sweep.dir = -1; } if (B.op[key] <= 0) { B.op[key] = 0; B.sweep.dir = 1; }
    SL[key].sync(); benchUpdate();
  }
  xsStep(dt * k); drawXs();
}

/* ---------- experiments ---------- */
const EXP = {
  grow: { pre: "practice", op: { vgs: 0, vds: .3 }, tr: "lin", sweep: "vgs", ex: "N" },
  pinch: { pre: "practice", op: { vgs: 4, vds: 0 }, sweep: "vds", ex: "vdsat" },
  rvsi: { pre: "practice", op: { vgs: 4, vds: .25 }, ex: "rds" },
  width: { pre: "practice", op: { vgs: 3, vds: 4 }, pin: true, then: () => { B.dev.n.W *= 2; }, ex: "beta" },
  length: { pre: "textbook", op: { vgs: 1.2, vds: 2.5 }, pin: true, then: () => { B.dev.n.L /= 2; }, ex: "ft" },
  oxide: { pre: "textbook", op: { vgs: 2, vds: 2.5 }, pin: true, then: () => { B.dev.n.tox /= 2; }, ex: "eox" },
  heat: { pre: "practice", op: { vgs: 3, vds: 6 }, tr: "lin", then: () => { B.env.T = 400; }, ex: "mu" },
  leak: { pre: "chip", op: { vgs: .2, vds: .9 }, tr: "log", ex: "ss" },
  np: { pre: "practice", op: { vgs: 4, vds: 1.5 }, pin: true, then: () => { B.type = "p"; }, ex: "mu" },
  gmid: { pre: "textbook", op: { vgs: .85, vds: 2.5 }, ex: "gmid" },
  brk: { pre: "small", op: { vgs: 4, vds: 12 }, ex: "p" },
  clm: { pre: "chip", op: { vgs: 1, vds: 1 }, pin: true, then: () => { B.dev.n.L = .72; B.dev.n.W = 8; B.dev.n.lam = .025; }, ex: "av" }
};
function runExp(k) {
  const e = EXP[k]; loadPreset(e.pre); B.type = "n"; B.pins = []; B.sweep = null;
  Object.assign(B.op, e.op); if (e.tr) B.tr = e.tr;
  D = makeDev(B.dev.n, "n", B.env);
  if (e.pin) pinNow();
  if (e.then) { e.then(); B.edited = true; }
  if (e.ex) B.ex = e.ex;
  if (e.sweep) B.sweep = { k: e.sweep, dir: 1 };
  syncAll(); benchUpdate(); labReset();
  $("#bench").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
$$("[data-exp]").forEach(b => b.addEventListener("click", () => runExp(b.dataset.exp)));

/* =====================================================================================================================
   CIRCUIT LAB: the workbench's devices dropped into seven common circuits
   ===================================================================================================================== */
const pre = () => PRE[B.pre];
const LAB = { k: "lsw", P: {}, t: 0, anim: false, dir: 1, s: null, h: null, st: null, sls: [], built: false, simKey: null, sim: null };
const labDevs = () => ({ n: makeDev(B.dev.n, "n", B.env), p: makeDev(B.dev.p, "p", B.env) });
const fR = v => v === 0 ? "0 Ω" : v === Infinity ? "∞" : E3(v, "Ω"), fA = v => E3(v, "A"), fW = v => E3(v, "W");
const vlab = (s, p, str, o = {}) => s.text(p, str, { cls: "sm", c: o.c || "cursor", anchor: o.anchor || "start" });

/* ----- schematics ----- */
function drawLS(s, rg) {
  const vd = s.vsrc([90, 120]), m = s.mosfet([256, 250]), vi = s.vsrc([120, 300]);
  s.wire([vd.bot, [90, 160]]); s.gnd([90, 160]);
  s.wire([vd.top, [90, 50], [300, 50]]); s.res([300, 50], [300, 150]); s.wire([[300, 150], m.D]); s.node([300, 172]);
  s.wire([[300, 172], [356, 172]]); const fl = s.net([356, 172], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  if (rg) { s.wire([vi.top, [120, 250], [134, 250]]); s.res([134, 250], [214, 250]); s.wire([[214, 250], m.G]); s.text([174, 228], "RG", { anchor: "middle" }); }
  else s.wire([vi.top, [120, 250], m.G]);
  s.wire([vi.bot, [120, 340], [300, 340]]); s.wire([m.S, [300, 340]]); s.node([300, 340]); s.gnd([300, 340]);
  s.text([64, 112], "VDD", { anchor: "end" }); s.text([94, 292], rg ? "driver" : "Vin", { anchor: "end" }); s.text([318, 92], "RL"); s.text([318, 244], "M1");
  const t = { vdd: vlab(s, [64, 130], "", { anchor: "end" }), vin: vlab(s, [94, 310], "", { anchor: "end" }), rl: vlab(s, [318, 110], ""), m: s.text([318, 262], "n-channel", { cls: "sm" }),
    out: vlab(s, [384, 198], "", { anchor: "middle" }), i: vlab(s, [286, 30], "", { anchor: "end" }), rg: rg ? vlab(s, [174, 272], "", { anchor: "middle" }) : null };
  return { t, f: s.flow([vd.top, [90, 50], [300, 50], [300, 150], ...m.thru, [300, 340]], { c: "t3", gap: 16 }) };
}
function drawT(s) {
  const vd = s.vsrc([90, 120]), m = s.mosfet([256, 250]), vi = s.vsrc([120, 300]);
  s.wire([vd.bot, [90, 160]]); s.gnd([90, 160]);
  s.wire([vd.top, [90, 50], [300, 50]]); s.node([300, 50]); s.coil([300, 50], [300, 150], { side: -1 }); s.wire([[300, 150], m.D]); s.node([300, 172]);
  s.wire([[300, 50], [356, 50], [356, 72]]); s.diode([356, 138], [356, 72]); s.wire([[356, 138], [356, 172], [300, 172]]);
  s.wire([vi.top, [120, 250], [134, 250]]); s.res([134, 250], [214, 250]); s.wire([[214, 250], m.G]); s.text([174, 228], "RG", { anchor: "middle" });
  s.wire([vi.bot, [120, 340], [300, 340]]); s.wire([m.S, [300, 340]]); s.node([300, 340]); s.gnd([300, 340]);
  s.text([64, 112], "VDD", { anchor: "end" }); s.text([94, 292], "driver", { anchor: "end" }); s.text([286, 92], "load", { anchor: "end" }); s.text([374, 100], "clamp"); s.text([374, 118], "diode", { cls: "sm" }); s.text([318, 244], "M1");
  const t = { vdd: vlab(s, [64, 130], "", { anchor: "end" }), vin: vlab(s, [94, 310], "", { anchor: "end" }), il: vlab(s, [286, 110], "", { anchor: "end" }), m: s.text([318, 262], "n-channel", { cls: "sm" }),
    out: vlab(s, [318, 196], ""), i: vlab(s, [286, 30], "", { anchor: "end" }), rg: vlab(s, [174, 272], "", { anchor: "middle" }) };
  return { t, f: s.flow([vd.top, [90, 50], [300, 50], [300, 150], ...m.thru, [300, 340]], { c: "t3", gap: 16 }) };
}
function drawHS(s) {
  const vd = s.vsrc([90, 120]), m = s.mosfet([256, 120], { p: true, sTop: true }), vi = s.vsrc([150, 290]), thru = m.thru.slice().reverse();
  s.wire([vd.bot, [90, 160]]); s.gnd([90, 160]);
  s.wire([vd.top, [90, 46], [300, 46], m.S]);
  s.wire([m.D, [300, 210]]); s.node([300, 186]); s.wire([[300, 186], [356, 186]]); const fl = s.net([356, 186], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  s.res([300, 210], [300, 300]); s.wire([[300, 300], [300, 340]]);
  s.wire([vi.top, [150, 220], [210, 220], [210, 120], m.G]); s.wire([vi.bot, [150, 340], [300, 340]]); s.node([300, 340]); s.gnd([300, 340]);
  s.text([64, 112], "VDD", { anchor: "end" }); s.text([124, 282], "Vin", { anchor: "end" }); s.text([318, 246], "RL"); s.text([318, 112], "M1");
  const t = { vdd: vlab(s, [64, 130], "", { anchor: "end" }), vin: vlab(s, [124, 300], "", { anchor: "end" }), rl: vlab(s, [318, 264], ""), m: s.text([318, 130], "p-channel", { cls: "sm" }),
    out: vlab(s, [384, 212], "", { anchor: "middle" }), i: vlab(s, [286, 28], "", { anchor: "end" }) };
  return { t, f: s.flow([vd.top, [90, 46], [300, 46], ...thru, [300, 210], [300, 300], [300, 340]], { c: "t3", gap: 16 }) };
}
function drawINV(s) {
  const vd = s.vsrc([50, 170]); s.wire([vd.bot, [50, 215]]); s.gnd([50, 215]);
  const mp = s.mosfet([226, 120], { p: true, sTop: true }), mn = s.mosfet([226, 240]);
  s.wire([vd.top, [50, 40], [270, 40], mp.S]); s.wire([mp.D, mn.D]); s.node([270, 180]);
  s.wire([[270, 180], [330, 180]]); const fl = s.net([330, 180], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  s.wire([mn.S, [270, 310]]); s.gnd([270, 310]);
  s.wire([mp.G, [200, 120], [200, 240], mn.G]); s.node([200, 180]);
  const vi = s.vsrc([130, 230]); s.wire([vi.top, [130, 180], [200, 180]]); s.wire([vi.bot, [130, 265]]); s.gnd([130, 265]);
  s.text([24, 162], "VDD", { anchor: "end" }); s.text([104, 222], "Vin", { anchor: "end" }); s.text([288, 112], "M2"); s.text([288, 248], "M1");
  const t = { vdd: vlab(s, [24, 180], "", { anchor: "end" }), vin: vlab(s, [104, 240], "", { anchor: "end" }), mp: s.text([288, 130], "p-channel", { cls: "sm" }), mn: s.text([288, 266], "n-channel", { cls: "sm" }),
    out: vlab(s, [358, 206], "", { anchor: "middle" }), i: vlab(s, [282, 26], "") };
  return { t, f: s.flow([vd.top, [50, 40], [270, 40], ...mp.thru.slice().reverse(), ...mn.thru, [270, 310]], { c: "t3", gap: 16 }) };
}
function drawCS(s, follower) {
  const vd = s.vsrc([60, 150]); s.wire([vd.bot, [60, 200]]); s.gnd([60, 200]);
  const m = s.mosfet([256, follower ? 130 : 210]), va = s.vac([150, follower ? 180 : 245]), vg = s.vsrc([150, follower ? 238 : 302]);
  let fp;
  if (follower) {
    s.wire([vd.top, [60, 40], [300, 40], m.D]); s.wire([m.S, [300, 205]]); s.node([300, 190]);
    s.wire([[300, 190], [350, 190]]); const fl = s.net([350, 190], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
    s.res([300, 205], [300, 310]); s.gnd([300, 310]);
    s.wire([va.top, [150, 130], m.G]); s.wire([va.bot, vg.top]); s.wire([vg.bot, [150, 270]]); s.gnd([150, 270]);
    s.text([318, 250], "RS"); s.text([318, 122], "M1");
    fp = [vd.top, [60, 40], [300, 40], ...m.thru, [300, 205], [300, 310]];
  } else {
    s.wire([vd.top, [60, 40], [300, 40]]); s.res([300, 40], [300, 130]); s.wire([[300, 130], m.D]); s.node([300, 150]);
    s.wire([[300, 150], [350, 150]]); const fl = s.net([350, 150], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
    s.res(m.S, [300, 330]); s.gnd([300, 330]);
    s.wire([va.top, [150, 210], m.G]); s.wire([va.bot, vg.top]); s.wire([vg.bot, [150, 334]]); s.gnd([150, 334]);
    s.text([318, 78], "RD"); s.text([318, 282], "RS"); s.text([318, 202], "M1");
    fp = [vd.top, [60, 40], [300, 40], [300, 130], ...m.thru, [300, 330]];
  }
  s.text([34, 142], "VDD", { anchor: "end" }); s.text([124, va.top[1] + 12], "vin", { anchor: "end" }); s.text([124, vg.top[1] + 12], "VGG", { anchor: "end" });
  const t = { vdd: vlab(s, [34, 160], "", { anchor: "end" }), vin: vlab(s, [124, va.top[1] + 30], "", { anchor: "end" }), vgg: vlab(s, [124, vg.top[1] + 30], "", { anchor: "end" }),
    rd: follower ? null : vlab(s, [318, 96], ""), rs: vlab(s, follower ? [318, 268] : [318, 300], ""), out: vlab(s, [383, follower ? 216 : 176], "", { anchor: "middle" }),
    i: vlab(s, [286, follower ? 64 : 28], "", { anchor: "end" }), vg: vlab(s, [236, follower ? 116 : 196], "", { anchor: "end" }) };
  return { t, f: s.flow(fp, { c: "t3", gap: 16 }) };
}
function drawMIR(s) {
  const vd = s.vsrc([50, 170]); s.wire([vd.bot, [50, 215]]); s.gnd([50, 215]);
  const ir = s.isrc([150, 100]), m1 = s.mosfet([194, 240], { left: true }), m2 = s.mosfet([236, 240]);
  s.wire([vd.top, [50, 40], [280, 40]]); s.node([150, 40]); s.wire([[150, 40], ir.top]); s.wire([ir.bot, m1.D]);
  s.node([150, 160]); s.wire([[150, 160], [215, 160], [215, 240]]); s.wire([m1.G, m2.G]); s.node([215, 240]);
  s.res([280, 40], [280, 130]); s.wire([[280, 130], m2.D]); s.node([280, 165]); s.wire([[280, 165], [330, 165]]);
  const fl = s.net([330, 165], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  s.wire([m1.S, [150, 310]]); s.gnd([150, 310]); s.wire([m2.S, [280, 310]]); s.gnd([280, 310]);
  s.text([24, 162], "VDD", { anchor: "end" }); s.text([124, 92], "Iref", { anchor: "end" }); s.text([132, 232], "M1", { anchor: "end" }); s.text([298, 232], "M2"); s.text([298, 78], "RL");
  const t = { vdd: vlab(s, [24, 180], "", { anchor: "end" }), iref: vlab(s, [124, 110], "", { anchor: "end" }), rl: vlab(s, [298, 96], ""), out: vlab(s, [358, 191], "", { anchor: "middle" }),
    i: vlab(s, [298, 142], ""), m2: s.text([298, 250], "", { cls: "sm" }), vgs: vlab(s, [222, 290], "", { anchor: "middle", c: "accent" }) };
  return { t, f: s.flow([[150, 40], ir.top, ir.bot, ...m1.thru, [150, 310]], { c: "t3", gap: 16 }), f2: s.flow([[150, 40], [280, 40], [280, 130], ...m2.thru, [280, 310]], { c: "t3", gap: 16 }),
    f0: s.flow([vd.top, [50, 40], [150, 40]], { c: "t3", gap: 16 }) };
}
const spdI = i => i < 1e-15 ? 0 : 10 + 80 * clamp((Math.log10(i) + 9) / 10, 0, 1);

/* ----- shared plot piece: a device's curves with a load line ----- */
/* o = { vgs, vds, i, xmax, ymax, load: [I at 0 V, V at 0 A], loadName, steps: other VGS curves, band: [[v, i]] excursion, extra(P) } */
function famPlot(cv, d, o) {
  const n = d.type === "n" ? { x: "VDS", y: "ID", g: "VGS" } : { x: "VSD", y: "|ID|", g: "VSG" };
  const P = frame(cv, { x: { lo: 0, hi: o.xmax, name: n.x, unit: "V" }, y: { lo: 0, hi: o.ymax, name: n.y, unit: "A" } }), c = P.c;
  P.clip();
  const edge = curve(P, x => idOf(d, d.vt + x, x), 0, o.xmax, 160).filter(Boolean);
  c.fillStyle = css("--act"); c.globalAlpha = .5; c.fillRect(P.l, P.top, P.r - P.l, P.bot - P.top);
  c.fillStyle = css("--nreg"); c.globalAlpha = .65; c.beginPath(); c.moveTo(P.l, P.top); edge.forEach(p => c.lineTo(p[0], Math.max(P.top, p[1]))); c.lineTo(P.r, P.top); c.closePath(); c.fill(); c.globalAlpha = 1;
  line(c, edge, rgbS(T.ink, .45), 1.2, [5, 4]);
  for (const g of (o.steps || [])) if (Math.abs(g - o.vgs) > .05) line(c, curve(P, x => idOf(d, g, x), 0, o.xmax, 140), rgbS(T.muted, .6), 1.2);
  if (o.band) line(c, o.band.map(([x, y]) => [P.X(x), P.Y(y)]), rgbS(T.cursor, .5), 9);
  if (o.load) line(c, [[P.X(0), P.Y(o.load[0])], [P.X(o.load[1]), P.Y(0)]], rgbS(T.t3), 2.4);
  if (o.extra) o.extra(P);
  line(c, curve(P, x => idOf(d, o.vgs, x), 0, o.xmax, 220), rgbS(T.accent), 2.8);
  line(c, [[P.X(o.vds), P.bot], [P.X(o.vds), P.Y(o.i)], [P.l, P.Y(o.i)]], rgbS(T.ink, .45), 1, [3, 3]);
  dot(c, P.X(o.vds), P.Y(o.i), rgbS(T.cursor), 6.5);
  c.restore();
  pill(c, P.r - 8, P.top + 16, `M1 at ${n.g} = ${o.vgs.toFixed(2)} V`, rgbS(T.accent), "right", 10.5);
  if (o.load) pill(c, P.r - 8, P.top + 33, o.loadName || "load line", rgbS(T.t3), "right", 10.5);
  return P;
}
/* the gate drive's sweep: Vout (and heat in M1) against Vin for a switch */
function switchSweep(cv, st, P, xm, solveAt, note) {
  const sw = []; let pm = 1e-15;
  for (let k = 0; k <= 160; k++) { const v = xm * k / 160, r = solveAt(v); sw.push([v, r[0], r[1]]); pm = Math.max(pm, r[1]); }
  const Q = frame(cv, { x: { lo: 0, hi: xm, name: "Vin", unit: "V" }, y: { lo: 0, hi: Math.max(P.VDD, .1) * 1.08, name: "Vout", unit: "V", col: T.accent }, y2: { lo: 0, hi: pm * 1.15, name: "heat in M1", unit: "W", col: T.t3 } }), c = Q.c;
  Q.clip(); line(c, sw.map(([v, x]) => [Q.X(v), Q.Y(x)]), rgbS(T.accent), 2.6); line(c, sw.map(([v, , p]) => [Q.X(v), Q.Y2(p)]), rgbS(T.t3), 2, [6, 4]);
  line(c, [[Q.X(P.Vin), Q.top], [Q.X(P.Vin), Q.bot]], rgbS(T.ink, .4), 1, [3, 3]); dot(c, Q.X(P.Vin), Q.Y(st.vout), rgbS(T.cursor), 6); dot(c, Q.X(P.Vin), Q.Y2(st.pm), rgbS(T.t3), 4.5); c.restore();
  const pk = sw.reduce((a, b) => b[2] > a[2] ? b : a);
  if (pk[2] > 1e-12) pill(c, clamp(Q.X(pk[0]) + 12, Q.l + 8, Q.r - 260), clamp(Q.Y2(pk[2]) + 4, Q.top + 30, Q.bot - 4), `hottest: ${fW(pk[2])} at Vin = ${pk[0].toFixed(2)} V`, rgbS(T.t3), "left", 10);
  if (note) pill(c, Q.r - 8, Q.bot - 10, note, rgbS(T.accent), "right", 10.5);
}

/* ----- the seven templates ----- */
const TPL = {
  lsw: {
    name: "Low-side switch", short: "n-channel switch", dev: "n", anim: "Vin",
    blurb: `<b>What it is.</b> An n-channel MOSFET between a load and ground. The load hangs from the supply to the drain, and the gate decides whether current flows. <b>Why we care.</b> It's the most common MOSFET circuit there is: LEDs, relays, motors, any logic-driven load. It's Problem 1 of the Switches homework, built with this page's device.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "RL", label: "Load R<sub>L</sub>", min: .01, max: 1e7, log: true, fmt: fR },
      { k: "Vin", label: "Gate drive V<sub>in</sub>", min: 0, max: 2 * pre().vdd, step: .01, fmt: fV, hint: "The source is grounded, so V<sub>GS</sub> = V<sub>in</sub>." }],
    suggest(D) { const V = pre().vdd, d = D.n, isat = d.beta / 2 * Math.max(.2, V - d.vt) ** 2, ion = Math.min(.1 * isat, .5 * B.rate.ID); return { VDD: V, RL: e6(V / ion), Vin: V }; },
    at(d, P, vin) { const v = root(x => idOf(d, vin, x) - (P.VDD - x) / P.RL, 0, P.VDD), i = (P.VDD - v) / P.RL; return { v, i }; },
    solve(P, D) { const d = D.n, o = TPL.lsw.at(d, P, P.Vin), i = o.i, v = o.v; return { d, vgs: P.Vin, vds: v, i, reg: regionOf(d, P.Vin, v), vout: v, pm: i * v, pl: i * i * P.RL }; },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = fV(P.Vin); h.t.rl.textContent = fR(P.RL); h.t.out.textContent = fV(st.vout); h.t.i.textContent = "I = " + fA(st.i); },
    plotA(cv, st, P) { famPlot(cv, st.d, { vgs: st.vgs, vds: st.vds, i: st.i, xmax: Math.max(P.VDD, .1) * 1.05, ymax: 1.25 * P.VDD / P.RL || 1e-3, load: [P.VDD / P.RL, P.VDD], steps: nice(0, 2 * pre().vdd, 5).filter(v => v > st.d.vt), loadName: "load line: what RL allows" }); },
    capA: "M1's curve (blue) and the load line (red). The circuit sits where they cross: the only point that both M1 and R<sub>L</sub> agree on.",
    plotB(cv, st, P) { switchSweep(cv, st, P, 2 * pre().vdd, v => { const o = TPL.lsw.at(st.d, P, v); return [o.v, o.i * o.v]; }); },
    capB: "Sweep the gate (Animate does it). V<sub>out</sub> snaps from V<sub>DD</sub> down to near 0, and M1's heat peaks in between, where it's half on. Good switches cross that zone fast.",
    reads(st, P) { return lc("V<sub>out</sub> = V<sub>DS</sub>", fV(st.vout)) + lc("Load current", fA(st.i)) + lc("M1 acts like", st.i > 1e-15 ? fR(st.vds / st.i) : "an open switch") + lc("Region", st.reg) + lc("Heat in M1", fW(st.pm)) + lc("Power to the load", fW(st.pl)) + lc("Efficiency", st.i > 0 ? (100 * st.pl / (st.pl + st.pm)).toFixed(1) + " %" : "–") + lc("1/(βV<sub>ov</sub>) estimate", P.Vin > st.d.vt ? fR(1 / (st.d.beta * (P.Vin - st.d.vt))) : "–"); },
    notes(st, P) {
      if (P.Vin - st.d.vt <= 0) return `<p><b>Off.</b> V<sub>in</sub> = ${fV(P.Vin)} is below V<sub>T</sub>, so M1 has no channel. No current flows through R<sub>L</sub>, so it drops nothing, and V<sub>out</sub> sits at V<sub>DD</sub>.</p>`;
      if (st.reg === "triode" && st.vds < .1 * P.VDD) return `<p><b>On, and a good switch.</b> M1 is deep in triode, acting like ${fR(st.vds / st.i)}. Only ${fV(st.vds)} is lost across it, so the load gets ${(100 * (1 - st.vds / P.VDD)).toFixed(1)}% of the supply. To lose even less, drive the gate harder: R<sub>DS(on)</sub> ≈ 1/(β V<sub>ov</sub>).</p>`;
      return `<p><b>Partly on.</b> M1 is ${st.reg === "saturation" ? "in saturation, limiting the current like a current source" : "in triode, but with a large voltage across it"}. It drops ${fV(st.vds)} at ${fA(st.i)} and heats up by ${fW(st.pm)}. A switch should never rest here.</p>`;
    },
    checks(st) { return devChecks(st.d, st.vgs, st.vds, st.i); }
  },
  hsw: {
    name: "High-side switch", short: "p-channel switch", dev: "p", anim: "Vin",
    blurb: `<b>What it is.</b> A p-channel MOSFET between the supply and a load whose other end is grounded. Pulling the gate <i>low</i> turns it on. <b>Why we care.</b> It switches a load's supply while the load stays grounded: battery disconnects, power rails, reverse-polarity protection. It's Problem 2 of the Switches homework.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "RL", label: "Load R<sub>L</sub>", min: .01, max: 1e7, log: true, fmt: fR },
      { k: "Vin", label: "Gate voltage V<sub>in</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV, hint: "The source sits on V<sub>DD</sub>, so V<sub>SG</sub> = V<sub>DD</sub> − V<sub>in</sub>. A low gate is on." }],
    suggest(D) { const V = pre().vdd, d = D.p, isat = d.beta / 2 * Math.max(.2, V - d.vt) ** 2, ion = Math.min(.1 * isat, .5 * B.rate.ID); return { VDD: V, RL: e6(V / ion), Vin: 0 }; },
    at(d, P, vin) { const vsg = Math.max(0, P.VDD - vin), v = root(x => idOf(d, vsg, x) - (P.VDD - x) / P.RL, 0, P.VDD); return { vsg, v, i: (P.VDD - v) / P.RL }; },
    solve(P, D) { const d = D.p, o = TPL.hsw.at(d, P, P.Vin), i = o.i; return { d, vgs: o.vsg, vds: o.v, i, reg: regionOf(d, o.vsg, o.v), vout: P.VDD - o.v, pm: i * o.v, pl: i * i * P.RL }; },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = fV(P.Vin); h.t.rl.textContent = fR(P.RL); h.t.out.textContent = fV(st.vout); h.t.i.textContent = "I = " + fA(st.i); },
    plotA(cv, st, P) { famPlot(cv, st.d, { vgs: st.vgs, vds: st.vds, i: st.i, xmax: Math.max(P.VDD, .1) * 1.05, ymax: 1.25 * P.VDD / P.RL || 1e-3, load: [P.VDD / P.RL, P.VDD], steps: nice(0, 2.5 * pre().vdd, 5).filter(v => v > st.d.vt), loadName: "load line: what RL allows" }); },
    capA: "Everything here is in p-channel quantities: V<sub>SD</sub> across M1 and |I<sub>D</sub>| through it. It's the n-channel switch's picture again.",
    plotB(cv, st, P) { switchSweep(cv, st, P, Math.max(P.VDD, P.Vin, .1) * 1.05, v => { const o = TPL.hsw.at(st.d, P, v); return [P.VDD - o.v, o.i * o.v]; }, "on while the gate is low"); },
    capB: "V<sub>out</sub> against the gate voltage: the low-side switch's mirror image. A high gate is off; a low gate is on.",
    reads(st, P) { return lc("V<sub>out</sub>", fV(st.vout)) + lc("V<sub>SG</sub>", fV(st.vgs)) + lc("V<sub>SD</sub> across M1", fV(st.vds)) + lc("I<sub>D</sub>", st.i > 0 ? "−" + fA(st.i) : "0") + lc("M1 acts like", st.i > 1e-15 ? fR(st.vds / st.i) : "an open switch") + lc("Region", st.reg) + lc("Heat in M1", fW(st.pm)) + lc("Power to the load", fW(st.pl)); },
    notes(st, P) {
      if (st.vgs - st.d.vt <= 0) return `<p><b>Off.</b> The gate is within |V<sub>T</sub>| of the source (V<sub>SG</sub> = ${fV(st.vgs)}), so there's no channel. R<sub>L</sub> holds V<sub>out</sub> at 0 V.</p>`;
      return `<p><b>${st.reg === "triode" && st.vds < .1 * P.VDD ? "On." : "Partly on."}</b> The gate sits ${fV(st.vgs)} below the source, so holes form a channel. M1 drops ${fV(st.vds)} and passes ${fA(st.i)} out of its drain into R<sub>L</sub>. At the same size and drive a p-channel part is weaker (holes are slower), so its R<sub>DS(on)</sub> is higher.</p>`;
    },
    checks(st) { return devChecks(st.d, st.vgs, st.vds, st.i); }
  },
  tsw: {
    name: "Switching transient", short: "gate charge, Miller plateau", dev: "n", anim: "time",
    blurb: `<b>What it is.</b> A low-side switch watched in time, as a gate driver pushes charge through R<sub>G</sub> into the gate's capacitance. The load is an inductor carrying a steady current, with a clamp diode across it: the setup every datasheet's gate-charge test uses. <b>Why we care.</b> A real switch spends nanoseconds to microseconds half-on at every edge, and that's where switching loss comes from. The flat 'Miller plateau' is drawn on every power MOSFET datasheet.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "IL", label: "Load current I<sub>L</sub>", min: 1e-6, max: 300, log: true, fmt: fA, hint: "The inductor keeps this current flowing, through M1 when it's on and through the diode when it's off." },
      { k: "Vdr", label: "Gate driver's high level", min: 0, max: 2 * pre().vdd, step: .01, fmt: fV }, { k: "RG", label: "Gate resistor R<sub>G</sub>", min: .1, max: 1e6, log: true, fmt: fR, hint: "A smaller R<sub>G</sub> charges the gate faster." },
      { k: "cgd", label: "C<sub>gd</sub> as a share of WLC<sub>ox</sub>", min: .01, max: .6, step: .01, fmt: v => (v * 100).toFixed(0) + " %", hint: "The gate-to-drain overlap. It causes the Miller plateau." },
      { k: "f", label: "Switching frequency", min: 100, max: 1e8, log: true, fmt: v => E3(v, "Hz") }],
    suggest(D) { const L = TPL.lsw.suggest(D), C = D.n.W * D.n.L * D.n.cox; return { VDD: L.VDD, IL: e6(L.VDD / L.RL), Vdr: L.Vin, RG: e6(clamp(1e-8 / C, 1, 1e5)), cgd: .3, f: 1e5 }; },
    sim(P, D) {
      const d = D.n, WLC = d.W * d.L * d.cox, cgs = 2 / 3 * WLC + .05 * WLC, cgd = P.cgd * WLC, cds = cgd, ciss = cgs + cgd;
      const ipl = Math.min(P.IL, idOf(d, P.Vdr, P.VDD)), vpl = d.vt + Math.sqrt(2 * ipl / d.beta);
      const tpl = P.Vdr > vpl + .02 ? cgd * P.VDD * P.RG / (P.Vdr - vpl) : 0, Th = 6 * P.RG * ciss + 1.6 * tpl;
      /* the clamp diode, smoothed: it carries whatever part of IL M1 doesn't, once the drain rises to VDD */
      const sw = .005, Gc = Math.max(P.IL, 1e-12) / .02, clampI = y => { const z = (y - P.VDD) / sw; return Gc * sw * (z > 30 ? z : Math.log1p(Math.exp(z))); }, clampG = y => Gc / (1 + Math.exp(-(y - P.VDD) / sw));
      const Nn = 1400, dt = Th / Nn, M00 = cgs + cgd, M01 = -cgd, M11 = cgd + cds, out = { t: [], vg: [], vd: [], id: [], ig: [], src: [], Th, cgs, cgd, ciss, vpl, tpl };
      let x = 0, y = P.VDD + sw * Math.log(Math.expm1(Math.max(P.IL, 1e-12) / (Gc * sw)));
      /* backward Euler with Newton steps: the gate node and the drain node, coupled through Cgd */
      for (let k = 0; k <= 2 * Nn; k++) {
        const t = k * dt, vs = t < Th ? P.Vdr : 0;
        if (k > 0) {
          const xp = out.vg[k - 1], yp = out.vd[k - 1];
          for (let it = 0; it < 5; it++) {
            const h = 1e-6, i0 = idOf(d, x, y), gm = (idOf(d, x + h, y) - i0) / h, gds = (idOf(d, x, y + h) - i0) / h;
            const G1 = (M00 * (x - xp) + M01 * (y - yp)) / dt - (vs - x) / P.RG, G2 = (M01 * (x - xp) + M11 * (y - yp)) / dt - (P.IL - clampI(y) - i0);
            const a = M00 / dt + 1 / P.RG, b = M01 / dt, c2 = M01 / dt + gm, e = M11 / dt + clampG(y) + gds, det = a * e - b * c2;
            x -= (G1 * e - b * G2) / det; y -= (a * G2 - c2 * G1) / det;
          }
        }
        out.t.push(t); out.vg.push(x); out.vd.push(y); out.id.push(idOf(d, x, y)); out.ig.push((vs - x) / P.RG); out.src.push(vs);
      }
      out.p = out.id.map((i, k) => i * out.vd[k]);
      let eon = 0, eoff = 0, qg = 0;
      for (let k = 1; k <= 2 * Nn; k++) { const e = (out.p[k] + out.p[k - 1]) / 2 * dt; if (k <= Nn) { eon += e; qg += Math.max(0, out.ig[k]) * dt; } else eoff += e; }
      const vfin = out.vd[Nn], span = P.VDD - vfin;
      const cross = (lo, hi, lev, dir) => { for (let k = lo + 1; k <= hi; k++) if ((out.vd[k - 1] - lev) * dir > 0 && (out.vd[k] - lev) * dir <= 0) return out.t[k]; return NaN; };
      out.ton = cross(0, Nn, vfin + .1 * span, 1) - cross(0, Nn, vfin + .9 * span, 1); out.toff = cross(Nn, 2 * Nn, vfin + .9 * span, -1) - cross(Nn, 2 * Nn, vfin + .1 * span, -1);
      Object.assign(out, { eon, eoff, qg, N: Nn, dt, vfin, span }); return out;
    },
    solve(P, D) {
      const key = JSON.stringify([P, B.dev.n, B.env]); if (LAB.simKey !== key) { LAB.sim = TPL.tsw.sim(P, D); LAB.simKey = key; }
      const S = LAB.sim, u = (LAB.t / 6) % 1, k = Math.min(2 * S.N, Math.round(u * 2 * S.N)), on = S.src[k] > 0;
      const ph = !on ? 4 : S.vg[k] < D.n.vt ? 0 : S.vd[k] > S.vfin + .9 * S.span ? 1 : S.vd[k] > S.vfin + .05 * S.span ? 2 : 3;
      return { d: D.n, S, k, ph, vgs: S.vg[k], vds: S.vd[k], i: S.id[k], tt: S.t[k] };
    },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = fV(st.S.src[st.k]); h.t.il.textContent = fA(P.IL); h.t.rg.textContent = fR(P.RG); h.t.out.textContent = "VDS " + fV(st.vds); h.t.i.textContent = "ID " + fA(st.i); },
    plotA(cv, st, P) {
      const S = st.S, tm = S.t[2 * S.N], u = st.tt, vm = Math.max(P.VDD, P.Vdr, .1) * 1.1, pl = S.tpl > 0 && P.Vdr > S.vpl;
      const Q = frame(cv, { x: { lo: 0, hi: tm, name: "time", unit: "s" }, y: { lo: 0, hi: vm, name: "volts", unit: "V", fixed: true } }), c = Q.c;
      Q.clip();
      if (pl) line(c, [[Q.l, Q.Y(S.vpl)], [Q.r, Q.Y(S.vpl)]], rgbS(T.cursor, .6), 1, [2, 3]);
      line(c, S.t.map((t, k) => [Q.X(t), Q.Y(S.src[k])]), rgbS(T.muted, .8), 1.4);
      line(c, S.t.map((t, k) => [Q.X(t), Q.Y(S.vd[k])]), rgbS(T.t3), 2.4);
      line(c, S.t.map((t, k) => [Q.X(t), Q.Y(S.vg[k])]), rgbS(T.accent), 2.6);
      line(c, [[Q.X(u), Q.top], [Q.X(u), Q.bot]], rgbS(T.cursor), 1.4); dot(c, Q.X(u), Q.Y(st.vgs), rgbS(T.accent), 5); dot(c, Q.X(u), Q.Y(st.vds), rgbS(T.t3), 5);
      c.restore();
      pill(c, Q.r - 8, Q.top + 16, "VGS (gate)", rgbS(T.accent), "right", 10.5); pill(c, Q.r - 8, Q.top + 33, "VDS (drain)", rgbS(T.t3), "right", 10.5); pill(c, Q.r - 8, Q.top + 50, "driver", rgbS(T.muted), "right", 10.5);
      if (pl) pill(c, Q.r - 8, Q.Y(S.vpl) - 7, `Miller plateau ≈ ${S.vpl.toFixed(2)} V`, rgbS(T.cursor), "right", 10);
    },
    plotB(cv, st, P) {
      const S = st.S, tm = S.t[2 * S.N], u = st.tt, im = Math.max(...S.id) * 1.15 || 1e-6, pm = Math.max(...S.p) * 1.15 || 1e-9;
      const Q = frame(cv, { x: { lo: 0, hi: tm, name: "time", unit: "s" }, y: { lo: 0, hi: im, name: "ID", unit: "A", col: T.accent }, y2: { lo: 0, hi: pm, name: "heat VDS·ID", unit: "W", col: T.t3 } }), c = Q.c;
      Q.clip();
      c.fillStyle = rgbS(T.t3, .16); c.beginPath(); c.moveTo(Q.X(0), Q.bot); S.t.forEach((t, k) => c.lineTo(Q.X(t), Q.Y2(S.p[k]))); c.lineTo(Q.X(tm), Q.bot); c.closePath(); c.fill();
      line(c, S.t.map((t, k) => [Q.X(t), Q.Y2(S.p[k])]), rgbS(T.t3), 1.8);
      line(c, S.t.map((t, k) => [Q.X(t), Q.Y(S.id[k])]), rgbS(T.accent), 2.6);
      line(c, [[Q.X(u), Q.top], [Q.X(u), Q.bot]], rgbS(T.cursor), 1.4); dot(c, Q.X(u), Q.Y(st.i), rgbS(T.accent), 5);
      c.restore();
      pill(c, Q.r - 8, Q.top + 16, `each turn-on loses ${E3(S.eon, "J")}, each turn-off ${E3(S.eoff, "J")}`, rgbS(T.t3), "right", 10.5);
    },
    capA: "The driver (grey) steps high, then low. The gate (blue) charges through R<sub>G</sub>. The drain (red) can only fall once M1 carries all of I<sub>L</sub>, and while it falls the gate stalls on the plateau.",
    capB: "Current, and the heat it makes. The shaded humps are the switching losses: energy lost at every single edge, so they scale with frequency.",
    reads(st, P) { const S = st.S, f = P.f; return lc("C<sub>iss</sub> = C<sub>gs</sub> + C<sub>gd</sub>", E3(S.ciss, "F")) + lc("C<sub>rss</sub> = C<sub>gd</sub>", E3(S.cgd, "F")) + lc("Gate charge Q<sub>g</sub>", E3(S.qg, "C")) + lc("Plateau voltage", P.Vdr > S.vpl ? fV(S.vpl) : "none")
      + lc("V<sub>DS</sub> fall time (90→10%)", isFinite(S.ton) ? E3(S.ton, "s") : "–") + lc("V<sub>DS</sub> rise time", isFinite(S.toff) ? E3(S.toff, "s") : "–") + lc(`Switching loss at ${E3(f, "Hz")}`, fW((S.eon + S.eoff) * f)) + lc("Gate-drive power Q<sub>g</sub>V f", fW(S.qg * P.Vdr * f)); },
    notes(st, P) {
      const L = ["<b>1. Charging to threshold.</b> The gate fills C<sub>gs</sub> through R<sub>G</sub>, but it's still below V<sub>T</sub>: no channel, no current, and V<sub>DS</sub> stays at V<sub>DD</sub>.",
        "<b>2. Current moves over.</b> Past V<sub>T</sub> the channel forms and I<sub>D</sub> climbs toward I<sub>L</sub>, taking current away from the diode. Until M1 carries all of it, the diode holds the drain at V<sub>DD</sub>, so M1 has full voltage and rising current: heat.",
        "<b>3. The Miller plateau.</b> M1 now carries the full current and V<sub>DS</sub> falls. The falling drain pulls on C<sub>gd</sub>, so nearly all the gate current goes into C<sub>gd</sub> and V<sub>GS</sub> stalls. Most of the switching loss happens here.",
        "<b>4. Fully on.</b> V<sub>DS</sub> has collapsed. The gate charges the rest of the way to the driver's level, which lowers R<sub>DS(on)</sub>.",
        "<b>5. Turn-off.</b> The same story backwards: the gate discharges, stalls on the plateau while V<sub>DS</sub> rises, then drops below V<sub>T</sub>."];
      return `<p>${L[st.ph]}</p>${P.Vdr <= st.S.vpl ? `<p><b class="badtxt">The driver never reaches the plateau.</b> M1 needs about ${fV(st.S.vpl)} on its gate to carry ${fA(P.IL)}, so it never fully turns on.</p>` : ""}<p class="tip">One sweep of the cursor covers ${E3(st.S.t[2 * st.S.N], "s")} of real time. Raise R<sub>G</sub> or C<sub>gd</sub> and the plateau stretches, and the loss grows with it.</p>`;
    },
    checks(st) { const S = st.S; return devChecks(st.d, Math.max(...S.vg), Math.max(...S.vd), Math.max(...S.id), Math.max(...S.p), true); }
  },
  inv: {
    name: "CMOS inverter", short: "the logic gate", dev: "both", anim: "Vin",
    blurb: `<b>What it is.</b> A p-channel MOSFET on top, an n-channel one below, gates tied together. Whatever the input, one of them is off. <b>Why we care.</b> It's the cell every digital chip is built from, billions of times over. It draws almost no current while it sits still, which is why your laptop doesn't melt.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: .2, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "Vin", label: "Input V<sub>in</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV },
      { k: "kp", label: "Widen the p-channel part ×", min: .25, max: 8, log: true, fmt: v => v.toFixed(2) + "×", hint: "The workbench's p device, made this many times wider here. Match β<sub>p</sub> to β<sub>n</sub> to centre the switching point." }],
    suggest() { return { VDD: pre().vdd, Vin: +(pre().vdd * .4).toFixed(2), kp: 1 }; },
    out(dn, dp, V, vin) { const v = root(x => idOf(dn, vin, x) - idOf(dp, V - vin, V - x), 0, V); return { v, i: idOf(dn, vin, v) }; },
    solve(P, D) {
      const dn = D.n, dp = makeDev({ ...B.dev.p, W: B.dev.p.W * P.kp }, "p", B.env), V = P.VDD, vin = Math.min(P.Vin, V), at = x => TPL.inv.out(dn, dp, V, x), o = at(vin), sw = [];
      for (let k = 0; k <= 300; k++) { const x = V * k / 300, r = at(x); sw.push([x, r.v, r.i]); }
      const vm = root(x => x - at(x).v, 0, V);
      let vil = NaN, vih = NaN;
      for (let k = 1; k < sw.length; k++) { const s = (sw[k][1] - sw[k - 1][1]) / (sw[k][0] - sw[k - 1][0]); if (isNaN(vil) && s < -1) vil = sw[k - 1][0]; if (!isNaN(vil) && isNaN(vih) && s > -1 && sw[k][0] > vm) vih = sw[k][0]; }
      const g = (at(Math.min(V, vm + 1e-4)).v - at(Math.max(0, vm - 1e-4)).v) / 2e-4;
      return { d: dn, dp, vin, vout: o.v, i: o.i, sw, vm, vil, vih, voh: isFinite(vil) ? at(vil).v : NaN, vol: isFinite(vih) ? at(vih).v : NaN, gain: g, vgs: vin, vds: o.v };
    },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = fV(st.vin); h.t.out.textContent = fV(st.vout); h.t.i.textContent = "IDD = " + fA(st.i); h.t.mp.textContent = `p-channel, ×${P.kp.toFixed(2)} wide`; },
    plotA(cv, st, P) {
      const V = P.VDD, im = Math.max(...st.sw.map(s => s[2])) * 1.15 || 1e-9;
      const Q = frame(cv, { x: { lo: 0, hi: V, name: "Vin", unit: "V" }, y: { lo: 0, hi: V * 1.05, name: "Vout", unit: "V", col: T.accent }, y2: { lo: 0, hi: im, name: "supply current", unit: "A", col: T.t3 } }), c = Q.c;
      Q.clip();
      c.fillStyle = rgbS(T.t3, .14); c.beginPath(); c.moveTo(Q.X(0), Q.bot); st.sw.forEach(([x, , i]) => c.lineTo(Q.X(x), Q.Y2(i))); c.lineTo(Q.X(V), Q.bot); c.closePath(); c.fill();
      line(c, [[Q.X(0), Q.Y(0)], [Q.X(V), Q.Y(V)]], rgbS(T.ink, .3), 1, [4, 4]);
      line(c, st.sw.map(([x, v]) => [Q.X(x), Q.Y(v)]), rgbS(T.accent), 2.8);
      for (const [x, lb] of [[st.vil, "VIL"], [st.vih, "VIH"]]) if (isFinite(x)) { line(c, [[Q.X(x), Q.top], [Q.X(x), Q.bot]], rgbS(T.muted, .7), 1, [2, 3]); tag(c, Q.X(x) + 3, Q.bot - 6, lb, rgbS(T.muted), "left", 10, 600); }
      dot(c, Q.X(st.vm), Q.Y(st.vm), rgbS(T.ink, .7), 4);
      dot(c, Q.X(st.vin), Q.Y(st.vout), rgbS(T.cursor), 6.5); dot(c, Q.X(st.vin), Q.Y2(st.i), rgbS(T.t3), 4.5);
      c.restore();
      pill(c, Q.r - 8, Q.top + 16, `switching point VM = ${st.vm.toFixed(3)} V`, rgbS(T.ink), "right", 10.5);
      pill(c, Q.r - 8, Q.top + 33, "shaded: current through both", rgbS(T.t3), "right", 10.5);
    },
    capA: "The voltage transfer curve. Low in gives high out, and high in gives low out. In between, both transistors conduct and the supply current (shaded) spikes.",
    plotB(cv, st, P) {
      const V = P.VDD, In = x => idOf(st.d, st.vin, x), Ip = x => idOf(st.dp, V - st.vin, V - x), ym = Math.max(In(V), Ip(0), 1e-12) * 1.1;
      const Q = frame(cv, { x: { lo: 0, hi: V, name: "Vout", unit: "V" }, y: { lo: 0, hi: ym, name: "current", unit: "A" } }), c = Q.c;
      Q.clip(); line(c, curve(Q, In, 0, V, 200), rgbS(T.t2), 2.6); line(c, curve(Q, Ip, 0, V, 200), rgbS(T.t3), 2.6);
      dot(c, Q.X(st.vout), Q.Y(st.i), rgbS(T.cursor), 6.5); c.restore();
      pill(c, Q.l + 8, Q.top + 16, "M2 (p) can push up", rgbS(T.t3), "left", 10.5); pill(c, Q.r - 8, Q.top + 16, "M1 (n) can pull down", rgbS(T.t2), "right", 10.5);
    },
    capB: "The tug of war at this input. M1 pulls the output down, M2 pushes it up, and the output settles where their currents match. Move V<sub>in</sub> and watch the crossing slide.",
    reads(st, P) {
      return lc("V<sub>out</sub>", fV(st.vout)) + lc("Supply current", fA(st.i)) + lc("Static power", fW(st.i * P.VDD)) + lc("Switching point V<sub>M</sub>", fV(st.vm))
        + lc("Gain at V<sub>M</sub>", Math.abs(st.gain) > 1e4 || !isFinite(st.gain) ? "∞ (λ = 0)" : st.gain.toPrecision(3)) + lc("Noise margin, low", isFinite(st.vil) && isFinite(st.vol) ? fV(st.vil - st.vol) : "–")
        + lc("Noise margin, high", isFinite(st.vih) && isFinite(st.voh) ? fV(st.voh - st.vih) : "–") + lc("β<sub>p</sub>/β<sub>n</sub>", (st.dp.beta / st.d.beta).toPrecision(3));
    },
    notes(st, P) {
      const r = Math.sqrt(st.dp.beta / st.d.beta), vmf = (st.d.vt + r * (P.VDD - st.dp.vt)) / (1 + r);
      const who = st.vout > .9 * P.VDD ? "M2 (p) is on and M1 (n) is off or nearly off, so the output is high." : st.vout < .1 * P.VDD ? "M1 (n) is on and M2 (p) is off or nearly off, so the output is low." : "Both are on and fighting, so current flows straight through from V<sub>DD</sub> to ground. Logic never rests here.";
      return `<p>${who}</p><p>The switching point is V<sub>M</sub> = (V<sub>Tn</sub> + r(V<sub>DD</sub> − |V<sub>Tp</sub>|))/(1 + r), with r = √(β<sub>p</sub>/β<sub>n</sub>) = ${r.toFixed(3)}: ${fV(vmf)}. Equal β puts it near the middle, which is why the p part is made wider.</p>`;
    },
    checks(st, P) { return devChecks(st.d, st.vin, st.vout, st.i).concat(devChecks(st.dp, P.VDD - st.vin, P.VDD - st.vout, st.i).filter(r => r.st === "bad").map(r => ({ ...r, nm: "M2: " + r.nm }))); }
  },
  cs: {
    name: "Common-source amplifier", short: "voltage gain", dev: "n", anim: "time",
    blurb: `<b>What it is.</b> A MOSFET biased in saturation with a resistor R<sub>D</sub> from the supply to its drain. A small wiggle on the gate makes a big, upside-down wiggle at the drain. <b>Why we care.</b> It's the MOSFET's basic amplifier, inside op-amps, radios and sensor front ends. It shows why saturation matters: that's where the device acts like a current source the gate can steer.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "RD", label: "Drain resistor R<sub>D</sub>", min: .1, max: 1e7, log: true, fmt: fR },
      { k: "RS", label: "Source resistor R<sub>S</sub>", min: .1, max: 1e7, log: true, zero: true, fmt: v => v === 0 ? "0 Ω (grounded)" : fR(v), hint: "Far left is 0 Ω. Any R<sub>S</sub> trades gain for stability: degeneration." },
      { k: "VGG", label: "Gate bias V<sub>GG</sub>", min: 0, max: 2 * pre().vdd, step: .001, fmt: v => v.toFixed(3) + " V" }, { k: "A", label: "Input amplitude", min: 1e-4, max: 2, log: true, fmt: v => E3(v, "V") }],
    suggest(D) { const d = D.n, V = pre().vdd, vov = Math.min(.4, .3 * V), I = d.beta / 2 * vov * vov, RD = e6(V / 2 / I), Ia = V / 2 / RD, vg = d.vt + Math.sqrt(2 * Ia / d.beta); return { VDD: V, RD, RS: 0, VGG: +vg.toFixed(3), A: e6(.08 * vov) }; },
    at(d, P, vg) { const I = root(x => x - idOf(d, vg - x * P.RS, P.VDD - x * (P.RD + P.RS)), 0, P.VDD / (P.RD + P.RS)); return { i: I, vout: P.VDD - I * P.RD, vgs: vg - I * P.RS, vds: P.VDD - I * (P.RD + P.RS) }; },
    solve(P, D) {
      const d = D.n, q = TPL.cs.at(d, P, P.VGG), wav = []; let lo = Infinity, hi = -Infinity, clipT = false, clipC = false;
      for (let k = 0; k <= 200; k++) { const ph = k / 100, vg = P.VGG + P.A * Math.sin(2 * Math.PI * ph), r = TPL.cs.at(d, P, vg); wav.push([ph, vg, r.vout, r.vds, r.i]); lo = Math.min(lo, r.vout); hi = Math.max(hi, r.vout); const g = regionOf(d, r.vgs, r.vds); if (g === "triode") clipT = true; if (g === "cutoff") clipC = true; }
      const ph = (LAB.t / 3) % 2, vg = P.VGG + P.A * Math.sin(2 * Math.PI * ph), now = TPL.cs.at(d, P, vg);
      const gm = (idOf(d, q.vgs + 1e-5, q.vds) - idOf(d, q.vgs - 1e-5, q.vds)) / 2e-5, gds = (idOf(d, q.vgs, q.vds + 1e-5) - idOf(d, q.vgs, q.vds - 1e-5)) / 2e-5, ro = gds > 0 ? 1 / gds : Infinity;
      const rpar = isFinite(ro) ? P.RD * ro / (P.RD + ro) : P.RD, av = -gm * rpar / (1 + gm * P.RS);
      return { d, q, wav, lo, hi, clipT, clipC, ph, vgNow: vg, now, gm, ro, av, meas: -(hi - lo) / (2 * P.A), vgs: now.vgs, vds: now.vds, i: now.i, reg: regionOf(d, q.vgs, q.vds) };
    },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = E3(st.vgNow - P.VGG, "V"); h.t.vgg.textContent = P.VGG.toFixed(3) + " V"; h.t.rd.textContent = fR(P.RD); h.t.rs.textContent = fR(P.RS); h.t.out.textContent = fV(st.now.vout); h.t.i.textContent = "ID = " + fA(st.i); },
    plotA(cv, st, P) { waveAmp(cv, st, P, false); },
    capA: "Two cycles of input (top) and output (bottom), each on its own scale. The output is upside down: more gate voltage, more current, more drop across R<sub>D</sub>, a lower drain. Push the amplitude up until a peak flattens.",
    plotB(cv, st, P) {
      famPlot(cv, st.d, { vgs: st.now.vgs, vds: st.now.vds, i: st.now.i, xmax: Math.max(P.VDD, .1) * 1.05, ymax: 1.3 * P.VDD / (P.RD + P.RS), load: [P.VDD / (P.RD + P.RS), P.VDD], band: st.wav.map(w => [w[3], w[4]]),
        steps: [st.q.vgs - 2 * P.A, st.q.vgs + 2 * P.A].filter(v => v > 0), loadName: "load line, slope −1/(RD + RS)", extra: Q => dot(Q.c, Q.X(st.q.vds), Q.Y(st.q.i), rgbS(T.ink, .7), 4) });
    },
    capB: "The operating point rides up and down the load line (orange band). It has to stay in the green saturation zone; when it slides into the blue triode zone at the top left, the output's bottom peak clips.",
    reads(st, P) {
      return lc("Bias current I<sub>D</sub>", fA(st.q.i)) + lc("Bias V<sub>DS</sub>", fV(st.q.vds)) + lc("Bias region", st.reg) + lc("g<sub>m</sub>", E3(st.gm, "S")) + lc("r<sub>o</sub>", fR(st.ro))
        + lc("Gain from the formula", st.av.toPrecision(3)) + lc("Gain measured peak to peak", isFinite(st.meas) ? st.meas.toPrecision(3) : "–") + lc("Headroom before triode", fV(st.q.vds - (st.q.vgs - st.d.vt)));
    },
    notes(st) {
      if (st.reg !== "saturation") return `<p><b>Not biased in saturation</b> (${st.reg}). ${st.reg === "triode" ? "Too much current or too big an R<sub>D</sub>: the drain has fallen below V<sub>GS</sub> − V<sub>T</sub>. Lower V<sub>GG</sub> or R<sub>D</sub>." : "Raise V<sub>GG</sub> past V<sub>T</sub>."} An amplifier needs the current-source region.</p>`;
      const ok = !st.clipT && !st.clipC;
      return `<p>The formula A<sub>v</sub> = −g<sub>m</sub>(R<sub>D</sub> ∥ r<sub>o</sub>)/(1 + g<sub>m</sub>R<sub>S</sub>) gives <b>${st.av.toPrecision(3)}</b>. The full model, measured peak to peak, gives <b>${st.meas.toPrecision(3)}</b>. ${Math.abs(st.meas / st.av - 1) < .03 ? "They agree because the input is small." : "They differ because the input is no longer small, so the square law bends the output."}</p>
        <p>${ok ? "No clipping: the operating point stays in saturation all cycle." : st.clipT ? "<b>Clipping:</b> at the input's peaks the drain falls below V<sub>GS</sub> − V<sub>T</sub>, M1 drops into triode, and the output's bottom flattens." : "<b>Clipping:</b> at the input's troughs M1 cuts off, and the output flattens at V<sub>DD</sub>."}</p>`;
    },
    checks(st) { return devChecks(st.d, Math.max(...st.wav.map(w => w[1])), Math.max(...st.wav.map(w => w[3])), Math.max(...st.wav.map(w => w[4]))); }
  },
  sf: {
    name: "Source follower", short: "a buffer", dev: "n", anim: "time",
    blurb: `<b>What it is.</b> The drain goes straight to the supply, and the output comes from the source, across R<sub>S</sub>. The source 'follows' the gate, one V<sub>GS</sub> below it. <b>Why we care.</b> Its gain is just under 1, but its output resistance is low (about 1/g<sub>m</sub>), so it can drive a heavy load without loading the stage before it. It's a buffer.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: 0, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "RS", label: "Source resistor R<sub>S</sub>", min: .1, max: 1e7, log: true, fmt: fR },
      { k: "VGG", label: "Gate bias V<sub>GG</sub>", min: 0, max: 2.5 * pre().vdd, step: .001, fmt: v => v.toFixed(3) + " V" }, { k: "A", label: "Input amplitude", min: 1e-4, max: 5, log: true, fmt: v => E3(v, "V") }],
    suggest(D) { const d = D.n, V = pre().vdd, vov = Math.min(.4, .3 * V), I = d.beta / 2 * vov * vov, RS = e6(V / 3 / I), Ia = V / 3 / RS, vg = V / 3 + d.vt + Math.sqrt(2 * Ia / d.beta); return { VDD: V, RS, VGG: +vg.toFixed(3), A: e6(V / 10) }; },
    at(d, P, vg) { const I = root(x => x - idOf(d, vg - x * P.RS, P.VDD - x * P.RS), 0, P.VDD / P.RS); return { i: I, vout: I * P.RS, vgs: vg - I * P.RS, vds: P.VDD - I * P.RS }; },
    solve(P, D) {
      const d = D.n, q = TPL.sf.at(d, P, P.VGG), wav = []; let lo = Infinity, hi = -Infinity;
      for (let k = 0; k <= 200; k++) { const ph = k / 100, vg = P.VGG + P.A * Math.sin(2 * Math.PI * ph), r = TPL.sf.at(d, P, vg); wav.push([ph, vg, r.vout, r.vds, r.i]); lo = Math.min(lo, r.vout); hi = Math.max(hi, r.vout); }
      const ph = (LAB.t / 3) % 2, vg = P.VGG + P.A * Math.sin(2 * Math.PI * ph), now = TPL.sf.at(d, P, vg);
      const gm = (idOf(d, q.vgs + 1e-5, q.vds) - idOf(d, q.vgs - 1e-5, q.vds)) / 2e-5, gds = (idOf(d, q.vgs, q.vds + 1e-5) - idOf(d, q.vgs, q.vds - 1e-5)) / 2e-5, ro = gds > 0 ? 1 / gds : Infinity;
      const rs = isFinite(ro) ? P.RS * ro / (P.RS + ro) : P.RS, av = gm * rs / (1 + gm * rs);
      return { d, q, wav, lo, hi, ph, vgNow: vg, now, gm, ro, av, meas: (hi - lo) / (2 * P.A), rout: 1 / (gm + 1 / P.RS + gds), vgs: now.vgs, vds: now.vds, i: now.i, reg: regionOf(d, q.vgs, q.vds) };
    },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.vin.textContent = E3(st.vgNow - P.VGG, "V"); h.t.vgg.textContent = P.VGG.toFixed(3) + " V"; h.t.rs.textContent = fR(P.RS); h.t.out.textContent = fV(st.now.vout); h.t.i.textContent = "ID = " + fA(st.i); h.t.vg.textContent = "gate " + fV(st.vgNow); },
    plotA(cv, st, P) { waveAmp(cv, st, P, true); },
    capA: "Gate (blue) and source (red) on one scale. The source tracks the gate a steady V<sub>GS</sub> below it. The gap barely changes, so the gain is just under 1.",
    plotB(cv, st, P) {
      const d = st.d, xm = 2.5 * pre().vdd, pts = [];
      for (let k = 0; k <= 200; k++) { const v = xm * k / 200; pts.push([v, TPL.sf.at(d, P, v).vout]); }
      const Q = frame(cv, { x: { lo: 0, hi: xm, name: "gate voltage", unit: "V", fixed: true }, y: { lo: 0, hi: Math.max(P.VDD, .1) * 1.05, name: "Vout", unit: "V", fixed: true } }), c = Q.c;
      Q.clip(); line(c, [[Q.X(0), Q.Y(0)], [Q.X(xm), Q.Y(xm)]], rgbS(T.ink, .3), 1, [4, 4]); line(c, pts.map(([x, y]) => [Q.X(x), Q.Y(y)]), rgbS(T.accent), 2.8);
      const a = P.VGG - P.A, b = P.VGG + P.A; line(c, [[Q.X(a), Q.Y(TPL.sf.at(d, P, a).vout)], [Q.X(b), Q.Y(TPL.sf.at(d, P, b).vout)]], rgbS(T.cursor, .5), 9);
      dot(c, Q.X(st.vgNow), Q.Y(st.now.vout), rgbS(T.cursor), 6.5); c.restore();
      pill(c, Q.l + 8, Q.top + 16, "dashed: Vout = gate, a gain of exactly 1", rgbS(T.muted), "left", 10.5);
    },
    capB: "Output against gate voltage: a straight line of slope just under 1, shifted right by about V<sub>GS</sub>. It's flat at the start, where the gate is below V<sub>T</sub>, and flat at the top, where the source can't rise past V<sub>DD</sub>. The orange band is the stretch the input swings over.",
    reads(st) {
      return lc("Bias current", fA(st.q.i)) + lc("V<sub>GS</sub> (the drop)", fV(st.q.vgs)) + lc("Bias output", fV(st.q.vout)) + lc("g<sub>m</sub>", E3(st.gm, "S"))
        + lc("Gain from the formula", st.av.toPrecision(4)) + lc("Gain measured", st.meas.toPrecision(4)) + lc("Output resistance", fR(st.rout)) + lc("1/g<sub>m</sub>", fR(1 / st.gm));
    },
    notes(st, P) {
      if (st.reg === "cutoff") return "<p><b>Off.</b> The gate is too low to turn M1 on, so the source sits at 0 V. Raise V<sub>GG</sub>.</p>";
      return `<p>A<sub>v</sub> = g<sub>m</sub>R<sub>S</sub>/(1 + g<sub>m</sub>R<sub>S</sub>) = <b>${st.av.toPrecision(4)}</b>. The bigger g<sub>m</sub>R<sub>S</sub>, the closer to 1. The output resistance is about 1/g<sub>m</sub> ∥ R<sub>S</sub> = ${fR(st.rout)}, ${(P.RS / st.rout).toPrecision(3)} times lower than R<sub>S</sub> alone: that's the buffer's whole point.</p>
        <p>M1 stays in saturation easily here, because its drain sits at V<sub>DD</sub>, far above its gate.</p>`;
    },
    checks(st) { return devChecks(st.d, Math.max(...st.wav.map(w => w[1] - w[2])), Math.max(...st.wav.map(w => w[3])), Math.max(...st.wav.map(w => w[4]))); }
  },
  mir: {
    name: "Current mirror", short: "copying a current", dev: "n", anim: "RL",
    blurb: `<b>What it is.</b> M1 is wired as a diode, gate tied to drain, so the reference current sets its V<sub>GS</sub>. M2 shares that V<sub>GS</sub>, so in saturation it carries the same current, scaled by its width. <b>Why we care.</b> It's how chips make steady currents; every op-amp has a few. It only works while M2 stays in saturation, which is the 'compliance' limit.`,
    ctl: () => [{ k: "VDD", label: "Supply V<sub>DD</sub>", min: .2, max: 2.5 * pre().vdd, step: .01, fmt: fV }, { k: "Iref", label: "Reference current I<sub>ref</sub>", min: 1e-9, max: 100, log: true, fmt: fA },
      { k: "M", label: "M2 width ÷ M1 width", min: .25, max: 8, log: true, fmt: v => v.toFixed(2) + "×" }, { k: "RL", label: "Load R<sub>L</sub> on M2", min: .01, max: 1e8, log: true, fmt: fR, hint: "Make R<sub>L</sub> too big and M2 runs out of drain voltage." }],
    suggest(D) { const d = D.n, V = pre().vdd, I = Math.min(.25 * B.rate.ID, d.beta / 2 * .16); return { VDD: V, Iref: e6(I), M: 1, RL: e6(V / 2 / I) }; },
    solve(P, D) {
      const d = D.n, vgs = root(v => idOf(d, v, v) - P.Iref, 0, 60), d2 = makeDev({ ...B.dev.n, W: B.dev.n.W * P.M }, "n", B.env);
      const out = RL => { const v = root(x => idOf(d2, vgs, x) - (P.VDD - x) / RL, 0, P.VDD); return { v, i: (P.VDD - v) / RL }; };
      const o = out(P.RL), sw = []; for (let k = 0; k <= 200; k++) { const R = .01 * Math.pow(1e10, k / 200); sw.push([R, out(R).i]); }
      const vov = vovE(d, vgs), gds = (idOf(d2, vgs, o.v + 1e-5) - idOf(d2, vgs, Math.max(0, o.v - 1e-5))) / 2e-5;
      return { d, d2, vgs, vov, vout: o.v, i: o.i, sw, ideal: P.M * P.Iref, ro: gds > 0 ? 1 / gds : Infinity, reg: regionOf(d2, vgs, o.v), rmax: (P.VDD - vov) / (P.M * P.Iref), vds: o.v };
    },
    paint(st, P, h) { h.t.vdd.textContent = fV(P.VDD); h.t.iref.textContent = fA(P.Iref); h.t.rl.textContent = fR(P.RL); h.t.out.textContent = fV(st.vout); h.t.i.textContent = "Iout " + fA(st.i); h.t.m2.textContent = `${P.M.toFixed(2)}× as wide`; h.t.vgs.textContent = "VGS " + fV(st.vgs); },
    plotA(cv, st, P) {
      const d2 = st.d2, V = P.VDD, ym = Math.max(st.ideal * 1.6, idOf(d2, st.vgs, V) * 1.15);
      const Q = frame(cv, { x: { lo: 0, hi: V, name: "Vout = VDS of M2", unit: "V", fixed: true }, y: { lo: 0, hi: ym, name: "Iout", unit: "A" } }), c = Q.c;
      Q.clip();
      c.fillStyle = css("--nreg"); c.globalAlpha = .7; c.fillRect(Q.l, Q.top, Q.X(st.vov) - Q.l, Q.bot - Q.top); c.globalAlpha = 1;
      line(c, [[Q.l, Q.Y(st.ideal)], [Q.r, Q.Y(st.ideal)]], rgbS(T.muted), 1.4, [6, 4]);
      line(c, [[Q.X(0), Q.Y(V / P.RL)], [Q.X(V), Q.Y(0)]], rgbS(T.t3), 2.2);
      line(c, curve(Q, x => idOf(d2, st.vgs, x), 0, V, 220), rgbS(T.accent), 2.8);
      dot(c, Q.X(st.vout), Q.Y(st.i), rgbS(T.cursor), 6.5); c.restore();
      pill(c, Q.X(st.vov) + 6, Q.bot - 10, `compliance: Vout must stay above Vov = ${st.vov.toFixed(3)} V`, rgbS(T.ink), "left", 10);
      pill(c, Q.r - 8, Q.top + 16, `ideal copy, ${fA(st.ideal)}`, rgbS(T.muted), "right", 10.5); pill(c, Q.r - 8, Q.top + 33, "RL's load line", rgbS(T.t3), "right", 10.5);
    },
    capA: "M2's curve at the shared V<sub>GS</sub>, against its drain voltage. Right of the blue zone it's a nearly flat current source: the copy. Inside the zone it's in triode, and the copy collapses.",
    plotB(cv, st, P) {
      const ym = Math.max(...st.sw.map(s => s[1]), st.ideal) * 1.15, rm = st.rmax > .01 && st.rmax < 1e8;
      const Q = frame(cv, { x: { lo: .01, hi: 1e8, log: true, name: "RL", unit: "ohms" }, y: { lo: 0, hi: ym, name: "Iout", unit: "A" } }), c = Q.c;
      Q.clip(); line(c, [[Q.l, Q.Y(st.ideal)], [Q.r, Q.Y(st.ideal)]], rgbS(T.muted), 1.4, [6, 4]);
      line(c, st.sw.map(([R, i]) => [Q.X(R), Q.Y(i)]), rgbS(T.accent), 2.8);
      if (rm) line(c, [[Q.X(st.rmax), Q.top], [Q.X(st.rmax), Q.bot]], rgbS(T.bad), 1.4, [3, 3]);
      dot(c, Q.X(P.RL), Q.Y(st.i), rgbS(T.cursor), 6.5); c.restore();
      if (rm) pill(c, Q.X(st.rmax) - 6, Q.top + 16, `largest RL ≈ ${fR(st.rmax).replace("Ω", "ohms")}`, rgbS(T.bad), "right", 10);
    },
    capB: "Output current against load resistance, on a log scale. It's flat across many decades, because the mirror doesn't care what it drives, until R<sub>L</sub> takes so much voltage that M2 leaves saturation.",
    reads(st, P) {
      return lc("Shared V<sub>GS</sub>", fV(st.vgs)) + lc("Overdrive V<sub>ov</sub>", fV(st.vov)) + lc("I<sub>out</sub>", fA(st.i)) + lc("I<sub>out</sub> / I<sub>ref</sub>", (st.i / P.Iref).toPrecision(4))
        + lc("Error from ideal", ((st.i / st.ideal - 1) * 100).toFixed(2) + " %") + lc("M2's region", st.reg) + lc("M2's r<sub>o</sub>", fR(st.ro)) + lc("Largest R<sub>L</sub>", fR(st.rmax));
    },
    notes(st) {
      const e = (st.i / st.ideal - 1) * 100;
      if (st.reg !== "saturation") return `<p><b>Out of compliance.</b> R<sub>L</sub> drops so much that M2's drain is at ${fV(st.vout)}, below V<sub>ov</sub> = ${fV(st.vov)}. M2 is in triode, and only ${fA(st.i)} flows instead of ${fA(st.ideal)}.</p>`;
      return `<p><b>Copying.</b> M2 carries ${fA(st.i)}, ${Math.abs(e) < .05 ? "an exact copy" : `${e > 0 ? "+" : "−"}${Math.abs(e).toFixed(2)}% off the ideal ${fA(st.ideal)}`}. ${st.d.lam > 0 ? `That error is λ at work: M2's V<sub>DS</sub> (${fV(st.vout)}) differs from M1's (${fV(st.vgs)}), so their (1 + λV<sub>DS</sub>) factors differ.` : "With λ = 0 the copy is perfect anywhere in saturation."}</p>`;
    },
    checks(st) { return devChecks(st.d2, st.vgs, st.vout, st.i); }
  }
};
/* two strips, input above and output below (amplifier), or both on one axis (follower) */
function waveAmp(cv, st, P, same) {
  const g = canvas2d(cv), { c, H } = g, w = st.wav, ph = st.ph;
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, g.W, H);
  const X0 = { lo: 0, hi: 2, name: "time, in cycles", unit: "", n: 4 };
  if (same) {
    const lo = Math.min(...w.map(x => Math.min(x[1], x[2]))), hi = Math.max(...w.map(x => Math.max(x[1], x[2]))), pad = (hi - lo) * .12 || .1;
    const Q = frame(cv, { x: X0, y: { lo: Math.max(0, lo - pad), hi: hi + pad, name: "volts", unit: "V", fixed: true } }, g);
    Q.clip(); line(c, w.map(x => [Q.X(x[0]), Q.Y(x[1])]), rgbS(T.accent), 2.6); line(c, w.map(x => [Q.X(x[0]), Q.Y(x[2])]), rgbS(T.t3), 2.6);
    line(c, [[Q.X(ph), Q.top], [Q.X(ph), Q.bot]], rgbS(T.cursor), 1.4); dot(c, Q.X(ph), Q.Y(st.vgNow), rgbS(T.accent), 5); dot(c, Q.X(ph), Q.Y(st.now.vout), rgbS(T.t3), 5); c.restore();
    pill(c, Q.r - 8, Q.top + 16, "gate", rgbS(T.accent), "right", 10.5); pill(c, Q.r - 8, Q.top + 33, "source = Vout", rgbS(T.t3), "right", 10.5);
    return;
  }
  const mid = Math.round(H * .4), pad = (a, b) => (b - a) * .15 || 1e-3;
  const il = Math.min(...w.map(x => x[1])), ih = Math.max(...w.map(x => x[1])), ol = Math.min(...w.map(x => x[2])), oh = Math.max(...w.map(x => x[2]));
  const A = frame(cv, { x: X0, y: { lo: il - pad(il, ih), hi: ih + pad(il, ih), name: "gate (input)", unit: "V", fixed: true, col: T.accent, n: 3 }, area: [26, mid - 12], noX: true }, g);
  A.clip(); line(c, w.map(x => [A.X(x[0]), A.Y(x[1])]), rgbS(T.accent), 2.4); line(c, [[A.X(ph), A.top], [A.X(ph), A.bot]], rgbS(T.cursor), 1.4); dot(c, A.X(ph), A.Y(st.vgNow), rgbS(T.accent), 5); c.restore();
  const Bq = frame(cv, { x: X0, y: { lo: Math.max(0, ol - pad(ol, oh)), hi: Math.min(P.VDD * 1.05, oh + pad(ol, oh)), name: "drain (output)", unit: "V", fixed: true, col: T.t3, n: 4 }, area: [mid + 24, H - 38] }, g);
  Bq.clip(); line(c, w.map(x => [Bq.X(x[0]), Bq.Y(x[2])]), rgbS(T.t3), 2.6); line(c, [[Bq.X(ph), Bq.top], [Bq.X(ph), Bq.bot]], rgbS(T.cursor), 1.4); dot(c, Bq.X(ph), Bq.Y(st.now.vout), rgbS(T.t3), 5); c.restore();
  pill(c, Bq.r - 8, Bq.top + 16, `swing ${E3(oh - ol, "V")} peak to peak`, rgbS(T.t3), "right", 10.5);
  pill(c, A.r - 8, A.top + 16, `swing ${E3(ih - il, "V")} peak to peak`, rgbS(T.accent), "right", 10.5);
}
/* a device's limits inside a circuit. pk: peak power, if it isn't i × vds; transient: the peak is brief */
function devChecks(d, vgs, vds, i, pk, transient) {
  const R = B.rate, p = pk === undefined ? i * vds : pk, rows = [];
  rows.push({ nm: d.type === "n" ? "V<sub>DS</sub> rating" : "V<sub>SD</sub> rating", f: vds / R.VDS, st: lim(vds, R.VDS), val: `${fV(vds)} of ${E3(R.VDS, "V")}` });
  rows.push({ nm: d.type === "n" ? "V<sub>GS</sub> rating" : "V<sub>SG</sub> rating", f: vgs / R.VGS, st: lim(vgs, R.VGS), val: `${fV(vgs)} of ${E3(R.VGS, "V")}` });
  rows.push({ nm: "Current rating", f: i / R.ID, st: lim(i, R.ID), val: `${fA(i)} of ${fA(R.ID)}` });
  rows.push({ nm: transient ? "Peak heat (brief)" : "Power rating", f: p / R.P, st: transient ? (p > R.P ? "info" : "ok") : lim(p, R.P), val: `${fW(p)} of ${fW(R.P)}`,
    why: transient && p > R.P ? "Above the steady rating, but only for nanoseconds to microseconds. Datasheets give a separate pulsed safe operating area for this." : "" });
  return rows;
}

/* ----- lab UI ----- */
function labBuild() {
  const box = $("#labTpls");
  box.innerHTML = Object.entries(TPL).map(([k, t], i) => `<button type="button" data-k="${k}" aria-pressed="${k === LAB.k}"><b>${i + 1}. ${t.name}</b><span>${t.short}</span></button>`).join("");
  box.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; LAB.k = b.dataset.k; $$("button", box).forEach(x => x.setAttribute("aria-pressed", String(x === b))); labReset(); });
  $("#labSuggest").addEventListener("click", labReset);
  $("#labAnim").addEventListener("click", () => { LAB.anim = !LAB.anim; labAnimUI(); });
  speedUI("#labSpd", "#labPause");
  LAB.built = true; labReset();
}
function labAnimUI() { const t = TPL[LAB.k], w = t.anim === "time" ? "time" : t.anim === "Vin" ? "Vin" : "RL"; $("#labAnim").textContent = (LAB.anim ? "Stop " : "Animate ") + w; $("#labAnim").setAttribute("aria-pressed", String(LAB.anim)); }
function labReset() {
  if (!LAB.built) return;
  const t = TPL[LAB.k]; LAB.P = t.suggest(labDevs()); LAB.t = 0; LAB.simKey = null; LAB.anim = t.anim === "time"; LAB.dir = 1;
  $("#labName").textContent = t.name; $("#labWhy").innerHTML = t.blurb;
  const host = $("#labCtl"); host.innerHTML = "";
  LAB.sls = t.ctl().map(s => mkSl(host, { ...s, id: "lab" + s.k, get: () => LAB.P[s.k], set: v => { LAB.P[s.k] = v; }, on: labRefresh }));
  const box = $("#labSch"); box.replaceChildren();
  LAB.s = Schem.svg(box, LAB.k === "inv" || LAB.k === "mir" ? [-30, 6, 480, 350] : LAB.k === "cs" || LAB.k === "sf" ? [-20, 10, 450, 370] : [10, 10, 440, 362], t.name + " schematic, with live voltages and currents");
  LAB.h = ({ lsw: () => drawLS(LAB.s, false), tsw: () => drawT(LAB.s), hsw: () => drawHS(LAB.s), inv: () => drawINV(LAB.s), cs: () => drawCS(LAB.s, false), sf: () => drawCS(LAB.s, true), mir: () => drawMIR(LAB.s) })[LAB.k]();
  $("#labCapA").innerHTML = t.capA; $("#labCapB").innerHTML = t.capB;
  labAnimUI(); labRefresh();
}
function labRefresh(fast) {
  if (!LAB.built || !LAB.h) return;
  const t = TPL[LAB.k], Dv = labDevs(), st = LAB.st = t.solve(LAB.P, Dv), h = LAB.h;
  t.paint(st, LAB.P, h);
  if (LAB.k === "mir") { h.f.speed = spdI(LAB.P.Iref); h.f2.speed = spdI(st.i); h.f0.speed = spdI(LAB.P.Iref + st.i); } else h.f.speed = spdI(st.i);
  t.plotA($("#labCvA"), st, LAB.P, Dv); t.plotB($("#labCvB"), st, LAB.P, Dv);
  if (fast === true) return;
  $("#labReads").innerHTML = t.reads(st, LAB.P);
  $("#labNotes").innerHTML = t.notes(st, LAB.P);
  const rows = t.checks(st, LAB.P), bad = rows.filter(r => r.st === "bad").length;
  $("#labCons").innerHTML = rows.map(crow).join("");
  $("#labConsSum").innerHTML = bad ? `<span class="badge bad">${bad} limit${bad > 1 ? "s" : ""} exceeded</span>` : `<span class="badge ok">inside every limit</span>`;
  $("#labDev").innerHTML = `Built from the workbench's devices (${PRE[B.pre].name}${B.edited ? ", edited" : ""}): n-channel β = ${E3(Dv.n.beta, "A/V²")}, V<sub>T</sub> = ${fV(Dv.n.vt)}; p-channel β = ${E3(Dv.p.beta, "A/V²")}, |V<sub>T</sub>| = ${fV(Dv.p.vt)}. Change them up in the workbench.`;
  $("#labStatus").textContent = LAB.anim ? "animating" : "paused animation: drag the sliders";
}
let labFrame = 0;
function labTick(dt) {
  if (!LAB.h) return;
  const k = SIM.k, t = TPL[LAB.k];
  Schem.tick(LAB.s.flows, dt * k);
  if (!LAB.anim || k === 0) return;
  if (t.anim === "time") { LAB.t += dt * k; labRefresh(++labFrame % 8 !== 0); return; }
  const sl = LAB.sls.find(s => s.s.k === t.anim), s = sl.s;
  if (s.log) { const x = Math.log(LAB.P[t.anim] / s.min) / Math.log(s.max / s.min) + LAB.dir * dt * k / 8; LAB.P[t.anim] = s.min * Math.pow(s.max / s.min, clamp(x, 0, 1)); if (x >= 1 || x <= 0) LAB.dir *= -1; }
  else { const top = Math.min(s.max, LAB.P.VDD); let v = LAB.P[t.anim] + LAB.dir * top / 6 * dt * k; if (v >= top) { v = top; LAB.dir = -1; } if (v <= 0) { v = 0; LAB.dir = 1; } LAB.P[t.anim] = v; }
  sl.sync(); labRefresh(++labFrame % 5 !== 0);
}

/* ---------- start ---------- */
loadPreset("practice");
buildBench(); syncAll(); benchUpdate(); labBuild();
redraws.push(benchUpdate, () => labRefresh());
for (const id of ["#xsCv", "#famCv", "#trCv", "#mapCv", "#prCv"]) new ResizeObserver(() => benchUpdate()).observe($(id));
for (const id of ["#labCvA", "#labCvB"]) new ResizeObserver(() => labRefresh()).observe($(id));
whenVisible($("#xsCv"), benchTick);
whenVisible($("#lab"), labTick);
