/* MOSFET HW 2: Sah's equations and the homework's circuits. Copied into both page.js and the scenes. */

/* Sah's equations. vov is the overdrive (VGS − VT, or VSG − |VT| for a p-channel part); vds is VDS (or VSD).
   Returns the drain current's size and the region it came from. */
function sah(beta, vov, vds) {
  if (vov <= 0) return { i: 0, reg: "cutoff" };
  if (vds < vov) return { i: beta * (vov * vds - vds * vds / 2), reg: "triode" };
  return { i: beta / 2 * vov * vov, reg: "saturation" };
}
/* a switch: the MOSFET in series with a load resistor R across a supply. Returns the voltage across the MOSFET, where its
   current equals the resistor's (the load line meets the MOSFET's curve). */
function switchPoint(beta, vov, R, Vdd) {
  let lo = 0, hi = Vdd;
  for (let k = 0; k < 60; k++) { const v = (lo + hi) / 2; if (sah(beta, vov, v).i < (Vdd - v) / R) lo = v; else hi = v; }
  const v = (lo + hi) / 2; return { v, i: (Vdd - v) / R, reg: sah(beta, vov, v).reg };
}

/* engineering format: 0.06444 A -> "64.44mA" */
function eng(v, u = "", d = 4, gap = "") {
  if (!isFinite(v)) return "–";
  if (v === 0) return "0" + gap + u;
  const a = Math.abs(v), P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
  for (const [f, p] of P) if (a >= f * .9995 || f === 1e-15) { const s = (v / f).toPrecision(d); return (s.includes("e") ? String(+s) : s).replace("-", "−") + gap + p + u; }
}
/* dot speed for a current, on a log scale so microamps crawl and amps race */
const spdI = i => i < 1e-7 ? 0 : 8 + 72 * Math.min(1, Math.max(0, (Math.log10(i) + 6) / 6));

/* ---------- the homework's circuits ---------- */
/* Problem 1: the n-channel low-side switch. R1 hangs from the 5 V supply to the drain, and Vin drives the gate. */
function drawN(s, o = {}) {
  const vd = s.vsrc([90, 120]), m = s.mosfet([256, 250]), vi = s.vsrc([120, 300]);
  s.wire([vd.bot, [90, 160]]); s.gnd([90, 160]);
  s.wire([vd.top, [90, 50], [300, 50]]); s.res([300, 50], [300, 150]); s.wire([[300, 150], m.D]); s.node([300, 172]);
  s.wire([[300, 172], [356, 172]]); const fl = s.net([356, 172], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  s.wire([vi.top, [120, 250], m.G]); s.wire([vi.bot, [120, 340], [300, 340]]); s.wire([m.S, [300, 340]]); s.node([300, 340]); s.gnd([300, 340]);
  s.text([64, 112], "Vdd", { anchor: "end" }); s.text([64, 130], o.vdd || "5.0 V", { anchor: "end", cls: "sm" });
  s.text([94, 292], "Vin", { anchor: "end" }); const tin = s.text([94, 310], o.vin || "5.0 V", { anchor: "end", cls: "sm" });
  s.text([318, 96], "R1"); const tr = s.text([318, 114], o.r1 || "", { cls: "sm" });
  s.text([318, 244], "M1"); s.text([318, 262], o.name || "NMOS", { cls: "sm" });
  s.text([288, 194], "D", { anchor: "end", cls: "sm", c: "accent" }); s.text([200, 238], "G", { cls: "sm", c: "accent" }); s.text([288, 310], "S", { anchor: "end", cls: "sm", c: "accent" });
  return { m, t: { vin: tin, r1: tr }, at: { M1: [280, 250], R1: [300, 100], out: [300, 172], gate: [190, 250], vin: [120, 300], vdd: [90, 120] },
    f: { main: [vd.top, [90, 50], [300, 50], [300, 150], ...m.thru, [300, 340]] } };
}
/* Problem 2: the p-channel high-side switch. The source sits on the 5 V supply, R1 runs from the drain to ground. */
function drawP(s, o = {}) {
  const vd = s.vsrc([90, 120]), m = s.mosfet([256, 120], { p: true, sTop: true }), vi = s.vsrc([150, 290]), thru = m.thru.slice().reverse();
  s.wire([vd.bot, [90, 160]]); s.gnd([90, 160]);
  s.wire([vd.top, [90, 46], [300, 46], m.S]);
  s.wire([m.D, [300, 210]]); s.node([300, 186]); s.wire([[300, 186], [356, 186]]); const fl = s.net([356, 186], { w: 46 }); s.text(fl, "Vout", { anchor: "middle", cls: "sm" });
  s.res([300, 210], [300, 300]); s.wire([[300, 300], [300, 340]]);
  s.wire([vi.top, [150, 220], [210, 220], [210, 120], m.G]); s.wire([vi.bot, [150, 340], [300, 340]]); s.node([300, 340]); s.gnd([300, 340]);
  s.text([64, 112], "Vdd", { anchor: "end" }); s.text([64, 130], o.vdd || "5.0 V", { anchor: "end", cls: "sm" });
  s.text([124, 282], "Vin", { anchor: "end" }); const tin = s.text([124, 300], o.vin || "0.0 V", { anchor: "end", cls: "sm" });
  s.text([318, 250], "R1"); const tr = s.text([318, 268], o.r1 || "", { cls: "sm" });
  s.text([318, 112], "M1"); s.text([318, 130], o.name || "PMOS", { cls: "sm" });
  s.text([288, 68], "S", { anchor: "end", cls: "sm", c: "accent" }); s.text([224, 110], "G", { cls: "sm", c: "accent" }); s.text([288, 176], "D", { anchor: "end", cls: "sm", c: "accent" });
  return { m, t: { vin: tin, r1: tr }, at: { M1: [280, 120], R1: [300, 255], out: [300, 186], gate: [232, 120], vin: [150, 290], vdd: [90, 120] },
    f: { main: [vd.top, [90, 46], [300, 46], ...thru, [300, 210], [300, 300], [300, 340]] } };
}
/* the datasheet's test circuit: a source on the gate and a source on the drain (n), or their mirror image (p) */
function drawTest(s, p) {
  if (!p) {
    const m = s.mosfet([200, 190]), g = s.vsrc([110, 240]), d = s.vsrc([380, 210]);
    s.wire([g.top, [110, 190], m.G]); s.wire([g.bot, [110, 300]]); s.gnd([110, 300]);
    s.wire([d.top, [380, 92], [244, 92], m.D]); s.wire([d.bot, [380, 300]]); s.gnd([380, 300]); s.wire([m.S, [244, 300]]); s.gnd([244, 300]);
    s.text([264, 180], "M1"); s.text([264, 198], "NMOS", { cls: "sm" });
    s.text([82, 232], "VGS", { anchor: "end" }); s.text([82, 250], "5.0 V", { anchor: "end", cls: "sm" });
    s.text([408, 202], "VDS"); s.text([408, 220], "10 V", { cls: "sm" });
    return { m, at: { M1: [224, 190], G: [110, 240], D: [380, 210] }, f: { main: [d.top, [380, 92], [244, 92], ...m.thru, [244, 300]] } };
  }
  const m = s.mosfet([300, 200], { p: true, sTop: true, left: true }), d = s.vsrc([110, 210]), g = s.vsrc([390, 160]), thru = m.thru.slice().reverse();
  s.wire([d.top, [110, 92], [390, 92]]); s.wire([m.S, [256, 92]]); s.node([256, 92]); s.wire([d.bot, [110, 300]]); s.gnd([110, 300]);
  s.wire([g.top, [390, 92]]); s.wire([g.bot, [390, 200], m.G]); s.wire([m.D, [256, 300]]); s.gnd([256, 300]);
  s.text([236, 190], "M1", { anchor: "end" }); s.text([236, 208], "PMOS", { anchor: "end", cls: "sm" });
  s.text([82, 202], "VSD", { anchor: "end" }); s.text([82, 220], "10 V", { anchor: "end", cls: "sm" });
  s.text([418, 152], "VSG"); s.text([418, 170], "5.0 V", { cls: "sm" });
  return { m, at: { M1: [276, 200], G: [390, 160], D: [110, 210] }, f: { main: [d.top, [110, 92], [256, 92], ...thru, [256, 300]] } };
}
