/* BJT common-emitter amplifier: the live interactives. Formulas come from shared.js, a port of verify.py. Every demo uses example part values, never the homework's. */
let T = tokens(TOK);
themeListeners.push(() => { T = tokens(TOK); });
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;

/* a chart frame on a 2D canvas. o = { x:[a,b], y:[a,b], xt, yt, xl, yl, fx, fy, pad } */
function chart(c, W, H, o) {
  const p = Object.assign({ l: 50, r: 14, t: 14, b: 38 }, o.pad || {});
  const X = v => p.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * (W - p.l - p.r);
  const Y = v => H - p.b - (v - o.y[0]) / (o.y[1] - o.y[0]) * (H - p.t - p.b);
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

const A0 = { Vcc: 12, R1: 8200, R2: 1500, RC: 2200, RE: 560, RL: 47000 };
const LBL = { Vcc: "12 V", R1: "8.2 kΩ", R2: "1.5 kΩ", R3: "2.2 kΩ", R4: "560 Ω", RL: "47 kΩ", part: false };
const WAVE = Math.PI;                                         // on-screen wave, rad/s: one cycle every 2 s, whatever the real frequency
const logv = (el, a, b) => a * Math.pow(b / a, +el.value / 1000);
const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 2, 5, 10]) if (m * p >= v * (1 - 1e-9)) return m * p; return 10 * p; };
const sig = v => +(+v).toPrecision(3);
const ease01 = u => u * u * (3 - 2 * u);

/* ---------- hero: a live amplifier ---------- */
(function hero() {
  const box = $("#heroSch"), cv = $("#heroCv"), sl = $("#heroA"), reads = $("#heroReads"), status = $("#heroStatus"), q = solveAmp(A0), IQ = q.IE;
  const s = Schem.svg(box, [24, 4, 456, 360], "A common-emitter amplifier. A small input wave reaches the base through C1. The collector carries a large current through R3, and the amplified, inverted wave leaves through C2 to the load Rl.");
  const h = drawAmp(s, LBL);
  const F = { c: s.flow(h.f.c, { c: "t3" }), div: s.flow(h.f.div, { c: "t1" }), sig: s.flow(h.f.sig, { c: "cursor", gap: 18 }), by: s.flow(h.f.by, { c: "cursor", gap: 18 }), out: s.flow(h.f.out, { c: "cursor", gap: 18 }) };
  let t = 0, by = true;
  const floorV = q.VE + 0.2 - q.VC;
  const iBy = v => IQ * Math.exp(v / VT25);
  const iNo = v => { let lo = IQ * .4, hi = IQ * 1.6; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; (VT25 * Math.log(m / IQ) + (m - IQ) * A0.RE < v) ? lo = m : hi = m; } return (lo + hi) / 2; };
  const out = (v, b) => Math.max(floorV, -((b ? iBy(v) : iNo(v)) - IQ) * q.rc);
  const Tw = 5;
  function paint() {
    const A = +sl.value * 1e-3, { c, W, H } = canvas2d(cv), rIn = niceUp(A), rOut = niceUp(Math.max(Math.abs(out(A, true)), Math.abs(out(-A, true))));
    const vAt = u => A * Math.sin(WAVE * (t - (1 - u) * Tw));
    const gap = 8, sh = (H - gap) / 2;
    strip(c, 0, 0, W, sh, { name: "input · vin", range: "±" + eng(rIn, "V", 2), col: rgbS(T.cursor), f: u => vAt(u) / rIn });
    c.fillStyle = rgbS(T.line); c.fillRect(0, sh, W, gap);
    strip(c, 0, sh + gap, W, sh, { name: "output · vout", range: "±" + eng(rOut, "V", 2), col: rgbS(T.accent), f: u => out(vAt(u), by) / rOut });
    const now = A * Math.sin(WAVE * t), I = by ? iBy(now) : iNo(now), sw = 62 * Math.cos(WAVE * t) * (.35 + .65 * Math.min(1, +sl.value / 12));
    F.c.speed = clamp(58 * I / IQ, 8, 170); F.div.speed = 24; F.sig.speed = sw; F.by.speed = by ? sw : 0; F.out.speed = -sw * (by ? 1.2 : .25);
  }
  function text() {
    const A = +sl.value * 1e-3, dn = out(A, by), up = out(-A, by), clip = by && dn <= floorV + 1e-6, mis = Math.abs(Math.abs(dn) - Math.abs(up)) / ((Math.abs(dn) + Math.abs(up)) / 2);
    $("#heroAOut").textContent = eng(A, "V", 2);
    reads.innerHTML = cell("input peak", eng(A, "V", 2)) + cell("output, up swing", eng(up, "V")) + cell("output, down swing", eng(dn, "V")) + cell("small-signal gain", fx(by ? q.AV : -q.rc / (q.re + A0.RE), by ? 0 : 2), true) + cell("DC emitter current", eng(IQ, "A"));
    status.textContent = clip ? "clipping" : mis > .12 ? "lopsided: distorting" : "clean";
    h.op("by", by ? 1 : .18); F.by.el.style.display = by ? "" : "none"; paint();
  }
  seg("#heroSeg", k => { by = k === "in"; text(); });
  sl.addEventListener("input", text); themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { t += dt; Schem.tick(s.flows, dt); paint(); });
  text();
})();

/* ---------- tour: click a part ---------- */
(function tour() {
  const box = $("#tourSch"), txt = $("#tourTxt"), segB = $("#tourSeg");
  const s = Schem.svg(box, [24, 4, 456, 360], "The amplifier's parts. Choose a part with the buttons or by clicking it.");
  const h = drawAmp(s, { Vcc: "", part: false });
  const INFO = {
    c1: { p: h.at.C1, r: [34, 46], t: "C1 · the input coupling capacitor", b: "Lets the AC signal reach the base. Blocks DC, so the signal source can't disturb the base's steady voltage.", w: "Problem 1 is this job" },
    div: { p: [178, 184], r: [34, 166], t: "R1 and R2 · the voltage divider", b: "Two resistors that split the supply to hold the base at a steady DC voltage. That's the biasing that turns the transistor partly on.", w: "Problem 3a" },
    q: { p: [276, 190], r: [44, 50], t: "Q1 · the transistor", b: "A small wiggle at the base makes a large wiggle in the current from collector to emitter. Everything else in the circuit exists to help it do this.", w: "Problem 3" },
    r3: { p: h.at.R3, r: [30, 48], t: "R3 · the collector resistor", b: "Turns the changing collector current into a changing voltage. More current means a bigger drop across R3, which pulls the collector down. That's why the output is upside down.", w: "Problem 3c" },
    r4: { p: h.at.R4, r: [31, 46], t: "R4 · the emitter resistor", b: "Sets the DC current and keeps it stable, even when β changes from one transistor to the next.", w: "Problem 3b" },
    c3: { p: h.at.C3, r: [36, 46], t: "C3 · the bypass capacitor", b: "Gives AC a shortcut around R4. It holds the emitter still for AC, so the gain stays high. DC still has to go through R4.", w: "Problem 2 is this job" },
    c2: { p: [362, 182], r: [66, 96], t: "C2 and Rl · the output", b: "C2 passes the amplified wave and blocks the collector's DC. Rl is the load, whatever is receiving the output: the next stage, a speaker driver, or a meter.", w: "Problem 3c" }
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
  for (const k in INFO) { const o = INFO[k], e = svgEl("ellipse", { cx: o.p[0], cy: o.p[1], rx: o.r[0], ry: o.r[1], class: "tourhit" }, s.g); e.addEventListener("click", () => pick(k)); }
  seg("#tourSeg", pick); apply(); pick("c1");
  whenVisible(box, dt => { const a = 1 - Math.exp(-dt / .07); cur = cur.map((v, i) => v + (goal[i] - v) * a); apply(); });
})();

/* ---------- capacitor and resistor ---------- */
(function capLab() {
  const box = $("#capSch"), cv = $("#capCv"), sF = $("#capF"), sC = $("#capC"), reads = $("#capReads"), status = $("#capStatus"), R = 1000;
  const s = Schem.svg(box, [24, 8, 374, 288], "A source, a capacitor and a resistor connected in a series loop. Charge piles up on the capacitor's plates.");
  const acG = s.group(), dcG = s.group(); acG.vac([60, 150]); dcG.vsrc([60, 150]);
  s.wire([[60, 131], [60, 46], [170, 46]]); s.cap([170, 46], [222, 46]); s.wire([[222, 46], [340, 46]]); s.res([340, 46], [340, 254]); s.wire([[340, 254], [60, 254], [60, 169]]); s.gnd([200, 254]);
  s.text([96, 150], "source"); s.text([356, 142], "R"); s.text([356, 160], "1 kΩ", { cls: "sm" }); s.text([196, 18], "C", { anchor: "middle" }); const tC = s.text([196, 92], "", { anchor: "middle", cls: "sm" });
  const fl = s.flow([[60, 131], [60, 46], [340, 46], [340, 254], [60, 254], [60, 169]], { c: "cursor", gap: 18 });
  const pl = [[], []]; [28, 37, 55, 64].forEach(y => { pl[0].push(s.text([180, y], "+", { anchor: "middle" })); pl[1].push(s.text([212, y], "−", { anchor: "middle" })); });
  let mode = "ac", t = 0, t0 = 0;
  const Tw = 5;
  function vals() { const f = +logv(sF, 1, 1e4).toPrecision(2), C = +logv(sC, 1e-6, 1e-3).toPrecision(2), X = xcOf(f, C), x = X / R, k = 1 / Math.sqrt(1 + x * x), ph = Math.atan(x); return { f, C, X, x, k, ph }; }
  const tau = C => .25 + .75 * Math.log10(C / 1e-6) / 3;
  function at(tt, v) {
    if (mode === "ac") { const vs = Math.sin(WAVE * tt), vR = v.k * Math.sin(WAVE * tt + v.ph), vC = vs - vR; return { vs, vR, vC }; }
    const on = tt >= t0, vC = on ? 1 - Math.exp(-(tt - t0) / tau(v.C)) : 0; return { vs: on ? 1 : 0, vR: on ? 1 - vC : 0, vC };
  }
  function paint() {
    const v = vals(), { c, W, H } = canvas2d(cv), g = chart(c, W, H, { x: [0, 1], y: [-1.25, 1.25], xt: [], yt: [-1, 0, 1], fy: y => y ? (y > 0 ? "+peak" : "−peak") : "0", pad: { l: 52, b: 12, t: 12 } });
    const tr = key => { const pts = []; for (let i = 0; i <= 260; i++) { const u = i / 260; pts.push([g.X(u), g.Y(at(t - (1 - u) * Tw, v)[key])]); } return pts; };
    stroke(c, tr("vs"), rgbS(T.muted), 1.8, [5, 4]); stroke(c, tr("vC"), rgbS(T.cursor), 2.4); stroke(c, tr("vR"), rgbS(T.accent), 2.8);
    const n = at(t, v), N = Math.round(Math.min(1, Math.abs(n.vC)) * 4), plus = n.vC >= 0;
    pl[0].forEach((e, i) => { e.textContent = plus ? "+" : "−"; e.style.fill = `var(--${plus ? "t3" : "t1"})`; e.style.opacity = i < N ? 1 : 0; });
    pl[1].forEach((e, i) => { e.textContent = plus ? "−" : "+"; e.style.fill = `var(--${plus ? "t1" : "t3"})`; e.style.opacity = i < N ? 1 : 0; });
    fl.speed = 120 * (mode === "ac" ? v.k * Math.cos(WAVE * t + v.ph) : n.vR);
  }
  function text() {
    const v = vals(), ac = mode === "ac";
    $("#capFOut").textContent = eng(sig(v.f), "Hz"); $("#capCOut").textContent = eng(sig(v.C), "F"); tC.textContent = eng(sig(v.C), "F");
    acG.g.style.display = ac ? "" : "none"; dcG.g.style.display = ac ? "none" : "";
    reads.innerHTML = ac ? cell("X<sub>C</sub> = 1/(2πfC)", fmtOhm(v.X)) + cell("X<sub>C</sub> ÷ R", sig(v.x)) + cell("signal reaching R", fx(v.k * 100, 1) + " %", true)
      : cell("X<sub>C</sub> at DC", "∞") + cell("after it fills", "no current", true) + cell("capacitor voltage", "equals the source");
    status.textContent = !ac ? "DC blocked once charged" : v.x < .1 ? "good coupling" : v.x < 1 ? "partly through" : "mostly blocked";
    paint();
  }
  seg("#capSeg", k => { mode = k; t0 = t + .35; text(); });
  [sF, sC].forEach(e => e.addEventListener("input", text)); themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { t += dt; Schem.tick(s.flows, dt); paint(); });
  text();
})();

/* ---------- what the capacitor sees ---------- */
(function reqFold() {
  const box = $("#reqSch"), s1 = $("#reqR1"), s2 = $("#reqR2"), reads = $("#reqReads"), status = $("#reqStatus");
  const RV = [1000, 1500, 2200, 3300, 4700, 6800, 10000, 15000, 22000, 33000, 47000, 68000];
  const s = Schem.svg(box, [44, 30, 400, 322], "A coupling capacitor feeding a node between R1, which goes up to the supply, and R2, which goes to ground. In the AC view, the supply becomes ground and R1 swings down beside R2.");
  const h = drawCoupling(s, { Vcc: "12 V", C1: "" });
  const fd = s.flow(h.fd, { c: "t1" }), fa = s.flow(h.fa, { c: "cursor", gap: 18 }), fa2 = s.flow(h.fa2, { c: "cursor", gap: 18 });
  let want = 0, p = 0, t = 0;
  function apply() {
    const m = ease01(clamp(p * 2, 0, 1)), f = ease01(clamp(p * 2 - 1, 0, 1)); h.set(m, f);
    fd.el.style.display = p < .02 ? "" : "none"; fa.el.style.display = p > .02 ? "" : "none"; fa2.el.style.display = p > .985 ? "" : "none";
    fd.speed = 44; fa.speed = fa2.speed = 52 * Math.cos(WAVE * t);
  }
  function text() {
    const R1 = RV[+s1.value], R2 = RV[+s2.value], Req = par(R1, R2);
    $("#reqR1Out").textContent = fmtOhm(R1); $("#reqR2Out").textContent = fmtOhm(R2); h.t.R1.textContent = fmtOhm(R1); h.t.R2.textContent = fmtOhm(R2);
    reads.innerHTML = cell("R<sub>eq</sub> = R1 ∥ R2", fmtOhm(Req), true) + cell("limit for X<sub>C</sub>: 0.1·R<sub>eq</sub>", fmtOhm(.1 * Req)) + cell("R<sub>eq</sub> compared with R2", fx(Req / R2 * 100, 0) + " %");
    status.textContent = want ? "R1 and R2 in parallel" : "as drawn: DC view";
  }
  seg("#reqSeg", k => { want = k === "ac" ? 1 : 0; if (reduce) p = want; text(); apply(); });
  [s1, s2].forEach(e => e.addEventListener("input", text));
  whenVisible(box, dt => { t += dt; p = p < want ? Math.min(want, p + dt / 1.5) : Math.max(want, p - dt / .9); apply(); Schem.tick(s.flows, dt); });
  text(); apply();
})();

/* ---------- bypassing: gain against frequency ---------- */
(function bypassLab() {
  const cv = $("#byCv"), sC = $("#byC"), sF = $("#byF"), reads = $("#byReads"), status = $("#byStatus"), q = solveAmp(A0), RE = A0.RE, full = q.rc / q.re;
  const gainAt = (f, C) => { const w = TWO_PI * f, d = 1 + Math.pow(w * RE * C, 2), zr = RE / d, zi = -w * RE * RE * C / d; return q.rc / Math.hypot(q.re + zr, zi); };
  function draw() {
    const C = logv(sC, 1e-6, 1e-2), f = logv(sF, 1, 1e5), fr = 1 / (TWO_PI * C * .1 * RE), a = gainAt(f, C), { c, W, H } = canvas2d(cv);
    $("#byCOut").textContent = eng(sig(C), "F"); $("#byFOut").textContent = eng(sig(f), "Hz");
    const g = chart(c, W, H, { x: [0, 5], y: [0, 200], xt: [0, 1, 2, 3, 4, 5], yt: [0, 50, 100, 150, 200], fx: v => ["1", "10", "100", "1k", "10k", "100k"][v], xl: "signal frequency (Hz, log scale)", yl: "gain, |Av|", pad: { l: 58 } });
    const pts = []; for (let e = 0; e <= 5.001; e += .02) pts.push([g.X(e), g.Y(gainAt(Math.pow(10, e), C))]);
    stroke(c, [[g.X(0), g.Y(full)], [g.X(5), g.Y(full)]], rgbS(T.good, .55), 1.4, [3, 4]); tag(c, g.X(5) - 4, g.Y(full) - 7, "full gain", rgbS(T.good), "right");
    stroke(c, pts, rgbS(T.accent), 3);
    const lr = Math.log10(fr);
    if (lr >= 0 && lr <= 5) { stroke(c, [[g.X(lr), g.Y(0)], [g.X(lr), g.Y(200)]], rgbS(T.cursor), 1.8, [6, 4]); tag(c, g.X(lr) + (lr > 3.7 ? -6 : 6), g.Y(188), "10× rule met", rgbS(T.cursor), lr > 3.7 ? "right" : "left"); }
    blob(c, g.X(Math.log10(f)), g.Y(a), rgbS(T.ink), 6);
    const X = xcOf(f, C);
    reads.innerHTML = cell("X<sub>C</sub> at this f", fmtOhm(X)) + cell("0.1 × R4", fmtOhm(.1 * RE)) + cell("gain |A<sub>V</sub>|", fx(a, 1), true) + cell("share of full gain", fx(a / full * 100, 0) + " %");
    status.textContent = X < .1 * RE ? "rule met at this frequency" : "rule not met";
  }
  [sC, sF].forEach(e => e.addEventListener("input", draw)); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- standard values ---------- */
(function ladder() {
  const cv = $("#ladCv"), sl = $("#ladV"), reads = $("#ladReads"), status = $("#ladStatus");
  function draw() {
    const v = logv(sl, 1, 1000), buy = nextUpE12(v), dec = Math.pow(10, Math.floor(Math.log10(v) + 1e-9)), { c, W, H } = canvas2d(cv), L = 30, R = 30, X = m => L + Math.log10(m) * (W - L - R), y0 = 74;
    $("#ladVOut").textContent = sig(v) + " µF";
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    stroke(c, [[L, y0], [W - R, y0]], rgbS(T.muted), 2);
    c.font = `600 12px ${css("--f-mono")}`; c.textAlign = "center";
    const list = [...E12.map(m => m / 10), 10], mBuy = buy / dec;
    let below = 0;
    for (const m of list) {
      const x = X(m), val = +(m * dec).toPrecision(2), hot = Math.abs(m - mBuy) < 1e-6;
      if (m * dec < v * (1 - 1e-9)) below = val;
      stroke(c, [[x, y0 - 9], [x, y0 + 9]], rgbS(hot ? T.good : T.muted), hot ? 3 : 1.6);
      c.font = `600 12px ${css("--f-mono")}`; c.textAlign = "center"; c.fillStyle = rgbS(hot ? T.good : T.muted); c.fillText(String(val), x, y0 + 30);
    }
    c.strokeStyle = rgbS(T.good); c.lineWidth = 2.4; c.beginPath(); c.arc(X(mBuy), y0, 15, 0, 7); c.stroke();
    const xv = X(v / dec); stroke(c, [[xv, y0 - 44], [xv, y0 - 16]], rgbS(T.cursor), 2.4);
    c.fillStyle = rgbS(T.cursor); c.beginPath(); c.moveTo(xv, y0 - 10); c.lineTo(xv - 6, y0 - 20); c.lineTo(xv + 6, y0 - 20); c.closePath(); c.fill();
    tag(c, clamp(xv, 70, W - 70), y0 - 50, "calculated", rgbS(T.cursor), "center");
    reads.innerHTML = cell("calculated minimum", sig(v) + " µF") + cell("buy this one", buy + " µF", true) + cell("next one down fails", (below || +(dec * .82).toPrecision(2)) + " µF");
    status.textContent = "always round up";
  }
  sl.addEventListener("input", draw); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- the divider and the base ---------- */
(function divLab() {
  const cv = $("#divCv"), s1 = $("#divR1"), s2 = $("#divR2"), sB = $("#divB"), reads = $("#divReads"), status = $("#divStatus"), Vcc = 12, RE = 560;
  const R1V = [1000, 1500, 2200, 3300, 4700, 6800, 8200, 10000, 15000, 22000, 47000, 100000], R2V = [150, 220, 330, 470, 680, 1000, 1500, 2200, 4700, 10000, 15000, 22000];
  function draw() {
    const R1 = R1V[+s1.value], R2 = R2V[+s2.value], b = +sB.value, Vs = Vcc * R2 / (R1 + R2), Rt = par(R1, R2), on = Vs > .75, IE = on ? (Vs - .7) / (RE + Rt / (b + 1)) : 0, IB = IE / (b + 1), Vf = Vs - IB * Rt, Id = (Vcc - Vf) / R1, stiff = R2 <= .01 * b * RE;
    $("#divR1Out").textContent = fmtOhm(R1); $("#divR2Out").textContent = fmtOhm(R2); $("#divBOut").textContent = b;
    const { c, W, H } = canvas2d(cv); c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    const x0 = Math.max(70, W * .1), cw = 70, top = 26, bot = H - 24, Y = v => bot - v / Vcc * (bot - top);
    c.fillStyle = rgbS(T.t1, .3); c.fillRect(x0, top, cw, Y(Vs) - top); c.fillStyle = rgbS(T.accent, .3); c.fillRect(x0, Y(Vs), cw, bot - Y(Vs));
    c.strokeStyle = rgbS(T.muted); c.lineWidth = 1.2; c.strokeRect(x0, top, cw, bot - top);
    tag(c, x0 + cw / 2, (top + Y(Vs)) / 2 + 4, "R1", rgbS(T.ink), "center"); tag(c, x0 + cw / 2, Math.min(bot - 5, (bot + Y(Vs)) / 2 + 4), "R2", rgbS(T.ink), "center");
    tag(c, x0 - 8, top + 8, "12 V", rgbS(T.muted), "right"); tag(c, x0 - 8, bot + 3, "0 V", rgbS(T.muted), "right");
    stroke(c, [[x0 - 6, Y(Vs)], [x0 + cw + 12, Y(Vs)]], rgbS(T.ink), 2.2); tag(c, x0 + cw + 18, Y(Vs) - 3, "simple VB " + fx(Vs, 2) + " V", rgbS(T.ink));
    stroke(c, [[x0 - 6, Y(Vf)], [x0 + cw + 12, Y(Vf)]], rgbS(T.cursor), 2.2, [5, 4]); tag(c, x0 + cw + 18, Y(Vf) + 14, "with base current " + fx(Vf, 2) + " V", rgbS(T.cursor));
    const bx = W * .56, bw = W * .4, sc = bw / Math.max(Id, 1e-9), rows = [["divider current", Id, T.t1], ["base current (the sip)", IB, T.cursor]];
    rows.forEach(([n, v, col], i) => { const y = 60 + i * 74; tag(c, bx, y - 8, n, rgbS(T.muted)); c.fillStyle = rgbS(col, .8); c.fillRect(bx, y, Math.max(2, v * sc), 22); tag(c, bx, y + 40, eng(v, "A"), rgbS(T.ink)); });
    reads.innerHTML = cell("V<sub>B</sub>, simple", fx(Vs, 2) + " V") + cell("V<sub>B</sub>, with base current", fx(Vf, 2) + " V") + cell("difference", fx(Math.abs(Vs - Vf) / Vs * 100, 1) + " %", true) + cell("R2 vs 0.01·β·R<sub>E</sub>", fmtOhm(R2) + " · " + fmtOhm(.01 * b * RE));
    status.textContent = !on ? "transistor off" : stiff ? "stiff" : "not stiff";
  }
  [s1, s2, sB].forEach(e => e.addEventListener("input", draw)); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- beta barely gets a vote ---------- */
(function betaLab() {
  const cv = $("#betaCv"), sl = $("#betaB"), reads = $("#betaReads"), status = $("#betaStatus"), a = A0, Vth = a.Vcc * a.R2 / (a.R1 + a.R2), Rt = par(a.R1, a.R2);
  const vdb = b => (Vth - .7) / (a.RE + Rt / (b + 1)), IB0 = vdb(150) / 151, bb = b => (b + 1) * IB0;
  function draw() {
    const b = +sl.value, { c, W, H } = canvas2d(cv); $("#betaBOut").textContent = b;
    const g = chart(c, W, H, { x: [50, 400], y: [0, 6], xt: [50, 100, 150, 200, 250, 300, 350, 400], yt: [0, 1, 2, 3, 4, 5, 6], fy: v => v + " mA", xl: "β of the transistor", pad: { l: 58 } });
    const line = f => { const p = []; for (let x = 50; x <= 400; x += 5) p.push([g.X(x), g.Y(f(x) * 1e3)]); return p; };
    stroke(c, line(bb), rgbS(T.t3), 2.8); stroke(c, line(vdb), rgbS(T.accent), 3.2);
    tag(c, g.X(392), g.Y(bb(392) * 1e3) + 30, "base bias", rgbS(T.t3), "right"); tag(c, g.X(392), g.Y(vdb(392) * 1e3) - 9, "voltage divider bias", rgbS(T.accent), "right");
    stroke(c, [[g.X(b), g.Y(0)], [g.X(b), g.Y(6)]], rgbS(T.muted), 1.2, [4, 4]);
    blob(c, g.X(b), g.Y(bb(b) * 1e3), rgbS(T.t3), 6); blob(c, g.X(b), g.Y(vdb(b) * 1e3), rgbS(T.accent), 6);
    const d1 = (vdb(b) / vdb(150) - 1) * 100, d2 = (bb(b) / bb(150) - 1) * 100, sgn = v => (v >= 0 ? "+" : "") + fx(v, 1) + " %";
    reads.innerHTML = cell("divider bias I<sub>E</sub>", eng(vdb(b), "A"), true) + cell("change from β = 150", sgn(d1)) + cell("base bias I<sub>E</sub>", eng(bb(b), "A")) + cell("change from β = 150", sgn(d2));
    status.textContent = "divider moves " + fx(Math.abs(d1), 1) + " %, base bias " + fx(Math.abs(d2), 0) + " %";
  }
  sl.addEventListener("input", draw); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- the load joins in for AC ---------- */
(function rcLab() {
  const box = $("#rcSch"), sl = $("#rcL"), reads = $("#rcReads"), status = $("#rcStatus"), RC = A0.RC;
  const RLV = [470, 1000, 1500, 2200, 3300, 4700, 6800, 10000, 15000, 22000, 33000, 47000, 68000, 100000, 220000];
  const s = Schem.svg(box, [24, 4, 456, 360], "The amplifier with its collector resistor and load. In the AC view the capacitors become wires, the supply becomes ground, and the collector resistor swings down beside the load.");
  const h = drawAmp(s, LBL);
  const fO = s.flow(h.f.out, { c: "cursor", gap: 18 }), fR = s.flow([[282, 124], [282, 30]], { c: "cursor", gap: 18 }), fF = s.flow([[388, 124], [444, 124], [444, 218]], { c: "cursor", gap: 18 }), fC = s.flow(h.f.c, { c: "t3" });
  let want = 0, p = 0, t = 0;
  function apply() {
    const m = ease01(clamp(p * 2, 0, 1)), f = ease01(clamp(p * 2 - 1, 0, 1));
    h.short(m); h.op("src", 1 - m); h.op("acg", m); h.fold(f); h.op("re", 1 - .75 * m); h.op("div", 1 - .75 * m); h.op("in", 1 - .75 * m);
    fC.el.style.display = p < .02 ? "" : "none"; fO.el.style.display = p > .02 ? "" : "none"; fR.el.style.display = p > .02 && p < .5 ? "" : "none"; fF.el.style.display = p > .985 ? "" : "none";
    fC.speed = 50; fO.speed = fR.speed = fF.speed = 50 * Math.cos(WAVE * t);
  }
  function text() {
    const RL = RLV[+sl.value], rc = par(RC, RL); $("#rcLOut").textContent = fmtOhm(RL); h.t.RL.textContent = fmtOhm(RL);
    reads.innerHTML = cell("R3", fmtOhm(RC)) + cell("R<sub>l</sub>", fmtOhm(RL)) + cell("r<sub>c</sub> = R3 ∥ R<sub>l</sub>", fmtOhm(rc), true) + cell("r<sub>c</sub> compared with R3", fx(rc / RC * 100, 0) + " %");
    status.textContent = want ? "R3 and Rl in parallel" : "as drawn: DC view";
  }
  seg("#rcSeg", k => { want = k === "ac" ? 1 : 0; if (reduce) p = want; text(); apply(); });
  sl.addEventListener("input", text);
  whenVisible(box, dt => { t += dt; p = p < want ? Math.min(want, p + dt / 1.5) : Math.max(want, p - dt / .9); apply(); Schem.tick(s.flows, dt); });
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

/* ---------- the gain see-saw ---------- */
(function gainLab() {
  const cv = $("#gainCv"), sR = $("#gainR"), sI = $("#gainI"), reads = $("#gainReads"), status = $("#gainStatus"), RE = 560;
  let by = true, t = 0;
  const armL = r => 33 + 63 * Math.log10(r / 5);
  function paint() {
    const rc = +sR.value, I = +sI.value * 1e-3, re = VT25 / I, low = by ? re : re + RE, A = -rc / low, full = rc / re, { c, W, H } = canvas2d(cv);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    const half = W * .54, px = half * .42, py = H * .6, th = .16 * Math.sin(WAVE * t), L1 = Math.min(armL(low), px - 20), L2 = Math.min(armL(rc), half - px - 20), cs = Math.cos(th), sn = Math.sin(th);
    const pA = [px - L1 * cs, py + L1 * sn], pB = [px + L2 * cs, py - L2 * sn];
    c.fillStyle = rgbS(T.muted); c.beginPath(); c.moveTo(px, py + 4); c.lineTo(px - 18, py + 36); c.lineTo(px + 18, py + 36); c.closePath(); c.fill();
    stroke(c, [pA, [px, py]], rgbS(T.cursor), 9); stroke(c, [[px, py], pB], rgbS(T.accent), 9);
    blob(c, px, py, rgbS(T.ink), 5); blob(c, pA[0], pA[1], rgbS(T.cursor), 7); blob(c, pB[0], pB[1], rgbS(T.accent), 7);
    tag(c, Math.max(8, px - L1 - 8), py - 54, (by ? "r′e " : "r′e + RE ") + fmtOhm(low), rgbS(T.cursor));
    tag(c, px + L2 / 2 - 28, py + 62, "rc " + fmtOhm(rc), rgbS(T.accent));
    tag(c, 12, 20, "input pushes the short arm", rgbS(T.muted)); tag(c, 12, H - 12, "pivot = the flip", rgbS(T.muted));
    const gap = 8, x = half, w = W - half, sh = (H - gap) / 2, Tw = 5, rIn = .005, rOut = niceUp(full * rIn);
    const vAt = u => rIn * Math.sin(WAVE * (t - (1 - u) * Tw));
    strip(c, x, 0, w, sh, { name: "vin", range: "±5 mV", col: rgbS(T.cursor), f: u => vAt(u) / rIn });
    c.fillStyle = rgbS(T.line); c.fillRect(x, sh, w, gap);
    strip(c, x, sh + gap, w, sh, { name: "vout", range: "±" + eng(rOut, "V", 2), col: rgbS(T.accent), f: u => A * vAt(u) / rOut });
    c.fillStyle = rgbS(T.line); c.fillRect(x - 1, 0, 1, H);
  }
  function text() {
    const rc = +sR.value, I = +sI.value * 1e-3, re = VT25 / I, low = by ? re : re + RE, A = -rc / low;
    $("#gainROut").textContent = fmtOhm(rc); $("#gainIOut").textContent = fx(+sI.value, 2) + " mA";
    reads.innerHTML = cell("r<sub>e</sub>′ = 25 mV / I<sub>E</sub>", fmtOhm(re)) + cell("r<sub>c</sub>", fmtOhm(rc)) + cell("A<sub>V</sub>", fx(A, Math.abs(A) < 10 ? 2 : 0), true);
    status.textContent = "inverted, × " + fx(Math.abs(A), Math.abs(A) < 10 ? 1 : 0); paint();
  }
  seg("#gainSeg", k => { by = k === "in"; text(); });
  [sR, sI].forEach(e => e.addEventListener("input", text)); themeListeners.push(paint); new ResizeObserver(paint).observe(cv);
  whenVisible(cv, dt => { t += dt; paint(); });
  text();
})();
