/* ---------- Problem 1: the 2N7002's threshold. Tie the drain to the gate, sweep Vgs, zoom in, put a cursor at 250 µA ---------- */
const P1X = sweepX(.5, 3, .001), P1Y = P1X.map(v => mosId(MOS.n2N7002, v, v));

S.p1 = {
  ...BOX,
  P: { s: 0, c: 0, on: 0 },
  build(k) {
    const h = k.h = drawP1(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.ring(k, "rgM", h.at.M1, 36, 52); SC.ring(k, "rgT", h.at.tie, 96, 15); SC.ring(k, "rgV", h.at.V, 24, 25);
    k.label("Lg", h.at.gate, tx`I_G = 0`, { c: "muted", dy: 30, line: false });
    SC.lines(k, "c1", 494, 20, 276, "place the part", ["F2 → nmos, then click to place.", "Right-click it: Value 2N7002.", "Or hover, Pick New MOSFET,", "and choose Fairchild 2N7002."], { lh: 22 });
    SC.lines(k, "c2", 494, 20, 276, "wire it", ["Vgs + goes to the gate.", "The drain goes up and over", "to the gate as well.", "Source and Vgs − to ground."], { lh: 22 });
    SC.lines(k, "c3", 494, 20, 276, "Simulate → Edit Simulation Cmd", ["DC sweep tab, source Vgs,", "start 0.5, stop 3.0, step 1m.", "That writes .dc Vgs 0.5 3.0 1m:", "2,501 points, 1 mV apart."], { lh: 22 });
    const F = k.pf = ltPane(k, "pF", 20, 226, { x: [.5, 3, [.5, 1, 1.5, 2, 2.5, 3], fV], y: [0, .15, [0, .05, .1, .15], fmA] });
    const Z = k.pz = ltPane(k, "pZ", 20, 226, { x: [1.3, 1.8, [1.3, 1.4, 1.5, 1.6, 1.7, 1.8], fV], y: [0, 1e-3, [0, 2.5e-4, 5e-4, 7.5e-4, 1e-3], t => t === 1e-3 ? "1mA" : fuA(t)] });
    k.plot("wF", { c: "good", side: true });
    k.plot("wZ", { c: "good", side: true }).set(curvePts(Z, P1X.filter(v => v >= 1.3 && v <= 1.8), P1Y.filter((_, j) => P1X[j] >= 1.3 && P1X[j] <= 1.8)));
    k.plot("l250", { c: "cursor", side: true, cls: "w tint dash" }).set([[Z.L, Z.Y(2.5e-4)], [Z.R, Z.Y(2.5e-4)]]);
    k.plot("cv", { c: "ink", side: true, cls: "w tint dash" }); k.plot("chz", { c: "ink", side: true, cls: "w tint dash" });
    k.group("mk", s => { k.mk = svgEl("circle", { r: 4.5 }, s.g); k.mk.setAttribute("style", "fill:var(--cursor)"); }, { side: true });
    k.group("rd", s => { SC.card(s, 494, 254, 276, 84, "cursor 1 · Id(M1)"); k.vt = s.text([510, 316], "", { cls: "sm", c: "ink" }); }, { side: true });
    k.group("rq", s => s.text([510, 292], "Horz: ?", { cls: "sm", c: "ink" }), { side: true });
    k.label("La", [CX, 292], tx`\text{Horz} = 1.567\text{ V} = V_T`, { c: "good", line: false });
    k.alias("plotZ", "pZ wZ l250");
  },
  update(P, k) {
    const Z = k.pz, v = lerp(1.75, 1.567, P.c), j = Math.round((v - .5) * 1000), x = P1X[j], y = P1Y[j];
    k.o.wF.set(curvePts(k.pf, P1X, P1Y, P.s));
    cursorLines(k, Z, x, y); k.mk.setAttribute("cx", Z.X(x)); k.mk.setAttribute("cy", Z.Y(y));
    k.vt.textContent = "Vert: " + eng(y, "A", 5);
    const sv = P.c > 0 ? x : P1X[Math.round(P.s * (P1X.length - 1))];
    k.o.fm.speed = P.on * spdI(mosId(MOS.n2N7002, sv, sv));
  },
  steps: [
    { cap: tx`Place an NMOS and change its value to 2N7002. That links the part to the 2N7002 model in LTspice's library.`, add: "rgM c1" },
    { cap: tx`Wire Vgs to the gate, then run a wire from the drain up and over to the gate. Ground the source. Now \(V_{DS} = V_{GS}\) at every point of the sweep.`, drop: "rgM c1", add: "rgT c2 Lg" },
    { cap: tx`Add .dc Vgs 0.5 3.0 1m. LTspice solves the circuit at every 1 mV step from 0.5 V to 3.0 V.`, drop: "rgT c2 Lg", add: "rgV c3" },
    { cap: tx`Run it, then click M1's drain to plot Id(M1). Almost nothing flows until about 1.6 V. After that the current climbs fast.`, drop: "rgV c3", add: "pF wF", from: { s: 0 }, set: { s: 1, on: 1 }, dur: 2.6 },
    { cap: tx`Zoom in. Make the vertical axis top out near 1 mA and narrow the horizontal axis. Now the turn-on fills the plot, and 250 µA is a quarter of the way up.`, drop: "pF wF", add: "plotZ" },
    { cap: tx`Click the Id(M1) label to attach cursor 1, and drag until Vert is as close to 250 µA as it gets. The points are 1 mV apart, so it won't land exactly on it.`, add: "cv chz mk rd rq", from: { c: 0 }, set: { c: 1 }, dur: 1.8 },
    { cap: tx`Read Horz. The closest point is \(V_{GS}\) = 1.567 V, where Id = 248.70 µA. That's the 2N7002's threshold, inside the datasheet's 1 to 2.5 V.`, drop: "rq", add: "La" }
  ]
};
