/* Additional BJT circuits: the live interactives. Every demo uses its own example part values, never the homework's. */
let T = tokens(TOK);
const redraws = [];
themeListeners.push(() => { T = tokens(TOK); redraws.forEach(f => f()); });
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;
const logv = (el, a, b) => a * Math.pow(b / a, +el.value / 1000);
const pct = v => { const p = v * 100; return (p >= 10 ? p.toFixed(0) : p.toFixed(1)) + "%"; };
const ohm = r => eng(r, "Ω");
const lerp = (a, b, u) => a + (b - a) * u;
/* dot speed for a current, on a log scale so microamps crawl and amps race */
const spd = i => 6 + 74 * clamp((Math.log10(Math.abs(i) + 1e-12) + 6) / 6, 0, 1);

function stroke(c, pts, col, w = 2, dash) { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.setLineDash([]); }
function tag(c, x, y, s, col, align = "left", size = 11) { c.font = `600 ${size}px ${css("--f-mono")}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }
/* a sine across [x0, x1] about y with height a (pixels), moving with time t */
function sinePts(x0, x1, y, a, t, n = 160) { const p = []; for (let i = 0; i <= n; i++) { const u = i / n; p.push([lerp(x0, x1, u), y - a * Math.sin(2.4 * (t - (1 - u) * 4.2))]); } return p; }
function plotBg(c, W, H) { c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H); }

/* ---------- hero: a weak source meets a heavy load ---------- */
(function hero() {
  const box = $("#heroSch"), cv = $("#heroCv"), reads = $("#heroReads"), status = $("#heroStatus");
  const Rs = 10e3, RL = 100, RE = 470, b = 100, rp = VT25 / 10e-3, re = par(RE, RL);
  const zOne = b * (rp + re), zTwo = b * b * (2 * rp + re);
  const M = {
    direct: { vL: RL / (Rs + RL), iS: 1 / (Rs + RL), name: "wired straight to the speaker", who: "the sensor" },
    one: { vL: zOne / (Rs + zOne) * re / (re + rp), iS: 1 / (Rs + zOne), name: "through one emitter follower", who: "the 12 V supply" },
    darl: { vL: zTwo / (Rs + zTwo) * re / (re + 2 * rp), iS: 1 / (Rs + zTwo), name: "through a Darlington pair", who: "the 12 V supply" }
  };
  for (const k in M) M[k].iL = M[k].vL / RL;
  const ALT = {
    direct: "A sensor with 10 kΩ of internal resistance wired straight to a 100 Ω speaker. Almost all of its voltage is lost inside the sensor.",
    one: "The sensor drives the base of one emitter follower. The follower's emitter drives the 100 Ω speaker through a capacitor, with current from a 12 V supply.",
    darl: "The sensor drives a Darlington pair: two followers in a row. The second emitter drives the 100 Ω speaker, with current from a 12 V supply."
  };
  let mode = "direct", F = {}, t = 0;
  function draw() {
    box.replaceChildren();
    const s = Schem.svg(box, [0, 0, 470, 300], ALT[mode]);
    s.rect(12, 60, 146, 214, "soft"); s.text([85, 76], "a weak source", { anchor: "middle", cls: "sm" });
    const v = s.vac([40, 190]); s.gnd(v.bot); s.wire([v.top, [40, 110]]); s.res([40, 110], [136, 110], { len: 44 });
    s.text([88, 94], "Rs · 10 kΩ", { anchor: "middle", cls: "sm" }); s.text([72, 186], "sensor", { cls: "sm" });
    const nL = [396, 200];
    s.res(nL, [396, 270]); s.gnd([396, 270]); s.node(nL);
    s.text([410, 228], "RL"); s.text([410, 246], "100 Ω", { cls: "sm" }); s.text([410, 262], "speaker", { cls: "sm" });
    const src = [v.top, [40, 110], [136, 110]];
    if (mode === "direct") {
      s.wire([[136, 110], [396, 110], nL]);
      F.s = s.flow([...src, [396, 110], nL, [396, 270]], { c: "cursor", gap: 18 }); F.l = null; F.h = null;
    } else {
      const two = mode === "darl", B = [two ? 180 : 200, 110], xE = two ? 260 : 220, nE = [xE, 200];
      s.wire([[136, 110], B]); const q = s.bjt(B);
      s.text([B[0] + 26, 100], "Q1", { cls: "sm" }); s.text([B[0] + 26, 116], "β = 100", { cls: "sm" });
      s.wire([q.C, [B[0] + 20, 30]]); s.wire([[B[0] + 20, 30], [300, 30]]); const fl = s.net([300, 30], { w: 40 }); s.text(fl, "12 V", { anchor: "middle", cls: "sm" });
      let path = [[300, 30], [B[0] + 20, 30], ...thruQ(B)];
      if (two) {
        const B2 = [240, 150]; s.wire([q.E, [200, 150], B2]); const q2 = s.bjt(B2); s.wire([q2.C, [260, 30]]); s.node([260, 30]);
        s.text([286, 140], "Q2", { cls: "sm" }); s.text([286, 156], "β = 100", { cls: "sm" });
        path = [[300, 30], [260, 30], ...thruQ(B2)];
        F.h = s.flow([[200, 146], [200, 150], ...baseQ(B2)], { c: "t1", gap: 18 });
      } else F.h = null;
      s.wire([[xE, two ? 186 : 146], nE]); s.node(nE); s.res(nE, [xE, 270]); s.gnd([xE, 270]);
      s.text([xE - 16, 238], "RE", { anchor: "end", cls: "sm" }); s.text([xE - 16, 254], "470 Ω", { anchor: "end", cls: "sm" });
      s.wire([nE, [xE + 30, 200]]); s.cap([xE + 30, 200], [xE + 70, 200], { pol: true }); s.wire([[xE + 70, 200], nL]);
      F.s = s.flow([...src, ...baseQ(B)], { c: "cursor", gap: 18 });
      F.l = s.flow([...path, nE, [xE + 30, 200], [xE + 70, 200], nL, [396, 270]], { c: "t3", gap: 14 });
    }
    F.list = s.flows;
  }
  function readouts() {
    const m = M[mode];
    status.textContent = m.name;
    reads.innerHTML = cell("reaches the speaker", pct(m.vL), true) + cell("speaker current, peak", eng(m.iL, "A")) +
      cell("drawn from the sensor", eng(m.iS, "A")) + cell("who supplies the speaker", m.who);
  }
  function scope() {
    const { c, W, H } = canvas2d(cv); plotBg(c, W, H);
    const mid = H / 2 + 14, a = H * .32, m = M[mode];
    c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.beginPath();
    for (const k of [-1, 0, 1]) { c.moveTo(14, mid + k * a); c.lineTo(W - 14, mid + k * a); } c.stroke();
    stroke(c, sinePts(14, W - 14, mid, a, t), rgbS(T.cursor), 2, [6, 5]);
    stroke(c, sinePts(14, W - 14, mid, a * m.vL, t), rgbS(T.t3), 2.8);
    tag(c, 14, 20, "- - the sensor's own voltage", rgbS(T.cursor)); tag(c, 14, 36, "—— across the speaker", rgbS(T.t3));
    tag(c, W - 14, 20, pct(m.vL) + " gets through", rgbS(T.ink), "right");
  }
  function speeds() {
    const m = M[mode], w = Math.cos(t * 2.4);
    F.s.speed = w * spd(m.iS) * .5;
    if (F.l) F.l.speed = w * spd(m.iL); if (F.h) F.h.speed = w * spd(m.iL / b);
  }
  seg("#heroSeg", k => { mode = k; draw(); readouts(); scope(); });
  draw(); readouts(); scope(); redraws.push(scope);
  new ResizeObserver(scope).observe(cv);
  whenVisible(cv, dt => { t += dt; speeds(); Schem.tick(F.list, dt); scope(); });
})();

/* ---------- topic 1d: where a follower's base wiggle goes ---------- */
(function split() {
  const cv = $("#splitCv"), sI = $("#splitI"), sR = $("#splitR"), reads = $("#splitReads"), RE = 1000, b = 100;
  let t = 0;
  const st = () => { const IE = logv(sI, 5e-4, 2e-2), RL = logv(sR, 22, 1e4), rp = VT25 / IE, re = par(RE, RL); return { IE, RL, rp, re, A: re / (re + rp), Z: b * (rp + re) }; };
  function draw() {
    const q = st(), { c, W, H } = canvas2d(cv); plotBg(c, W, H);
    const x0 = 18, x1 = W - 18, w = x1 - x0, xa = x0 + Math.max(3, w * (1 - q.A));
    tag(c, x0, 22, "the base wiggle, split two ways", rgbS(T.ink));
    c.fillStyle = rgbS(T.bad, .85); c.fillRect(x0, 32, xa - x0, 26);
    c.fillStyle = rgbS(T.good, .75); c.fillRect(xa, 32, x1 - xa, 26);
    tag(c, x0, 76, "lost across r′e: " + pct(1 - q.A), rgbS(T.bad)); tag(c, x1, 76, "reaches the load: " + pct(q.A), rgbS(T.good), "right");
    const mid = (H + 92) / 2 - 6, a = (H - 104) / 2 - 14;
    c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.beginPath(); c.moveTo(x0, mid); c.lineTo(x1, mid); c.stroke();
    stroke(c, sinePts(x0, x1, mid, a, t), rgbS(T.cursor), 2, [6, 5]); stroke(c, sinePts(x0, x1, mid, a * q.A, t), rgbS(T.good), 2.8);
    tag(c, x0, H - 10, "- - base     —— output", rgbS(T.muted));
  }
  function upd() {
    const q = st();
    $("#splitIOut").textContent = eng(q.IE, "A"); $("#splitROut").textContent = ohm(q.RL);
    reads.innerHTML = cell("r′e = 25 mV / IE", ohm(q.rp)) + cell("re = RE || RL", ohm(q.re)) + cell("gain AV", fx(q.A, 3), true) + cell("Zin = β (r′e + re)", ohm(q.Z));
    draw();
  }
  sI.addEventListener("input", upd); sR.addEventListener("input", upd); upd(); redraws.push(draw);
  new ResizeObserver(draw).observe(cv);
  whenVisible(cv, dt => { t += dt; draw(); });
})();

/* ---------- topic 2a: why a gain stage wants a follower in front of a heavy load ---------- */
(function buffer() {
  const box = $("#bufSch"), cv = $("#bufCv"), reads = $("#bufReads"), status = $("#bufStatus");
  const RC = 4700, rp1 = 20, RL = 100, b2 = 150, rp2 = 5, RE2 = 1000;
  const M = {
    none: { rc: RC, A1: -RC / rp1, A2: 1, name: "nothing attached" },
    direct: { rc: par(RC, RL), A1: -par(RC, RL) / rp1, A2: 1, name: "speaker on the collector" },
    buf: (() => { const re2 = par(RE2, RL), z = b2 * (rp2 + re2), rc = par(RC, z); return { rc, A1: -rc / rp1, A2: re2 / (re2 + rp2), name: "follower in between" }; })()
  };
  const ALT = { none: "A common-emitter stage with a 4.7 kΩ collector resistor and nothing connected to its collector.",
    direct: "The same common-emitter stage with a 100 Ω speaker connected straight to its collector.",
    buf: "The same common-emitter stage driving the base of an emitter follower, whose emitter drives the 100 Ω speaker." };
  let mode = "none", t = 0;
  function draw() {
    box.replaceChildren(); const s = Schem.svg(box, [0, 0, 470, 232], ALT[mode]);
    if (mode === "buf") s.wire([[100, 24], [240, 24]]); const fr = s.net([100, 24], { left: true, w: 30 }); s.text(fr, "+V", { anchor: "middle", cls: "sm" });
    s.node([40, 140]); s.text([40, 122], "vin", { anchor: "middle", cls: "sm" }); s.wire([[40, 140], [80, 140]]);
    const q = s.bjt([80, 140]); s.text([106, 130], "Q1 · CE", { cls: "sm" }); s.text([106, 146], "r′e = 20 Ω", { cls: "sm" });
    s.res([100, 24], [100, 80], { len: 34 }); if (mode === "buf") s.node([100, 24]); s.wire([[100, 80], q.C]); s.node([100, 80]); s.wire([q.E, [100, 196]]); s.gnd([100, 196]);
    s.text([84, 44], "RC", { anchor: "end", cls: "sm" }); s.text([84, 60], "4.7 kΩ", { anchor: "end", cls: "sm" });
    s.text([86, 208], "emitter bypassed", { anchor: "end", cls: "sm" });
    const lo = (x, y) => { s.res([x, y], [x, 196], { len: 34 }); s.gnd([x, 196]); s.node([x, y]); s.text([x + 16, y + 44], "speaker", { cls: "sm" }); s.text([x + 16, y + 60], "100 Ω", { cls: "sm" }); };
    if (mode === "none") { s.wire([[100, 80], [360, 80]]); const fo = s.net([360, 80], { w: 34 }); s.text(fo, "out", { anchor: "middle", cls: "sm" }); }
    else if (mode === "direct") { s.wire([[100, 80], [360, 80]]); lo(360, 80); }
    else {
      const B = [220, 80]; s.wire([[100, 80], B]); const q2 = s.bjt(B); s.wire([q2.C, [240, 24]]); s.node([240, 24]);
      s.text([248, 58], "Q2 · follower", { cls: "sm" });
      s.wire([q2.E, [240, 130]]); s.node([240, 130]); s.res([240, 130], [240, 196], { len: 34 }); s.gnd([240, 196]); s.text([226, 166], "1 kΩ", { anchor: "end", cls: "sm" });
      s.wire([[240, 130], [360, 130]]); lo(360, 130);
    }
  }
  function scope() {
    const m = M[mode], { c, W, H } = canvas2d(cv); plotBg(c, W, H);
    const gw = (W - 16) / 3, mid = H / 2 + 12, a = H / 2 - 30, top = Math.abs(M.none.A1);
    const rows = [["input (enlarged)", .2, T.cursor], ["Q1's collector", -Math.abs(m.A1) / top, T.t3], ["the output", mode === "none" ? -1 : -Math.abs(m.A1 * m.A2) / top, T.good]];
    rows.forEach(([name, f, col], i) => {
      const x0 = 8 + i * gw + 8, x1 = 8 + (i + 1) * gw - 8;
      c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.strokeRect(x0, 26, x1 - x0, H - 34);
      c.beginPath(); c.moveTo(x0, mid); c.lineTo(x1, mid); c.stroke();
      tag(c, x0 + 6, 18, name, rgbS(T.ink));
      stroke(c, sinePts(x0 + 4, x1 - 4, mid, a * f, t, 90), rgbS(col), 2.6);
    });
  }
  function readouts() {
    const m = M[mode]; status.textContent = m.name;
    reads.innerHTML = cell("rc that Q1 sees", ohm(m.rc)) + cell("Q1's gain", fx(m.A1, 1)) + cell("follower's gain", mode === "buf" ? fx(m.A2, 3) : "–") +
      cell("gain to the output", fx(m.A1 * m.A2, 1), true);
  }
  seg("#bufSeg", k => { mode = k; draw(); readouts(); scope(); });
  draw(); readouts(); scope(); redraws.push(scope);
  new ResizeObserver(scope).observe(cv);
  whenVisible(cv, dt => { t += dt; scope(); });
})();

/* ---------- topic 3a: current needed at the input, one transistor or two ---------- */
(function darlington() {
  const cv = $("#darCv"), sI = $("#darI"), sB = $("#darB"), reads = $("#darReads");
  let mode = "one";
  const LIM = .02;                                            // what a typical logic pin can supply
  function draw() {
    const IL = logv(sI, .01, 3), b = +sB.value, { c, W, H } = canvas2d(cv); plotBg(c, W, H);
    const rows = mode === "one" ? [["load = Q's emitter", IL, T.t3], ["needed at the base", IL / b, T.cursor]]
      : [["load = Q2's emitter", IL, T.t3], ["Q2's base = Q1's emitter", IL / b, T.t1], ["needed at Q1's base", IL / (b * b), T.cursor]];
    const L = 18, R = W - 18, lo = -6, hi = 1, X = v => L + (Math.log10(v) - lo) / (hi - lo) * (R - L);
    c.font = `11px ${css("--f-mono")}`;
    for (let e = lo; e <= hi; e++) {
      const x = X(Math.pow(10, e)); c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.beginPath(); c.moveTo(x, 34); c.lineTo(x, H - 28); c.stroke();
      c.fillStyle = rgbS(T.muted); c.textAlign = "center"; c.fillText(eng(Math.pow(10, e), "A", 1), x, H - 12);
    }
    const xl = X(LIM); stroke(c, [[xl, 30], [xl, H - 28]], rgbS(T.bad), 1.6, [5, 4]); tag(c, xl - 6, 22, "a logic pin's limit, 20 mA", rgbS(T.bad), "right");
    const bh = 20, gap = (H - 70 - rows.length * bh) / rows.length;
    rows.forEach(([name, v, col], i) => {
      const y = 44 + gap * (i + .7) + bh * i; c.fillStyle = rgbS(col, .85); c.fillRect(L, y, Math.max(3, X(v) - L), bh);
      tag(c, L + 4, y - 6, name + " · " + eng(v, "A"), rgbS(T.ink));
    });
    c.textAlign = "left";
    const need = rows[rows.length - 1][1];
    $("#darIOut").textContent = eng(IL, "A"); $("#darBOut").textContent = String(b);
    reads.innerHTML = cell("needed at the input", eng(need, "A"), true) + cell("current gain", Math.round(IL / need).toLocaleString("en-US") + "×") +
      cell("voltage given up", mode === "one" ? "0.7 V" : "1.4 V") + cell("can a logic pin drive it?", need <= LIM ? "yes" : "no");
  }
  seg("#darSeg", k => { mode = k; draw(); });
  sI.addEventListener("input", draw); sB.addEventListener("input", draw); draw(); redraws.push(draw);
  new ResizeObserver(draw).observe(cv);
})();

/* ---------- topic 4b: a regulator you can load down ---------- */
(function regulator() {
  const box = $("#regSch"), sV = $("#regV"), sR1 = $("#regR1"), sL = $("#regL"), reads = $("#regReads"), status = $("#regStatus");
  const R2 = 10e3, b1 = 50, b2 = 100, TOP = 11;                 // U1's output can't get closer than about 1 V to the 12 V rail
  const s = Schem.svg(box, [0, 0, 470, 360], "A practice regulator: an op-amp compares a reference with a sample of the output from a divider, and drives a Darlington pair from a 12 V supply into a load.");
  const h = drawReg(s, { ref: "Vref", refW: 46, R1: "10 kΩ", R2: "10 kΩ", RL: "20 Ω", b1: "β = 50", b2: "β = 100" });
  const F = { l: s.flow(h.f.c2, { c: "t3", gap: 14 }), ll: s.flow(h.f.load, { c: "t3", gap: 14 }), dv: s.flow(h.f.div, { c: "t2", gap: 22 }),
    c1: s.flow(h.f.c1, { c: "t1", gap: 18 }), hd: s.flow(h.f.hand, { c: "t1", gap: 18 }), d: s.flow(h.f.drive, { c: "cursor", gap: 24 }) };
  let q;
  function upd() {
    const Vref = +sV.value, R1 = +sR1.value * 1000, RL = logv(sL, 2, 200), want = Vref * (1 + R1 / R2), ok = want + 1.4 <= TOP, Vo = ok ? want : TOP - 1.4;
    const IL = Vo / RL, Id = Vo / (R1 + R2), IE2 = IL + Id, Iu = IE2 / (b1 * b2);
    q = { IL, Id, IE2, Iu };
    h.t.ref.textContent = fx(Vref, 2) + " V"; h.t.R1.textContent = R1 ? ohm(R1) : "0 Ω"; h.t.RL.textContent = ohm(RL);
    $("#regVOut").textContent = fx(Vref, 2) + " V"; $("#regR1Out").textContent = R1 ? ohm(R1) : "0 Ω"; $("#regLOut").textContent = ohm(RL);
    status.textContent = ok ? "regulating" : "U1 is out of room";
    status.style.color = ok ? "" : "var(--bad)";
    reads.innerHTML = cell("Vout", fx(Vo, 2) + " V", true) + cell("U1's output", fx(Vo + 1.4, 2) + " V") + cell("load current", eng(IL, "A")) +
      cell("U1's current", eng(Iu, "A"), true) + cell("current gain", Math.round(IL / Iu).toLocaleString("en-US") + "×") + cell("heat in Q2", fx((12 - Vo) * IE2, 2) + " W");
    $("#regMsg").textContent = ok ? `Vout = Vref (1 + R1/R2) = ${fx(want, 2)} V, whatever the load. U1 sits 1.4 V higher to cover both junctions.`
      : `Vref (1 + R1/R2) asks for ${fx(want, 2)} V, but U1 can't swing above about 11 V, so Vout stops at ${fx(Vo, 2)} V. Feedback only works while U1 has room.`;
  }
  for (const el of [sV, sR1, sL]) el.addEventListener("input", upd);
  upd();
  whenVisible(box, dt => {
    F.l.speed = spd(q.IE2); F.ll.speed = spd(q.IL); F.dv.speed = spd(q.Id) * .5; F.c1.speed = F.hd.speed = spd(q.IE2 / b2); F.d.speed = spd(q.Iu);
    Schem.tick(s.flows, dt);
  });
})();

/* ---------- "check your answer before revealing": one box per worked example ---------- */
const CHECK = {
  p1a: ["re1", "Ω", 317.647], p1b: ["r′e1", "Ω", 12.5], p1c: ["Zin", "kΩ", 36.3162, [36.6463, "That's the exact (β + 1) version. The course formula uses β, which gives 36.32 kΩ."]],
  p1d: ["AV", "V/V", .962138], p2a: ["re2", "Ω", 136.364], p2b: ["r′e2", "Ω", 7.21154], p2c: ["AV,CC", "V/V", .949772], p2d: ["AV,total", "V/V", -136.767],
  p3: ["Iin", "µA", 45.8333, [45.0789, "That's the exact (β + 1) version. The course's shortcut divides by β, which gives 45.83 µA. Either is a fair answer."]],
  p4a: ["Vout", "V", 6], p4b: ["IRload", "A", .6],
  p4c: ["Iout of U1", "µA", 68.2045, [66.7556, "That's the exact (β + 1) version. The course's shortcut divides by β, which gives 68.20 µA. Both sit inside the hint."]]
};
const sig3 = (v, x) => Math.abs(v - x) <= .5 * Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 2) * 1.02;
document.addEventListener("DOMContentLoaded", () => {
  for (const [id, [name, unit, target, alt]] of Object.entries(CHECK)) {
    const art = document.getElementById(id), rev = art && art.querySelector("details.reveal"); if (!rev) continue;
    const d = document.createElement("details"); d.className = "deeper check";
    d.innerHTML = `<summary>Check your answer before revealing</summary><div><form><label><span>Your ${name}, in ${unit}</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="a number"></label><button type="submit" class="btn">Check</button></form><p class="checkmsg" role="status"></p></div>`;
    const input = d.querySelector("input"), msg = d.querySelector(".checkmsg");
    d.querySelector("form").addEventListener("submit", e => {
      e.preventDefault();
      const v = Number(input.value.replace(/[−–]/g, "-").replace(/,/g, "").trim());
      let r, ok = false;
      if (!input.value.trim() || !isFinite(v)) r = `Enter a number in ${unit}.`;
      else if (sig3(v, target)) { ok = true; r = "That matches to three significant figures."; }
      else if (alt && sig3(v, alt[0])) { ok = true; r = alt[1]; }
      else if (sig3(-v, target)) r = "Right size, wrong sign. Which stage flips the wave?";
      else if (sig3(v / 1000, target) || sig3(v * 1000, target)) r = `Off by a factor of 1000. Enter it in ${unit}.`;
      else r = "Not yet. Go back through the steps above and check each one.";
      msg.textContent = r; msg.className = "checkmsg " + (ok ? "ok" : "no");
    });
    rev.before(d);
  }
});
