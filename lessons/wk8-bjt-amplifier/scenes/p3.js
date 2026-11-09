/* ---------- Problem 3: the DC parts (a and b) fade the signal path away; the AC parts (c, d, e) short the capacitors and ground the supply ---------- */
function viewDC(h, dc) { const a = 1 - .85 * dc; h.op("in", a); h.op("out", a); h.op("by", a); }
function viewAC(h, m, f = 0) { h.short(m); h.op("src", 1 - m); h.op("acg", m); h.fold(f); }

S.p3a = {
  ...BOX,
  P: { dc: 0 },
  build(k) {
    const h = k.h = drawAmp(k.sch, AMP3);
    k.flow("fdiv", h.f.div, { c: "t1" });
    SC.ring(k, "rgR", [148, 264], 68, 44);
    SC.bars(k, "stf", 494, 20, 276, "is R2 small enough?", [{ v: 620, c: "accent", t: "R2 = 620 Ω" }, { v: 2040, c: "muted", t: "0.01 β R4 = 2040 Ω" }], 2040);
    k.group("lad", s => {
      SC.card(s, 494, 142, 276, 224, "the 15 V divided up");
      const x = 560, w = 72, top = 170, bot = 352, yB = bot - 2.2043 / 15 * (bot - top);
      const a = s.rect(x, top, w, yB - top, "fillc"), b = s.rect(x, yB, w, bot - yB, "fillc");
      a.setAttribute("style", "--c:var(--t1);opacity:.32"); b.setAttribute("style", "--c:var(--accent);opacity:.5");
      s.text([x + w / 2, (top + yB) / 2], "R1", { anchor: "middle" }); s.text([x + w / 2, (yB + bot) / 2], "R2", { anchor: "middle", cls: "sm", c: "ink" });
      s.text([x - 8, top + 4], "15 V", { anchor: "end", cls: "sm" }); s.text([x - 8, bot - 4], "0 V", { anchor: "end", cls: "sm" });
      const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)"); g.wire([[x - 6, yB], [x + w + 12, yB]], "w tint"); s.text([x + w + 18, yB], "VB", { c: "cursor" });
    }, { side: true });
    k.group("ladv", s => s.text([694, 352 - 2.2043 / 15 * 182 + 20], "2.20 V", { c: "good" }), { side: true });
    k.group("fcd", s => SC.card(s, 494, 20, 276, 112, "the divider rule"), { side: true });
    k.label("Lf", [632, 82], tx`V_B = 15\text{ V}\cdot 620/(3600+620)`, { c: "accent", line: false });
    k.label("La", [632, 82], tx`V_B = 2.20\text{ V}`, { c: "good", line: false });
  },
  update(P, k) { viewDC(k.h, P.dc); k.o.fdiv.speed = 40; },
  steps: [
    { cap: tx`At DC the capacitors are open. The signal can't get in and Rl can't be reached, so only the supply, the divider, the transistor, R3 and R4 are left.`, set: { dc: 1 }, dur: 1.2 },
    { cap: tx`R2 is less than 0.01 β R4, so the divider is stiff. The base draws so little that you can ignore it.`, add: "rgR stf" },
    { cap: tx`With base current ignored, the same current runs down through R1 and R2. The middle of the pair is the base.`, drop: "rgR", add: "fdiv lad" },
    { cap: tx`R2 is the bottom of the pair, so it gets its share of the 15 V: R2 over the total.`, drop: "stf", add: "fcd Lf" },
    { cap: tx`\(V_B\) = 15 V · 620/4220 = 2.204 V, about 2.20 V.`, drop: "Lf", add: "La ladv" }
  ]
};

S.p3b = {
  ...BOX,
  P: { dc: 1 },
  build(k) {
    const h = k.h = drawAmp(k.sch, AMP3);
    k.flow("fe", h.f.e, { c: "t3" });
    SC.ring(k, "rgB", h.at.BE, 30, 44); SC.ring(k, "rgR", [262, 300], 62, 42);
    k.group("lev", s => {
      SC.card(s, 494, 20, 276, 150, "the two voltages");
      const x0 = 530, x1 = 736, yB = 72, yE = 140;
      const g = s.group(); g.g.setAttribute("style", "--c:var(--accent)"); g.wire([[x0, yB], [x1, yB]], "w tint"); g.wire([[x0, yE], [x1, yE]], "w tint");
      s.text([x0, yB - 14], "base · your VB from part a", { cls: "sm", c: "ink" }); s.text([x0, yE + 14], "emitter · VE", { cls: "sm", c: "ink" });
      s.arrow([640, yB + 2], [640, yE - 2], { c: "cursor" }); s.text([652, (yB + yE) / 2], "0.7 V drop", { c: "cursor" });
    }, { side: true });
    SC.lines(k, "open", 494, 184, 276, "at DC", ["C3 is open: no DC through it.", "So all of IE goes through R4."], { lh: 22 });
    k.label("Lve", h.at.E, tx`V_E = V_B - 0.7\text{ V}`, { c: "cursor", dx: 84, dy: -30 });
    k.label("Lf", h.at.R4, tx`I_E = V_E/680\ \Omega`, { c: "accent", dx: 130, dy: 42 });
    k.label("Av", h.at.E, tx`V_E = 1.504\text{ V}`, { c: "good", dx: 84, dy: -30 });
    k.label("Ai", h.at.R4, tx`I_E = 2.21\text{ mA}`, { c: "good", dx: 130, dy: 42 });
  },
  update(P, k) { viewDC(k.h, P.dc); k.o.fe.speed = 46; },
  steps: [
    { cap: tx`The base-emitter junction is an on diode, so the emitter sits 0.7 V below the base. Use your \(V_B\) from part a.`, add: "rgB lev Lve" },
    { cap: tx`The emitter's DC current has one place to go. C3 is open at DC, so all of it runs through R4 to ground.`, drop: "rgB", add: "rgR fe open" },
    { cap: tx`R4 has \(V_E\) on top and ground on the bottom, so Ohm's law gives the current.`, add: "Lf" },
    { cap: tx`\(V_E\) = 2.204 − 0.7 = 1.504 V, so \(I_E\) = 1.504 V / 680 Ω = 2.21 mA.`, drop: "Lf Lve rgR", add: "Av Ai" }
  ]
};

S.p3c = {
  ...BOX,
  P: { m: 0, f: 0 },
  build(k) {
    const h = k.h = drawAmp(k.sch, AMP3);
    k.flow("fO", h.f.out, { c: "cursor", gap: 18 }); k.flow("fR", [[282, 124], [282, 30]], { c: "cursor", gap: 18 }); k.flow("fF", [[388, 124], [444, 124], [444, 218]], { c: "cursor", gap: 18 });
    SC.ring(k, "rg", h.at.C, 12, 12, "good");
    k.group("cd", s => SC.card(s, 494, 216, 276, 120, "two paths to AC ground"), { side: true });
    k.label("Lf", [632, 262], tx`r_c = R_3 \parallel R_l`, { c: "ink", line: false });
    k.label("Lf2", [632, 298], tx`=\;R_3 R_l/(R_3 + R_l)`, { c: "accent", line: false });
    k.label("La", [632, 298], tx`r_c = 2.63\text{ k}\Omega`, { c: "good", line: false });
  },
  update(P, k, t) { viewAC(k.h, P.m, P.f); k.h.op("re", 1 - .75 * P.m); k.h.op("div", 1 - .75 * P.m); k.h.op("in", 1 - .75 * P.m); const v = wob(t); k.o.fO.speed = v; k.o.fR.speed = v; k.o.fF.speed = v; if (P.f < .97) k.o.fF.el.style.display = "none"; if (P.f > .03) k.o.fR.el.style.display = "none"; },
  steps: [
    { cap: tx`Follow the AC rules: capacitors turn into wires and \(V_{cc}\) turns into ground. C2 now ties Rl straight to the collector.`, set: { m: 1 }, dur: 1.4 },
    { cap: tx`From the collector, AC has two ways to reach ground. It can go down through Rl, or up through R3 to the grounded supply.`, add: "rg fO fR" },
    { cap: tx`R3 swings down beside Rl to show it: two resistors from the same node to ground. That's parallel.`, drop: "rg", add: "fF cd Lf Lf2", set: { f: 1 }, dur: 1.7 },
    { cap: tx`\(r_c\) = (2.7 kΩ)(100 kΩ)/(102.7 kΩ) = 2629 Ω, about 2.63 kΩ.`, drop: "Lf2", add: "La" }
  ]
};

S.p3d = {
  ...BOX,
  P: { w: 0 },
  build(k) {
    const h = k.h = drawAmp(k.sch, AMP3);
    k.flow("fb", h.loops.be, { c: "t1", gap: 18 });
    SC.ring(k, "rg", h.at.BE, 32, 44);
    const c = k.c = { x0: 516, x1: 758, y0: 54, y1: 256 }, X = v => lerp(c.x0, c.x1, (v + 2.4) / 3.2), Y = i => c.y1 - i / exp(.8) * (c.y1 - c.y0);
    Object.assign(k, { XX: X, YY: Y });
    k.group("cur", s => {
      SC.card(s, 494, 20, 276, 262, "the base-emitter diode curve");
      s.wire([[c.x0, c.y0], [c.x0, c.y1], [c.x1, c.y1]], "gridl");
      const a = s.group(); a.g.setAttribute("style", "--c:var(--accent)"); a.path(pd(rng(-2.4, .8, 90).map(v => [X(v), Y(exp(v))])), "w tint");
      s.text([(c.x0 + c.x1) / 2, c.y1 + 14], "voltage →", { cls: "sm", anchor: "middle" });
      s.text([c.x0 + 8, c.y0 + 6], "current ↑", { cls: "sm" });
      const d = s.group(); d.g.setAttribute("style", "--c:var(--ink)"); svgEl("circle", { cx: X(0), cy: Y(1), r: 5, class: "fillc" }, d.g);
      s.text([X(0) - 12, Y(1) - 12], "IE", { anchor: "end" });
    }, { side: true });
    k.group("tan", s => { const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)"); g.wire([[X(-.8), Y(.2)], [X(.76), Y(1.76)]], "w tint dash"); }, { side: true });
    k.group("wig", s => { s.g.setAttribute("style", "--c:var(--cursor)"); k.wd = svgEl("circle", { r: 6.5, class: "fillc" }, s.g); }, { side: true });
    k.plot("hv", { c: "muted", side: true, cls: "w tint thin" });
    k.group("rule", s => SC.card(s, 494, 292, 276, 66, ""), { side: true });
    k.label("Lf", [632, 325], tx`r_e' = 25\text{ mV}/I_E`, { c: "accent", line: false });
    k.label("La", [632, 325], tx`r_e' = 11.3\ \Omega`, { c: "good", line: false });
  },
  update(P, k, t) {
    k.o.fb.speed = 34; const v = .36 * sin(t * 2.6), i = 1 + v;
    k.wd.setAttribute("cx", k.XX(v).toFixed(1)); k.wd.setAttribute("cy", k.YY(i).toFixed(1));
    k.o.hv.set([[k.XX(v), k.YY(i)], [k.XX(v), k.c.y1]]);
  },
  steps: [
    { cap: tx`Look at the junction between base and emitter. It's a forward-biased diode, and your \(I_E\) from part b sets where it sits on its curve.`, add: "rg fb cur" },
    { cap: tx`For a small wiggle, the curve looks like the dashed straight line. A straight line on a current-voltage plot is a resistor, and its slope sets the value.`, add: "tan wig hv" },
    { cap: tx`Taking the slope of the diode equation gives the rule. Use your \(I_E\) from part b.`, add: "rule Lf" },
    { cap: tx`\(r_e'\) = 25 mV / 2.212 mA = 11.3 Ω.`, drop: "Lf", add: "La" }
  ]
};

S.p3e = {
  ...BOX,
  P: { m: 1 },
  build(k) {
    const h = k.h = drawAmp(k.sch, AMP3);
    k.flow("fs", h.f.sig, { c: "cursor", gap: 18 }); k.flow("fb", h.loops.be, { c: "cursor", gap: 18 }); k.flow("fg", h.f.by, { c: "cursor", gap: 18 }); k.flow("fc", [[388, 124], ...h.f.acc.slice(1)], { c: "accent", gap: 18 }); k.flow("fo", h.f.out, { c: "accent", gap: 18 });
    SC.ring(k, "rgE", h.at.E, 10, 10, "good");
    k.label("Lg", h.at.E, tx`\text{AC ground}`, { c: "good", dx: 52, dy: -26 });
    k.label("Li", h.at.BE, tx`i_e = v_{in}/r_e'`, { c: "cursor", dx: -54, dy: 26 });
    k.label("Lo", [388, 124], tx`v_{out} = -i_e\,r_c`, { c: "accent", dx: -14, dy: -60 });
    const sc = k.sc = { x0: 508, x1: 758, a: 68, b: 202 };
    k.group("sc1", s => { SC.card(s, 494, 20, 276, 84, "input at the base"); s.wire([[sc.x0, sc.a], [sc.x1, sc.a]], "gridl"); }, { side: true });
    k.group("sc2", s => { SC.card(s, 494, 112, 276, 164, "output (not to scale)"); s.wire([[sc.x0, sc.b], [sc.x1, sc.b]], "gridl"); }, { side: true });
    k.plot("wi", { c: "cursor", side: true }); k.plot("wo", { c: "accent", side: true });
    k.group("rule", s => SC.card(s, 494, 284, 276, 72, ""), { side: true });
    k.label("Lf", [632, 320], tx`A_V = v_{out}/v_{in} = -r_c/r_e'`, { c: "ink", line: false });
    k.label("La", [632, 320], tx`A_V = -2629/11.30 = -232.6`, { c: "good", line: false });
  },
  update(P, k, t) {
    const h = k.h, sc = k.sc; viewAC(h, P.m); h.op("re", .25); h.op("div", .25);
    const v = wob(t, 40); k.o.fs.speed = v; k.o.fb.speed = v; k.o.fg.speed = v; k.o.fc.speed = -v; k.o.fo.speed = -v;
    const wv = (y, a) => rng(0, 1, 110).map(u => [lerp(sc.x0, sc.x1, u), y - a * sin(2.6 * (t - (1 - u) * 5))]);
    k.o.wi.set(wv(sc.a, 8)); k.o.wo.set(wv(sc.b, -54));
  },
  steps: [
    { cap: tx`C1 is a short for AC, so the whole input wave arrives at the base.`, add: "fs sc1 wi" },
    { cap: tx`C3 holds the emitter at AC ground, so the entire input lands across \(r_e'\). Ohm's law gives the emitter current.`, add: "rgE Lg fb fg Li" },
    { cap: tx`About the same current flows through \(r_c\). More current means a bigger drop, which pulls the collector down, so the output is a large upside-down wave.`, drop: "rgE Lg", add: "fc fo sc2 wo Lo" },
    { cap: tx`Divide the output by the input and \(i_e\) cancels. Use your \(r_c\) from part c and your \(r_e'\) from part d.`, add: "rule Lf" },
    { cap: tx`\(A_V\) = −2629 Ω / 11.30 Ω = −232.6, or about −233. That's inside the hint's range.`, drop: "Lf", add: "La" }
  ]
};
