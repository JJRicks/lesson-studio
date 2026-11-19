/* ---------- Problem 4: the BSS84's family. Sweep Vsd for each stepped Vsg; LTspice draws it all upside down ---------- */
const P4X = sweepX(0, 10, .1), P4Y = [2, 3, 4, 5, 6].map(g => P4X.map(v => -mosId(MOS.BSS84, g, v)));
const F4 = { m: MOS.BSS84, X: P4X, Y: P4Y, gates: [2, 3, 4, 5, 6], sign: -1, gn: "Vsg", dn: "Vsd",
  y: [-.8, 0, [-.8, -.6, -.4, -.2, 0], fnmA],
  vals: ["Vsg = 2 V: about 0, below |VT|", "Vsg = 3 V: −62.13 mA", "Vsg = 4 V: −224.0 mA", "Vsg = 5 V: −442.5 mA", "Vsg = 6 V: −698.4 mA"] };

S.p4 = {
  ...BOX,
  P: { s: 0, on: 0 },
  build(k) {
    const h = k.h = drawP4(k.sch);
    SC.ring(k, "rgD", h.at.Vd, 24, 25); SC.ring(k, "rgG", h.at.Vg, 24, 25);
    SC.lines(k, "c1", 494, 20, 276, "two sources", ["Vsd + to the source (top).", "Vsg + to the source as well,", "and Vsg − to the gate.", "The drain goes to ground."], { lh: 22 });
    SC.lines(k, "c2", 494, 20, 276, ".dc Vsd 0 10 0.1 Vsg 2 6 1", ["1st source, Vsd: 0 to 10 V in", "0.1 V steps. That's the x-axis.", "2nd source, Vsg: 2 to 6 V in 1 V", "steps. One curve for each."], { lh: 22 });
    famScene(k, h, F4);
  },
  update(P, k) { famUpdate(P, k, F4); },
  steps: [
    { cap: tx`Vsd lifts the source above the grounded drain. Vsg hangs from the source and holds the gate below it.`, add: "rgD rgG c1" },
    { cap: tx`Add .dc Vsd 0 10 0.1 Vsg 2 6 1: Vsd swept from 0 to 10 V once for each Vsg from 2 V to 6 V.`, drop: "rgD rgG c1", add: "c2" },
    { cap: tx`Run it and plot Id(M1). At Vsg = 2 V the part is below threshold, so that curve sits at zero. At 3 V a current starts, drawn downward.`, drop: "c2", add: "pF w0 w1 st", from: { s: 0 }, set: { s: 2, on: 1 }, dur: 2.8 },
    { cap: tx`Then 4, 5 and 6 V. Same shapes as Problem 2, upside down. The bends sit further right, because the BSS84's internal resistance eats more voltage.`, add: "w2 w3 w4", set: { s: 5 }, dur: 3.6 },
    { cap: tx`Put your name on the plot with Place Text, and screenshot it.`, drop: "st", add: "nm c5" },
    { cap: tx`Left of the dashed line: triode. Right of it: saturation. The curves level off at about 0, −62.13, −224.0, −442.5 and −698.4 mA.`, drop: "c5", add: "bd rg vals" }
  ]
};
