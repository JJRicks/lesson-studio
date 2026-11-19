/* ---------- Problem 2: the 2N7002's family of curves. Sweep Vds for each stepped Vgs ---------- */
const P2X = sweepX(0, 10, .1), P2Y = [1, 2, 3, 4, 5].map(g => P2X.map(v => mosId(MOS.n2N7002, g, v)));

/* the scene for a family: shared by Problems 2 and 4. o = { m, X, Y, gates, sign, y: pane y axis, name, vals } */
function famScene(k, h, o) {
  k.flow("fm", h.f.main, { c: "t3", gap: 16 });
  const F = k.pf = ltPane(k, "pF", 20, 208, { x: [0, 10, [0, 2, 4, 6, 8, 10], t => t + "V"], y: o.y });
  o.Y.forEach((ys, j) => k.plot("w" + j, { c: FAM[j], side: true }));
  k.group("st", s => { SC.card(s, 494, 236, 276, 78, "LTspice is sweeping"); k.st1 = s.text([510, 278], "", { cls: "sm", c: "ink" }); k.st2 = s.text([510, 298], "", { cls: "sm", c: "ink" }); }, { side: true });
  SC.lines(k, "c5", 494, 236, 276, "sign the plot", ["Plot Settings → Notes and", "Annotations → Place Text,", "then click where it goes."], { lh: 21 });
  k.group("nm", s => s.text([752, F.Y(o.sign * .27)], "your name", { anchor: "end", cls: "sm", c: "cursor" }), { side: true });
  /* the edge of saturation: where each curve bends flat, for every gate voltage in between */
  const bd = [];
  for (let g = o.m.Vto + .1; g <= o.gates[4] + .6; g += .02) { const q = kneeOf(o.m, g); if (q.v <= 10) bd.push([F.X(q.v), Math.max(F.top, Math.min(F.bot, F.Y(o.sign * q.i)))]); }
  k.plot("bd", { c: "ink", side: true, cls: "w tint dash" }).set(bd);
  k.group("rg", s => { s.text([F.X(.2), F.Y(o.sign * .76)], "triode", { cls: "sm", c: "ink" }); s.text([F.X(9.8), F.Y(o.sign * .53)], "saturation", { anchor: "end", cls: "sm", c: "ink" }); }, { side: true });
  SC.lines(k, "vals", 494, 236, 276, "where each curve levels off", o.vals, { lh: 15 });
}
function famUpdate(P, k, o) {
  o.Y.forEach((ys, j) => k.o["w" + j].set(curvePts(k.pf, o.X, ys, Math.max(0, Math.min(1, P.s - j)))));
  const j = Math.max(0, Math.min(4, Math.ceil(P.s - 1e-6) - 1)), u = Math.min(1, P.s - j), live = P.s > .001 && P.s < 4.999, vd = 10 * u;
  k.st1.textContent = live ? `outer: ${o.gn} = ${o.gates[j]} V` : "done: 5 curves × 101 points";
  k.st2.textContent = live ? `inner: ${o.dn} = ${vd.toFixed(1)} V` : "";
  k.o.fm.speed = P.on * spdI(mosId(o.m, o.gates[j], vd));
}

const F2 = { m: MOS.n2N7002, X: P2X, Y: P2Y, gates: [1, 2, 3, 4, 5], sign: 1, gn: "Vgs", dn: "Vds",
  y: [0, .8, [0, .2, .4, .6, .8], fmA],
  vals: ["Vgs = 1 V: 0, below threshold", "Vgs = 2 V: 13.07 mA", "Vgs = 3 V: 142.2 mA", "Vgs = 4 V: 380.2 mA", "Vgs = 5 V: 701.9 mA"] };

S.p2 = {
  ...BOX,
  P: { s: 0, on: 0 },
  build(k) {
    const h = k.h = drawP2(k.sch);
    SC.ring(k, "rgG", h.at.Vg, 24, 25); SC.ring(k, "rgD", h.at.Vd, 24, 25);
    SC.lines(k, "c1", 494, 20, 276, "two sources", ["Vgs drives the gate.", "Vds drives the drain.", "The source goes to ground.", "Gate and drain are separate now."], { lh: 22 });
    SC.lines(k, "c2", 494, 20, 276, ".dc Vds 0 10 0.1 Vgs 1 5 1", ["1st source, Vds: 0 to 10 V in", "0.1 V steps. That's the x-axis.", "2nd source, Vgs: 1 to 5 V in 1 V", "steps. One curve for each."], { lh: 22 });
    famScene(k, h, F2);
  },
  update(P, k) { famUpdate(P, k, F2); },
  steps: [
    { cap: tx`Build it with two sources: Vgs on the gate and Vds on the drain. The source goes to ground.`, add: "rgG rgD c1" },
    { cap: tx`Add .dc Vds 0 10 0.1 Vgs 1 5 1. LTspice sweeps Vds from 0 to 10 V once for each Vgs, from 1 V to 5 V.`, drop: "rgG rgD c1", add: "c2" },
    { cap: tx`Run it and plot Id(M1). The 1 V curve comes first and lies flat at zero, because 1 V is below threshold. At 2 V a small current flows.`, drop: "c2", add: "pF w0 w1 st", from: { s: 0 }, set: { s: 2, on: 1 }, dur: 2.8 },
    { cap: tx`Then 3, 4 and 5 V. Each curve climbs like a resistor, then bends flat. The bend moves right as Vgs grows.`, add: "w2 w3 w4", set: { s: 5 }, dur: 3.6 },
    { cap: tx`Put your name on the plot with Place Text, and screenshot it.`, drop: "st", add: "nm c5" },
    { cap: tx`Left of the dashed line the part is in triode, and right of it, saturation. The curves level off at 0, 13.07, 142.2, 380.2 and 701.9 mA.`, drop: "c5", add: "bd rg vals" }
  ]
};
