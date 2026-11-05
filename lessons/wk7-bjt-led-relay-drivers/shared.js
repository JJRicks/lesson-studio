/* Shared by page.js and the scenes: the circuit models (a port of verify.py), E24 helpers, and the three homework circuits. */
const VTH = 1.380649e-23 * 300.15 / 1.602176634e-19;          // thermal voltage at 27 C, LTspice's default
const Q3904 = { IS: 1e-14, BF: 300, BR: 4, VAF: 100, IKF: 0.4, RB: 20, RC: 0.1, RE: 0.1 };
const Q3906 = { IS: 1e-14, BF: 200, BR: 4, VAF: 100, IKF: 0.4, RB: 20, RC: 0.1, RE: 0.1 };
const WHITE = { IS: 93.1e-12, N: 6.45, RS: 0.042 }, GREEN = { IS: 93.2e-12, N: 5.43, RS: 0.042 };

function gpI(vbe, vbc, m) {                                  // Gummel-Poon DC, npn sense: [collector current, base current]
  const If = m.IS * Math.expm1(vbe / VTH), Ir = m.IS * Math.expm1(vbc / VTH);
  const q1 = 1 / (1 - vbc / m.VAF), qb = q1 / 2 * (1 + Math.sqrt(Math.max(0, 1 + 4 * If / m.IKF)));
  return [(If - Ir) / qb - Ir / m.BR, If / m.BF + Ir / m.BR];
}
const ledV = (i, d) => d.N * VTH * Math.log1p(i / d.IS) + i * d.RS;
const ledI = (v, d) => {                                      // current at forward voltage v (solves the RS drop)
  if (v <= 0) return 0;
  let lo = 0, hi = Math.max(1e-9, v / d.RS);
  for (let j = 0; j < 90; j++) { const m = (lo + hi) / 2; if (ledV(m, d) > v) hi = m; else lo = m; }
  return (lo + hi) / 2;
};
function bisect(fn, lo, hi, n = 56) {
  let flo = fn(lo);
  for (let j = 0; j < n; j++) { const m = (lo + hi) / 2, fm = fn(m); if (fm * flo > 0) { lo = m; flo = fm; } else hi = m; }
  return (lo + hi) / 2;
}
/* vin - R1 - base; vcc - rload - (LED) - collector; emitter grounded. Returns pin values like LTspice's .op */
function npnDrive(vin, vcc, r1, rload, m = Q3904, led = null) {
  if (vin <= 0.01) return { VCE: vcc, IB: 0, IC: 0, beta: NaN, VBE: Math.max(0, vin), VLED: 0 };
  const pins = (vbe, vbc) => { const [ic, ib] = gpI(vbe, vbc, m), ie = ic + ib; return [ic, ib, ic * m.RC + (vbe - vbc) + ie * m.RE, ib * m.RB + vbe + ie * m.RE]; };
  const vbeFor = vbc => bisect(vbe => { const p = pins(vbe, vbc); return vin - p[1] * r1 - p[3]; }, -3, 1.5);
  const coll = vbc => { const [ic, , vce] = pins(vbeFor(vbc), vbc); return vcc - ic * rload - (led ? (ic > 0 ? ledV(ic, led) : -1) : 0) - vce; };
  const hi = VTH * Math.log(vin * m.BR / (m.IS * (r1 + m.RB))) - 1e-4, vbc = bisect(coll, -vcc - 1, hi), vbe = vbeFor(vbc);
  const [IC, IB, VCE, VBE] = pins(vbe, vbc);
  return { VCE, IB, IC, beta: IC / IB, VBE, VLED: led && IC > 0 ? ledV(IC, led) : 0 };
}
/* vcc on the emitter; vin - R1 - base; collector - LED - R2 - ground. The npn circuit upside down: currents come out negative, as LTspice prints them */
function pnpDrive(vin, vcc, r1, r2, m = Q3906, led = GREEN) {
  const r = npnDrive(vcc - vin, vcc, r1, r2, m, led);
  return { VEC: r.VCE, VC: vcc - r.VCE, IB: -r.IB, IC: -r.IC, beta: r.beta, VEB: r.VBE, VLED: r.VLED };
}
const region = (ib, ic, vce, beta) => ib <= 1e-7 ? "cutoff" : vce < 0.25 && ic < 0.9 * beta * ib ? "saturation" : "active";

const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
function e24near(r) {                                         // { lo, hi, pick, tie } using plain difference, like the homework's 2.1 k example
  const d = Math.pow(10, Math.floor(Math.log10(r) + 1e-9)), vals = [];
  for (const k of [d / 10, d, d * 10]) for (const m of E24) vals.push(+(m * k).toPrecision(3));
  const lo = Math.max(...vals.filter(v => v <= r * (1 + 1e-9))), hi = Math.min(...vals.filter(v => v >= r * (1 - 1e-9)));
  const a = r - lo, b = hi - r, tie = lo !== hi && Math.abs(a - b) < 1e-9 * r;
  return { lo, hi, tie, pick: lo === hi ? lo : tie ? null : a < b ? lo : hi };
}
const speedOf = i => 72 * Math.sqrt(Math.max(0, i) / 0.02);   // current-flow dots: 72 units a second at 20 mA; the square root keeps a 2 mA base current visible
const fmtOhm = r => r >= 1e3 ? (+(r / 1e3).toPrecision(3)) + " kΩ" : (+r.toPrecision(3)) + " Ω";
function eng(v, u, d = 3) {                                    // 0.0193 -> "19.4 mA"
  const a = Math.abs(v); if (!isFinite(v)) return "–";
  if (a === 0) return "0 " + u;
  const [k, p] = a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : a >= 1e-6 ? [1e6, "µ"] : a >= 1e-9 ? [1e9, "n"] : [1e12, "p"];
  return (v < 0 ? "−" : "") + (+(a * k).toPrecision(d)) + " " + p + u;
}

/* ---------- the homework's circuits, drawn on a Schem. Each returns handles: pins, the LED or lamp, flow paths, label anchors ---------- */
function drawNpnLed(s, o = {}) {
  const ox = o.x || 0, oy = o.y || 0, P = (a, b) => [a + ox, b + oy];
  const vcc = s.vsrc(P(70, 125)); s.gnd(vcc.bot);
  s.wire([vcc.top, P(70, 40), P(330, 40)]);
  s.res(P(330, 40), P(330, 112));
  const led = s.led(P(330, 112), P(330, 186), { c: o.ledC || "led-w", side: -1 });
  s.wire([P(330, 186), P(330, 226)]);
  s.node(P(330, 206)); s.wire([P(330, 206), P(352, 206)]); const flag = s.net(P(352, 206), { w: 44 });
  const q = s.bjt(P(310, 262)); s.gnd(q.E);
  const vin = s.vsrc(P(70, 300)); s.gnd(vin.bot);
  s.wire([vin.top, P(70, 262), P(150, 262)]); s.res(P(150, 262), P(270, 262)); s.wire([P(270, 262), q.B]);
  return {
    led, q, flag,
    fc: [vcc.top, P(70, 40), P(330, 40), P(330, 226), P(330, 241), P(310, 255), P(310, 269), P(330, 283), P(330, 308)],
    fb: [vin.top, P(70, 262), P(310, 262), P(310, 269), P(330, 283), P(330, 308)],
    loopC: [vcc.bot, vcc.top, P(70, 40), P(330, 40), P(330, 298)],
    loopB: [vin.bot, vin.top, P(70, 262), P(310, 262), P(310, 269), P(330, 283), P(330, 298)],
    at: { Vcc: P(70, 125), Vin: P(70, 300), R1: P(210, 262), R2: P(330, 76), LED: P(330, 149), Q: P(330, 262), C: q.C, E: q.E, B: q.B, net: flag, top: P(200, 40) }
  };
}
function drawPnpLed(s, o = {}) {
  const ox = o.x || 0, oy = o.y || 0, P = (a, b) => [a + ox, b + oy];
  const vcc = s.vsrc(P(70, 125)); s.gnd(vcc.bot);
  const q = s.bjt(P(310, 96), { pnp: true });
  s.wire([vcc.top, P(70, 40), P(330, 40), q.E]);
  s.wire([q.B, P(290, 96)]); s.res(P(290, 96), P(176, 96)); s.wire([P(176, 96), P(150, 96), P(150, 211)]);
  const vin = s.vsrc(P(150, 230)); s.gnd(vin.bot);
  s.wire([q.C, P(330, 158)]); s.node(P(330, 146)); s.wire([P(330, 146), P(352, 146)]); const flag = s.net(P(352, 146), { w: 36 });
  const led = s.led(P(330, 158), P(330, 222), { c: o.ledC || "led-g", side: -1 });
  s.res(P(330, 222), P(330, 296)); s.gnd(P(330, 296));
  return {
    led, q, flag,
    fc: [vcc.top, P(70, 40), P(330, 40), q.E, P(330, 75), P(310, 89), P(310, 103), P(330, 117), q.C, P(330, 306)],
    fb: [vcc.top, P(70, 40), P(330, 40), q.E, P(330, 75), P(310, 89), P(310, 96), P(150, 96), P(150, 211)],
    loopC: [vcc.bot, vcc.top, P(70, 40), P(330, 40), P(330, 306)],
    loopB: [vcc.bot, vcc.top, P(70, 40), P(330, 40), q.E, P(330, 75), P(310, 89), P(310, 96), P(150, 96), vin.top, vin.bot],
    at: { Vcc: P(70, 125), Vin: P(150, 230), R1: P(233, 96), R2: P(330, 259), LED: P(330, 190), Q: P(330, 96), C: q.C, E: q.E, B: q.B, net: flag, top: P(200, 40) }
  };
}
function drawRelay(s, o = {}) {
  const ox = o.x || 0, oy = o.y || 0, P = (a, b) => [a + ox, b + oy];
  const v12 = s.vsrc(P(70, 125)); s.gnd(v12.bot);
  s.wire([v12.top, P(70, 40), P(360, 40)]); s.node(P(270, 40));
  s.rect(P(336, 62)[0], P(336, 62)[1], 156, 112, "w dash");
  s.diode(P(270, 196), P(270, 40));
  s.coil(P(360, 40), P(360, 196), { n: 4, len: 84, side: -1 });
  const q = s.bjt(P(340, 262));
  s.wire([P(270, 196), P(360, 196), q.C]); s.node(P(360, 196)); s.gnd(q.E);
  const inFlag = s.net(P(104, 262), { left: true, w: 40 });
  s.wire([P(104, 262), P(150, 262)]); s.res(P(150, 262), P(280, 262)); s.wire([P(280, 262), q.B]);
  s.wire([P(455, 80), P(455, 50), P(560, 50)]); const acFlag = s.net(P(560, 50), { w: 74 });
  const lever = s.lever(P(455, 80), 50);
  s.wire([P(455, 132), P(455, 212)]); svgEl("circle", { cx: P(455, 132)[0], cy: P(455, 132)[1], r: 3.4, class: "w body" }, s.g);
  const lamp = s.lamp(P(455, 230), { c: "led-w" });
  s.wire([lamp.bot, P(455, 300), P(560, 300)]); const nFlag = s.net(P(560, 300), { w: 74 });
  return {
    q, lever, lamp, inFlag, acFlag, nFlag,
    fc: [v12.top, P(70, 40), P(360, 40), P(360, 196), q.C, P(360, 241), P(340, 255), P(340, 269), P(360, 283), P(360, 308)],
    fb: [P(104, 262), P(340, 262), P(340, 269), P(360, 283), P(360, 308)],
    fd: [P(360, 120), P(360, 196), P(270, 196), P(270, 40), P(360, 40), P(360, 120)],
    fac: [P(560, 50), P(455, 50), P(455, 80), P(455, 132), P(455, 300), P(560, 300)],
    loopC: [v12.bot, v12.top, P(70, 40), P(360, 40), P(360, 298)],
    loopB: [P(104, 262), P(340, 262), P(340, 269), P(360, 283), P(360, 298)],
    at: { V: P(70, 125), R1: P(215, 262), coil: P(360, 118), D1: P(270, 118), Q: P(360, 262), C: q.C, B: q.B, E: q.E, lamp: P(455, 230), sw: P(455, 106), box: P(414, 62), inF: inFlag, acF: acFlag, nF: nFlag }
  };
}
