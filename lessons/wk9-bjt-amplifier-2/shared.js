/* Shared by page.js and the scenes: the simplified-analysis formulas (a port of verify.py) and the homework's two circuits. */
const VT25 = 0.025;                                           // the course's thermal voltage, 25 mV
const TWO_PI = 2 * Math.PI;
const par = (...r) => 1 / r.reduce((s, x) => s + 1 / x, 0);
/* a VDB amplifier whose emitter has two resistors: re (left in the AC path) above R4 (bypassed by C3) */
function solveSwamp(a) {
  const VB = a.Vcc * a.R2 / (a.R1 + a.R2), VE = VB - 0.7, IE = VE / (a.re + a.R4), VC = a.Vcc - IE * a.RC, rc = par(a.RC, a.RL), rp = VT25 / IE, Zb = a.beta * (rp + a.re);
  return { VB, VE, IE, VC, rc, rp, AV: -rc / (rp + a.re), AV0: -rc / rp, Zb, Rdiv: par(a.R1, a.R2), Zin: par(a.R1, a.R2, Zb) };
}
function eng(v, u, d = 3) {                                   // 0.0193 -> "19.3 mA"
  const a = Math.abs(v); if (!isFinite(v)) return "∞ " + u;
  if (a === 0) return "0 " + u;
  const [k, p] = a >= 1e6 ? [1e-6, "M"] : a >= 1e3 ? [1e-3, "k"] : a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : a >= 1e-6 ? [1e6, "µ"] : a >= 1e-9 ? [1e9, "n"] : [1e12, "p"];
  return (v < 0 ? "−" : "") + (+(a * k).toPrecision(d)) + " " + p + u;
}
const fmtOhm = r => eng(r, "Ω");

/* The Problem 1 amplifier (and, with other values, the live demos). Named groups fade with op(name, 0..1):
   src the supply, acg its AC ground, in, out, by (C3), div, rc (R3), sw (the unbypassed re), r4.
   short(m) turns each capacitor into a wire, fold(f) swings R3 down beside Rl. */
function drawSwamp(s, v = {}) {
  const t = {}, G = {};
  for (const n of ["div", "rc", "sw", "r4", "by", "in", "out", "src", "acg"]) G[n] = s.group();
  const cap1 = G.in.group(), sh1 = G.in.group(), cap2 = G.out.group(), sh2 = G.out.group(), cap3 = G.by.group(), sh3 = G.by.group();
  /* the supply and the rail */
  const src = G.src.vsrc([46, 92]); G.src.gnd(src.bot); G.src.wire([src.top, [46, 24]]);
  G.src.text([72, 84], "Vcc"); t.Vcc = G.src.text([72, 102], v.Vcc || "", { cls: "sm" });
  s.wire([[46, 24], [178, 24]]); const railR = s.group(); railR.wire([[178, 24], [282, 24]]); s.node([178, 24]);
  G.acg.gnd([46, 24]); G.acg.text([46, 66], "AC ground", { anchor: "middle", cls: "sm" });
  /* base divider */
  G.div.res([178, 24], [178, 172]); G.div.res([178, 172], [178, 330]);
  G.div.text([162, 90], "R1", { anchor: "end" }); t.R1 = G.div.text([162, 108], v.R1 || "", { anchor: "end", cls: "sm" });
  G.div.text([162, 244], "R2", { anchor: "end" }); t.R2 = G.div.text([162, 262], v.R2 || "", { anchor: "end", cls: "sm" });
  s.wire([[178, 172], [262, 172]]); s.node([178, 172]);
  s.text([220, 158], "VB", { anchor: "middle", cls: "sm" });
  /* input */
  const f1 = G.in.net([96, 172], { left: true, w: 40 }); G.in.text(f1, "vin", { anchor: "middle", cls: "sm" });
  G.in.wire([[96, 172], [108, 172]]); G.in.wire([[148, 172], [178, 172]]);
  cap1.cap([148, 172], [108, 172], { pol: true }); sh1.wire([[108, 172], [148, 172]]);
  G.in.text([128, 142], "C1", { anchor: "middle" });
  /* transistor and collector */
  const q = s.bjt([262, 172]);
  s.text([306, 160], "Q1"); s.text([306, 178], v.part === false ? "" : "2N3904", { cls: "sm" });
  G.rc.res([282, 24], [282, 112]);
  const rcg = G.rc.group(); rcg.path("M282 24V14M269 14H295L282 2Z");
  const rct = s.group(); rct.text([298, 60], "R3"); t.R3 = rct.text([298, 78], v.R3 || "", { cls: "sm" });
  s.wire([[282, 112], q.C]); s.node([282, 112]);
  s.text([268, 100], "VC", { anchor: "end", cls: "sm" });
  /* output */
  G.out.wire([[282, 112], [312, 112]]); G.out.wire([[352, 112], [388, 112]]);
  cap2.cap([312, 112], [352, 112], { pol: true }); sh2.wire([[312, 112], [352, 112]]);
  G.out.text([332, 146], "C2", { anchor: "middle" });
  G.out.node([388, 112]); G.out.res([388, 112], [388, 330]); G.out.gnd([388, 330]);
  G.out.text([404, 232], "Rl"); t.RL = G.out.text([404, 250], v.RL || "", { cls: "sm" });
  const fl = G.out.group(); fl.wire([[388, 112], [410, 112]]); const f2 = fl.net([410, 112], { w: 40 }); fl.text(f2, "Vout", { anchor: "middle", cls: "sm" });
  const stub = s.group(); stub.wire([[388, 112], [444, 112]]);
  /* emitter: re, then R4 with C3 across R4 only */
  s.wire([q.E, [282, 218]]); s.node([282, 218]);
  s.text([294, 214], "VE", { cls: "sm" });
  G.sw.res([282, 218], [282, 272]);
  G.sw.text([268, 236], "re", { anchor: "end" }); t.re = G.sw.text([268, 254], v.re || "", { anchor: "end", cls: "sm" });
  s.node([282, 272]);
  G.r4.res([282, 272], [282, 330]);
  G.r4.text([268, 294], "R4", { anchor: "end" }); t.R4 = G.r4.text([268, 312], v.R4 || "", { anchor: "end", cls: "sm" });
  G.by.wire([[282, 272], [336, 272]]); G.by.wire([[336, 330], [282, 330]]);
  cap3.cap([336, 272], [336, 330], { pol: true, plus: -1 }); sh3.wire([[336, 272], [336, 330]]);
  G.by.text([354, 302], "C3");
  s.wire([[178, 330], [282, 330]]); s.node([282, 330]); s.gnd([282, 330]);
  const op = (n, a) => { G[n].g.style.opacity = (+a).toFixed(3); };
  const short = m => { for (const [c, w] of [[cap1, sh1], [cap2, sh2], [cap3, sh3]]) { c.g.style.opacity = (1 - m).toFixed(3); w.g.style.opacity = m.toFixed(3); } };
  const fold = f => {
    G.rc.g.setAttribute("transform", `translate(${(162 * f).toFixed(2)} 0) rotate(${(180 * f).toFixed(2)} 282 112)`);
    rct.g.setAttribute("transform", `translate(${(162 * f).toFixed(2)} ${(100 * f).toFixed(2)})`);
    railR.g.style.opacity = (1 - f).toFixed(3); rcg.g.style.opacity = f > .02 ? "1" : "0"; stub.g.style.opacity = f.toFixed(3); fl.g.style.opacity = (1 - f).toFixed(3);
  };
  op("acg", 0); short(0); fold(0);
  const E3 = [[282, 151], [262, 165], [262, 179], [282, 193]];          // the path through the transistor, collector to emitter
  return { op, short, fold, t, q,
    at: { Vcc: [46, 92], R1: [178, 98], R2: [178, 251], R3: [282, 68], re: [282, 245], R4: [282, 301], RL: [388, 221], C1: [128, 172], C2: [332, 112], C3: [336, 301],
          B: [262, 172], Q: [282, 172], C: [282, 112], E: [282, 218], N: [282, 272], BE: [272, 193], rail: [178, 24], foldR3: [444, 156], G: [282, 330] },
    f: { c: [src.top, [46, 24], [282, 24], ...E3, [282, 330]],
         e: [[282, 193], [282, 330]],
         div: [[178, 24], [178, 330]],
         sig: [[84, 172], [262, 172]],
         out: [[282, 112], [388, 112], [388, 330]],
         by: [[282, 272], [336, 272], [336, 330]],
         eAC: [[282, 193], [282, 272], [336, 272], [336, 330]],
         acc: [[444, 112], [282, 112], ...E3, [282, 272], [336, 272], [336, 330]] },
    loops: { div: [[178, 24], [178, 330]], be: [[178, 172], [262, 172], [262, 179], [282, 193], [282, 218]], e: [[282, 193], [282, 330]],
             eAC: [[262, 172], [262, 179], [282, 193], [282, 272], [336, 272], [336, 330]] } };
}

/* The Problem 2 LTspice circuit (the homework's Figure 2). Groups fade with op(name, a): src, rin, b1, rc, out, sine, tran, name.
   flipR(on) and flipB(on) draw Rin or B1 upside down, which flips the sign LTspice gives their current. */
function drawPi(s, v = {}) {
  const G = {}, t = {};
  for (const n of ["src", "rin", "b1", "rc", "out", "sine", "tran", "name", "iarr"]) G[n] = s.group();
  const xs = 62, xr = 162, xb = 282, xc = 410, T = 90, B = 290;
  const vs = G.src.vac([xs, 190]); G.src.wire([vs.top, [xs, T]]); G.src.wire([vs.bot, [xs, B]]); G.src.node([xs, B]); G.src.gnd([xs, B]);
  G.src.text([88, 182], "Vin");
  G.rin.wire([[xs, T], [xr, T]]); G.rin.res([xr, T], [xr, B]); G.rin.wire([[xs, B], [xr, B]]);
  G.rin.text([112, T - 14], "Vin", { anchor: "middle", cls: "sm" });
  G.rin.text([178, 176], "Rin"); t.Rin = G.rin.text([178, 194], v.Rin || "", { cls: "sm" });
  const ia = G.iarr.group(); ia.g.setAttribute("style", "--c:var(--t1)");
  ia.wire([[136, 150], [136, 196]], "w tint thin"); ia.head([136, 206], [136, 150], 9, "head tint");
  G.iarr.text([136, 226], "I(Rin) +", { anchor: "middle", cls: "sm", c: "t1" });
  G.b1.wire([[xr, B], [xb, B]]); G.b1.node([xr, B]);
  const b = G.b1.isrc([xb, 190], { dep: !!v.dep }); G.b1.wire([[xb, T], b.top]); G.b1.wire([b.bot, [xb, B]]);
  G.b1.text([312, 190], "B1"); t.expr = G.b1.text([292, 124], v.expr || "", { cls: "sm" });
  G.rc.wire([[xb, T], [xc, T]]); G.rc.res([xc, T], [xc, B]); G.rc.wire([[xb, B], [xc, B]]); G.rc.node([xb, B]); G.rc.node([xb, T]);
  G.rc.text([426, 176], "rc"); t.rc = G.rc.text([426, 194], v.rc || "", { cls: "sm" });
  G.out.wire([[xc, T], [424, T]]); G.out.node([xc, T]); const f = G.out.net([424, T], { w: 40 }); G.out.text(f, "Vout", { anchor: "middle", cls: "sm" });
  t.sine = G.sine.text([24, 334], v.sine || "SINE(0 1mV 1kHz)", { cls: "sm", c: "ink" });
  G.tran.text([184, 334], ".tran 2ms", { cls: "sm", c: "ink" });
  t.name = G.name.text([300, 334], v.name || "your name", { c: "cursor" });
  const op = (n, a) => { G[n].g.style.opacity = (+a).toFixed(3); };
  const flipR = on => ia.g.setAttribute("transform", on ? "rotate(180 136 178)" : "");
  return { op, t, flipR, flipB: b.flip,
    at: { src: [xs, 190], Rin: [xr, 190], B1: [xb, 190], rc: [xc, 190], vin: [112, T], vout: [xc, T], arrow: [136, 178], name: [340, 334], sine: [80, 334], tran: [220, 334], expr: [340, 124] },
    f: { in: [vs.top, [xs, T], [xr, T], [xr, B], [xs, B], vs.bot],
         out: [[xb, T], [xb, B], [xc, B], [xc, T], [xb, T]] } };
}
