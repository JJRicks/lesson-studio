/* BJT amplifiers 2: the live interactives. Formulas come from shared.js, a port of verify.py. Every demo uses example part values, never the homework's. */
let T = tokens(TOK);
themeListeners.push(() => { T = tokens(TOK); });
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;

/* a chart frame on a 2D canvas. o = { x:[a,b], y:[a,b], xt, yt, xl, yl, fx, fy, pad, Y } (Y: optional value transform, e.g. log10) */
function chart(c, W, H, o) {
  const p = Object.assign({ l: 50, r: 14, t: 14, b: 38 }, o.pad || {}), tf = o.Y || (v => v);
  const X = v => p.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * (W - p.l - p.r);
  const Y = v => H - p.b - (tf(v) - tf(o.y[0])) / (tf(o.y[1]) - tf(o.y[0])) * (H - p.t - p.b);
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
  c.font = `11px ${css("--f-mono")}`; c.lineWidth = 1;
  for (const v of o.xt) { const x = X(v); c.strokeStyle = rgbS(T.grid); c.beginPath(); c.moveTo(x, p.t); c.lineTo(x, H - p.b); c.stroke(); c.fillStyle = rgbS(T.muted); c.textAlign = "center"; c.fillText(o.fx ? o.fx(v) : String(v), x, H - p.b + 15); }
  for (const v of o.yt) { const y = Y(v); c.strokeStyle = rgbS(T.grid); c.beginPath(); c.moveTo(p.l, y); c.lineTo(W - p.r, y); c.stroke(); c.fillStyle = rgbS(T.muted); c.textAlign = "right"; c.fillText(o.fy ? o.fy(v) : String(v), p.l - 6, y + 4); }
  c.fillStyle = rgbS(T.muted); c.textAlign = "center";
  if (o.xl) c.fillText(o.xl, (p.l + W - p.r) / 2, H - 6);
  if (o.yl) { c.save(); c.translate(12, (p.t + H - p.b) / 2); c.rotate(-Math.PI / 2); c.fillText(o.yl, 0, 0); c.restore(); }
  c.textAlign = "left";
  return { X, Y, p };
}
function stroke(c, pts, col, w = 2, dash) { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.setLineDash([]); }
function blob(c, x, y, col, r = 5) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = rgbS(T.plot); c.lineWidth = 2; c.stroke(); }
function tag(c, x, y, s, col, align = "left") { c.font = `600 11px ${css("--f-mono")}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }

/* one scrolling trace in its own strip. f(u) returns the value at u in 0..1 (1 is now) as a fraction of the printed range */
function strip(c, x, y, w, h, o) {
  const mid = y + h / 2 + 5, amp = h / 2 - 24;
  c.fillStyle = rgbS(T.plot); c.fillRect(x, y, w, h);
  c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.beginPath();
  for (const k of [-1, 0, 1]) { c.moveTo(x, mid + k * amp); c.lineTo(x + w, mid + k * amp); }
  c.stroke();
  const n = Math.min(320, Math.ceil(w / 1.5)), pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x + u * w, mid - amp * clamp(o.f(u), -1.14, 1.14)]); }
  stroke(c, pts, o.col, 2.6);
  blob(c, pts[n][0] - 3, pts[n][1], o.col, 4);
  tag(c, x + 10, y + 15, o.name, rgbS(T.ink)); tag(c, x + w - 10, y + 15, o.range, rgbS(T.muted), "right");
}

/* an LTspice-style plot: two stacked panes over 0..tEnd ms with a cursor. panes: [{ name, col, f(tms), range }] */
function scopePanes(c, W, H, panes, tEnd, cur) {
  const L = 62, R = 14, top = 8, gap = 10, ph = (H - top - 26 - gap * (panes.length - 1)) / panes.length, X = tm => L + tm / tEnd * (W - L - R);
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
  c.font = `11px ${css("--f-mono")}`;
  const out = [];
  panes.forEach((p, k) => {
    const y0 = top + k * (ph + gap), y1 = y0 + ph, mid = (y0 + y1) / 2 + 6, amp = (ph - 26) / 2, Y = v => mid - v / p.range * amp;
    c.strokeStyle = rgbS(T.line); c.lineWidth = 1; c.strokeRect(L, y0, W - L - R, ph);
    c.setLineDash([3, 4]); c.strokeStyle = rgbS(T.grid);
    for (let i = 1; i < 10; i++) { const x = X(tEnd * i / 10); c.beginPath(); c.moveTo(x, y0 + 18); c.lineTo(x, y1); c.stroke(); }
    for (const f of [-1, -.5, 0, .5, 1]) { const y = Y(f * p.range); c.beginPath(); c.moveTo(L, y); c.lineTo(W - R, y); c.stroke(); c.fillStyle = rgbS(T.muted); c.textAlign = "right"; c.fillText(p.fy(f * p.range), L - 6, y + 4); }
    c.setLineDash([]);
    tag(c, (L + W - R) / 2, y0 + 13, p.name, p.col, "center");
    const pts = []; for (let i = 0; i <= 400; i++) { const tm = tEnd * i / 400; pts.push([X(tm), Y(p.f(tm))]); }
    stroke(c, pts, p.col, 2.4);
    out.push({ y: Y(p.f(cur)), y0, y1 });
  });
  c.fillStyle = rgbS(T.muted); c.textAlign = "center";
  for (let i = 0; i <= 10; i += 2) c.fillText((tEnd * i / 10).toFixed(1) + "ms", X(tEnd * i / 10), H - 8);
  const xc = X(cur);
  stroke(c, [[xc, top], [xc, H - 22]], rgbS(T.ink, .7), 1.2, [5, 4]);
  panes.forEach((p, k) => blob(c, xc, out[k].y, p.col, 5));
  return { X, L, R };
}
function dragTime(cv, tEnd, L, R, fn) {                       // pointer drags across a scopePanes canvas; fn(time in ms)
  const at = e => { const r = cv.getBoundingClientRect(); return clamp((e.clientX - r.left - L) / (r.width - L - R), 0, 1) * tEnd; };
  let on = false;
  cv.addEventListener("pointerdown", e => { on = true; cv.setPointerCapture(e.pointerId); fn(at(e)); });
  cv.addEventListener("pointermove", e => { if (on) fn(at(e)); });
  cv.addEventListener("pointerup", () => { on = false; });
  cv.style.cursor = "ew-resize"; cv.style.touchAction = "pan-y";
}
const mvFmt = v => { const a = Math.abs(v); return a >= .1 ? fx(v, a >= 1 ? 1 : 2) + "V" : fx(v * 1e3, a >= .01 ? 0 : 1) + "mV"; };

const A0 = { Vcc: 12, R1: 8200, R2: 1500, RC: 2200, RL: 47000, beta: 200 }, RTOT = 570;
const LBL = { Vcc: "12 V", R1: "8.2 kΩ", R2: "1.5 kΩ", R3: "2.2 kΩ", RL: "47 kΩ", part: false };
const WAVE = Math.PI;                                         // on-screen wave, rad/s: one cycle every 2 s, whatever the real frequency
const logv = (el, a, b) => a * Math.pow(b / a, +el.value / 1000);
const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 2, 5, 10]) if (m * p >= v * (1 - 1e-9)) return m * p; return 10 * p; };
const sig = v => +(+v).toPrecision(3);
const ease01 = u => u * u * (3 - 2 * u);
const gainTxt = A => fx(A, Math.abs(A) < 10 ? 2 : 1);

/* ---------- hero: a live swamped amplifier ---------- */
(function hero() {
  const box = $("#heroSch"), cv = $("#heroCv"), sA = $("#heroA"), sR = $("#heroRe"), reads = $("#heroReads"), status = $("#heroStatus");
  const s = Schem.svg(box, [24, 0, 456, 360], "A common-emitter amplifier whose emitter has two resistors: re on top with no capacitor across it, and R4 below with C3 across it. A small input wave reaches the base through C1, and the amplified, inverted wave leaves through C2 to the load Rl.");
  const h = drawSwamp(s, LBL);
  const F = { c: s.flow(h.f.c, { c: "t3" }), div: s.flow(h.f.div, { c: "t1" }), sig: s.flow(h.f.sig, { c: "cursor", gap: 18 }), by: s.flow(h.f.by, { c: "cursor", gap: 18 }), out: s.flow(h.f.out, { c: "cursor", gap: 18 }) };
  let t = 0;
  const st = () => { const re = +sR.value, q = solveSwamp({ ...A0, re, R4: RTOT - re }); return { re, q }; };
  const iOf = (v, IQ, re) => {                                // VT ln(i/IQ) + (i - IQ) re = v, solved in log space
    let lo = Math.log(IQ) - 30, hi = Math.log(IQ) + 30;
    for (let k = 0; k < 64; k++) { const m = (lo + hi) / 2, i = Math.exp(m); (VT25 * (m - Math.log(IQ)) + (i - IQ) * re < v) ? lo = m : hi = m; }
    return Math.exp((lo + hi) / 2);
  };
  const outOf = (v, S) => { const { q, re } = S, i = iOf(v, q.IE, re); return Math.max(q.VE + (i - q.IE) * re + 0.2 - q.VC, -(i - q.IE) * q.rc); };
  const Tw = 5;
  function paint() {
    const S = st(), A = logv(sA, .5e-3, .3), { c, W, H } = canvas2d(cv), rIn = niceUp(A), rOut = niceUp(Math.max(Math.abs(outOf(A, S)), Math.abs(outOf(-A, S))));
    const vAt = u => A * Math.sin(WAVE * (t - (1 - u) * Tw));
    const gap = 8, sh = (H - gap) / 2;
    strip(c, 0, 0, W, sh, { name: "input · vin", range: "±" + eng(rIn, "V", 2), col: rgbS(T.cursor), f: u => vAt(u) / rIn });
    c.fillStyle = rgbS(T.line); c.fillRect(0, sh, W, gap);
    strip(c, 0, sh + gap, W, sh, { name: "output · vout", range: "±" + eng(rOut, "V", 2), col: rgbS(T.accent), f: u => outOf(vAt(u), S) / rOut });
    const now = A * Math.sin(WAVE * t), I = iOf(now, S.q.IE, S.re), sw = 62 * Math.cos(WAVE * t) * (.35 + .65 * Math.min(1, A / 5e-3));
    F.c.speed = clamp(58 * I / S.q.IE, 8, 170); F.div.speed = 24; F.sig.speed = sw; F.by.speed = sw; F.out.speed = -sw * 1.2;
  }
  function text() {
    const S = st(), A = logv(sA, .5e-3, .3), dn = outOf(A, S), up = outOf(-A, S), mis = Math.abs(Math.abs(dn) - Math.abs(up)) / ((Math.abs(dn) + Math.abs(up)) / 2);
    const clip = dn <= S.q.VE + (iOf(A, S.q.IE, S.re) - S.q.IE) * S.re + 0.2 - S.q.VC + 1e-6 || up > .97 * S.q.IE * S.q.rc;
    $("#heroAOut").textContent = eng(A, "V", 2); $("#heroReOut").textContent = S.re + " Ω";
    h.t.re.textContent = S.re + " Ω"; h.t.R4.textContent = (RTOT - S.re) + " Ω";
    h.op("sw", S.re ? 1 : .3);
    reads.innerHTML = cell("input peak", eng(A, "V", 2)) + cell("output, up swing", eng(up, "V")) + cell("output, down swing", eng(dn, "V")) +
      cell("gain −r<sub>c</sub>/(r<sub>e</sub>′ + r<sub>e</sub>)", gainTxt(S.q.AV), true) + cell("Z<sub>in</sub> (β = 200)", fmtOhm(S.q.Zin)) + cell("DC emitter current", eng(S.q.IE, "A"));
    status.textContent = clip ? "clipping" : mis > .12 ? "lopsided: distorting" : "clean";
    paint();
  }
  [sA, sR].forEach(e => e.addEventListener("input", text)); themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { t += dt; Schem.tick(s.flows, dt); paint(); });
  text();
})();

/* ---------- tour: click a part ---------- */
(function tour() {
  const box = $("#tourSch"), txt = $("#tourTxt"), segB = $("#tourSeg");
  const s = Schem.svg(box, [24, 0, 456, 360], "The amplifier's parts. Choose a part with the buttons or by clicking it.");
  const h = drawSwamp(s, { part: false });
  const INFO = {
    c1: { p: h.at.C1, r: [34, 44], t: "C1 · the input coupling capacitor", b: "Lets the AC signal reach the base and blocks DC, so the signal source can't disturb the base's steady voltage.", w: "same job as last week" },
    div: { p: [178, 176], r: [34, 160], t: "R1 and R2 · the voltage divider", b: "Split the supply to hold the base at a steady DC voltage. For AC, both become paths from the base to ground, so they show up in the input impedance.", w: "Problems 1a and 1d" },
    q: { p: [276, 172], r: [44, 46], t: "Q1 · the transistor", b: "A small wiggle between base and emitter makes a large wiggle in collector current. Problem 2 replaces it with a two-part model.", w: "Problem 2" },
    r3: { p: h.at.R3, r: [30, 46], t: "R3 · the collector resistor", b: "Turns the changing collector current into the output voltage. For AC it sits in parallel with the load.", w: "Problem 1b" },
    re: { p: h.at.re, r: [30, 30], t: "re · the swamping resistor", b: "New this week. No capacitor sits across it, so the AC signal has to go through it. It lowers the gain, steadies it, and raises the input impedance.", w: "Problems 1c and 1d" },
    r4: { p: h.at.R4, r: [30, 30], t: "R4 · the rest of the emitter resistance", b: "Carries the DC current along with re, so together they set the bias. C3 hides it from AC.", w: "Problem 1a" },
    c3: { p: h.at.C3, r: [34, 34], t: "C3 · the bypass capacitor, across R4 only", b: "Look where its top connects: below re. It shorts R4 for AC and leaves re in the signal's path.", w: "Problems 1c and 1d" },
    c2: { p: [362, 170], r: [66, 92], t: "C2 and Rl · the output", b: "C2 passes the amplified wave to the load Rl and blocks the collector's DC. Rl is whatever receives the output.", w: "Problem 1b" }
  };
  const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)");
  const ring = svgEl("ellipse", { class: "w tint" }, g.g);
  let cur = [...INFO.c1.p, ...INFO.c1.r], goal = cur.slice();
  const apply = () => { ring.setAttribute("cx", cur[0].toFixed(1)); ring.setAttribute("cy", cur[1].toFixed(1)); ring.setAttribute("rx", cur[2].toFixed(1)); ring.setAttribute("ry", cur[3].toFixed(1)); };
  function pick(k) {
    const o = INFO[k]; goal = [...o.p, ...o.r]; if (reduce) { cur = goal.slice(); apply(); }
    txt.innerHTML = `<div class="where">${o.w}</div><h4>${o.t}</h4><p>${o.b}</p>`;
    $$("button", segB).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === k)));
  }
  for (const k of ["div", "c2", "q", "c1", "r3", "re", "r4", "c3"]) { const o = INFO[k], e = svgEl("ellipse", { cx: o.p[0], cy: o.p[1], rx: o.r[0], ry: o.r[1], class: "tourhit" }, s.g); e.addEventListener("click", () => pick(k)); }
  seg("#tourSeg", pick); apply(); pick("c1");
  whenVisible(box, dt => { const a = 1 - Math.exp(-dt / .07); cur = cur.map((v, i) => v + (goal[i] - v) * a); apply(); });
})();

/* ---------- which resistors carry which current ---------- */
(function legLab() {
  const box = $("#legSch"), sRe = $("#legRe"), sR4 = $("#legR4"), reads = $("#legReads"), status = $("#legStatus");
  const REV = [0, 22, 47, 68, 82, 100, 120, 150, 180, 220, 270, 330, 390], R4V = [100, 150, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 1200, 1500];
  const s = Schem.svg(box, [24, 0, 456, 360], "The amplifier with its two emitter resistors. In the DC view, current flows down through both re and R4. In the AC view the capacitors become wires and the signal goes through re, then around R4 through C3.");
  const h = drawSwamp(s, LBL);
  const fC = s.flow(h.f.c, { c: "t3" }), fD = s.flow(h.f.div, { c: "t1" }), fS = s.flow(h.f.sig, { c: "cursor", gap: 18 }), fE = s.flow(h.f.eAC, { c: "cursor", gap: 18 }), fO = s.flow(h.f.out, { c: "cursor", gap: 18 });
  let want = 0, p = 0, t = 0;
  function apply() {
    const m = ease01(p);
    h.short(m); h.op("src", 1 - m); h.op("acg", m); h.op("r4", 1 - .7 * m); h.op("by", .35 + .65 * m); h.op("div", 1 - .6 * m);
    const dc = p < .02, ac = p > .98;
    for (const f of [fC, fD]) f.el.style.display = dc ? "" : "none";
    for (const f of [fS, fE, fO]) f.el.style.display = ac ? "" : "none";
    fC.speed = 50; fD.speed = 24; const w = 52 * Math.cos(WAVE * t); fS.speed = w; fE.speed = w; fO.speed = -w;
  }
  function text() {
    const re = REV[+sRe.value], R4 = R4V[+sR4.value], q = solveSwamp({ ...A0, re, R4 });
    $("#legReOut").textContent = re + " Ω"; $("#legR4Out").textContent = fmtOhm(R4); h.t.re.textContent = re + " Ω"; h.t.R4.textContent = fmtOhm(R4);
    reads.innerHTML = cell("DC sees r<sub>e</sub> + R4", fmtOhm(re + R4), !want) + cell("I<sub>E</sub> = V<sub>E</sub>/(r<sub>e</sub> + R4)", eng(q.IE, "A")) + cell("r<sub>e</sub>′ = 25 mV/I<sub>E</sub>", fmtOhm(q.rp)) + cell("AC sees r<sub>e</sub>′ + r<sub>e</sub>", fmtOhm(q.rp + re), !!want);
    status.textContent = want ? "C3 shorts R4; re stays" : "both resistors carry DC";
  }
  seg("#legSeg", k => { want = k === "ac" ? 1 : 0; if (reduce) p = want; text(); apply(); });
  [sRe, sR4].forEach(e => e.addEventListener("input", text));
  whenVisible(box, dt => { t += dt; p = p < want ? Math.min(want, p + dt / 1.2) : Math.max(want, p - dt / .9); apply(); Schem.tick(s.flows, dt); });
  text(); apply();
})();

/* ---------- the diode curve up close ---------- */
(function reLab() {
  const cv = $("#reCv"), sl = $("#reI"), reads = $("#reReads"), status = $("#reStatus"), V1 = .65, a = .005;
  const iOf = v => 1e-3 * Math.exp((v - V1) / VT25), vOf = i => V1 + VT25 * Math.log(i / 1e-3);
  let t = 0;
  function paint() {
    const I = +sl.value * 1e-3, vq = vOf(I), re = VT25 / I, { c, W, H } = canvas2d(cv);
    const g = chart(c, W, H, { x: [.58, .74], y: [0, 10], xt: [.58, .62, .66, .70, .74], yt: [0, 2, 4, 6, 8, 10], fx: v => v.toFixed(2), fy: v => v + " mA", xl: "base-emitter voltage (V)", pad: { l: 58 } });
    const pts = []; for (let v = .58; v <= .741; v += .001) { const i = iOf(v) * 1e3; if (i > 10.2) break; pts.push([g.X(v), g.Y(i)]); }
    stroke(c, pts, rgbS(T.accent), 3);
    const sl_ = (I * 1e3) / VT25, tan = v => I * 1e3 + (v - vq) * sl_, x1 = Math.max(vq - .03, vq - (I * 1e3) / sl_), x2 = Math.min(vq + .03, vq + (10 - I * 1e3) / sl_);
    stroke(c, [[g.X(x1), g.Y(tan(x1))], [g.X(x2), g.Y(tan(x2))]], rgbS(T.cursor), 1.8, [6, 4]);
    const v = vq + a * Math.sin(WAVE * t), i = I * 1e3 + (v - vq) * (I * 1e3) / VT25;
    stroke(c, [[g.X(v), g.Y(i)], [g.X(v), g.Y(0)]], rgbS(T.muted), 1, [3, 3]); stroke(c, [[g.X(v), g.Y(i)], [g.X(.58), g.Y(i)]], rgbS(T.muted), 1, [3, 3]);
    blob(c, g.X(vq), g.Y(I * 1e3), rgbS(T.ink), 4); blob(c, g.X(v), g.Y(i), rgbS(T.cursor), 6);
    reads.innerHTML = cell("I<sub>E</sub>", eng(I, "A")) + cell("r<sub>e</sub>′ = 25 mV / I<sub>E</sub>", fmtOhm(re), true) + cell("current wiggle for ±5 mV", "±" + eng(a / re, "A"));
    status.textContent = "slope = 1 / r′e";
  }
  sl.addEventListener("input", () => { $("#reIOut").textContent = fx(+sl.value, 2) + " mA"; paint(); });
  themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { t += dt; paint(); });
  sl.dispatchEvent(new Event("input"));
})();

/* ---------- the load joins in for AC ---------- */
(function rcLab() {
  const box = $("#rcSch"), sl = $("#rcL"), reads = $("#rcReads"), status = $("#rcStatus"), RC = A0.RC;
  const RLV = [470, 1000, 1500, 2200, 3300, 4700, 6800, 10000, 15000, 22000, 33000, 47000, 68000, 100000, 220000];
  const s = Schem.svg(box, [24, 0, 456, 360], "The amplifier with its collector resistor and load. In the AC view the capacitors become wires, the supply becomes ground, and the collector resistor swings down beside the load.");
  const h = drawSwamp(s, { ...LBL, re: "100 Ω", R4: "470 Ω" });
  const fO = s.flow(h.f.out, { c: "cursor", gap: 18 }), fR = s.flow([[282, 112], [282, 24]], { c: "cursor", gap: 18 }), fF = s.flow([[388, 112], [444, 112], [444, 200]], { c: "cursor", gap: 18 }), fC = s.flow(h.f.c, { c: "t3" });
  let want = 0, p = 0, t = 0;
  function apply() {
    const m = ease01(clamp(p * 2, 0, 1)), f = ease01(clamp(p * 2 - 1, 0, 1));
    h.short(m); h.op("src", 1 - m); h.op("acg", m); h.fold(f); for (const n of ["sw", "r4", "by", "div", "in"]) h.op(n, 1 - .75 * m);
    fC.el.style.display = p < .02 ? "" : "none"; fO.el.style.display = p > .02 ? "" : "none"; fR.el.style.display = p > .02 && p < .5 ? "" : "none"; fF.el.style.display = p > .985 ? "" : "none";
    fC.speed = 50; fO.speed = fR.speed = fF.speed = 50 * Math.cos(WAVE * t);
  }
  function text() {
    const RL = RLV[+sl.value], rc = par(RC, RL); $("#rcLOut").textContent = fmtOhm(RL); h.t.RL.textContent = fmtOhm(RL);
    reads.innerHTML = cell("R3", fmtOhm(RC)) + cell("R<sub>l</sub>", fmtOhm(RL)) + cell("r<sub>c</sub> = R3 || R<sub>l</sub>", fmtOhm(rc), true) + cell("r<sub>c</sub> compared with R3", fx(rc / RC * 100, 0) + " %");
    status.textContent = want ? "R3 and Rl in parallel" : "as drawn: DC view";
  }
  seg("#rcSeg", k => { want = k === "ac" ? 1 : 0; if (reduce) p = want; text(); apply(); });
  sl.addEventListener("input", text);
  whenVisible(box, dt => { t += dt; p = p < want ? Math.min(want, p + dt / 1.5) : Math.max(want, p - dt / .9); apply(); Schem.tick(s.flows, dt); });
  text(); apply();
})();

/* ---------- swamping: how much the gain drifts ---------- */
(function swampLab() {
  const cv = $("#swCv"), sRe = $("#swRe"), sRp = $("#swRp"), reads = $("#swReads"), status = $("#swStatus"), rc = 2200, lo = 8, hi = 20;
  function draw() {
    const re = +sRe.value, rp = +sRp.value, { c, W, H } = canvas2d(cv);
    $("#swReOut").textContent = re + " Ω"; $("#swRpOut").textContent = fx(rp, 1) + " Ω";
    const g = chart(c, W, H, { x: [4, 42], y: [5, 600], Y: Math.log10, xt: [5, 10, 15, 20, 25, 30, 35, 40], yt: [5, 10, 20, 50, 100, 200, 500], fx: v => v + " Ω", xl: "r′e inside the transistor", yl: "gain size |Av| (log scale)", pad: { l: 58 } });
    c.fillStyle = rgbS(T.cursor, .12); c.fillRect(g.X(lo), g.p.t, g.X(hi) - g.X(lo), H - g.p.t - g.p.b);
    tag(c, (g.X(lo) + g.X(hi)) / 2, g.p.t + 14, "realistic spread", rgbS(T.cursor), "center");
    const line = f => { const p = []; for (let x = 4; x <= 42; x += .25) p.push([g.X(x), g.Y(clamp(f(x), 5, 600))]); return p; };
    stroke(c, line(x => rc / x), rgbS(T.muted), 2, [6, 5]); stroke(c, line(x => rc / (x + re)), rgbS(T.accent), 3.2);
    tag(c, g.X(41), g.Y(rc / 41) - 8, "no re", rgbS(T.muted), "right");
    tag(c, g.X(41), g.Y(rc / (41 + re)) + (re < 15 ? 18 : -8), "with re = " + re + " Ω", rgbS(T.accent), "right");
    stroke(c, [[g.X(rp), g.p.t], [g.X(rp), H - g.p.b]], rgbS(T.ink, .5), 1.2, [3, 4]);
    blob(c, g.X(rp), g.Y(rc / rp), rgbS(T.muted), 5); blob(c, g.X(rp), g.Y(rc / (rp + re)), rgbS(T.accent), 6);
    const spread = (a, b) => (a - b) / ((a + b) / 2) * 50, s0 = spread(rc / lo, rc / hi), s1 = spread(rc / (lo + re), rc / (hi + re));
    reads.innerHTML = cell("gain now, with r<sub>e</sub>", gainTxt(-rc / (rp + re)), true) + cell("gain now, no r<sub>e</sub>", gainTxt(-rc / rp)) +
      cell("drift across the band, with r<sub>e</sub>", "±" + fx(s1, 0) + " %") + cell("drift across the band, no r<sub>e</sub>", "±" + fx(s0, 0) + " %");
    status.textContent = re ? "drift cut from ±" + fx(s0, 0) + " % to ±" + fx(s1, 0) + " %" : "no swamping";
  }
  [sRe, sRp].forEach(e => e.addEventListener("input", draw)); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- input impedance: three paths ---------- */
(function zinLab() {
  const box = $("#zinSch"), sRe = $("#zinRe"), sB = $("#zinB"), reads = $("#zinReads"), status = $("#zinStatus"), R1 = 8200, R2 = 1500, rp = 12;
  const s = Schem.svg(box, [0, 10, 480, 300], "The input source feeding a node with three paths to ground: R1, R2, and the transistor's base. Dots on each path move at a speed that shows its share of the input current.");
  const top = 70, bot = 250, xs = [190, 290, 400];
  const v = s.vac([60, 160]); s.wire([v.top, [60, top], [xs[2], top]]); s.wire([v.bot, [60, bot], [xs[2], bot]]); s.gnd([60, bot]);
  s.text([84, 152], "vin"); s.text([124, top - 16], "Zin →", { anchor: "middle", cls: "sm" });
  s.node([xs[0], top]); s.node([xs[1], top]); s.node([xs[0], bot]); s.node([xs[1], bot]);
  xs.forEach(x => s.res([x, top], [x, bot]));
  s.text([xs[0] + 16, 150], "R1"); s.text([xs[0] + 16, 168], "8.2 kΩ", { cls: "sm" }); s.text([xs[0] + 16, 186], "to Vcc", { cls: "sm" });
  s.text([xs[1] + 16, 150], "R2"); s.text([xs[1] + 16, 168], "1.5 kΩ", { cls: "sm" });
  s.text([xs[2] + 16, 132], "base"); s.text([xs[2] + 16, 150], "β(r′e+re)", { cls: "sm" }); const tB = s.text([xs[2] + 16, 168], "", { cls: "sm", c: "ink" });
  const F = xs.map((x, i) => s.flow([[x, top], [x, bot]], { c: ["t1", "t1", "t3"][i], gap: 16 }));
  const fIn = s.flow([v.top, [60, top], [xs[0], top]], { c: "cursor", gap: 18 });
  let t = 0, sh = [0, 0, 0];
  function text() {
    const re = +sRe.value, b = +sB.value, Zb = b * (rp + re), G = [1 / R1, 1 / R2, 1 / Zb], Gt = G[0] + G[1] + G[2], Zin = 1 / Gt;
    sh = G.map(g => g / Gt);
    $("#zinReOut").textContent = re + " Ω"; $("#zinBOut").textContent = b; tB.textContent = fmtOhm(Zb);
    reads.innerHTML = cell("R1 || R2", fmtOhm(par(R1, R2))) + cell("Z<sub>in(base)</sub> = β(r<sub>e</sub>′ + r<sub>e</sub>)", fmtOhm(Zb)) + cell("Z<sub>in</sub>, all three", fmtOhm(Zin), true) + cell("share of input current into the base", fx(sh[2] * 100, 1) + " %");
    status.textContent = sh[2] > .3 ? "the base loads the input" : sh[2] > .08 ? "the base takes a little" : "the divider sets Zin";
    move();
  }
  function move() { const w = Math.cos(WAVE * t); F.forEach((f, i) => { f.speed = 150 * sh[i] * w; }); fIn.speed = 70 * w; }
  [sRe, sB].forEach(e => e.addEventListener("input", text));
  whenVisible(box, dt => { t += dt; move(); Schem.tick(s.flows, dt); });
  text();
})();

/* ---------- from transistor to model ---------- */
(function modelLab() {
  const box = $("#modelSch"), sB = $("#modelB"), sI = $("#modelI"), reads = $("#modelReads"), status = $("#modelStatus");
  const s = Schem.svg(box, [20, 20, 440, 304], "A transistor with terminals b, c and e. It can be swapped for the small-signal model: a resistor beta times re-prime from b to e, and a diamond-shaped dependent current source from c to e.");
  const b = [60, 150], c = [420, 60], e = [235, 300], N = [235, 260];
  const tr = s.group(), md = s.group();
  const q = tr.bjt([215, 150]); tr.wire([b, q.B]); tr.wire([q.C, [235, 60], c]); tr.wire([q.E, e]);
  md.wire([b, [150, 150]]); md.res([150, 150], [150, N[1]]); md.wire([[150, N[1]], [320, N[1]]]); md.wire([N, e]); md.node(N);
  const src = md.isrc([320, 165], { dep: true }); md.wire([c, [320, 60], src.top]); md.wire([src.bot, [320, N[1]]]);
  md.text([134, 205], "βr′e", { anchor: "end" }); const tR = md.text([134, 223], "", { anchor: "end", cls: "sm" });
  md.text([352, 160], "βib"); md.text([352, 178], "ic = β·ib", { cls: "sm" });
  for (const [p, n, dx, dy] of [[b, "b", -16, 0], [c, "c", 16, 0], [e, "e", 16, 4]]) { svgEl("circle", { cx: p[0], cy: p[1], r: 5, class: "w body" }, s.g); s.text([p[0] + dx, p[1] + dy], n, { anchor: dx < 0 ? "end" : "start", cls: "lg" }); }
  const fb = [tr.flow([b, q.B, [215, 157], [235, 171], e], { c: "t1", gap: 16 }), md.flow([b, [150, 150], [150, N[1]], N, e], { c: "t1", gap: 16 })];
  const fc = [tr.flow([c, [235, 60], q.C, [235, 129], [215, 143], [215, 157], [235, 171], e], { c: "t3", gap: 16 }), md.flow([c, [320, 60], [320, N[1]], N, e], { c: "t3", gap: 16 })];
  let want = 0, p = 0, t = 0, sp = { b: 0, c: 0 };
  const spd = I => Math.max(4, 14 * Math.log2(I / 2e-7));
  function apply() {
    const m = ease01(p); tr.g.style.opacity = (1 - m).toFixed(3); md.g.style.opacity = m.toFixed(3);
    const k = p > .5 ? 1 : 0; fb.forEach((f, i) => f.el.style.display = i === k ? "" : "none"); fc.forEach((f, i) => f.el.style.display = i === k ? "" : "none");
    const w = Math.cos(WAVE * t); fb[k].speed = sp.b * w; fc[k].speed = sp.c * w;
  }
  function text() {
    const B = +sB.value, IE = +sI.value * 1e-3, rp = VT25 / IE, ic = 5e-3 / rp, ib = ic / B;
    sp = { b: spd(ib), c: spd(ic) };
    $("#modelBOut").textContent = B; $("#modelIOut").textContent = fx(+sI.value, 1) + " mA"; tR.textContent = fmtOhm(B * rp);
    reads.innerHTML = cell("r<sub>e</sub>′ = 25 mV/I<sub>E</sub>", fmtOhm(rp)) + cell("βr<sub>e</sub>′, base to emitter", fmtOhm(B * rp)) + cell("i<sub>b</sub> peak", eng(ib, "A")) + cell("i<sub>c</sub> = βi<sub>b</sub> peak", eng(ic, "A"), true);
    status.textContent = want ? "π model" : "transistor";
  }
  seg("#modelSeg", k => { want = k === "m" ? 1 : 0; if (reduce) p = want; text(); apply(); });
  [sB, sI].forEach(el => el.addEventListener("input", text));
  whenVisible(box, dt => { t += dt; p = p < want ? Math.min(want, p + dt / 1.1) : Math.max(want, p - dt / 1.1); apply(); Schem.tick(s.flows, dt); });
  text(); apply();
})();

/* ---------- the model in a simulator ---------- */
(function ltLab() {
  const box = $("#ltSch"), cv = $("#ltCv"), sB = $("#ltB"), sRi = $("#ltRin"), sRc = $("#ltRc"), reads = $("#ltReads"), status = $("#ltStatus");
  const RIV = [220, 330, 470, 680, 820, 1000, 1500, 2200, 3300, 4700], RCV = [330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000];
  const s = Schem.svg(box, [10, 50, 470, 300], "An LTspice schematic: a sine source Vin across Rin, and a behavioral current source B1 in parallel with rc at the output node Vout. An arrow beside Rin shows the direction LTspice counts as positive current.");
  const h = drawPi(s, { name: "J. Student" });
  const fIn = s.flow(h.f.in, { c: "t1", gap: 18 }), fOut = s.flow(h.f.out, { c: "t3", gap: 18 });
  let fR = 1, fB = 1, cur = .25, auto = true, L = 62, R = 14;
  const vals = () => ({ b: +sB.value, Rin: RIV[+sRi.value], rc: RCV[+sRc.value] });
  const vin = tm => 1e-3 * Math.sin(TWO_PI * tm);             // tm in ms, 1 kHz
  function paint() {
    const v = vals(), A = -v.b * v.rc / v.Rin * fR * fB, { c, W, H } = canvas2d(cv), rO = niceUp(Math.abs(A) * 1e-3);
    const o = scopePanes(c, W, H, [{ name: "V(vin)", col: rgbS(T.cursor), f: vin, range: 1e-3, fy: mvFmt }, { name: "V(vout)", col: rgbS(T.accent), f: tm => A * vin(tm), range: rO, fy: mvFmt }], 2, cur);
    L = o.L; R = o.R;
    tag(c, W - R - 8, H - 34, "J. Student", rgbS(T.cursor), "right");
    const x = vin(cur) / 1e-3; fIn.speed = 55 * x; fOut.speed = 55 * x * fR * fB * (1 + Math.log10(v.b) * .6);
  }
  function text() {
    const v = vals(), A = -v.b * v.rc / v.Rin * fR * fB, vi = vin(cur);
    $("#ltBOut").textContent = v.b; $("#ltRinOut").textContent = fmtOhm(v.Rin); $("#ltRcOut").textContent = fmtOhm(v.rc);
    h.t.Rin.textContent = fmtOhm(v.Rin).replace(" ", ""); h.t.rc.textContent = fmtOhm(v.rc).replace(" ", ""); h.t.expr.textContent = `I={${v.b}*I(Rin)}`;
    h.flipR(fR < 0); h.flipB(fB < 0);
    reads.innerHTML = cell("cursor time", fx(cur, 3) + " ms") + cell("V(vin)", mvFmt(vi)) + cell("I(Rin), as LTspice counts it", eng(fR * vi / v.Rin, "A")) + cell("V(vout)", mvFmt(A * vi)) + cell("gain V(vout) ÷ V(vin)", gainTxt(A), true);
    status.textContent = A < 0 ? "inverting, as a real amplifier does" : "not inverting: check the orientation";
    paint();
  }
  seg("#ltSegR", k => { fR = k === "flip" ? -1 : 1; text(); });
  seg("#ltSegB", k => { fB = k === "flip" ? -1 : 1; text(); });
  [sB, sRi, sRc].forEach(e => e.addEventListener("input", text));
  dragTime(cv, 2, 62, 14, tm => { auto = false; cur = tm; text(); });
  themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { if (auto) { cur = (cur + dt * .22) % 2; text(); } Schem.tick(s.flows, dt); });
  text();
})();

/* ---------- read the gain off a plot: practice ---------- */
(function scopeLab() {
  const cv = $("#scopeCv"), reads = $("#scopeReads"), status = $("#scopeStatus");
  const GAINS = [-4, -7.5, -12, -25, -40, -64, -150, -250, 3, 8, 15, 50], AMPS = [2e-3, 5e-3, 10e-3, 20e-3], FREQ = [.5, 1, 2];
  let A = -12, amp = 5e-3, f = 1, cur = .9, shown = false, n = 0;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const vin = tm => amp * Math.sin(TWO_PI * f * tm);
  function draw() {
    const { c, W, H } = canvas2d(cv);
    scopePanes(c, W, H, [{ name: "V(vin)", col: rgbS(T.cursor), f: vin, range: niceUp(amp), fy: mvFmt }, { name: "V(vout)", col: rgbS(T.accent), f: tm => A * vin(tm), range: niceUp(Math.abs(A) * amp), fy: mvFmt }], 2, cur);
    reads.innerHTML = cell("cursor time", fx(cur, 3) + " ms") + cell("V(vin)", mvFmt(vin(cur))) + cell("V(vout)", mvFmt(A * vin(cur))) + cell("gain", shown ? gainTxt(A) : "?", true);
    status.textContent = shown ? (A < 0 ? "inverting, × " : "not inverting, × ") + fx(Math.abs(A), Math.abs(A) < 10 ? 1 : 0) : "amplifier " + (n + 1);
  }
  $("#scopeNew").addEventListener("click", () => { let g; do g = pick(GAINS); while (g === A); A = g; amp = pick(AMPS); f = pick(FREQ); shown = false; n++; draw(); });
  $("#scopeShow").addEventListener("click", () => { shown = true; draw(); });
  dragTime(cv, 2, 62, 14, tm => { cur = tm; draw(); });
  themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();
