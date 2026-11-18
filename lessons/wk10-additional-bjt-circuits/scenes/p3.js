/* ---------- Problem 3: the Darlington pair. Voltages walk forward, currents walk backward. Dot speeds grow on a log scale ---------- */
S.p3 = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawDarl(k.sch);
    k.flow("fl", h.f.c2, { c: "t3", gap: 14 }); k.flow("fh", h.f.c1, { c: "t1", gap: 18 }); k.flow("fd", h.f.hand, { c: "t1", gap: 18 }); k.flow("fi", h.f.in, { c: "cursor", gap: 24 });
    k.alias("fq2", "fd");
    SC.ring(k, "rgJ", [160, 176], 34, 82);
    SC.levels(k, "lev", 20, 168, "walking down from the base", [{ t: "Q1's base · 8 V", v: 8 }, { t: "Q2's base · 7.3 V", v: 7.3 }, { t: "Vout · 6.6 V", v: 6.6 }], ["0.7 V", "0.7 V"]);
    k.label("Lv", h.at.out, tx`V_{out} = 8 - 0.7 - 0.7 = 6.6\text{ V}`, { c: "cursor", dx: -150, dy: 64 });
    k.label("Li", h.at.RL, tx`I_{E2} = 6.6\text{ V}/10\ \Omega = 0.66\text{ A}`, { c: "t3", dx: 150, dy: 22 });
    SC.ladder(k, "lad", 20, "walking the current back", [{ v: .66, t: "load = Q2's emitter", c: "t3" }, { v: .0055, t: "Q2's base = Q1's emitter", c: "t1" }, { v: .66 / 14400, t: "Q1's base = the input", c: "cursor", hide: true }]);
    k.label("Lb2", h.at.hand, tx`I_{B2} = 0.66\text{ A}/120 = 5.5\text{ mA}`, { c: "t1", dx: -100, dy: 70 });
    SC.box(k, "rule", 208, 86, "once more, through Q1");
    k.label("Lf", [CX, 256], tx`I_{in} = I_{B2}/120 = 0.66\text{ A}/(120 \cdot 120)`, { c: "accent", line: false });
    k.label("La", [CX, 256], tx`I_{in} = 45.83\ \mu\text{A}`, { c: "good", line: false });
    SC.lines(k, "ex", 494, 302, 276, "", ["exact (β + 1 each): 45.08 µA"], { lh: 20 });
  },
  update(P, k) { k.o.fl.speed = 70; k.o.fh.speed = 22; k.o.fd.speed = 22; k.o.fi.speed = 7; },
  steps: [
    { cap: tx`From the 8 V base, the path to the output crosses two base-emitter junctions. Each one drops 0.7 V.`, add: "rgJ lev Lv" },
    { cap: tx`Q2's emitter has one way out: down through the 10 Ω load. Ohm's law gives the load current.`, drop: "rgJ lev", add: "fl Li" },
    { cap: tx`Q2's base needs its emitter current divided by β. Every bit of it comes out of Q1's emitter.`, drop: "Lv", add: "fh fd lad Lb2" },
    { cap: tx`Q1's base needs that divided by β again. That's the only current the 8 V source supplies.`, drop: "Li", add: "fi rule Lf" },
    { cap: tx`\(I_{in}\) = 0.66 A / (120 × 120) = 45.83 µA. A 45 µA trickle controls 0.66 A, about 14,400 times more.`, drop: "Lf", add: "La ex" }
  ]
};
