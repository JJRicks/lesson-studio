/* ---------- Problem 2: the p-channel switch. a: βp from the datasheet point. b: the switch's current. c: RDS(on) ---------- */
S.p2a = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawTest(k.sch, true); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.lines(k, "ds", 494, 20, 276, "the datasheet says", ["VT = −2.0 V, ID = −0.24 A at", "VGS = −5.0 V, VDS = −10 V.", "Flip every sign: VSG = 5 V,", "VSD = 10 V, |ID| = 0.24 A."], { lh: 21 });
    regionBar(k, "rb", 142, { edge: 3, v: 10, max: 11, el: "VSG − |VT| = 3 V", vl: "VSD = 10 V" });
    SC.box(k, "eq", 256, 104, "saturation: Sah's square law");
    k.label("Le", [CX, 298], tx`|I_D| = (\beta_p/2)\,(V_{SG} - |V_T|)^2`, { c: "ink", line: false });
    k.label("Ls", [CX, 334], tx`\beta_p = 2|I_D|/(V_{SG} - |V_T|)^2`, { c: "accent", line: false });
    k.label("La", [CX, 334], tx`\beta_p = 2(0.24)/(3)^2 = 0.05333\text{ A/V}^2`, { c: "good", line: false });
  },
  update(P, k) { k.o.fm.speed = 50; },
  steps: [
    { cap: tx`A p-channel datasheet lists negative numbers. Flip them into \(V_{SG}\), \(V_{SD}\) and \(|I_D|\), and every quantity is positive again.`, add: "ds" },
    { cap: tx`Find the region. The edge is \(V_{SG} - |V_T|\) = 3 V, and \(V_{SD}\) = 10 V is past it: saturation.`, add: "rb" },
    { cap: tx`Write the square law with the flipped quantities, and solve it for \(\beta_p\).`, add: "eq Le Ls" },
    { cap: tx`\(\beta_p\) = 2(0.24 A)/(3 V)² = 0.05333 A/V². That's less than half of the n-channel part's.`, drop: "Ls", add: "La" }
  ]
};

S.p2b = {
  ...BOX,
  P: { on: 0 },
  build(k) {
    const h = k.h = drawP(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    k.label("Lg", h.at.gate, tx`V_{SG} = 5 - 0 = 5\text{ V}`, { c: "cursor", dy: -32, line: false });
    k.label("Ld", h.at.out, tx`V_{SD} = 5 - 4.8 = 0.2\text{ V}`, { c: "cursor", dx: 40, dy: 32, line: false });
    SC.lines(k, "rd", 494, 20, 276, "read the circuit", ["Source: the 5 V supply.", "Gate: Vin = 0 V, so VSG = 5 V.", "Drain: Vout = 4.8 V,", "so VSD = 0.2 V."], { lh: 22 });
    regionBar(k, "rb", 146, { edge: 3, v: .2, max: 5, el: "VSG − |VT| = 3 V", vl: "VSD = 0.2 V" });
    SC.box(k, "eq", 258, 102, "triode: Sah's equation");
    k.label("Le", [CX, 298], tx`|I_D| = \beta_p\left[(V_{SG} - |V_T|)V_{SD} - V_{SD}^2/2\right]`, { c: "ink", line: false });
    k.label("Lv", [CX, 334], tx`= \beta_p\left[(3)(0.2) - 0.2^2/2\right]`, { c: "accent", line: false });
    k.label("La", [CX, 334], tx`I_D = -30.93\text{ mA}`, { c: "good", line: false });
  },
  update(P, k) { k.o.fm.speed = 18 * P.on; },
  steps: [
    { cap: tx`Measure from the source, which sits on the 5 V supply. The gate is at 0 V, so \(V_{SG}\) = 5 V. The drain is at 4.8 V, so \(V_{SD}\) = 0.2 V.`, add: "rd Lg Ld" },
    { cap: tx`Find the region. 0.2 V is far below the edge at 3 V, so it's triode, just like Problem 1.`, add: "rb" },
    { cap: tx`Use the triode equation with part a's \(\beta_p\). Compute \(|I_D|\), then give it its sign.`, add: "eq Le Lv" },
    { cap: tx`\(|I_D|\) = 0.05333(0.58) = 30.93 mA. It flows out of the drain, so \(I_D\) = −30.93 mA.`, drop: "Lv", add: "La", set: { on: 1 } }
  ]
};

S.p2c = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawP(k.sch); k.flow("fm", h.f.main, { c: "t3", gap: 16 });
    SC.ring(k, "rgM", h.at.M1, 27, 50);
    SC.box(k, "eq", 20, 104, "the switch's own resistance");
    k.label("Le", [CX, 62], tx`R_{DS(on)} = V_{SD}/|I_D|`, { c: "ink", line: false });
    k.label("Lv", [CX, 98], tx`= 0.2\text{ V}/|I_D|\ \ (\text{from part b})`, { c: "accent", line: false });
    k.label("La", [CX, 98], tx`R_{DS(on)} = 6.466\ \Omega`, { c: "good", line: false });
    SC.lines(k, "cmp", 494, 136, 276, "the two switches, same 5 V drive", ["n-channel, Problem 1: 3.103 Ω", "p-channel, Problem 2: 6.466 Ω", "", "The ratio is 2.083, exactly", "βn / βp."], { lh: 21 });
  },
  update(P, k) { k.o.fm.speed = 18; },
  steps: [
    { cap: tx`Same idea as Problem 1c, with the p-channel quantities: \(R_{DS(on)} = V_{SD}/|I_D|\).`, add: "rgM eq Le" },
    { cap: tx`Use \(V_{SD}\) = 0.2 V and the size of the current from part b. Compute it.`, add: "Lv" },
    { cap: tx`\(R_{DS(on)}\) = 0.2 V/30.93 mA = 6.466 Ω, inside the hint's 6.3 to 6.6 Ω, and about twice the n-channel switch's.`, drop: "Lv", add: "La cmp" }
  ]
};
