/* ---------- Part A: npn white LED driver ---------- */

S.p1 = {
  view: "2d", box: [12, 6, 740, 368], side: [446, 12, 302, 316],
  P: { on: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawNpnLed(s); SC.npnText(s, h);
    k.loop("lc", h.loopC, { c: "t3" }); k.loop("lb", h.loopB, { c: "t1" });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fb", h.fb, { c: "t1" });
    SC.budget(k, "budC0", 452, 20, 290, "collector loop · the 5 V budget", 5, [{ v: 1.8, c: "accent", t: "R2 · what's left" }, { v: 3.2, c: "led-w", t: "LED · 3.2 V" }, { v: 0, c: "muted", t: "VCE · 0 V" }]);
    SC.budget(k, "budC", 452, 20, 290, "collector loop · the 5 V budget", 5, [{ v: 1.8, c: "accent", t: "R2 · 1.8 V" }, { v: 3.2, c: "led-w", t: "LED · 3.2 V" }, { v: 0, c: "muted", t: "VCE · 0 V" }]);
    SC.ruler(k, "ru2", 452, 124, 290, "E24 near 90 Ω · multipliers × 10 Ω", [6.8, 7.5, 8.2, 9.1, 10], 6.5, 10.3, 9.0);
    SC.ruler(k, "ru1", 452, 124, 290, "E24 near 1300 Ω · multipliers × 1 kΩ", [1.0, 1.1, 1.2, 1.3, 1.5, 1.6], .96, 1.64, 1.3);
    SC.pick(k, "pk1", "ru1", 1.3, 124);
    SC.budget(k, "budB", 452, 228, 290, "base loop · the 3.3 V budget", 3.3, [{ v: 2.6, c: "accent", t: "R1 · 2.6 V" }, { v: 0.7, c: "t1", t: "VBE · 0.7 V" }]);
    k.label("Lr2", h.at.R2, tx`R_2=1.8\text{ V}/20\text{ mA}=90\ \Omega`, { c: "accent", dx: -122, dy: 12 });
    k.label("Lib", h.at.R1, tx`I_B=20\text{ mA}/10=2\text{ mA}`, { c: "t1", dx: 0, dy: -50 });
    k.label("Lr1", h.at.R1, tx`R_1=2.6\text{ V}/2\text{ mA}=1300\ \Omega`, { c: "accent", dx: 20, dy: 50 });
    k.label("Ar2", h.at.R2, tx`R_2=91\ \Omega`, { c: "good", dx: -92, dy: 12 });
    k.label("Ar1", h.at.R1, tx`R_1=1.3\text{ k}\Omega`, { c: "good", dx: 10, dy: 46 });
  },
  update(P, k) { k.o.fc.speed = speedOf(0.02); k.o.fb.speed = speedOf(0.002); k.h.led.set(P.on); },
  steps: [
    { cap: tx`The collector loop: 5 V pushes current through R2, the LED and Q1 to ground. The LED takes 3.2 V and a saturated Q1 takes 0 V, so R2 gets the rest.`, add: "lc fc budC0", set: { on: 1 } },
    { cap: tx`R2 must drop the leftover 1.8 V while 20 mA flows through it. Ohm's law gives 90 Ω.`, drop: "budC0", add: "budC Lr2" },
    { cap: tx`90 Ω is 9.0 × 10 Ω. On the E24 ruler the arrow sits between two marks. Which is closer?`, add: "ru2" },
    { cap: tx`Now the base. For a sure saturation, give it one tenth of the collector current: \(I_B = 2\) mA.`, drop: "lc", add: "fb Lib" },
    { cap: tx`The base loop: 3.3 V from the pin, 0.7 V across the base-emitter diode, and R1 takes the other 2.6 V.`, drop: "Lib", add: "lb budB" },
    { cap: tx`R1 drops 2.6 V at 2 mA: 1300 Ω.`, add: "Lr1" },
    { cap: tx`1300 Ω is 1.3 × 1 kΩ. Look for 1.3 on the ruler.`, drop: "ru2", add: "ru1" },
    { cap: tx`R1 = 1.3 kΩ exactly, since 1.3 is in E24. R2 = 91 Ω, 1 Ω from 90 (82 Ω is 8 Ω away).`, drop: "Lr1 Lr2 lb", add: "pk1 Ar1 Ar2 lc" }
  ]
};

S.p2 = {
  view: "2d", box: [12, 6, 740, 368], side: [446, 12, 302, 350],
  P: { on: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawNpnLed(s); SC.npnText(s, h, { part: false });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fb", h.fb, { c: "t1" });
    k.label("Lq", h.at.Q, tx`\texttt{2N3904}`, { c: "cursor", dx: 92, dy: 30 });
    k.label("Ll", h.at.LED, tx`\texttt{WhiteLED}`, { c: "cursor", dx: -112, dy: -2 });
    k.label("L1", h.at.R1, tx`\text{your }R_1`, { c: "cursor", dx: 0, dy: 46 });
    k.label("L2", h.at.R2, tx`\text{your }R_2`, { c: "cursor", dx: -96, dy: 4 });
    SC.lines(k, "card", 452, 20, 290, "SPICE directive · the model card", [".model WhiteLED D (IS=93.1P RS=42M", "+ N=6.45 BV=5 IBV=30U CJO=2.97P", "+ VJ=.75 M=.333 TT=4.32U)"], { c: "ink" });
    SC.lines(k, "opcmd", 452, 120, 290, "Simulate › Configure Analysis", ["DC op pnt  →  .op"], { cls: "", c: "ink", lh: 22 });
    SC.ring(k, "rg", h.flag, 42, 21);
    SC.op(k, "opQ", 452, 186, 290, [["V(vce):", "?"], ["Ib(Q1):", "?"], ["Ic(Q1):", "?"]]);
    SC.op(k, "opA", 452, 186, 290, [["V(vce):", "0.0407 V"], ["Ib(Q1):", "1.935 mA"], ["Ic(Q1):", "19.38 mA"]]);
    k.label("Lck", [597, 316], tx`18\text{ mA}\lt I_C\lt 22\text{ mA}\;?`, { c: "t3", line: false });
    k.label("Lb", [597, 346], tx`\beta=I_C/I_B=\;?`, { c: "ink", line: false });
    k.label("Lba", [597, 330], tx`\beta=19.38/1.935\approx 10.0`, { c: "good", line: false });
  },
  update(P, k) { k.o.fc.speed = speedOf(0.02 * P.on); k.o.fb.speed = speedOf(0.002 * P.on); k.h.led.set(P.on); },
  steps: [
    { cap: tx`Draw Figure 1 in LTspice. The parts are generic until you change their values: the npn to 2N3904 and the LED to WhiteLED. Use your own R1 and R2.`, add: "Lq Ll L1 L2" },
    { cap: tx`WhiteLED isn't in LTspice's library, so paste its model card as a SPICE directive. The LED's value must match the card's name.`, add: "card" },
    { cap: tx`Pick DC op pnt, which puts .op on the schematic, and label the collector Vce so it shows up in the printout by name.`, drop: "Lq Ll L1 L2", add: "opcmd rg" },
    { cap: tx`Run it. LTspice solves every DC voltage and current and prints them. Copy these three lines.`, drop: "rg", add: "fc fb opQ", set: { on: 1 }, dur: 1.4 },
    { cap: tx`Check the LED current is in the visible window, then divide \(I_C\) by \(I_B\).`, add: "Lck Lb" },
    { cap: tx`About 40.7 mV, 1.935 mA and 19.38 mA, so β ≈ 10.0, the forced beta you designed for.`, drop: "opQ Lb Lck", add: "opA Lba" }
  ]
};
