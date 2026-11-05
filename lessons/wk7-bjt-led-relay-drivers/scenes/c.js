/* ---------- Part C: npn relay driver ---------- */

S.p5 = {
  view: "2d", box: [14, 6, 880, 368], side: [664, 12, 228, 348],
  P: { cl: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawRelay(s); SC.relayText(s, h);
    k.loop("lc", h.loopC, { c: "t3" }); k.loop("lb", h.loopB, { c: "t1" });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fb", h.fb, { c: "t1" }); k.flow("fac", h.fac, { c: "cursor", gap: 18 });
    SC.budget(k, "budC", 670, 20, 216, "collector loop · 12 V", 12, [{ v: 12, c: "t4", t: "coil (800 Ω) · 12 V" }, { v: 0, c: "muted", t: "VCE · 0 V" }]);
    SC.budget(k, "budB", 670, 160, 216, "base loop · 3.3 V", 3.3, [{ v: 2.6, c: "accent", t: "R1 · 2.6 V" }, { v: 0.7, c: "t1", t: "VBE · 0.7 V" }]);
    SC.ruler(k, "ru", 670, 262, 216, "E24 from 1.6 to 2.0 kΩ", [1.6, 1.8, 2.0], 1.52, 2.08, null);
    k.group("mk", g => { const X = k.rx.ru, yy = 262 + 54, m = g.group(); m.g.setAttribute("style", "--c:var(--cursor)"); m.wire([[X(1.733), yy - 30], [X(1.733), yy + 4]], "w tint"); m.head([X(1.733), yy + 4], [X(1.733), yy - 30], 9, "head tint"); }, { side: true });
    SC.pick(k, "pk", "ru", 1.8, 262);
    k.label("Lsat", [778, 136], tx`I_{C,sat}=12\text{ V}/800\ \Omega=\;?`, { c: "t3", line: false });
    k.label("Lib", h.at.R1, tx`I_B=I_{C,sat}/10`, { c: "t1", dx: 0, dy: -46 });
    k.label("Lr1", h.at.R1, tx`R_1=2.6\text{ V}/I_B`, { c: "accent", dx: 10, dy: 50 });
    k.label("Asat", [778, 136], tx`I_{C,sat}=15\text{ mA}`, { c: "good", line: false });
    k.label("Ar1", h.at.R1, tx`R_1=1733\ \Omega\to1.8\text{ k}\Omega`, { c: "good", dx: 30, dy: 52 });
  },
  update(P, k, t) {
    k.o.fc.speed = speedOf(0.015); k.o.fb.speed = speedOf(0.0015);
    k.h.lever.set(26 * (1 - P.cl)); k.h.lamp.set(P.cl > .97 ? .85 + .15 * Math.abs(Math.sin(t * 4.4)) : 0);
    k.o.fac.speed = P.cl > .97 ? 70 * Math.cos(t * 4.4) : 0;
  },
  steps: [
    { cap: tx`At DC the relay coil is just 800 Ω of wire. With Q1 saturated it takes 0 V, so the coil gets all 12 V.`, add: "lc fc budC" },
    { cap: tx`That sets the most current the collector loop can carry, \(I_{C,sat}\). Divide the supply by the coil's resistance.`, add: "Lsat" },
    { cap: tx`Same rule as the LEDs: give the base one tenth of that.`, drop: "lc", add: "fb Lib" },
    { cap: tx`The base loop: 3.3 V from the pin, 0.7 V across the base-emitter diode, and R1 takes 2.6 V at your \(I_B\).`, drop: "Lib", add: "lb budB Lr1" },
    { cap: tx`Here's that stretch of E24. Where does your R1 land, and which mark is closer?`, add: "ru" },
    { cap: tx`\(I_{C,sat}\) = 15 mA, \(I_B\) = 1.5 mA, R1 = 1733 Ω, closest to 1.8 kΩ. The coil pulls the contacts shut and the 120 V lamp lights.`, drop: "Lsat Lr1 lb", add: "Asat Ar1 mk pk fac lc", set: { cl: 1 }, win: { cl: [.3, .7] }, dur: 1.6 }
  ]
};

S.p6 = {
  view: "2d", box: [14, 6, 740, 368],
  P: { m: 0, on: 0 },
  build(k) {
    const full = k.group("full", s => { const h = drawRelay(s); SC.relayText(s, h); h.lever.set(26); });
    k.group("simp", s => {
      const v12 = s.vsrc([70, 125]); s.gnd(v12.bot); s.wire([v12.top, [70, 40], [360, 40]]);
      s.res([360, 40], [360, 196]);
      const q = s.bjt([340, 262]); s.wire([[360, 196], q.C]); s.gnd(q.E);
      s.node([360, 211]); s.wire([[360, 211], [382, 211]]); const fl = s.net([382, 211], { w: 44 });
      const vin = s.vsrc([70, 300]); s.gnd(vin.bot); s.wire([vin.top, [70, 262], [150, 262]]); s.res([150, 262], [280, 262]); s.wire([[280, 262], q.B]);
      s.text([98, 117], "Vcc"); s.text([98, 135], "12 V", { cls: "sm" }); s.text([378, 110], "coil"); s.text([378, 128], "800 Ω", { cls: "sm" });
      s.text(fl, "Vce", { anchor: "middle", cls: "sm" }); s.text([382, 252], "Q1"); s.text([382, 270], "2N3904", { cls: "sm" });
      s.text([215, 241], "R1", { anchor: "middle" }); s.text([98, 292], "Vin"); s.text([98, 310], "3.3 V", { cls: "sm" });
    });
    k.flow("fc", [[70, 106], [70, 40], [360, 40], [360, 226], [360, 241], [340, 255], [340, 269], [360, 283], [360, 308]], { c: "t3" });
    k.flow("fb", [[70, 281], [70, 262], [340, 262], [340, 269], [360, 283], [360, 308]], { c: "t1" });
    k.label("Ls1", [360, 118], tx`\text{coil}\to 800\ \Omega`, { c: "cursor", dx: 120, dy: 0, when: () => k.P.m > .9 });
    k.label("Ls2", [596, 246], tx`\text{D1, contacts, lamp: no DC effect}`, { c: "muted", line: false, when: () => k.P.m > .9 });
    SC.op(k, "opQ", 452, 40, 290, [["V(vce):", "?"], ["Ib(Q1):", "?"], ["Ic(Q1):", "?"]]);
    SC.op(k, "opA", 452, 40, 290, [["V(vce):", "0.0405 V"], ["Ib(Q1):", "1.408 mA"], ["Ic(Q1):", "14.95 mA"]]);
    k.label("Lck", [597, 196], tx`12\text{ mA}\lt I_C\lt 18\text{ mA}\;?`, { c: "t3", line: false });
    k.label("Lb", [597, 236], tx`\beta=I_C/I_B=\;?`, { c: "ink", line: false });
    k.label("Ab", [597, 226], tx`\beta=14.95/1.408\approx 10.6`, { c: "good", line: false });
  },
  update(P, k) {
    const f = k.o.full, s = k.o.simp;
    if (f.v > .008) f.el.style.opacity = (f.v * (1 - P.m)).toFixed(3);
    if (s.v > .008) s.el.style.opacity = (s.v * P.m).toFixed(3);
    k.o.fc.speed = speedOf(0.015 * P.on); k.o.fb.speed = speedOf(0.0014 * P.on);
  },
  steps: [
    { cap: tx`For a DC operating point, the coil becomes an 800 Ω resistor. D1, the contacts and the lamp carry no DC current through Q1, so leave them out.`, add: "full simp Ls1 Ls2", from: { m: 0 }, set: { m: 1 }, win: { m: [.35, 1] }, dur: 2.6 },
    { cap: tx`What's left is Part A's circuit on 12 V. Run DC op pnt and copy V(vce), Ib(Q1) and Ic(Q1).`, drop: "Ls1 Ls2", add: "fc fb opQ", set: { on: 1 }, dur: 1.4 },
    { cap: tx`Check \(I_C\) is in the homework's window and close to your \(I_{C,sat}\), then divide.`, add: "Lck Lb" },
    { cap: tx`About 40.5 mV, 1.408 mA and 14.95 mA, so β ≈ 10.6. \(I_C\) is a hair under 15 mA because Q1 keeps 40 mV.`, drop: "opQ Lck Lb", add: "opA Ab" }
  ]
};

S.ec = {
  view: "2d", box: [14, 6, 880, 368], side: [664, 12, 228, 334],
  P: { off: 0, s1: 0, s2: 0 },
  build(k) {
    const s = k.sch, h = k.h = drawRelay(s); SC.relayText(s, h, { vin: false });
    k.flow("fc", h.fc, { c: "t3" }); k.flow("fd", h.fd, { c: "t3" }); k.flow("fac", h.fac, { c: "cursor", gap: 18 });
    k.group("field", g => { g.g.setAttribute("style", "--c:var(--t4)"); g.path("M352 70C335 70 335 166 352 166C369 166 369 70 352 70Z", "w tint thin"); g.path("M352 58C323 58 323 178 352 178C381 178 381 58 352 58Z", "w tint thin"); });
    k.text("vHi", [62, 288], "3.3 V", { anchor: "middle", cls: "sm" }); k.text("vLo", [62, 288], "0 V", { anchor: "middle", cls: "sm", c: "bad" });
    const L = 0.5, R = 800, I0 = 0.015, vd = i => 1.9 * VTH * Math.log1p(Math.max(0, i) / 4e-9), tr = [];
    for (let n = 0, i = I0, dt = 3e-3 / 600; n <= 600; n++) { tr.push([n * dt, 12 + vd(i), i]); i = Math.max(0, i - dt * (i * R + vd(i)) / L); }
    const X = t => 700 + (t + 0.5e-3) / 3.5e-3 * 176, Y = v => 296 - Math.min(61, v) / 60 * 228;
    Object.assign(k, { tr, X, Y, I0 });
    k.group("scope", g => {
      SC.card(g, 670, 20, 216, 320, "collector voltage, V_C");
      for (const v of [0, 12, 40, 60]) { g.wire([[700, Y(v)], [876, Y(v)]], "gridl"); g.text([696, Y(v)], String(v), { anchor: "end", cls: "sm" }); }
      g.wire([[X(0), 60], [X(0), 300]], "w dash"); g.text([X(0) + 4, 312], "Q1 off", { cls: "sm" }); g.text([872, 330], "3 ms →", { anchor: "end", cls: "sm" });
      g.text([872, Y(40) - 9], "Q1's 40 V limit", { anchor: "end", cls: "sm", c: "bad" });
    }, { side: true });
    k.plot("tr1", { c: "bad", side: true }); k.plot("tr2", { c: "t3", side: true });
    k.label("Lspk", [790, 92], tx`\text{without D1: off the chart}`, { c: "bad", line: false, when: () => k.P.s1 > .9 });
    k.label("Lcl", [800, 226], tx`\text{with D1: }\approx 12.7\text{ V}`, { c: "t3", line: false, when: () => k.P.s2 > .1 });
    k.label("LE", [360, 118], tx`E=LI^2/2\text{ stored}`, { c: "t4", dx: -170, dy: 40 });
    k.label("LV", h.at.C, tx`v=L\,di/dt`, { c: "bad", dx: -130, dy: 82 });
    k.label("LD", h.at.D1, tx`\text{D1 conducts}`, { c: "t3", dx: -76, dy: -44 });
    SC.lines(k, "sum", 670, 20, 216, "your three sentences cover", ["1  coil stores LI²/2", "2  Q1 off: v = L di/dt", "   spikes the collector", "3  D1 loops the current", "   and clamps V_C"], { cls: "", lh: 26 });
    k.label("Ans", [440, 352], tx`\text{D1 is a flyback diode: it protects Q1 from the turn-off spike}`, { c: "good", line: false });
  },
  update(P, k, t) {
    const { X, Y, tr, I0 } = k, iNow = tr[Math.min(tr.length - 1, Math.round(P.s2 * (tr.length - 1)))][2];
    k.o.fc.speed = speedOf(I0 * (1 - P.off)); k.o.fd.speed = P.s2 > 0 && P.s2 < 1 ? speedOf(iNow) : 0;
    const fo = k.o.field; if (fo.v > .008) fo.el.style.opacity = (fo.v * (1 - P.off)).toFixed(3);
    k.h.lever.set(26 * P.off); k.h.lamp.set(P.off < .5 ? .9 : 0); k.o.fac.speed = P.off < .5 ? 70 * Math.cos(t * 4.4) : 0;
    const base = [[X(-0.5e-3), Y(0.04)], [X(0), Y(0.04)]];
    k.o.tr1.set(P.s1 <= 0 ? [] : base.concat([[X(0.02e-3), Y(0.04 + 62 * P.s1)]]));
    const upto = P.s2 * 3e-3, pts = tr.filter(p => p[0] <= upto).map(p => [X(p[0]), Y(p[1])]);
    k.o.tr2.set(P.s2 <= 0 ? [] : base.concat(pts));
  },
  steps: [
    { cap: tx`While Q1 is on, current flows through the coil. Its magnetic field holds the contacts shut, and that field is stored energy.`, add: "fc field LE vHi fac" },
    { cap: tx`Q1 snaps off. The coil fights the sudden change, \(v = L\,di/dt\), and with nowhere for the current to go the collector would leap far past Q1's 40 V limit.`, drop: "LE vHi", add: "vLo scope tr1 LV Lspk", from: { off: 0, s1: 0 }, set: { off: 1, s1: 1 }, win: { off: [0, .3], s1: [.3, 1] }, dur: 2.4 },
    { cap: tx`With D1 in place, the collector only rises until D1 turns on, about 12.7 V. The coil's current then circles through D1 and fades away.`, add: "fd tr2 LD Lcl", from: { s2: 0 }, set: { s2: 1 }, dur: 3.6 },
    { cap: tx`Now write it: what causes the spike, how D1 gives the current a path, and what that protects.`, drop: "scope tr1 tr2 LV LD Lspk Lcl", add: "sum" },
    { cap: tx`D1 is a flyback diode. It clamps the turn-off spike so the coil's stored energy can't destroy Q1.`, add: "Ans" }
  ]
};
