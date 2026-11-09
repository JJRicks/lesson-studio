/* ---------- Problem 1: the coupling capacitor ---------- */
S.p1 = {
  ...BOX,
  P: { m: 0, f: 0, sw: 0 },
  build(k) {
    const h = k.h = drawCoupling(k.sch, { Vcc: "15 V", R1: "13 kΩ", R2: "1 kΩ", C1: "47 µF" });
    k.flow("fa", h.fa, { c: "cursor", gap: 18 }); k.flow("fa2", h.fa2, { c: "cursor", gap: 18 });
    SC.ring(k, "rgC", h.at.C1, 42, 54);
    k.label("Lrule", [182, 142], tx`X_C \lt 0.1\,R_{eq}`, { c: "cursor", dx: 8, dy: -36 });
    k.label("Lgnd", h.at.top, tx`\text{AC ground}`, { c: "good", dx: -92, dy: -10 });
    k.group("reqC", s => SC.card(s, 494, 20, 276, 90, "what C1 feeds"), { side: true });
    k.group("va", s => s.text([316, 180], "Va", { cls: "sm" }));
    k.label("Lreq", [632, 60], tx`R_{eq} = R_1 \parallel R_2`, { c: "ink", line: false });
    k.label("Lreq2", [632, 92], tx`R_{eq} = 928.6\ \Omega`, { c: "accent", line: false });

    const c = { x0: 546, x1: 758, y0: 152, y1: 326 }, LIM = 92.857, XC = f => xcOf(f, 47e-6), FC = 1 / (TWO_PI * 47e-6 * LIM);
    const X = f => c.x0 + Math.log10(f) / 3 * (c.x1 - c.x0), Y = r => c.y1 - Math.log10(r) / 4 * (c.y1 - c.y0);
    Object.assign(k, { X, Y, XC, FC });
    k.group("chart", s => {
      SC.card(s, 494, 114, 276, 252, "XC in ohms, against frequency");
      for (const e of [0, 1, 2, 3]) s.wire([[X(10 ** e), c.y0], [X(10 ** e), c.y1]], "gridl");
      ["1", "10", "100", "1k", "10k"].forEach((t, e) => { s.wire([[c.x0, Y(10 ** e)], [c.x1, Y(10 ** e)]], "gridl"); s.text([c.x0 - 6, Y(10 ** e)], t, { cls: "sm", anchor: "end" }); });
      const a = s.group(); a.g.setAttribute("style", "--c:var(--accent)"); a.wire([[X(1), Y(XC(1))], [X(1000), Y(XC(1000))]], "w tint"); s.text([X(5), Y(XC(5)) - 16], "XC", { c: "accent" });
      const l = s.group(); l.g.setAttribute("style", "--c:var(--cursor)"); l.wire([[c.x0, Y(LIM)], [c.x1, Y(LIM)]], "w tint dash"); s.text([c.x1, Y(LIM) - 11], "92.86 Ω limit", { c: "cursor", cls: "sm", anchor: "end" });
      s.text([(c.x0 + c.x1) / 2, c.y1 + 32], "frequency (log scale) →", { cls: "sm", anchor: "middle" });
    }, { side: true });
    const z = k.rect("zone", X(FC), c.y0, c.x1 - X(FC), c.y1 - c.y0, { c: "good", side: true }); z.r.style.opacity = .16;
    k.group("dot", s => { s.g.setAttribute("style", "--c:var(--good)"); k.dotE = svgEl("circle", { r: 6.5, class: "fillc" }, s.g); }, { side: true });
    k.group("ticks", s => ["1", "10", "100", "1k"].forEach((t, e) => s.text([X(10 ** e), c.y1 + 14], t, { cls: "sm", anchor: "middle" })), { side: true });
    k.group("vline", s => { const g = s.group(); g.g.setAttribute("style", "--c:var(--good)"); g.wire([[X(FC), c.y0], [X(FC), c.y1]], "w tint"); s.text([X(FC) + 8, c.y0 + 14], "f = 36.47 Hz", { c: "good" }); s.text([X(FC) + 8, c.y0 + 32], "good coupling", { c: "good", cls: "sm" }); }, { side: true });
  },
  update(P, k, t) {
    k.h.set(P.m, P.f); const v = wob(t); k.o.fa.speed = v; k.o.fa2.speed = v;
    if (P.f < .97) k.o.fa2.el.style.display = "none";
    const f = 10 ** lerp(0, Math.log10(k.FC), P.sw); k.dotE.setAttribute("cx", k.X(f).toFixed(1)); k.dotE.setAttribute("cy", k.Y(k.XC(f)).toFixed(1));
  },
  steps: [
    { cap: tx`The AC signal crosses C1 and lands on the resistors. Good coupling means C1's reactance stays under a tenth of the resistance it feeds.`, add: "fa rgC Lrule" },
    { cap: tx`\(V_{cc}\) can't wiggle, so AC treats the top of R1 as ground. The supply vanishes from the AC picture. Vin is ideal, so it adds no resistance.`, drop: "rgC Lrule", add: "Lgnd", set: { m: 1 }, dur: 1.4 },
    { cap: tx`R1 swings around to sit beside R2. Both run from Va to ground, so they're in parallel.`, drop: "Lgnd", add: "va fa2 reqC Lreq Lreq2", set: { f: 1 }, dur: 1.7 },
    { cap: tx`A tenth of \(R_{eq}\) is the limit. On this chart \(X_C\) falls as frequency rises, and the dashed line marks the limit.`, add: "chart" },
    { cap: tx`Follow the \(X_C\) line to the right until it reaches the limit. That crossing is the frequency you're solving for. Above it, \(X_C\) is small enough.`, add: "dot", set: { sw: 1 }, from: { sw: 0 }, dur: 1.7 },
    { cap: tx`\(f\) = 1/(2π · 47 µF · 92.86 Ω) = 36.47 Hz, about 36.5 Hz. Good coupling happens above it.`, add: "ticks zone vline" }
  ]
};

/* ---------- Problem 2: the bypass capacitor ---------- */
S.p2 = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawBypass(k.sch, { R4: "1 kΩ" });
    k.flow("fd", h.fd, { c: "t3" }); k.flow("fc", h.fc, { c: "cursor", gap: 18 });
    SC.ring(k, "rgR", h.at.R4, 66, 52);
    k.label("Ldc", [230, 262], tx`\text{DC}`, { c: "t3", dx: -78, dy: -8 });
    k.label("Lac", [330, 262], tx`\text{AC}`, { c: "cursor", dx: 62, dy: -8 });
    k.group("tgt", s => SC.card(s, 494, 20, 276, 90, "the target"), { side: true });
    k.label("Ltgt", [632, 60], tx`R_{eq} = R_4 = 1\text{ k}\Omega`, { c: "ink", line: false });
    k.label("Ltgt2", [632, 92], tx`X_C \lt 0.1\,R_{eq} = 100\ \Omega`, { c: "accent", line: false });
    SC.bars(k, "bars", 494, 116, 276, "XC at four frequencies", [{ v: 8, c: "bad", t: "20 Hz · the worst case", tc: "bad" }, { v: 4, c: "accent", t: "40 Hz" }, { v: 2, c: "accent", t: "80 Hz" }, { v: 1, c: "accent", t: "160 Hz" }], 8);
    const c = { x0: 536, x1: 758, y0: 148, y1: 316 }, LIM = 100, XC = C => xcOf(20, C * 1e-6), X = C => c.x0 + (C - 10) / 190 * (c.x1 - c.x0), Y = r => c.y1 - Math.min(r, 800) / 800 * (c.y1 - c.y0), CC = 1 / (TWO_PI * 20 * LIM) * 1e6;
    k.group("curve", s => {
      SC.card(s, 494, 116, 276, 228, "XC at 20 Hz, against capacitance");
      s.wire([[c.x0, c.y0], [c.x0, c.y1], [c.x1, c.y1]], "gridl");
      const a = s.group(); a.g.setAttribute("style", "--c:var(--accent)"); a.path(pd(rng(10, 200, 120).map(C => [X(C), Y(XC(C))])), "w tint");
      const l = s.group(); l.g.setAttribute("style", "--c:var(--cursor)"); l.wire([[c.x0, Y(LIM)], [c.x1, Y(LIM)]], "w tint dash"); s.text([c.x1, Y(LIM) - 11], "100 Ω limit", { c: "cursor", cls: "sm", anchor: "end" });
      s.text([c.x0 + 26, c.y0 + 8], "XC", { c: "accent" });
      s.text([(c.x0 + c.x1) / 2, c.y1 + 14], "bigger capacitor →", { cls: "sm", anchor: "middle" });
      const d = s.group(); d.g.setAttribute("style", "--c:var(--good)"); svgEl("circle", { cx: X(CC), cy: Y(LIM), r: 6.5, class: "fillc" }, d.g);
      s.text([X(CC) + 10, Y(LIM) + 20], "smallest C", { cls: "sm", c: "good" });
    }, { side: true });
    SC.ruler(k, "rul", 494, 120, 276, "standard values near the result, µF", [33, 39, 47, 56, 68, 82, 100], 31, 106);
    SC.arrow(k, "arw", "rul", 79.58); SC.pick(k, "pk", "rul", 82);
    k.group("res", s => SC.card(s, 494, 226, 276, 92, "the result"), { side: true });
    k.label("Lc", [632, 262], tx`\text{calculated: } 79.6\ \mu\text{F}`, { c: "cursor", line: false });
    k.label("La", [632, 296], tx`C_3 = 82\ \mu\text{F}`, { c: "good", line: false });
  },
  update(P, k, t) { k.o.fd.speed = 46; k.o.fc.speed = wob(t); },
  steps: [
    { cap: tx`DC can't cross a capacitor, so it has to go through R4. AC can take C3, as long as C3's reactance is small next to R4.`, add: "fd fc Ldc Lac" },
    { cap: tx`The only resistance given for C3 to work against is R4, so \(R_{eq}\) = R4 and the limit is 100 Ω.`, drop: "Ldc Lac", add: "rgR tgt Ltgt Ltgt2" },
    { cap: tx`\(X_C\) doubles every time the frequency halves. The lowest frequency is the hardest case, so design at 20 Hz.`, drop: "rgR", add: "bars" },
    { cap: tx`At 20 Hz, a bigger capacitor gives a smaller \(X_C\). The smallest capacitor that works is where the curve meets the limit. Solve for it.`, drop: "bars", add: "curve" },
    { cap: tx`The result won't be a value you can buy. Rounding down would leave \(X_C\) above the limit, so move up to the next standard value.`, drop: "curve", add: "rul" },
    { cap: tx`\(C\) = 1/(2π · 20 Hz · 100 Ω) = 79.6 µF, so buy the next one up: C3 = 82 µF.`, add: "arw pk res Lc La" }
  ]
};
