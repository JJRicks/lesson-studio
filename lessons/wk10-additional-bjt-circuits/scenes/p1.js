/* ---------- Problem 1: the emitter follower. a is the AC view, b the DC view, c and d follow the signal current ---------- */

S.p1a = {
  ...BOX,
  P: { m: 0 },
  build(k) {
    const h = k.h = drawFollower(k.sch);
    k.flow("fre", h.f.re, { c: "cursor", gap: 18 }); k.flow("frl", h.f.rl, { c: "cursor", gap: 18 });
    SC.ring(k, "rgE", h.at.E, 16, 16, "good");
    SC.lines(k, "ac", 494, 20, 276, "the AC rules", ["Capacitors become wires.", "DC supplies become ground,", "because their voltage never wiggles.", "What's left carries only the signal."], { lh: 22 });
    SC.lines(k, "paths", 494, 20, 276, "from the emitter to ground", ["1 · straight down through RE", "2 · across C1, then down RL", "Both start at the emitter and", "end at ground: they're in parallel."], { lh: 22 });
    SC.box(k, "rule", 160, 92, "combine a parallel pair");
    k.label("Lf", [CX, 214], tx`r_{e1} = (2700)(360)/(2700 + 360)\ \Omega`, { c: "accent", line: false });
    k.label("La", [CX, 214], tx`r_{e1} = 317.6\ \Omega`, { c: "good", line: false });
    SC.lines(k, "why", 494, 266, 276, "", ["Smaller than either path alone,", "as a parallel pair always is."], { lh: 22 });
  },
  update(P, k, t) { viewAC(k.h, P.m); const v = wob(t); k.o.fre.speed = v * .12; k.o.frl.speed = v; },
  steps: [
    { cap: tx`For AC, C1 becomes a wire and the 15 V supply becomes ground, since its voltage never wiggles.`, set: { m: 1 }, add: "ac", dur: 1.4 },
    { cap: tx`From the emitter, the signal has two ways to ground: straight down RE, or across C1 and down RL.`, drop: "ac", add: "fre frl rgE paths" },
    { cap: tx`Two paths from one node to ground are in parallel. Multiply them, then divide by their sum.`, drop: "rgE", add: "rule Lf" },
    { cap: tx`\(r_{e1}\) = (2700)(360) / 3060 = 317.6 Ω. The small 360 Ω load does most of the deciding.`, drop: "Lf", add: "La why" }
  ]
};

S.p1b = {
  ...BOX,
  P: { dc: 0 },
  build(k) {
    const h = k.h = drawFollower(k.sch);
    k.flow("fdc", h.f.dc, { c: "t3" });
    SC.ring(k, "rgC", h.at.C1, 26, 22, "bad");
    SC.lines(k, "dcr", 494, 20, 276, "the DC rules", ["C1 is open: no steady current", "gets through it.", "So RL carries no DC at all,", "and every bit of IE goes down RE."], { lh: 22 });
    SC.levels(k, "lev", 20, 150, "the two voltages", [{ t: "base · 6.1 V", v: 6.1 }, { t: "emitter · VE", v: 5.4 }], ["0.7 V"]);
    k.label("Lve", h.at.E, tx`V_E = 6.1 - 0.7 = 5.4\text{ V}`, { c: "cursor", dx: -130, dy: 24 });
    SC.box(k, "cur", 182, 70, "Ohm's law on RE");
    k.label("Lie", [CX, 226], tx`I_E = 5.4\text{ V}/2700\ \Omega = 2.000\text{ mA}`, { c: "t3", line: false });
    SC.box(k, "rule", 264, 84, "the junction's AC resistance");
    k.label("Lr", [CX, 312], tx`r_{e1}' = 25\text{ mV}/I_E`, { c: "accent", line: false });
    k.label("La", [CX, 312], tx`r_{e1}' = 12.50\ \Omega`, { c: "good", line: false });
  },
  update(P, k) { const h = k.h, a = 1 - .8 * P.dc; h.op("load", a); h.op("out", a); k.o.fdc.speed = 40; },
  steps: [
    { cap: tx`At DC, C1 is open, so RL drops out. The steady current from the 15 V supply has one path: through Q1 and down RE.`, set: { dc: 1 }, add: "dcr rgC fdc", dur: 1.3 },
    { cap: tx`The base-emitter junction is a diode that's on, so the emitter sits 0.7 V below the 6.1 V base.`, drop: "dcr rgC", add: "lev Lve" },
    { cap: tx`All of the emitter current flows through RE, so Ohm's law on RE gives \(I_E\).`, add: "cur Lie" },
    { cap: tx`The DC current sets how steep the junction's curve is. Divide 25 mV by \(I_E\).`, add: "rule Lr" },
    { cap: tx`\(I_E\) = 2.000 mA, so \(r_{e1}'\) = 25 mV / 2.000 mA = 12.50 Ω.`, drop: "Lr", add: "La" }
  ]
};

/* c and d: the signal current. The base trickle is drawn slow, the emitter flow fast: that speed gap is β */
function sigFlows(k, h) {
  k.flow("fb", h.f.sig, { c: "cursor", gap: 18 }); k.flow("fe", h.f.ie, { c: "t3", gap: 18 });
  k.flow("fre", h.f.re, { c: "t3", gap: 18 }); k.flow("frl", h.f.rl, { c: "t3", gap: 18 });
}
function sigSpeeds(k, t, base = 1) { const v = wob(t); k.o.fb.speed = v * .1 * base; k.o.fe.speed = v; k.o.fre.speed = v * .12; k.o.frl.speed = v * .88; }

S.p1c = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawFollower(k.sch); sigFlows(k, h);
    k.alias("fsig", "fe fre frl");
    SC.ring(k, "rgP", [216, 222], 26, 44);
    k.label("Lp", h.at.E, tx`r_{e1}' + r_{e1}`, { c: "cursor", dx: -100, dy: -6 });
    SC.bars(k, "spd", 494, 20, 276, "the same wiggle, two currents", [{ v: 110, c: "t3", t: "emitter current ie" }, { v: 1, c: "cursor", t: "base current ib = ie / 110" }], 110);
    SC.lines(k, "lk", 494, 146, 276, "looking into the base", ["vb = ie (r′e1 + re1)", "ib = ie / β", "vb / ib = β (r′e1 + re1)"], { lh: 24 });
    SC.box(k, "rule", 262, 80, "use your parts a and b");
    k.label("Lf", [CX, 308], tx`Z_{in} = 110\,(r_{e1}' + r_{e1})`, { c: "accent", line: false });
    k.label("La", [CX, 308], tx`Z_{in} = 36.32\text{ k}\Omega`, { c: "good", line: false });
  },
  update(P, k, t) { viewAC(k.h, P.m); sigSpeeds(k, t); },
  steps: [
    { cap: tx`Wiggle the base and the emitter follows. A signal current \(i_e\) flows through \(r_{e1}'\) inside Q1, then \(r_{e1}\) outside it.`, add: "fsig rgP Lp" },
    { cap: tx`Only a sliver of that current comes from the source. The base supplies \(i_e/\beta\), and the supply provides the rest.`, drop: "rgP", add: "fb spd" },
    { cap: tx`Divide the base voltage by the base current. \(i_e\) cancels and β moves to the top.`, drop: "Lp", add: "lk rule Lf" },
    { cap: tx`\(Z_{in}\) = 110 × (12.50 + 317.6) Ω = 36.32 kΩ. With the exact β + 1 it's 36.65 kΩ.`, drop: "Lf", add: "La" }
  ]
};

S.p1d = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawFollower(k.sch); sigFlows(k, h);
    k.alias("fsig", "fe fre frl");
    SC.split(k, "bar", 20, 12.5, 317.6, "r′e1", "re1");
    SC.ring(k, "rgO", h.at.E, 16, 16, "good");
    k.label("Lo", h.at.E, tx`v_{out} = i_e\,r_{e1}`, { c: "good", dx: -120, dy: 10 });
    const w = k.wv = SC.strip(k, "wav", 144, 116, "base (dashed) and output");
    k.plot("wi", { c: "cursor", side: true }); k.plot("wo", { c: "good", side: true });
    k.alias("wavs", "wav wi wo");
    SC.box(k, "rule", 272, 76, "the output share");
    k.label("Lf", [CX, 316], tx`A_V = r_{e1}/(r_{e1} + r_{e1}')`, { c: "accent", line: false });
    k.label("La", [CX, 316], tx`A_V = 0.9621`, { c: "good", line: false });
  },
  update(P, k, t) {
    viewAC(k.h, P.m); sigSpeeds(k, t, 0);
    const w = k.wv; k.o.wi.set(SC.wave(508, 758, w.y, w.a, t)); k.o.wo.set(SC.wave(508, 758, w.y, w.a * .9621, t));
    k.o.wi.el.style.strokeDasharray = "6 5";
  },
  steps: [
    { cap: tx`One signal current \(i_e\) flows through \(r_{e1}'\) and then \(r_{e1}\). The base voltage splits between them, like a voltage divider.`, add: "fsig bar" },
    { cap: tx`The output is taken below \(r_{e1}'\), so only the \(r_{e1}\) share reaches the load. The red sliver is lost inside Q1.`, add: "rgO Lo wavs" },
    { cap: tx`Divide output by input and \(i_e\) cancels. Use your answers from parts a and b.`, drop: "rgO", add: "rule Lf" },
    { cap: tx`\(A_V\) = 317.6 / (317.6 + 12.50) = 0.9621, inside the hint's 0.95 to 0.99. The output rises and falls in step with the base.`, drop: "Lf Lo", add: "La" }
  ]
};
