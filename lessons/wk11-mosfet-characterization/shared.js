/* MOSFET HW 1: LTspice's VDMOS model and the homework's four test circuits. Copied into both page.js and the scenes.
   The equations and parameters match verify.py, which checks them against the instructor's own cursor readings. */
const MOS = {
  n2N7002: { Vto: 1.6, Kp: .17, mtr: 1.25, Rs: .75, Rd: 0, ks: .1 },   // standard.mos: Fairchild 2N7002
  BSS84: { Vto: 2.1, Kp: .2, mtr: 1, Rs: 1.8, Rd: 2.4, ks: .1 },      // standard.mos: NXP BSS84 (pchan; run it on VSG, VSD and |Vto|)
  BSS123: { Vto: 1.6, Kp: 1, mtr: 1, Rs: 1.8, Rd: 2.4, ks: .1 }       // standard.mos: Fairchild BSS123, the demos' part
};
/* the overdrive the channel sees: a smooth version of Vgs - Vto that never quite reaches zero (ksubthres) */
function vgst(m, v) { const a = (v - m.Vto) / m.ks; return m.ks * (a > 30 ? a + Math.log1p(Math.exp(-a)) : Math.log1p(Math.exp(a))); }
function idCore(m, vgs, vds) { const g = vgst(m, vgs), d = vds * m.mtr; return g <= d ? m.Kp / 2 * g * g : m.Kp * d * (g - d / 2); }
/* drain current (magnitude) for terminal voltages; bisection solves the drops across the series Rs and Rd */
function mosId(m, vgs, vds) {
  if (vds <= 0) return 0;
  let lo = 0, hi = Math.min(20, vds / Math.max(m.Rs + m.Rd, 1e-3));
  for (let k = 0; k < 64; k++) { const i = (lo + hi) / 2; if (i < idCore(m, vgs - i * m.Rs, vds - i * (m.Rs + m.Rd))) lo = i; else hi = i; }
  return (lo + hi) / 2;
}
/* where a curve flattens: the external Vds at which the channel pinches off */
function kneeOf(m, vgs) { const i = mosId(m, vgs, 100); return { v: vgst(m, vgs - i * m.Rs) / m.mtr + i * (m.Rs + m.Rd), i }; }
function regionOf(m, vgs, vds) {
  const i = mosId(m, vgs, vds), g = vgst(m, vgs - i * m.Rs);
  if (g < .03) return "cutoff";
  return g <= Math.max(0, vds - i * (m.Rs + m.Rd)) * m.mtr ? "saturation" : "triode";
}
/* a DC sweep's points: n + 1 values from a to b, like .dc's start, stop and step */
const sweepX = (a, b, step) => { const n = Math.round((b - a) / step), out = []; for (let k = 0; k <= n; k++) out.push(+(a + k * step).toFixed(6)); return out; };

/* engineering format: 0.0002487 A -> "248.7µA". LTspice writes the unit right after the number. */
function eng(v, u = "", d = 4, gap = "") {
  if (!isFinite(v)) return "–";
  if (v === 0) return "0" + gap + u;
  const a = Math.abs(v), P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
  for (const [f, p] of P) if (a >= f * .9995 || f === 1e-15) { const s = (v / f).toPrecision(d); return (s.includes("e") ? String(+s) : s).replace("-", "−") + gap + p + u; }
}

/* ---------- the homework's circuits, laid out like the instructor's LTspice schematics ---------- */
/* Problem 1: 2N7002 with its drain tied to its gate, Vgs swept */
function drawP1(s, o = {}) {
  const m = s.mosfet([220, 190]), v = s.vsrc([110, 240]);
  s.wire([v.top, [110, 190], m.G]); s.wire([[110, 190], [110, 92], [264, 92], m.D]); s.node([110, 190]);
  s.wire([m.S, [264, 300]]); s.gnd([264, 300]); s.wire([v.bot, [110, 300]]); s.gnd([110, 300]);
  s.text([284, 180], "M1"); s.text([284, 198], o.name || "2N7002", { cls: "sm" });
  s.text([80, 232], o.src || "Vgs", { anchor: "end" }); s.text([80, 250], "swept", { anchor: "end", cls: "sm" });
  if (o.dc !== false) s.text([40, 352], ".dc Vgs 0.5 3.0 1m", { cls: "sm" });
  return { m, at: { M1: [244, 190], V: [110, 240], tie: [187, 92], gate: [165, 190] },
    f: { main: [v.top, [110, 92], [264, 92], ...m.thru, [264, 300]] } };
}
/* Problem 2: 2N7002 with Vgs on the gate and Vds on the drain */
function drawP2(s) {
  const m = s.mosfet([200, 190]), g = s.vsrc([110, 240]), d = s.vsrc([380, 210]);
  s.wire([g.top, [110, 190], m.G]); s.wire([g.bot, [110, 300]]); s.gnd([110, 300]);
  s.wire([d.top, [380, 92], [244, 92], m.D]); s.wire([d.bot, [380, 300]]); s.gnd([380, 300]);
  s.wire([m.S, [244, 300]]); s.gnd([244, 300]);
  s.text([264, 180], "M1"); s.text([264, 198], "2N7002", { cls: "sm" });
  s.text([80, 232], "Vgs", { anchor: "end" }); s.text([80, 250], "stepped", { anchor: "end", cls: "sm" });
  s.text([410, 202], "Vds"); s.text([410, 220], "swept", { cls: "sm" });
  s.text([40, 352], ".dc Vds 0 10 0.1 Vgs 1 5 1", { cls: "sm" });
  return { m, at: { M1: [224, 190], Vg: [110, 240], Vd: [380, 210] }, f: { main: [d.top, [380, 92], [244, 92], ...m.thru, [244, 300]] } };
}
/* Problem 3: BSS84 with its source on top at ground, and Vsg pulling the tied gate and drain below it */
function drawP3(s, o = {}) {
  const m = s.mosfet([300, 200], { p: true, sTop: true, left: true }), v = s.vsrc([390, 160]), thru = m.thru.slice().reverse();
  s.wire([[150, 92], [390, 92]]); s.gnd([150, 92]); s.wire([m.S, [256, 92]]); s.node([256, 92]);
  s.wire([v.top, [390, 92]]); s.wire([v.bot, [390, 200], m.G]); s.node([390, 200]);
  s.wire([m.D, [256, 300], [390, 300], [390, 200]]);
  s.text([236, 190], "M1", { anchor: "end" }); s.text([236, 208], o.name || "BSS84", { anchor: "end", cls: "sm" });
  s.text([420, 152], o.src || "Vsg"); s.text([420, 170], "swept", { cls: "sm" });
  if (o.dc !== false) s.text([40, 352], ".dc Vsg 0.5 3.0 1m", { cls: "sm" });
  return { m, at: { M1: [276, 200], V: [390, 160], tie: [323, 300], gate: [345, 200], top: [256, 92] },
    f: { main: [v.top, [390, 92], [256, 92], ...thru, [256, 300], [390, 300], v.bot] } };
}
/* Problem 4: BSS84 with Vsd on its source and Vsg holding the gate below the source */
function drawP4(s) {
  const m = s.mosfet([300, 200], { p: true, sTop: true, left: true }), d = s.vsrc([110, 210]), g = s.vsrc([390, 160]), thru = m.thru.slice().reverse();
  s.wire([d.top, [110, 92], [390, 92]]); s.wire([m.S, [256, 92]]); s.node([256, 92]); s.wire([d.bot, [110, 300]]); s.gnd([110, 300]);
  s.wire([g.top, [390, 92]]); s.wire([g.bot, [390, 200], m.G]);
  s.wire([m.D, [256, 300]]); s.gnd([256, 300]);
  s.text([236, 190], "M1", { anchor: "end" }); s.text([236, 208], "BSS84", { anchor: "end", cls: "sm" });
  s.text([80, 202], "Vsd", { anchor: "end" }); s.text([80, 220], "swept", { anchor: "end", cls: "sm" });
  s.text([420, 152], "Vsg"); s.text([420, 170], "stepped", { cls: "sm" });
  s.text([40, 352], ".dc Vsd 0 10 0.1 Vsg 2 6 1", { cls: "sm" });
  return { m, at: { M1: [276, 200], Vd: [110, 210], Vg: [390, 160] }, f: { main: [d.top, [110, 92], [256, 92], ...thru, [256, 300]] } };
}
/* dot speed for a current, on a log scale so microamps crawl and amps race */
const spdI = i => i < 1e-7 ? 0 : 8 + 72 * Math.min(1, Math.max(0, (Math.log10(i) + 6) / 6));
