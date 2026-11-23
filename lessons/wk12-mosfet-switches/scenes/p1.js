/* ---------- Problem 1: the n-channel switch. a: βn from the datasheet point. b: the switch's current. c: RDS(on) ---------- */
S.p1a = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawTest(k.sch, false); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.lines(k, "ds", 494, 20, 276, "the datasheet says", ["VT = 2.0 V", "ID = 0.5 A when", "VGS = 5.0 V and VDS = 10 V"], { lh: 22 });
    regionBar(k, "rb", 126, { edge: 3, v: 10, max: 11, el: "VGS − VT = 3 V", vl: "VDS = 10 V" });
    SC.box(k, "eq", 242, 112, "saturation: Sah's square law");
    k.label("Le", [CX, 286], tx`I_D = (\beta_n/2)\,(V_{GS} - V_T)^2`, { c: "ink", line: false });
    k.label("Ls", [CX, 324], tx`\beta_n = 2 I_D/(V_{GS} - V_T)^2`, { c: "accent", line: false });
    k.label("La", [CX, 324], tx`\beta_n = 2(0.5)/(3)^2 = 0.1111\text{ A/V}^2`, { c: "good", line: false });
  },
  update(P, k) { k.o.fm.speed = 60; },
  steps: [
    { cap: tx`The datasheet's test puts 5 V on the gate and 10 V on the drain, and measures 0.5 A. That one point is all you need.`, add: "ds" },
    { cap: tx`Find the region first. Saturation starts at \(V_{DS} = V_{GS} - V_T\) = 3 V, and the test's 10 V is well past it.`, add: "rb" },
    { cap: tx`So the square law applies. It has one unknown, \(\beta_n\). Solve for it.`, add: "eq Le Ls" },
    { cap: tx`\(\beta_n\) = 2(0.5 A)/(3 V)² = 0.1111 A/V², which is 1/9 exactly.`, drop: "Ls", add: "La" }
  ]
};

S.p1b = {
  ...BOX,
  P: { on: 0 },
  build(k) {
    const h = k.h = drawN(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    k.label("Lg", h.at.gate, tx`V_{GS} = 5\text{ V}`, { c: "cursor", dy: -28, line: false });
    k.label("Ld", h.at.out, tx`V_{DS} = 0.2\text{ V}`, { c: "cursor", dx: 36, dy: 30, line: false });
    SC.lines(k, "rd", 494, 20, 276, "read the circuit", ["Gate: Vin = 5 V. Source: ground.", "So VGS = 5 V.", "Drain: Vout = 0.2 V.", "So VDS = 0.2 V."], { lh: 22 });
    regionBar(k, "rb", 146, { edge: 3, v: .2, max: 5, el: "VGS − VT = 3 V", vl: "VDS = 0.2 V" });
    SC.box(k, "eq", 258, 102, "triode: Sah's equation");
    k.label("Le", [CX, 298], tx`I_D = \beta_n\left[(V_{GS} - V_T)V_{DS} - V_{DS}^2/2\right]`, { c: "ink", line: false });
    k.label("Lv", [CX, 334], tx`= \beta_n\left[(3)(0.2) - 0.2^2/2\right]`, { c: "accent", line: false });
    k.label("La", [CX, 334], tx`I_D = 64.44\text{ mA}`, { c: "good", line: false });
  },
  update(P, k) { k.o.fm.speed = 22 * P.on; },
  steps: [
    { cap: tx`Read the voltages off the circuit. The source is grounded, so \(V_{GS}\) is Vin = 5 V and \(V_{DS}\) is Vout = 0.2 V.`, add: "rd Lg Ld" },
    { cap: tx`Find the region. 0.2 V is far below the edge at \(V_{GS} - V_T\) = 3 V. The channel runs end to end: triode.`, add: "rb" },
    { cap: tx`Use the triode equation with \(\beta_n\) from part a. Compute it.`, add: "eq Le Lv" },
    { cap: tx`\(I_D\) = (1/9)(0.6 − 0.02) = 64.44 mA. It flows down from the 5 V supply, through R1 and M1, to ground.`, drop: "Lv", add: "La", set: { on: 1 } }
  ]
};

S.p1c = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawN(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.ring(k, "rgM", h.at.M1, 27, 50);
    SC.box(k, "eq", 20, 104, "the switch's own resistance");
    k.label("Le", [CX, 62], tx`R_{DS(on)} = V_{DS}/I_D`, { c: "ink", line: false });
    k.label("Lv", [CX, 98], tx`= 0.2\text{ V}/I_D\ \ (I_D\text{ from part b})`, { c: "accent", line: false });
    k.label("La", [CX, 98], tx`R_{DS(on)} = 3.103\ \Omega`, { c: "good", line: false });
    SC.lines(k, "bud", 494, 136, 276, "where the 5 V goes", ["R1 (the load):  4.8 V", "M1 (the switch): 0.2 V", "", "M1 heats up by 0.2 V × ID,", "about 13 mW."], { lh: 21 });
  },
  update(P, k) { k.o.fm.speed = 22; },
  steps: [
    { cap: tx`A fully-on MOSFET acts like a small resistor. \(R_{DS(on)}\) is that resistance: the voltage across the switch over the current through it.`, add: "rgM eq Le" },
    { cap: tx`Use \(V_{DS}\) = 0.2 V and the current you found in part b. Compute it.`, add: "Lv" },
    { cap: tx`\(R_{DS(on)}\) = 0.2 V/64.44 mA = 3.103 Ω, inside the hint's 2.5 to 3.5 Ω. R1 drops the other 4.8 V, so the load gets 96% of the supply.`, drop: "Lv", add: "La bud" }
  ]
};
