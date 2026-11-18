/* Shared by page.js and the scenes: number formatting and the homework's four circuits.
   Each draw function returns { op(group, 0..1), short(0..1), at: label anchors, f: flow paths }. */
const VT25 = 0.025;                                           // the course's thermal voltage, 25 mV
const par = (...r) => 1 / r.reduce((s, x) => s + 1 / x, 0);
function eng(v, u, d = 3) {                                   // 0.0193 -> "19.3 mA"
  const a = Math.abs(v); if (!isFinite(v)) return "∞ " + u;
  if (a === 0) return "0 " + u;
  const [k, p] = a >= 1e6 ? [1e-6, "M"] : a >= 1e3 ? [1e-3, "k"] : a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : a >= 1e-6 ? [1e6, "µ"] : [1e9, "n"];
  return (v < 0 ? "−" : "") + (+(a * k).toPrecision(d)) + " " + p + u;
}
/* the path a current takes through an npn drawn with s.bjt(B): collector pin, bar, emitter pin */
const thruQ = B => [[B[0] + 20, B[1] - 36], [B[0] + 20, B[1] - 21], [B[0], B[1] - 7], [B[0], B[1] + 7], [B[0] + 20, B[1] + 21], [B[0] + 20, B[1] + 36]];
const baseQ = B => [[B[0], B[1]], [B[0], B[1] + 7], [B[0] + 20, B[1] + 21], [B[0] + 20, B[1] + 36]];
function groups(s, names) { const G = {}; for (const n of names) G[n] = s.group(); return G; }
const opOf = G => (n, a) => { G[n].g.style.opacity = (+a).toFixed(3); };
/* a capacitor that can turn into a wire: draws both, returns m => crossfade (1 = wire) */
function capSwap(G, a, b, o = {}) {
  const c = G.group(), w = G.group(); c.cap(a, b, { pol: true, ...o }); w.wire([a, b]);
  return m => { c.g.style.opacity = (1 - m).toFixed(3); w.g.style.opacity = m.toFixed(3); };
}

/* Problem 1: the emitter follower. v = { Vcc, vin, RE, RL, beta } labels */
function drawFollower(s, v = {}) {
  const G = groups(s, ["src", "acg", "in", "re", "load", "out", "c1"]), B = [200, 170], E = [220, 206], nE = [220, 236], xL = 352, yB = 330;
  G.src.wire([[220, 52], [160, 52]]); const fl = G.src.net([160, 52], { left: true, w: 46 }); G.src.text(fl, v.Vcc || "15 V", { anchor: "middle", cls: "sm" });
  G.acg.wire([[220, 52], [160, 52]]); G.acg.gnd([160, 52]); G.acg.text([150, 34], "AC ground", { anchor: "middle", cls: "sm" });
  const q = s.bjt(B); s.wire([q.C, [220, 52]]);
  s.text([246, 160], "Q1"); s.text([246, 178], v.beta || "β = 110", { cls: "sm" });
  G.in.wire([[96, 170], B]); const fi = G.in.net([96, 170], { left: true, w: 40 }); G.in.text(fi, "Vin", { anchor: "middle", cls: "sm" });
  G.in.text([62, 200], v.vin || "6.1 V dc", { anchor: "middle", cls: "sm" });
  s.wire([E, nE]); s.node(nE); s.text([232, 222], "VE", { cls: "sm" });
  G.re.res(nE, [220, yB]); G.re.gnd([220, yB]);
  G.re.text([204, 276], "RE", { anchor: "end" }); G.re.text([204, 294], v.RE || "2.7 kΩ", { anchor: "end", cls: "sm" });
  s.wire([nE, [262, 236]]); const sw = capSwap(G.c1, [262, 236], [302, 236]); G.c1.text([282, 206], "C1", { anchor: "middle" });
  G.load.wire([[302, 236], [xL, 236]]); G.load.node([xL, 236]); G.load.res([xL, 236], [xL, yB]); G.load.gnd([xL, yB]);
  G.load.text([368, 276], "RL"); G.load.text([368, 294], v.RL || "360 Ω", { cls: "sm" });
  G.out.wire([[xL, 236], [376, 236]]); const fo = G.out.net([376, 236], { w: 40 }); G.out.text(fo, "Vout", { anchor: "middle", cls: "sm" });
  const op = opOf(G); op("acg", 0); sw(0);
  return { op, short: sw, q,
    at: { B, E: nE, RE: [220, 283], RL: [xL, 283], C1: [282, 236], rail: [190, 52], in: [74, 170], out: [398, 236], Q: [210, 170], BE: [210, 190] },
    f: { dc: [[160, 52], [220, 52], ...thruQ(B), nE, [220, yB]],
         re: [nE, [220, yB]], rl: [nE, [xL, 236], [xL, yB]], sig: [[96, 170], B], base: [[96, 170], ...baseQ(B), nE],
         ie: [[200, 177], [220, 191], [220, 206], nE] } };
}

/* Problem 2: the cascade, Q1 (common emitter) feeding Q2 (follower). Groups: q1 (the whole first stage), src, acg, c2, re2, load, out */
function drawCascade(s, v = {}) {
  const G = groups(s, ["q1", "src", "acg", "re2", "load", "out", "c2", "c13"]), yR = 30, yB = 318, B1 = [160, 170], B2 = [262, 100], nC = [180, 100], nE2 = [282, 170], xL = 384;
  /* rail */
  s.wire([[112, yR], [282, yR]]); G.src.wire([[112, yR], [86, yR]]); const fr = G.src.net([86, yR], { left: true, w: 44 }); G.src.text(fr, v.Vcc || "10 V", { anchor: "middle", cls: "sm" });
  G.acg.wire([[112, yR], [92, yR]]); G.acg.gnd([92, yR]); G.acg.text([60, 44], "AC gnd", { anchor: "middle", cls: "sm" });
  /* first stage */
  const g = G.q1;
  g.node([112, yR]); g.res([112, yR], [112, 170]); g.res([112, 170], [112, yB]); g.gnd([112, yB]); g.node([112, 170]);
  g.text([96, 92], "R1", { anchor: "end" }); g.text([96, 110], "4.7 kΩ", { anchor: "end", cls: "sm" });
  g.text([96, 236], "R2", { anchor: "end" }); g.text([96, 254], "1 kΩ", { anchor: "end", cls: "sm" });
  g.node([40, 170]); g.text([40, 152], "vin", { anchor: "middle", cls: "sm" });
  const swIn = capSwap(G.c13, [92, 170], [60, 170]); g.wire([[40, 170], [60, 170]]); g.wire([[92, 170], [112, 170]]); g.text([76, 144], "C1", { anchor: "middle", cls: "sm" });
  g.wire([[112, 170], B1]); const q1 = g.bjt(B1); g.text([186, 160], "Q1", { cls: "sm" });
  g.node([180, yR]); g.res([180, yR], nC); g.text([196, 52], "RC", { cls: "sm" }); g.text([196, 68], "3.9 kΩ", { cls: "sm" });
  g.wire([nC, q1.C]); g.wire([q1.E, [180, 236]]); g.node([180, 236]);
  g.res([180, 236], [180, yB]); g.gnd([180, yB]); g.text([164, 270], "RE1", { anchor: "end", cls: "sm" }); g.text([164, 286], "1 kΩ", { anchor: "end", cls: "sm" });
  g.wire([[180, 236], [214, 236]]); g.wire([[214, yB], [180, yB]]);
  const swBy = capSwap(G.c13, [214, 236], [214, yB], { plus: -1 }); g.text([228, 280], "C3", { cls: "sm" });
  s.node(nC); s.text([168, 88], "VC1", { anchor: "end", cls: "sm" });
  /* second stage */
  s.wire([nC, B2]); const q2 = s.bjt(B2); s.wire([q2.C, [282, yR]]); s.node([282, yR]);
  s.text([306, 92], "Q2"); s.wire([q2.E, nE2]); s.node(nE2); s.text([270, 158], "VE2", { anchor: "end", cls: "sm" });
  G.re2.res(nE2, [282, yB]); G.re2.gnd([282, yB]); G.re2.text([298, 236], "RE2"); G.re2.text([298, 254], v.RE2 || "1.5 kΩ", { cls: "sm" });
  s.wire([nE2, [302, 170]]); const sw2 = capSwap(G.c2, [302, 170], [338, 170]); G.c2.text([320, 140], "C2", { anchor: "middle" });
  G.load.wire([[338, 170], [xL, 170]]); G.load.node([xL, 170]); G.load.res([xL, 170], [xL, yB]); G.load.gnd([xL, yB]);
  G.load.text([400, 236], "RL"); G.load.text([400, 254], v.RL || "150 Ω", { cls: "sm" });
  G.out.wire([[xL, 170], [404, 170]]); const fo = G.out.net([404, 170], { w: 40 }); G.out.text(fo, "Vout", { anchor: "middle", cls: "sm" });
  const op = opOf(G); op("acg", 0);
  const short = m => { swIn(m); swBy(m); sw2(m); };
  short(0);
  return { op, short,
    at: { B1, C1: nC, B2, E2: nE2, RE2: [282, 244], RL: [xL, 244], C2: [320, 170], Q1: [170, 170], Q2: [272, 100], rail: [200, yR], out: [426, 170] },
    f: { dc2: [[200, yR], [282, yR], ...thruQ(B2), nE2, [282, yB]], re2: [nE2, [282, yB]], rl: [nE2, [xL, 170], [xL, yB]],
         link: [nC, B2], sig1: [[40, 170], [112, 170], B1], acc: [[180, yR], nC, ...thruQ(B1).slice(1), [180, 236], [214, 236], [214, yB]] } };
}

/* Problem 3: the Darlington pair. Groups: src (Vin), rail */
function drawDarl(s, v = {}) {
  const yR = 30, B1 = [150, 120], B2 = [250, 196], nO = [270, 256], yB = 330;
  s.wire([[120, yR], [270, yR]]); const fr = s.net([120, yR], { left: true, w: 46 }); s.text(fr, v.Vcc || "12 V", { anchor: "middle", cls: "sm" });
  s.node([170, yR]);
  const q1 = s.bjt(B1), q2 = s.bjt(B2); s.wire([q1.C, [170, yR]]); s.wire([q2.C, [270, yR]]);
  s.text([194, 110], "Q1"); s.text([194, 128], v.b1 || "β = 120", { cls: "sm" });
  s.text([294, 186], "Q2"); s.text([294, 204], v.b2 || "β = 120", { cls: "sm" });
  const vs = s.vsrc([70, 196]); s.wire([vs.top, [70, 120], B1]); s.gnd(vs.bot);
  s.text([44, 188], "Vin", { anchor: "end" }); s.text([44, 206], v.vin || "8 V", { anchor: "end", cls: "sm" });
  s.wire([q1.E, [170, 196], B2]); s.node([170, 196]);
  s.wire([q2.E, nO]); s.node(nO); s.res(nO, [270, yB]); s.gnd([270, yB]);
  s.text([286, 284], "Rload"); s.text([286, 302], v.RL || "10 Ω", { cls: "sm" });
  s.wire([nO, [300, 256]]); const fo = s.net([300, 256], { w: 40 }); s.text(fo, "Vout", { anchor: "middle", cls: "sm" });
  return { at: { B1, B2, E1: [170, 156], E2: [270, 232], out: nO, RL: [270, 293], src: [70, 196], rail: [220, yR], hand: [210, 196] },
    f: { in: [vs.top, [70, 120], ...baseQ(B1)], c1: [[120, yR], [170, yR], ...thruQ(B1)], hand: [[170, 156], [170, 196], ...baseQ(B2)],
         c2: [[170, yR], [270, yR], ...thruQ(B2), nO, [270, yB]], load: [nO, [270, yB]] } };
}

/* Problem 4: the regulator. Groups: fb (R1, R2 and the sense wire) */
function drawReg(s, v = {}) {
  const G = groups(s, ["fb", "ref"]), yR = 30, B1 = [190, 120], B2 = [270, 190], nO = [290, 256], xS = 50, yB = 330;
  const u = s.opamp([80, 120]); s.text([116, 120], "U1", { anchor: "middle", cls: "sm" });
  G.ref.wire([[64, u.P[1]], u.P]); const fr = G.ref.net([64, u.P[1]], { left: true, w: v.refW || 36 }), tRef = G.ref.text(fr, v.ref || "4.0 V", { anchor: "middle", cls: "sm" });
  s.wire([[150, yR], [290, yR]]); const fs = s.net([150, yR], { left: true, w: 46 }); s.text(fs, v.Vcc || "12 V", { anchor: "middle", cls: "sm" }); s.node([210, yR]);
  s.wire([u.O, B1]); const q1 = s.bjt(B1), q2 = s.bjt(B2); s.wire([q1.C, [210, yR]]); s.wire([q2.C, [290, yR]]);
  s.text([234, 110], "Q1"); s.text([234, 128], v.b1 || "β = 80", { cls: "sm" });
  s.text([314, 180], "Q2"); s.text([314, 198], v.b2 || "β = 110", { cls: "sm" });
  s.wire([q1.E, [210, 190], B2]); s.node([210, 190]);
  s.wire([q2.E, nO]); s.node(nO); s.res(nO, [290, yB]); s.gnd([290, yB]);
  s.text([306, 284], "Rload"); const tRL = s.text([306, 302], v.RL || "10 Ω", { cls: "sm" });
  s.wire([nO, [320, 256]]); const fo = s.net([320, 256], { w: 40 }); s.text(fo, "Vout", { anchor: "middle", cls: "sm" });
  const f = G.fb; f.wire([u.N, [xS, u.N[1]], [xS, 256]]); f.node([xS, 256]); f.wire([[xS, 256], [124, 256]]); f.res([124, 256], [220, 256]); f.wire([[220, 256], nO]);
  f.text([172, 234], "R1"); const tR1 = f.text([196, 234], v.R1 || "10 kΩ", { cls: "sm" });
  f.res([xS, 256], [xS, yB]); f.gnd([xS, yB]); f.text([66, 284], "R2"); f.text([66, 302], v.R2 || "20 kΩ", { cls: "sm" });
  return { op: opOf(G), u, t: { ref: tRef, R1: tR1, RL: tRL },
    at: { P: u.P, N: u.N, O: u.O, B1, B2, out: nO, S: [xS, 256], R1: [172, 256], R2: [xS, 293], RL: [290, 293], E1: [210, 156], rail: [250, yR], U: [110, 120] },
    f: { drive: [u.O, ...baseQ(B1)], hand: [[210, 156], [210, 190], ...baseQ(B2)], c1: [[150, yR], [210, yR], ...thruQ(B1)],
         c2: [[210, yR], [290, yR], ...thruQ(B2), nO], load: [nO, [290, yB]], div: [nO, [220, 256], [124, 256], [xS, 256], [xS, yB]],
         sense: [nO, [xS, 256], [xS, u.N[1]], u.N] } };
}
