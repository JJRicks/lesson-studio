/* ---------- Problem 3: the BSS84's threshold. Source on top at ground, sweep Vsg, cursor at Id = −1 mA ---------- */
const P3X = sweepX(.5, 3, .001), P3Y = P3X.map(v => -mosId(MOS.BSS84, v, v));

S.p3 = {
  ...BOX,
  P: { s: 0, c: 0, on: 0 },
  build(k) {
    const h = k.h = drawP3(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.ring(k, "rgM", h.at.M1, 36, 54); SC.ring(k, "rgT", h.at.top, 120, 15); SC.ring(k, "rgV", h.at.V, 24, 25);
    SC.lines(k, "c1", 494, 20, 276, "place the part", ["F2 → pmos. Ctrl+R twice before", "you click, so the source is on top.", "Right-click it: Value BSS84,", "or Pick New MOSFET → NXP BSS84."], { lh: 22 });
    SC.lines(k, "c2", 494, 20, 276, "wire it", ["Source (top) to ground,", "and to the + side of Vsg.", "Vsg − to the gate and drain.", "Gate and drain are tied."], { lh: 22 });
    SC.lines(k, "c3", 494, 20, 276, "Simulate → Edit Simulation Cmd", ["DC sweep tab, source Vsg,", "start 0.5, stop 3.0, step 1m.", "That writes .dc Vsg 0.5 3.0 1m."], { lh: 22 });
    const F = k.pf = ltPane(k, "pF", 20, 226, { x: [.5, 3, [.5, 1, 1.5, 2, 2.5, 3], fV], y: [-.07, 0, [-.06, -.04, -.02, 0], fnmA] });
    const Z = k.pz = ltPane(k, "pZ", 20, 226, { x: [1.9, 2.4, [1.9, 2, 2.1, 2.2, 2.3, 2.4], fV], y: [-1.25e-3, 0, [-1e-3, -7.5e-4, -5e-4, -2.5e-4, 0], t => t === -1e-3 ? "−1mA" : fnuA(t)] });
    k.plot("wF", { c: "good", side: true });
    k.plot("wZ", { c: "good", side: true }).set(curvePts(Z, P3X.filter(v => v >= 1.9 && v <= 2.4), P3Y.filter((_, j) => P3X[j] >= 1.9 && P3X[j] <= 2.4)));
    k.plot("l1m", { c: "cursor", side: true, cls: "w tint dash" }).set([[Z.L, Z.Y(-1e-3)], [Z.R, Z.Y(-1e-3)]]);
    k.plot("cv", { c: "ink", side: true, cls: "w tint dash" }); k.plot("chz", { c: "ink", side: true, cls: "w tint dash" });
    k.group("mk", s => { k.mk = svgEl("circle", { r: 4.5 }, s.g); k.mk.setAttribute("style", "fill:var(--cursor)"); }, { side: true });
    k.group("rd", s => { SC.card(s, 494, 254, 276, 84, "cursor 1 · Id(M1)"); k.vt = s.text([510, 316], "", { cls: "sm", c: "ink" }); }, { side: true });
    k.group("rq", s => s.text([510, 292], "Horz: ?", { cls: "sm", c: "ink" }), { side: true });
    k.label("La", [CX, 292], tx`\text{Horz} = 2.156\text{ V} = |V_T|`, { c: "good", line: false });
    k.label("Ls", [CX, 352], tx`V_T = -2.156\text{ V}`, { c: "good", line: false });
    k.alias("plotZ", "pZ wZ l1m");
  },
  update(P, k) {
    const Z = k.pz, v = lerp(2.35, 2.156, P.c), j = Math.round((v - .5) * 1000), x = P3X[j], y = P3Y[j];
    k.o.wF.set(curvePts(k.pf, P3X, P3Y, P.s));
    cursorLines(k, Z, x, y); k.mk.setAttribute("cx", Z.X(x)); k.mk.setAttribute("cy", Z.Y(y));
    k.vt.textContent = "Vert: " + eng(y, "A", 5);
    const sv = P.c > 0 ? x : P3X[Math.round(P.s * (P3X.length - 1))];
    k.o.fm.speed = P.on * spdI(mosId(MOS.BSS84, sv, sv));
  },
  steps: [
    { cap: tx`Place a PMOS, rotated so its source is on top, and change its value to BSS84.`, add: "rgM c1" },
    { cap: tx`Ground the source and connect it to the + side of Vsg. Vsg's − side goes to the gate and the drain, so the gate sits Vsg below the source.`, drop: "rgM c1", add: "rgT c2" },
    { cap: tx`Add .dc Vsg 0.5 3.0 1m, the same sweep as Problem 1 with Vsg in place of Vgs.`, drop: "rgT c2", add: "rgV c3" },
    { cap: tx`Run it and plot Id(M1). The curve heads down: LTspice counts current into the drain, and in a PMOS it flows out.`, drop: "rgV c3", add: "pF wF", from: { s: 0 }, set: { s: 1, on: 1 }, dur: 2.6 },
    { cap: tx`Zoom so the vertical axis reaches just past −1 mA, and narrow the horizontal axis around the turn-on.`, drop: "pF wF", add: "plotZ" },
    { cap: tx`Attach cursor 1 to Id(M1) and drag until Vert is as close to −1 mA as it gets.`, add: "cv chz mk rd rq", from: { c: 0 }, set: { c: 1 }, dur: 1.8 },
    { cap: tx`Read Horz: \(V_{SG}\) = 2.156 V at Id = −1.0008 mA. That's \(|V_T|\). The threshold itself is negative: \(V_T\) = −2.156 V.`, drop: "rq", add: "La Ls" }
  ]
};
