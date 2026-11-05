/* ---------- Part B: pnp green LED driver ---------- */

S.p3 = {
  view: "2d", box: [12, 6, 740, 368], side: [446, 12, 302, 316],
  P: { on: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawPnpLed(s); SC.pnpText(s, h);
    k.loop("lc", h.loopC, { c: "t3" }); k.loop("lb", h.loopB, { c: "t1" });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fb", h.fb, { c: "t1" });
    SC.budget(k, "budC0", 452, 20, 290, "collector loop · the 5 V budget", 5, [{ v: 0, c: "muted", t: "VEC · 0 V" }, { v: 2.7, c: "led-g", t: "LED · 2.7 V" }, { v: 2.3, c: "accent", t: "R2 · what's left" }]);
    SC.budget(k, "budC", 452, 20, 290, "collector loop · the 5 V budget", 5, [{ v: 0, c: "muted", t: "VEC · 0 V" }, { v: 2.7, c: "led-g", t: "LED · 2.7 V" }, { v: 2.3, c: "accent", t: "R2 · 2.3 V" }]);
    SC.ruler(k, "ru2", 452, 124, 290, "E24 near 115 Ω · multipliers × 100 Ω", [1.1, 1.2], 1.04, 1.26, 1.15);
    k.group("eq", g => { const X = k.rx.ru2, y = 124 + 54 - 14; g.text([X(1.125), y], "5 Ω", { anchor: "middle", cls: "sm", c: "cursor" }); g.text([X(1.175), y], "5 Ω", { anchor: "middle", cls: "sm", c: "cursor" }); }, { side: true });
    SC.ruler(k, "ru1", 452, 124, 290, "E24 near 2150 Ω · multipliers × 1 kΩ", [2.0, 2.2, 2.4], 1.95, 2.45, 2.15);
    SC.pick(k, "pk1", "ru1", 2.2, 124);
    SC.budget(k, "budB", 452, 228, 290, "base loop · the 5 V budget", 5, [{ v: 0.7, c: "t1", t: "VEB · 0.7 V" }, { v: 4.3, c: "accent", t: "R1 · 4.3 V" }, { v: 0, c: "muted", t: "Vin · 0 V" }]);
    k.label("Lr2", h.at.R2, tx`R_2=2.3\text{ V}/20\text{ mA}=115\ \Omega`, { c: "accent", dx: -128, dy: 42 });
    k.label("Lib", h.at.R1, tx`I_B=2\text{ mA, out of the base}`, { c: "t1", dx: 0, dy: 44 });
    k.label("Lr1", h.at.R1, tx`R_1=4.3\text{ V}/2\text{ mA}=2150\ \Omega`, { c: "accent", dx: 0, dy: 50 });
    k.label("Ar2", h.at.R2, tx`R_2=120\ \Omega\ \ (\text{or }110\ \Omega)`, { c: "good", dx: -136, dy: 42 });
    k.label("Ar1", h.at.R1, tx`R_1=2.2\text{ k}\Omega`, { c: "good", dx: 0, dy: 44 });
  },
  update(P, k) { k.o.fc.speed = speedOf(0.02); k.o.fb.speed = speedOf(0.002); k.h.led.set(P.on); },
  steps: [
    { cap: tx`Now the loop starts at +5 V on the emitter and runs down through Q1, the LED and R2 to ground. The LED takes 2.7 V, Q1 takes 0 V, and R2 gets the rest.`, add: "lc fc budC0", set: { on: 1 } },
    { cap: tx`R2 drops the leftover 2.3 V at 20 mA: 115 Ω.`, drop: "budC0", add: "budC Lr2" },
    { cap: tx`115 Ω is 1.15 × 100 Ω, exactly 5 Ω from the marks on either side. A tie, so break it on purpose and say how.`, add: "ru2 eq" },
    { cap: tx`The base current is still \(20\text{ mA}/10 = 2\) mA. In a pnp it flows out of the base, through R1, and into the 0 V pin.`, drop: "lc", add: "fb Lib" },
    { cap: tx`The base loop also starts at +5 V: 0.7 V across emitter to base, 0 V at the pin, and R1 takes 4.3 V. That's 2150 Ω.`, drop: "Lib", add: "lb budB Lr1" },
    { cap: tx`2150 Ω is 2.15 × 1 kΩ. Which mark is closer to the arrow?`, drop: "ru2 eq", add: "ru1" },
    { cap: tx`R1 = 2.2 kΩ (50 Ω away against 150 Ω). R2 = 120 Ω: half-up, closer by ratio, and gentler on the LED. 110 Ω ties.`, drop: "Lr1 Lr2 lb", add: "pk1 Ar1 Ar2 lc" }
  ]
};

S.p4 = {
  view: "2d", box: [12, 6, 740, 368], side: [446, 12, 302, 290],
  P: { on: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawPnpLed(s); SC.pnpText(s, h, { part: false });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fb", h.fb, { c: "t1" });
    k.label("Lq", h.at.Q, tx`\texttt{2N3906}`, { c: "cursor", dx: 82, dy: -38 });
    k.label("Ll", h.at.LED, tx`\texttt{GreenLED}`, { c: "cursor", dx: -132, dy: -60 });
    k.label("Lv", h.at.Vin, tx`V_{in}=0\text{ V}`, { c: "cursor", dx: 80, dy: 44 });
    SC.ring(k, "rg", h.flag, 34, 20);
    SC.ring(k, "rq", h.at.Q, 28, 40, "t3");
    SC.op(k, "opQ", 452, 20, 290, [["V(vc):", "?"], ["Ib(Q1):", "?"], ["Ic(Q1):", "?"]]);
    SC.op(k, "opA", 452, 20, 290, [["V(vc):", "4.9592 V"], ["Ib(Q1):", "−1.917 mA"], ["Ic(Q1):", "−18.93 mA"]]);
    k.label("Lneg", [597, 150], tx`\text{minus sign} = \text{flowing out}`, { c: "t1", line: false });
    k.label("Lec", [597, 196], tx`V_{EC}=5\text{ V}-V(vc)`, { c: "t3", line: false });
    k.label("Lck", [597, 246], tx`18\text{ mA}\lt|I_C|\lt 22\text{ mA}\;?`, { c: "t3", line: false });
    k.label("Lb", [597, 282], tx`\beta=I_C/I_B=\;?\quad\text{(signs cancel)}`, { c: "ink", line: false });
    k.label("Aec", [597, 196], tx`V_{EC}=5-4.9592=0.0408\text{ V}`, { c: "good", line: false });
    k.label("Ab", [597, 266], tx`\beta=(-18.93)/(-1.917)\approx 9.88`, { c: "good", line: false });
  },
  update(P, k) { k.o.fc.speed = speedOf(0.02 * P.on); k.o.fb.speed = speedOf(0.002 * P.on); k.h.led.set(P.on); },
  steps: [
    { cap: tx`Same steps as Problem 2 with the parts swapped: a 2N3906, the GreenLED model card, Vin at 0 V, and the collector labelled Vc.`, add: "Lq Ll Lv rg" },
    { cap: tx`Run DC op pnt and copy V(vc), Ib(Q1) and Ic(Q1). Both currents print negative: LTspice counts current into a pin as positive, and these flow out.`, drop: "Lq Ll Lv rg", add: "fc fb opQ Lneg", set: { on: 1 }, dur: 1.4 },
    { cap: tx`The table wants \(V_{EC}\), the voltage across Q1. LTspice gives V(vc) to ground, so subtract it from the 5 V on the emitter.`, add: "rq Lec" },
    { cap: tx`Check \(|I_C|\) is in the window, then divide. Two negatives give a positive β.`, drop: "rq", add: "Lck Lb" },
    { cap: tx`V(vc) ≈ 4.959 V, so \(V_{EC}\) ≈ 40.8 mV. \(I_B\) ≈ −1.917 mA and \(I_C\) ≈ −18.93 mA, so β ≈ 9.88. With 110 Ω: −20.53 mA and β ≈ 10.7.`, drop: "opQ Lec Lck Lb", add: "opA Aec Ab" }
  ]
};
