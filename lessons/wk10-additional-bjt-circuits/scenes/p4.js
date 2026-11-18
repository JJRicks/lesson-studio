/* ---------- Problem 4: the regulator. a finds Vout from the feedback divider, b the load current, c walks the current back to U1 ---------- */
function regFlows(k, h) {
  k.flow("fl", h.f.c2, { c: "t3", gap: 14 }); k.flow("fll", h.f.load, { c: "t3", gap: 14 }); k.flow("fdv", h.f.div, { c: "t2", gap: 22 });
  k.flow("fc1", h.f.c1, { c: "t1", gap: 18 }); k.flow("fh", h.f.hand, { c: "t1", gap: 18 }); k.flow("fd", h.f.drive, { c: "cursor", gap: 24 });
}
function regSpeeds(k) { k.o.fl.speed = 70; k.o.fll.speed = 70; k.o.fdv.speed = 10; k.o.fc1.speed = 22; k.o.fh.speed = 22; k.o.fd.speed = 7; }

S.p4a = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawReg(k.sch); regFlows(k, h);
    SC.ring(k, "rgU", [84, 120], 22, 34);
    SC.lines(k, "asm", 494, 20, 276, "assumptions", ["U1 is ideal. Negative feedback", "drives its output until V− = V+.", "Its inputs draw no current.", "U1's output stays below 12 V.", "Each junction drops 0.7 V."], { lh: 21 });
    SC.ring(k, "rgS", [50, 196], 16, 66, "t2");
    k.label("Lid", h.at.R2, tx`I_{div} = 4.0\text{ V}/20\text{ k}\Omega = 0.2\text{ mA}`, { c: "t2", dx: 130, dy: 44 });
    SC.box(k, "rule", 160, 82, "add R1's drop to the 4.0 V");
    k.label("Lf", [CX, 206], tx`V_{out} = 4.0\text{ V} + (0.2\text{ mA})(10\text{ k}\Omega)`, { c: "accent", line: false });
    k.label("La", [CX, 206], tx`V_{out} = 6.000\text{ V}`, { c: "good", line: false });
    SC.lines(k, "chk", 494, 254, 276, "check the assumption", ["U1 out = 6.0 + 1.4 = 7.4 V", "below 12 V, so U1 has room."], { lh: 22 });
  },
  update(P, k) { regSpeeds(k); },
  steps: [
    { cap: tx`Assume an ideal op-amp. With negative feedback it drives its output until \(V_- = V_+\), and its inputs draw no current.`, add: "rgU asm" },
    { cap: tx`So the − input sits at 4.0 V. That puts 4.0 V across R2, which sets the current in the divider.`, drop: "rgU", add: "rgS fdv Lid" },
    { cap: tx`No current goes into the − input, so the same 0.2 mA flows through R1. Add R1's drop to the 4.0 V.`, drop: "rgS", add: "rule Lf" },
    { cap: tx`\(V_{out}\) = 4.0 V + 2.0 V = 6.000 V. The transistors' 1.4 V doesn't come off it, because U1's output rises to 7.4 V to cover it.`, drop: "Lf", add: "La chk fl fll fc1 fh fd" }
  ]
};

S.p4b = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawReg(k.sch); regFlows(k, h);
    SC.ring(k, "rgL", h.at.RL, 12, 44, "t3");
    SC.lines(k, "acr", 494, 20, 276, "what the load sees", ["Its top is the output node.", "Its bottom is ground.", "So it has all of Vout across it."], { lh: 22 });
    SC.box(k, "rule", 130, 82, "Ohm's law, with your part a");
    k.label("Lf", [CX, 176], tx`I_{Rload} = V_{out}/10\ \Omega`, { c: "accent", line: false });
    k.label("La", [CX, 176], tx`I_{Rload} = 0.6000\text{ A}`, { c: "good", line: false });
    SC.lines(k, "why", 494, 226, 276, "why the transistors are there", ["Most op-amps can only supply", "a few tens of milliamps.", "This load wants far more."], { lh: 22 });
  },
  update(P, k) { regSpeeds(k); },
  steps: [
    { cap: tx`The load runs from the output node to ground, so the whole output voltage sits across it.`, add: "rgL acr fl fll" },
    { cap: tx`Divide the output voltage from part a by the 10 Ω load.`, add: "rule Lf" },
    { cap: tx`\(I_{Rload}\) = 6.000 V / 10 Ω = 0.6000 A, or 600 mA.`, drop: "Lf rgL", add: "La why" }
  ]
};

S.p4c = {
  ...BOX,
  P: {},
  build(k) {
    const h = k.h = drawReg(k.sch); regFlows(k, h);
    SC.ring(k, "rgO", h.at.out, 14, 14, "t3");
    SC.box(k, "sum", 20, 76, "two currents leave Q2's emitter");
    k.label("Ls", [CX, 64], tx`I_{E2} = I_{Rload} + 0.2\text{ mA}`, { c: "t3", line: false });
    SC.box(k, "b2", 104, 76, "back through Q2");
    k.label("Lb2", [CX, 148], tx`I_{B2} = I_{E1} = I_{E2}/110`, { c: "t1", line: false });
    SC.box(k, "rule", 188, 76, "back through Q1, to U1");
    k.label("Lf", [CX, 232], tx`I_{out} = I_{E2}/(110 \cdot 80)`, { c: "accent", line: false });
    k.label("La", [CX, 232], tx`I_{out} = 68.20\ \mu\text{A}`, { c: "good", line: false });
    SC.lines(k, "ex", 494, 272, 276, "", ["exact, with β + 1: 66.76 µA", "hint: 65 to 75 µA"], { lh: 20 });
  },
  update(P, k) { regSpeeds(k); },
  steps: [
    { cap: tx`Two currents leave Q2's emitter: the load current from part b, and the 0.2 mA that runs down the divider.`, add: "rgO fl fll fdv sum Ls" },
    { cap: tx`Q2's base needs its emitter current divided by 110. All of it comes out of Q1's emitter.`, drop: "rgO", add: "fc1 fh b2 Lb2" },
    { cap: tx`Q1's base needs that divided by 80. Q1's base current is the current coming out of U1.`, add: "fd rule Lf" },
    { cap: tx`\(I_{out}\) = 0.6002 A / (110 × 80) = 68.20 µA, inside the hint's 65 to 75 µA. U1 supplies 68 µA so the load can draw 600 mA.`, drop: "Lf", add: "La ex" }
  ]
};
