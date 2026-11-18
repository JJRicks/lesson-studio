/* ---------- Problem 2: the cascade. Q1 is given (VC1 and its gain), so most steps fade it back and work on Q2 ---------- */
const fadeQ1 = (h, a) => { h.op("q1", a); h.op("c13", a); };

S.p2a = {
  ...BOX,
  P: { m: 0 },
  build(k) {
    const h = k.h = drawCascade(k.sch);
    k.flow("fre", h.f.re2, { c: "cursor", gap: 18 }); k.flow("frl", h.f.rl, { c: "cursor", gap: 18 });
    SC.ring(k, "rgE", h.at.E2, 16, 16, "good");
    SC.lines(k, "ac", 494, 20, 276, "the AC view", ["Capacitors become wires.", "The 10 V supply becomes ground.", "Part a only needs Q2's emitter,", "so the first stage fades back."], { lh: 22 });
    SC.lines(k, "paths", 494, 20, 276, "from Q2's emitter to ground", ["1 · straight down through RE2", "2 · across C2, then down RL", "Same start, same end:", "they're in parallel."], { lh: 22 });
    SC.box(k, "rule", 160, 92, "combine a parallel pair");
    k.label("Lf", [CX, 214], tx`r_{e2} = (1500)(150)/(1500 + 150)\ \Omega`, { c: "accent", line: false });
    k.label("La", [CX, 214], tx`r_{e2} = 136.4\ \Omega`, { c: "good", line: false });
  },
  update(P, k, t) { const h = k.h; viewAC(h, P.m); fadeQ1(h, 1 - .72 * P.m); const v = wob(t); k.o.fre.speed = v * .09; k.o.frl.speed = v; },
  steps: [
    { cap: tx`For AC, the capacitors become wires and the 10 V supply becomes ground. Part a only needs Q2's emitter.`, set: { m: 1 }, add: "ac", dur: 1.4 },
    { cap: tx`From Q2's emitter, the signal can go straight down RE2, or across C2 and down RL.`, drop: "ac", add: "fre frl rgE paths" },
    { cap: tx`Both paths run from the same node to ground, so they're in parallel. Multiply, then divide by the sum.`, drop: "rgE", add: "rule Lf" },
    { cap: tx`\(r_{e2}\) = (1500)(150) / 1650 = 136.4 Ω, a little under the 150 Ω load.`, drop: "Lf", add: "La" }
  ]
};

S.p2b = {
  ...BOX,
  P: { dc: 0 },
  build(k) {
    const h = k.h = drawCascade(k.sch);
    k.flow("fdc", h.f.dc2, { c: "t3" });
    SC.ring(k, "rgL", [222, 100], 44, 14, "cursor");
    k.label("Lvc", [222, 100], tx`V_{C1} = 5.9\text{ V}`, { c: "cursor", dx: 0, dy: 34 });
    SC.lines(k, "dcr", 494, 20, 276, "the DC view", ["C2 is open, so RL carries no DC.", "A plain wire joins Q1's collector", "to Q2's base: same voltage.", "So Q2's base sits at 5.9 V."], { lh: 22 });
    SC.levels(k, "lev", 20, 150, "Q2's two voltages", [{ t: "base · VC1 = 5.9 V", v: 5.9 }, { t: "emitter · VE2", v: 5.2 }], ["0.7 V"]);
    k.label("Lve", h.at.E2, tx`V_{E2} = 5.9 - 0.7 = 5.2\text{ V}`, { c: "cursor", dx: 130, dy: -100 });
    SC.box(k, "cur", 182, 70, "Ohm's law on RE2");
    k.label("Lie", [CX, 226], tx`I_{E2} = 5.2\text{ V}/1500\ \Omega = 3.467\text{ mA}`, { c: "t3", line: false });
    SC.box(k, "rule", 264, 84, "the junction's AC resistance");
    k.label("Lr", [CX, 312], tx`r_{e2}' = 25\text{ mV}/I_{E2}`, { c: "accent", line: false });
    k.label("La", [CX, 312], tx`r_{e2}' = 7.212\ \Omega`, { c: "good", line: false });
  },
  update(P, k) { const h = k.h, a = 1 - .8 * P.dc; h.op("load", a); h.op("out", a); fadeQ1(h, 1 - .5 * P.dc); k.o.fdc.speed = 40; },
  steps: [
    { cap: tx`At DC, C2 is open and RL drops out. A plain wire joins Q1's collector to Q2's base, so the base sits at \(V_{C1}\) = 5.9 V.`, set: { dc: 1 }, add: "dcr rgL Lvc", dur: 1.3 },
    { cap: tx`Q2's base-emitter junction is on, so its emitter sits 0.7 V lower.`, drop: "dcr rgL", add: "lev Lve" },
    { cap: tx`With C2 open, all of Q2's emitter current goes down RE2. Ohm's law gives it.`, add: "fdc cur Lie" },
    { cap: tx`Divide 25 mV by that current. Keep all the digits of \(I_{E2}\).`, add: "rule Lr" },
    { cap: tx`\(I_{E2}\) = 3.467 mA, so \(r_{e2}'\) = 25 mV / 3.467 mA = 7.212 Ω.`, drop: "Lr", add: "La" }
  ]
};

S.p2c = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawCascade(k.sch);
    k.flow("fl", h.f.link, { c: "cursor", gap: 18 }); k.flow("fre", h.f.re2, { c: "t3", gap: 18 }); k.flow("frl", h.f.rl, { c: "t3", gap: 18 });
    k.alias("fsig", "fre frl");
    SC.ring(k, "rgB", h.at.B2, 18, 22);
    k.label("Lin", [222, 100], tx`\text{from Q1}`, { c: "cursor", dx: 0, dy: 34 });
    SC.split(k, "bar", 20, 7.212, 136.4, "r′e2", "re2");
    SC.lines(k, "fol", 494, 144, 276, "Q2 is a follower", ["Signal in at the base,", "out at the emitter.", "Same math as Problem 1d."], { lh: 22 });
    SC.box(k, "rule", 262, 86, "use your parts a and b");
    k.label("Lf", [CX, 310], tx`A_{V,CC} = r_{e2}/(r_{e2} + r_{e2}')`, { c: "accent", line: false });
    k.label("La", [CX, 310], tx`A_{V,CC} = 0.9498`, { c: "good", line: false });
  },
  update(P, k, t) { const h = k.h; viewAC(h, 1); fadeQ1(h, .28); const v = wob(t); k.o.fl.speed = v * .3; k.o.fre.speed = v * .09; k.o.frl.speed = v; },
  steps: [
    { cap: tx`The amplified signal leaves Q1's collector and arrives at Q2's base.`, add: "fl rgB Lin" },
    { cap: tx`Q2 is a follower. Its signal current flows through \(r_{e2}'\) and then \(r_{e2}\), so the base wiggle splits between them.`, drop: "rgB Lin", add: "fsig bar fol" },
    { cap: tx`The output is the \(r_{e2}\) share. Use your answers from parts a and b.`, add: "rule Lf" },
    { cap: tx`\(A_{V,CC}\) = 136.4 / (136.4 + 7.212) = 0.9498. Q2 keeps about 95% of the wave and keeps its sign.`, drop: "Lf", add: "La" }
  ]
};

S.p2d = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawCascade(k.sch);
    k.flow("fs", h.f.sig1, { c: "cursor", gap: 18 }); k.flow("fc", h.f.acc, { c: "t3", gap: 18 });
    k.flow("fl", h.f.link, { c: "t3", gap: 18 }); k.flow("fo", h.f.rl, { c: "good", gap: 18 });
    k.w1 = SC.strip(k, "s1", 20, 76, "vin at Q1's base (not to scale)");
    k.w2 = SC.strip(k, "s2", 104, 96, "at Q1's collector: ×(−144)");
    k.w3 = SC.strip(k, "s3", 208, 96, "at the load: ×AV,CC");
    for (const n of ["p1", "p2", "p3"]) k.plot(n, { c: n === "p1" ? "cursor" : n === "p2" ? "t3" : "good", side: true });
    k.alias("st1", "s1 p1 s2 p2 fs fc"); k.alias("st2", "s3 p3 fl fo");
    SC.box(k, "rule", 312, 46, "");
    k.label("Lf", [CX, 335], tx`A_{V,total} = A_{V,CE} \cdot A_{V,CC}`, { c: "accent", line: false });
    k.label("La", [CX, 335], tx`A_{V,total} = -136.8`, { c: "good", line: false });
  },
  update(P, k, t) {
    const h = k.h; viewAC(h, 1); fadeQ1(h, 1);
    const v = wob(t); k.o.fs.speed = v * .3; k.o.fc.speed = -v; k.o.fl.speed = -v * .3; k.o.fo.speed = -v;
    k.o.p1.set(SC.wave(508, 758, k.w1.y, 6, t)); k.o.p2.set(SC.wave(508, 758, k.w2.y, -k.w2.a, t)); k.o.p3.set(SC.wave(508, 758, k.w3.y, -k.w3.a * .95, t));
  },
  steps: [
    { cap: tx`Q1 multiplies the input by −144. The wave at its collector is 144 times bigger and upside down.`, add: "st1" },
    { cap: tx`Q2 passes that wave on to the load a little smaller, and the same way up as it arrived.`, add: "st2" },
    { cap: tx`Chain the two ratios. The voltage at \(V_{C1}\) cancels, so the gains multiply. Only Q1 flips the sign.`, add: "rule Lf" },
    { cap: tx`\(A_{V,total}\) = (−144)(0.9498) = −136.8. Its size, 136.8, sits inside the hint's 132 to 142.`, drop: "Lf", add: "La" }
  ]
};
