/* Shared by page.js and the scenes: the simplified-analysis formulas (a port of verify.py) and the homework's three circuits. */
const VT25 = 0.025;                                           // the course's thermal voltage, 25 mV
const TWO_PI = 2 * Math.PI;
const par = (a, b) => a * b / (a + b);
const xcOf = (f, C) => 1 / (TWO_PI * f * C);
function solveAmp(a) {                                        // simplified VDB common-emitter analysis
  const VB = a.Vcc * a.R2 / (a.R1 + a.R2), VE = VB - 0.7, IE = VE / a.RE, VC = a.Vcc - IE * a.RC, rc = par(a.RC, a.RL), re = VT25 / IE;
  return { VB, VE, IE, VC, VCE: VC - VE, rc, re, AV: -rc / re };
}
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
function nextUpE12(v) {                                       // the smallest standard 10% value at or above v
  const d = Math.pow(10, Math.floor(Math.log10(v) + 1e-9)) / 10;
  for (const k of [d, d * 10]) for (const m of E12) if (m * k >= v * (1 - 1e-9)) return +(m * k).toPrecision(3);
  return +(100 * d).toPrecision(3);
}
function eng(v, u, d = 3) {                                   // 0.0193 -> "19.3 mA"
  const a = Math.abs(v); if (!isFinite(v)) return "∞ " + u;
  if (a === 0) return "0 " + u;
  const [k, p] = a >= 1e6 ? [1e-6, "M"] : a >= 1e3 ? [1e-3, "k"] : a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : a >= 1e-6 ? [1e6, "µ"] : a >= 1e-9 ? [1e9, "n"] : [1e12, "p"];
  return (v < 0 ? "−" : "") + (+(a * k).toPrecision(d)) + " " + p + u;
}
const fmtOhm = r => eng(r, "Ω");

/* The Problem 1 circuit. set(m, f): m takes Vcc to AC ground, f folds R1 down next to R2. */
function drawCoupling(s, v = {}) {
  const A = [300, 196], R1top = [300, 74], t = {};
  const rail = s.group(), src = rail.vsrc([70, 118]); rail.gnd(src.bot); rail.wire([src.top, [70, 40], [300, 40], R1top]);
  rail.text([98, 108], "Vcc"); t.Vcc = rail.text([98, 126], v.Vcc || "", { cls: "sm" });
  const r1 = s.group(); r1.res(R1top, A);
  const r1g = r1.group(); r1g.path("M300 74V64M287 64H313L300 52Z");
  const r1t = s.group(); r1t.text([316, 128], "R1"); t.R1 = r1t.text([316, 146], v.R1 || "", { cls: "sm" });
  s.res(A, [300, 318]); s.gnd([300, 318]);
  s.text([316, 250], "R2"); t.R2 = s.text([316, 268], v.R2 || "", { cls: "sm" });
  const vi = s.vac([70, 286]); s.gnd(vi.bot); s.wire([vi.top, [70, 196], [160, 196]]);
  s.cap([160, 196], [204, 196]); s.wire([[204, 196], A]); s.node(A);
  s.text([98, 280], "Vin"); s.text([182, 164], "C1", { anchor: "middle" }); t.C1 = s.text([182, 232], v.C1 || "", { anchor: "middle", cls: "sm" });
  const stub = s.group(); stub.wire([A, [372, 196]]);
  const fl = s.group(); fl.wire([A, [340, 196]]); const lab = fl.net([340, 196], { w: 32 }); fl.text(lab, "Va", { anchor: "middle", cls: "sm" });
  const set = (m, f) => {
    rail.g.style.opacity = (1 - m).toFixed(3); r1g.g.style.opacity = m.toFixed(3); stub.g.style.opacity = f.toFixed(3); fl.g.style.opacity = (1 - f).toFixed(3);
    r1.g.setAttribute("transform", `translate(${(72 * f).toFixed(2)} 0) rotate(${(180 * f).toFixed(2)} 300 196)`);
    r1t.g.setAttribute("transform", `translate(${(72 * f).toFixed(2)} ${(122 * f).toFixed(2)})`);
  };
  set(0, 0);
  return { set, t, at: { C1: [182, 196], A, R1: [300, 135], R2: [300, 257], Vcc: [70, 118], fold: [372, 257], top: [300, 74] },
    fa: [vi.top, [70, 196], A, [300, 318]], fa2: [A, [372, 196], [372, 318]], fd: [src.top, [70, 40], [300, 40], [300, 318]] };
}

/* The Problem 2 circuit. */
function drawBypass(s, v = {}) {
  const x = 230, f = s.net([70, 34], { w: 52 }); s.text(f, "Vcc", { anchor: "middle", cls: "sm" });
  s.wire([[134, 34], [x, 34]]); s.res([x, 34], [x, 118]); s.text([246, 72], "R3");
  s.node([x, 118]); s.wire([[x, 118], [262, 118]]); const c = s.net([262, 118], { w: 34 }); s.text(c, "VC", { anchor: "middle", cls: "sm" });
  const q = s.bjt([210, 190]); s.wire([q.C, [x, 118]]); s.text([254, 190], "Q1");
  const b = s.net([88, 190], { w: 40 }); s.text(b, "VB", { anchor: "middle", cls: "sm" }); s.wire([[140, 190], q.B]);
  const E = [x, 252], G = [x, 340];
  s.wire([q.E, E]); s.node(E); s.res(E, G); s.node(G); s.gnd(G);
  s.text([214, 288], "R4", { anchor: "end" }); s.text([214, 306], v.R4 || "", { anchor: "end", cls: "sm" });
  s.wire([E, [330, 252]]); s.cap([330, 252], [330, 340], { pol: true, plus: -1 }); s.wire([[330, 340], G]);
  s.text([352, 298], "C3");
  return { at: { R4: [x, 296], C3: [330, 296], E, G },
    fd: [[134, 34], [x, 34], [x, 169], [210, 183], [210, 197], [x, 211], G], fc: [E, [330, 252], [330, 340], G] };
}

/* The VDB common-emitter amplifier of Problem 3 (and, with other values, the live demos). Named groups can be faded with op(name, 0..1):
   src Vcc's source, acg its AC ground, in, out, by (C3), div, rc, re. short(m) turns each capacitor into a wire, fold(f) swings R3 down beside Rl. */
function drawAmp(s, v = {}) {
  const t = {}, G = {};
  const add = n => G[n] = s.group();
  add("div"); add("rc"); add("re"); add("by"); add("in"); add("out"); add("src"); add("acg");
  const cap1 = G.in.group(), sh1 = G.in.group(), cap2 = G.out.group(), sh2 = G.out.group(), cap3 = G.by.group(), sh3 = G.by.group();
  /* the rail, the supply */
  const src = G.src.vsrc([46, 100]); G.src.gnd(src.bot); G.src.wire([src.top, [46, 30]]);
  G.src.text([72, 92], "Vcc"); t.Vcc = G.src.text([72, 110], v.Vcc || "", { cls: "sm" });
  s.wire([[46, 30], [178, 30]]); const railR = s.group(); railR.wire([[178, 30], [282, 30]]); s.node([178, 30]);
  G.acg.gnd([46, 30]); G.acg.text([46, 72], "AC ground", { anchor: "middle", cls: "sm" });
  /* base divider */
  G.div.res([178, 30], [178, 190]); G.div.res([178, 190], [178, 338]);
  G.div.text([162, 100], "R1", { anchor: "end" }); t.R1 = G.div.text([162, 118], v.R1 || "", { anchor: "end", cls: "sm" });
  G.div.text([162, 258], "R2", { anchor: "end" }); t.R2 = G.div.text([162, 276], v.R2 || "", { anchor: "end", cls: "sm" });
  s.wire([[178, 190], [262, 190]]); s.node([178, 190]);
  s.text([220, 176], "VB", { anchor: "middle", cls: "sm" });
  /* input */
  const f1 = G.in.net([96, 190], { left: true, w: 40 }); G.in.text(f1, "vin", { anchor: "middle", cls: "sm" });
  G.in.wire([[96, 190], [108, 190]]); G.in.wire([[148, 190], [178, 190]]);
  cap1.cap([148, 190], [108, 190], { pol: true }); sh1.wire([[108, 190], [148, 190]]);
  G.in.text([128, 160], "C1", { anchor: "middle" });
  /* transistor and collector */
  const q = s.bjt([262, 190]);
  s.text([306, 178], "Q1"); s.text([306, 196], v.part === false ? "" : "2N3904", { cls: "sm" });
  G.rc.res([282, 30], [282, 124]);
  const rcg = G.rc.group(); rcg.path("M282 30V20M269 20H295L282 8Z");
  const rct = s.group(); rct.text([298, 68], "R3"); t.R3 = rct.text([298, 86], v.R3 || "", { cls: "sm" });
  s.wire([[282, 124], q.C]); s.node([282, 124]);
  s.text([268, 112], "VC", { anchor: "end", cls: "sm" });
  /* output */
  G.out.wire([[282, 124], [312, 124]]); G.out.wire([[352, 124], [388, 124]]);
  cap2.cap([312, 124], [352, 124], { pol: true }); sh2.wire([[312, 124], [352, 124]]);
  G.out.text([332, 158], "C2", { anchor: "middle" });
  G.out.node([388, 124]); G.out.res([388, 124], [388, 338]); G.out.gnd([388, 338]);
  G.out.text([404, 262], "Rl"); t.RL = G.out.text([404, 280], v.RL || "", { cls: "sm" });
  const fl = G.out.group(); fl.wire([[388, 124], [410, 124]]); const f2 = fl.net([410, 124], { w: 40 }); fl.text(f2, "Vout", { anchor: "middle", cls: "sm" });
  const stub = s.group(); stub.wire([[388, 124], [444, 124]]);
  /* emitter */
  s.wire([q.E, [282, 250]]); s.node([282, 250]);
  s.text([272, 244], "VE", { anchor: "end", cls: "sm" });
  G.re.res([282, 250], [282, 338]);
  G.re.text([268, 290], "R4", { anchor: "end" }); t.R4 = G.re.text([268, 308], v.R4 || "", { anchor: "end", cls: "sm" });
  G.by.wire([[282, 250], [336, 250]]); G.by.wire([[336, 338], [282, 338]]);
  cap3.cap([336, 250], [336, 338], { pol: true, plus: -1 }); sh3.wire([[336, 250], [336, 338]]);
  G.by.text([354, 296], "C3");
  s.wire([[178, 338], [282, 338]]); s.node([282, 338]); s.gnd([282, 338]);
  const op = (n, a) => { G[n].g.style.opacity = (+a).toFixed(3); };
  const short = m => { for (const [c, w] of [[cap1, sh1], [cap2, sh2], [cap3, sh3]]) { c.g.style.opacity = (1 - m).toFixed(3); w.g.style.opacity = m.toFixed(3); } };
  const fold = f => {
    G.rc.g.setAttribute("transform", `translate(${(162 * f).toFixed(2)} 0) rotate(${(180 * f).toFixed(2)} 282 124)`);
    rct.g.setAttribute("transform", `translate(${(162 * f).toFixed(2)} ${(97 * f).toFixed(2)})`);
    railR.g.style.opacity = (1 - f).toFixed(3); rcg.g.style.opacity = f > .02 ? "1" : "0"; stub.g.style.opacity = f.toFixed(3); fl.g.style.opacity = (1 - f).toFixed(3);
  };
  op("acg", 0); short(0); fold(0);
  return { op, short, fold, t, q,
    at: { Vcc: [46, 100], R1: [178, 110], R2: [178, 264], R3: [282, 77], R4: [282, 294], RL: [388, 231], C1: [128, 190], C2: [332, 124], C3: [336, 294], B: [262, 190], Q: [282, 190], C: [282, 124], E: [282, 250], BE: [272, 212], foldR3: [444, 171], rail: [178, 30] },
    f: { c: [[46, 81], [46, 30], [282, 30], [282, 169], [262, 183], [262, 197], [282, 211], [282, 338]],
         e: [[282, 211], [282, 338]],
         div: [[178, 30], [178, 338]],
         b: [[178, 190], [262, 190], [262, 197], [282, 211], [282, 250]],
         sig: [[84, 190], [262, 190]],
         out: [[282, 124], [388, 124], [388, 338]],
         by: [[282, 250], [336, 250], [336, 338]],
         acc: [[444, 124], [282, 124], [282, 169], [262, 183], [262, 197], [282, 211], [282, 250], [336, 250], [336, 338]] },
    loops: { div: [[178, 30], [178, 338]], be: [[178, 190], [262, 190], [262, 197], [282, 211], [282, 250]], e: [[282, 211], [282, 338]],
             sig: [[108, 190], [262, 190], [262, 197], [282, 211], [282, 250], [336, 250], [336, 338], [178, 338]] } };
}
