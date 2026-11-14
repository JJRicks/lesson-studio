/* ---------- Problem 1: part a is the DC pass (the signal path fades away); parts b, c, d short the capacitors and ground the supply ---------- */
function viewDC(h, dc) { const a = 1 - .85 * dc; h.op("in", a); h.op("out", a); h.op("by", a); }
function viewAC(h, m, f = 0) { h.short(m); h.op("src", 1 - m); h.op("acg", m); h.fold(f); }

S.p1a = {
  ...BOX,
  P: { dc: 0 },
  build(k) {
    const h = k.h = drawSwamp(k.sch, AMP);
    k.flow("fdiv", h.f.div, { c: "t1" }); k.flow("fe", h.f.e, { c: "t3" });
    SC.ring(k, "rgR", [148, 251], 68, 44);
    SC.ring(k, "rgB", h.at.BE, 30, 40);
    SC.ring(k, "rgE", [288, 274], 22, 64);
    SC.bars(k, "stf", 494, 20, 276, "is R2 small enough?", [{ v: 560, c: "accent", t: "R2 = 560 Ω" }, { v: 2040, c: "muted", t: "0.01 β (re + R4) = 2040 Ω" }], 2040);
    k.group("lad", s => {
      SC.card(s, 494, 122, 276, 244, "the 16 V divided up");
      const x = 560, w = 72, top = 150, bot = 352, yB = bot - 2.3212 / 16 * (bot - top);
      const a = s.rect(x, top, w, yB - top, "fillc"), b = s.rect(x, yB, w, bot - yB, "fillc");
      a.setAttribute("style", "--c:var(--t1);opacity:.32"); b.setAttribute("style", "--c:var(--accent);opacity:.5");
      s.text([x + w / 2, (top + yB) / 2], "R1 · 3.3 kΩ", { anchor: "middle", cls: "sm", c: "ink" }); s.text([x + w / 2, (yB + bot) / 2], "R2", { anchor: "middle", cls: "sm", c: "ink" });
      s.text([x - 8, top + 4], "16 V", { anchor: "end", cls: "sm" }); s.text([x - 8, bot - 4], "0 V", { anchor: "end", cls: "sm" });
      const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)"); g.wire([[x - 6, yB], [x + w + 12, yB]], "w tint"); s.text([x + w + 18, yB], "VB", { c: "cursor" });
    }, { side: true });
    k.group("fcd", s => SC.card(s, 494, 20, 276, 92, "the divider rule"), { side: true });
    k.label("Lvb", [632, 72], tx`V_B = 16\text{ V}\cdot 560/(3300+560)`, { c: "accent", line: false });
    k.group("lev", s => {
      SC.card(s, 494, 20, 276, 150, "the two voltages");
      const x0 = 530, x1 = 736, yB = 72, yE = 140;
      const g = s.group(); g.g.setAttribute("style", "--c:var(--accent)"); g.wire([[x0, yB], [x1, yB]], "w tint"); g.wire([[x0, yE], [x1, yE]], "w tint");
      s.text([x0, yB - 14], "base · VB", { cls: "sm", c: "ink" }); s.text([x0, yE + 14], "emitter · VE", { cls: "sm", c: "ink" });
      s.arrow([640, yB + 2], [640, yE - 2], { c: "cursor" }); s.text([652, (yB + yE) / 2], "0.7 V drop", { c: "cursor" });
    }, { side: true });
    k.label("Lve", h.at.E, tx`V_E = V_B - 0.7\text{ V}`, { c: "cursor", dx: 100, dy: 40 });
    SC.lines(k, "open", 494, 184, 276, "at DC", ["C3 is open: no DC through it.", "So IE runs through re, then R4.", "re + R4 = 120 Ω + 560 Ω = 680 Ω"], { lh: 22 });
    k.label("Lie", h.at.R4, tx`I_E = V_E/680\ \Omega`, { c: "accent", dx: 120, dy: 40 });
    k.group("rule", s => SC.card(s, 494, 20, 276, 74, "the junction's AC resistance"), { side: true });
    k.label("Lr", [632, 64], tx`r_e' = 25\text{ mV}/I_E`, { c: "accent", line: false });
    k.label("La", [632, 64], tx`r_e' = 10.49\ \Omega`, { c: "good", line: false });
    SC.lines(k, "chain", 494, 108, 276, "the chain", ["VB = 16 V × 560 / 3860 = 2.321 V", "VE = 2.321 − 0.7 = 1.621 V", "IE = 1.621 V / 680 Ω = 2.384 mA", "re′ = 25 mV / 2.384 mA"], { lh: 24, c: "good" });
  },
  update(P, k) { viewDC(k.h, P.dc); k.o.fdiv.speed = 40; k.o.fe.speed = 46; },
  steps: [
    { cap: tx`At DC the capacitors are open, so the signal, C3 and Rl drop out. R2 is under 0.01 β (re + R4), so the divider is stiff.`, set: { dc: 1 }, add: "stf", dur: 1.2 },
    { cap: tx`With base current ignored, one current runs down R1 and R2. The base sits at R2's share of the 16 V.`, drop: "stf", add: "fdiv rgR lad fcd Lvb" },
    { cap: tx`The base-emitter junction is an on diode, so the emitter sits 0.7 V below the base.`, drop: "rgR lad fcd Lvb", add: "rgB lev Lve" },
    { cap: tx`C3 is open at DC, so the emitter current runs through re and then R4. Together that's 680 Ω.`, drop: "rgB", add: "rgE fe open Lie" },
    { cap: tx`The DC current sets how steep the junction's curve is. Divide 25 mV by your \(I_E\).`, drop: "lev open rgE Lve", add: "rule Lr" },
    { cap: tx`\(V_B\) = 2.321 V, \(V_E\) = 1.621 V and \(I_E\) = 2.384 mA, so \(r_e'\) = 25 mV / 2.384 mA = 10.49 Ω.`, drop: "Lr Lie", add: "La chain" }
  ]
};

S.p1b = {
  ...BOX,
  P: { m: 0, f: 0 },
  build(k) {
    const h = k.h = drawSwamp(k.sch, AMP);
    k.flow("fO", h.f.out, { c: "cursor", gap: 18 }); k.flow("fR", [[282, 112], [282, 24]], { c: "cursor", gap: 18 }); k.flow("fF", [[388, 112], [444, 112], [444, 200]], { c: "cursor", gap: 18 });
    SC.ring(k, "rg", h.at.C, 12, 12, "good");
    k.group("cd", s => SC.card(s, 494, 216, 276, 120, "two paths to AC ground"), { side: true });
    k.label("Lf", [632, 262], tx`r_c = R_3 \parallel R_l`, { c: "ink", line: false });
    k.label("Lf2", [632, 298], tx`=\;R_3 R_l/(R_3 + R_l)`, { c: "accent", line: false });
    k.label("La", [632, 298], tx`r_c = 2.629\text{ k}\Omega`, { c: "good", line: false });
  },
  update(P, k, t) {
    viewAC(k.h, P.m, P.f); for (const n of ["sw", "r4", "by", "div", "in"]) k.h.op(n, 1 - .75 * P.m);
    const v = wob(t); k.o.fO.speed = v; k.o.fR.speed = v; k.o.fF.speed = v;
    if (P.f < .97) k.o.fF.el.style.display = "none"; if (P.f > .03) k.o.fR.el.style.display = "none";
  },
  steps: [
    { cap: tx`Follow the AC rules: capacitors turn into wires and \(V_{cc}\) turns into ground. C2 now ties Rl straight to the collector.`, set: { m: 1 }, dur: 1.4 },
    { cap: tx`From the collector, AC has two ways to reach ground: down through Rl, or up through R3 to the grounded supply.`, add: "rg fO fR" },
    { cap: tx`R3 swings down beside Rl to show it. Two resistors from the same node to ground are in parallel.`, drop: "rg", add: "fF cd Lf Lf2", set: { f: 1 }, dur: 1.7 },
    { cap: tx`\(r_c\) = (2.7 kΩ)(100 kΩ)/(102.7 kΩ) = 2629 Ω, which is 2.629 kΩ.`, drop: "Lf2", add: "La" }
  ]
};

S.p1c = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawSwamp(k.sch, AMP);
    k.flow("fs", h.f.sig, { c: "cursor", gap: 18 }); k.flow("fb", h.loops.eAC, { c: "cursor", gap: 18 });
    k.flow("fc", h.f.acc.slice(1, 6), { c: "t3", gap: 18 }); k.flow("fo", h.f.out, { c: "t3", gap: 18 });
    SC.ring(k, "rgP", [284, 230], 20, 56); SC.ring(k, "rgS", [310, 301], 38, 34, "good");
    k.label("Lp", h.at.re, tx`r_e' + r_e`, { c: "cursor", dx: -66, dy: -32 });
    k.label("Lsh", [360, 301], tx`\text{R4 shorted by C3}`, { c: "good", dx: 72, dy: -14 });
    k.label("Li", h.at.BE, tx`i_e = v_{in}/(r_e' + r_e)`, { c: "cursor", dx: -172, dy: 24 });
    k.label("Lo", [388, 112], tx`v_{out} = -i_e\,r_c`, { c: "t3", dx: -4, dy: -54 });
    const sc = k.sc = { x0: 508, x1: 758, a: 68, b: 202 };
    k.group("sc1", s => { SC.card(s, 494, 20, 276, 84, "input at the base"); s.wire([[sc.x0, sc.a], [sc.x1, sc.a]], "gridl"); }, { side: true });
    k.group("sc2", s => { SC.card(s, 494, 112, 276, 164, "output (not to scale)"); s.wire([[sc.x0, sc.b], [sc.x1, sc.b]], "gridl"); }, { side: true });
    k.plot("wi", { c: "cursor", side: true }); k.plot("wo", { c: "t3", side: true });
    k.group("rule", s => SC.card(s, 494, 284, 276, 72, ""), { side: true });
    k.label("Lf", [632, 320], tx`A_V = -r_c/(r_e' + 120\ \Omega)`, { c: "ink", line: false });
    k.label("La", [632, 320], tx`A_V = -2629/130.49 = -20.15`, { c: "good", line: false });
  },
  update(P, k, t) {
    const h = k.h, sc = k.sc; viewAC(h, P.m); h.op("r4", .25); h.op("div", .25);
    const v = wob(t, 40); k.o.fs.speed = v; k.o.fb.speed = v; k.o.fc.speed = v; k.o.fo.speed = -v;
    const wv = (y, a) => rng(0, 1, 110).map(u => [lerp(sc.x0, sc.x1, u), y - a * sin(2.6 * (t - (1 - u) * 5))]);
    k.o.wi.set(wv(sc.a, 8)); k.o.wo.set(wv(sc.b, -50));
  },
  steps: [
    { cap: tx`C1 is a short for AC, so the whole input wave arrives at the base.`, add: "fs sc1 wi" },
    { cap: tx`C3 shorts R4 and nothing else. The signal current leaving the emitter goes through \(r_e'\), then the 120 Ω \(r_e\), then C3 to ground.`, add: "rgP rgS Lp Lsh fb" },
    { cap: tx`The input lands across \(r_e' + r_e\), which sets \(i_e\). The same current pulls the collector down through \(r_c\), so the output is upside down.`, drop: "rgP rgS Lp Lsh", add: "Li Lo fc fo sc2 wo" },
    { cap: tx`Divide the output by the input and \(i_e\) cancels. Use your \(r_c\) from part b and your \(r_e'\) from part a.`, add: "rule Lf" },
    { cap: tx`\(A_V\) = −2629 Ω / (10.49 Ω + 120 Ω) = −20.15. The output is about 20 times the input, inverted.`, drop: "Lf Li", add: "La" }
  ]
};

S.p1d = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawSwamp(k.sch, AMP);
    k.flow("fs", [h.f.sig[0], [178, 172]], { c: "cursor", gap: 18 }); k.flow("fsb", [[178, 172], [262, 172]], { c: "cursor", gap: 18 });
    k.flow("f1", [[178, 172], [178, 24]], { c: "t1", gap: 18 }); k.flow("f2", [[178, 172], [178, 330]], { c: "t1", gap: 18 });
    k.flow("f3", [[178, 172], [262, 172], [262, 179], [282, 193], [282, 272], [336, 272], [336, 330]], { c: "t3", gap: 18 });
    SC.ring(k, "rgIn", [118, 172], 52, 26); SC.ring(k, "rgQ", [286, 226], 22, 62);
    k.label("Lz", [96, 172], tx`Z_{in} = v_{in}/i_{in}`, { c: "cursor", dx: -32, dy: 78 });
    SC.lines(k, "lk", 494, 20, 276, "looking into the base", ["vb = ie (r′e + re)", "ib = ie / β", "vb / ib = β (r′e + re)"], { lh: 24 });
    k.group("zbc", s => SC.card(s, 494, 132, 276, 60, ""), { side: true });
    k.label("Lzb", [632, 162], tx`Z_{in(base)} = 300\,(r_e' + 120\ \Omega)`, { c: "t3", line: false });
    const xs = [530, 606, 682], top = 62, bot = 204;
    k.group("par", s => {
      SC.card(s, 494, 20, 276, 234, "three paths in parallel");
      s.wire([[506, top], [xs[2], top]]); s.wire([[xs[0], bot], [xs[2], bot]]); s.gnd([xs[1], bot]);
      xs.forEach(x => { s.res([x, top], [x, bot]); s.node([x, top]); });
      [["R1", "3.3 kΩ"], ["R2", "560 Ω"], ["base", "β(r′e+re)"]].forEach(([a, b], i) => { s.text([xs[i] + 12, 122], a, { cls: "sm", c: "ink" }); s.text([xs[i] + 12, 140], b, { cls: "sm" }); });
      s.text([632, 244], "dot speed = share of the current", { anchor: "middle", cls: "sm" });
    }, { side: true });
    const G = [1 / 3300, 1 / 560, 1 / (300 * (10.486 + 120))], Gt = G[0] + G[1] + G[2];
    k.sh = G.map(g => g / Gt);
    xs.forEach((x, i) => SC.sflow(k, "p" + i, [[x, top], [x, bot]], { c: i < 2 ? "t1" : "t3", gap: 14 }));
    k.alias("pf", "p0 p1 p2");
    k.group("rule", s => SC.card(s, 494, 266, 276, 90, "combine them"), { side: true });
    k.label("Lf", [632, 314], tx`Z_{in} = R_1 \parallel R_2 \parallel Z_{in(base)}`, { c: "ink", line: false });
    k.label("La", [632, 314], tx`Z_{in} = 473.0\ \Omega`, { c: "good", line: false });
  },
  update(P, k, t) {
    const h = k.h; viewAC(h, P.m); h.op("out", .3);
    const w = 60 * cos(t * 2.6); k.o.fs.speed = w; k.o.fsb.speed = w;
    ["f1", "f2", "f3"].forEach((n, i) => { k.o[n].speed = w * k.sh[i]; k.o["p" + i].speed = w * k.sh[i]; });
  },
  steps: [
    { cap: tx`\(Z_{in}\) is what vin sees through C1. For AC, C1 is a wire and \(V_{cc}\) is ground, so R1 and R2 both run from the base node to ground.`, add: "rgIn Lz fs fsb" },
    { cap: tx`Looking into the base, the emitter's AC resistance \(r_e' + r_e\) looks β times bigger. Use your \(r_e'\) from part a.`, drop: "rgIn Lz", add: "rgQ lk zbc Lzb" },
    { cap: tx`The input current splits three ways: up R1, down R2, or into the base. All three run from one node to ground, so they're in parallel.`, drop: "rgQ lk zbc Lzb fsb", add: "par pf f1 f2 f3" },
    { cap: tx`Add the three conductances and flip the sum. The smallest path, R2, does most of the deciding.`, add: "rule Lf" },
    { cap: tx`\(Z_{in(base)}\) = 300 × 130.49 Ω = 39.15 kΩ, and \(3.3\text{ k}\Omega \parallel 560\ \Omega \parallel 39.15\text{ k}\Omega\) = 473.0 Ω. That's inside the hint's 460 to 480 Ω.`, drop: "Lf", add: "La" }
  ]
};
