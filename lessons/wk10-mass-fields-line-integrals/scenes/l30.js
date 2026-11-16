/* ---------- Lesson 30 scenes: line integrals ---------- */
S["ex30-1"] = (() => {
  const r = t => [t, -3 * t - 10, 0], h = t => -3 * t - 10;
  return {
    cam: { y: -2.65, p: .32, d: 5, at: [3, -19, -9] },
    P: { t: 2.7, c: 2 },
    build(k) {
      k.scale(.3, .3, .045, [3, -19, -9]);
      k.grid("grid", [1, 5, 1], [-23, -15, 1], 0, { o: .25 });
      k.rig = pathRig(k, { r, t0: 2, t1: 4, h, hc: "bad", sV: .5 });
      ticks(k, "tk", r, rng(2, 4, 8), { c: "accent" });
      k.label("Lp0", r(2), tx`(2,-16)\ \ t=2`, { dx: -30, dy: -26 });
      k.label("Lp1", r(4), tx`(4,-22)\ \ t=4`, { dx: 30, dy: -26 });
      k.label("Lf", () => { const t = k.P.t; return [t, -3 * t - 10, h(t)]; }, tx`f=-3t-10`, { c: "bad", dx: 70, dy: 16 });
      k.label("Lv", () => r(k.P.t), tx`\|\mathbf r'\|=\sqrt{10}`, { c: "accent", dx: 40, dy: -50 });
      k.label("Lds", [3, -19, -10], tx`ds=\sqrt{10}\,dt`, { c: "accent", dy: 60, line: false });
      k.label("Lbr", [3, -19, -10], tx`\sqrt{10}\left[-\tfrac32t^2-10t\right]_2^4`, { c: "ink", dy: 60, line: false });
      k.label("Ans", [3, -19, -10], tx`-38\sqrt{10}\approx-120.17`, { c: "glow", dy: 60, line: false });
    },
    update(P, k) { k.rig.at(P.t); k.o.cur.upto(P.c); },
    steps: [
      { cap: tx`Walk along the line as \(t\) runs from 2 to 4. On it, \(f=-3x-10\) becomes \(-3t-10\). The stick hangs below the bead because \(f\) is negative.`, add: "grid C Lp0 Lp1 bead stk Lf", from: { t: 2.02 }, set: { t: 3.4 }, dur: 2.4 },
      { cap: tx`The velocity \(\langle1,-3\rangle\) never changes, so the speed is \(\sqrt{10}\) everywhere. Equal steps in \(t\) cover equal lengths, as the evenly spaced dots show.`, drop: "Lf", add: "Vb tk Lv" },
      { cap: tx`Each tiny piece of curve adds \(f\,ds\), with \(ds=\sqrt{10}\,dt\). The total is the signed area of this curtain, which hangs below the line.`, drop: "Vb tk Lv", add: "cur Lds", from: { c: 2.002, t: 2.02 }, set: { c: 4, t: 4 }, dur: 2.6 },
      { cap: tx`The bracket is \(-64\) at \(t=4\) and \(-26\) at \(t=2\). Subtract, then multiply by \(\sqrt{10}\).`, drop: "Lds bead stk", add: "Lbr", cam: { y: -2.82, p: .12, d: 4.8 } },
      { cap: tx`\(\sqrt{10}\,(-64+26)=-38\sqrt{10}\approx-120.17\).`, drop: "Lbr", add: "Ans" }
    ]
  };
})();

S["ex30-2"] = (() => {
  const r = t => [sin(t), t, 0], h = t => 4 * sin(t) * cos(t), a = PI / 6, b = PI / 3;
  return {
    cam: { y: -.62, p: .42, d: 4.6, at: [.68, .79, 1] },
    P: { t: .7, c: a },
    build(k) {
      k.scale(1.9, 1.9, .32, [.68, .79, 1.1]);
      k.grid("grid", [.3, 1, .1], [.4, 1.2, .1], 0, { o: .22 });
      k.surf("ghost", (x, y) => [x, y, 4 * x * cos(y)], [.3, 1, 28], [.4, 1.2, 28], { ramp: [0, 3.8], o: .25 });
      k.rig = pathRig(k, { r, t0: a, t1: b, h, hc: "s2", sV: .32, br: .04 });
      ticks(k, "tk", r, rng(a, b, 8), { c: "accent", r: .02 });
      k.label("Lp0", r(a), tx`t=\tfrac\pi6`, { dx: -40, dy: 20 });
      k.label("Lp1", r(b), tx`t=\tfrac\pi3`, { dx: 40, dy: 20 });
      k.label("Lg", [1, .4, 4 * cos(.4)], tx`f=4x\cos y`, { c: "muted", dx: 50, dy: -10 });
      k.label("Lf", () => { const t = k.P.t; return [sin(t), t, h(t)]; }, tx`4\sin t\cos t`, { c: "s2", dx: 70, dy: -24 });
      k.label("Lv", () => r(k.P.t), tx`\|\mathbf r'\|=\sqrt{\cos^2t+1}`, { c: "accent", dx: -90, dy: 36 });
      k.label("Lu0", [sin(a), a, h(a)], tx`u=\tfrac74`, { c: "cursor", dx: -46, dy: -20 });
      k.label("Lu1", [sin(b), b, h(b)], tx`u=\tfrac54`, { c: "cursor", dx: 46, dy: -20 });
      k.label("Ans", [.68, .79, 2.2], tx`\tfrac{7\sqrt7-5\sqrt5}{6}\approx1.223`, { c: "glow", dy: -40, line: false });
    },
    update(P, k) { k.rig.at(P.t); k.o.cur.upto(P.c); },
    steps: [
      { cap: tx`The see-through surface is \(f=4x\cos y\). Along the curve \(x=\sin t\) and \(y=t\), so the stick from the bead up to the surface is \(4\sin t\cos t\).`, add: "grid ghost Lg C Lp0 Lp1 bead stk Lf", from: { t: a + .01 }, set: { t: .95 }, dur: 2.4 },
      { cap: tx`The velocity is \(\langle\cos t,1\rangle\), so the speed is \(\sqrt{\cos^2t+1}\). It shrinks a little along the way, so the dots for equal steps in \(t\) bunch up slightly.`, drop: "Lf Lg", add: "Vb tk Lv" },
      { cap: tx`The integral adds \(f\,ds\) along the curve, with \(ds=\sqrt{1+\cos^2t}\,dt\). That's the area of this curtain.`, drop: "Vb tk Lv ghost", add: "cur", from: { c: a + .002, t: a + .01 }, set: { c: b, t: b }, dur: 2.6 },
      { cap: tx`Let \(u=1+\cos^2t\). The start of the curve has \(u=\tfrac74\) and the end has \(u=\tfrac54\). The limits run backward, and the minus sign from \(du\) flips them.`, drop: "bead stk", add: "Lu0 Lu1", cam: { y: -.5, p: .22, d: 4.4 } },
      { cap: tx`\(\tfrac43\left(\tfrac{7\sqrt7}{8}-\tfrac{5\sqrt5}{8}\right)=\dfrac{7\sqrt7-5\sqrt5}{6}\approx1.223\).`, drop: "Lu0 Lu1", add: "Ans" }
    ]
  };
})();

S["ex30-3"] = (() => {
  const r = t => [2.5 * t * t - 4, 2 * t * t - 10, 5];
  return {
    cam: { y: -.95, p: .5, d: 5, at: [41, 26, 2.5] },
    P: { t: 3 },
    build(k) {
      k.scale(.017, .017, .09, [41, 26, 2.5]);
      k.axes("axes", [0, 96], [0, 72], [0, 7.5]);
      k.rig = pathRig(k, { r, t0: 0, t1: 6, sV: .9, br: .045 });
      k.tube("sh", [[-4, -10, 0], [86, 62, 0]], { c: "muted", r: .008, o: .5 });
      k.tubes("drops", [[[-4, -10, 0], [-4, -10, 5]], [[86, 62, 0], [86, 62, 5]]], { c: "muted", r: .006, o: .5 });
      ticks(k, "tk", r, rng(0, 6, 6), { c: "accent", r: .03 });
      k.tube("legs", [[-4, -10, 5], [86, -10, 5], [86, 62, 5]], { c: "cursor", r: .011 });
      k.poly("tri", [[-4, -10, 5], [86, -10, 5], [86, 62, 5]], { c: "cursor", o: .14 });
      k.label("Lp0", r(0), tx`(-4,-10,5)`, { dx: -40, dy: -24 });
      k.label("Lp1", r(6), tx`(86,62,5)`, { dx: 40, dy: -24 });
      k.label("Lv", () => r(k.P.t), tx`\mathbf r'=\langle5t,4t,0\rangle`, { c: "accent", dx: 60, dy: 36 });
      k.label("Lsp", r(3), tx`\|\mathbf r'\|=\sqrt{41}\,t`, { c: "accent", dx: -40, dy: -60 });
      k.label("L90", [41, -10, 5], tx`90`, { c: "cursor", dy: 22, line: false });
      k.label("L72", [86, 26, 5], tx`72`, { c: "cursor", dx: 22, line: false });
      k.label("Ans", r(3), tx`L=18\sqrt{41}\approx115.26`, { c: "glow", dx: -60, dy: -70 });
    },
    update(P, k) { k.rig.at(P.t); },
    steps: [
      { cap: tx`Arc length adds up speed over time, \(L=\int_0^6\|\mathbf r'(t)\|\,dt\). The curve stays at height 5, and the bead speeds up as it goes.`, add: "axes C sh drops Lp0 Lp1 bead", from: { t: 0 }, set: { t: 6 }, dur: 3 },
      { cap: tx`The constants drop out, so \(\mathbf r'(t)=\langle5t,4t,0\rangle\). The velocity has no \(z\) part, and it grows with \(t\).`, add: "Vb Lv", from: { t: .3 }, set: { t: 4.5 }, dur: 2.6 },
      { cap: tx`The speed is \(\sqrt{25t^2+16t^2}=\sqrt{41}\,t\). The dots mark \(t=0,1,\dots,6\). Each gap is longer than the last because the speed keeps growing.`, drop: "Vb Lv bead", add: "tk Lsp" },
      { cap: tx`Integrate \(\sqrt{41}\,t\) from 0 to 6. As a check, the curve is a straight segment, and the right triangle shows its run, 90 across and 72 up.`, drop: "tk Lsp", add: "tri legs L90 L72", cam: { p: .85 } },
      { cap: tx`\(\sqrt{41}\cdot18=18\sqrt{41}\approx115.26\). That matches \(\sqrt{90^2+72^2}\).`, add: "Ans" }
    ]
  };
})();

S["ex30-4"] = (() => {
  const r = t => [t, t * t, 0], F = p => [-3 * p[0] * p[0], p[1]];
  const h = t => 1.6 * (-3 * t * t + 2 * t ** 3) / sqrt(1 + 4 * t * t);
  return {
    cam: { y: -1.3, p: .75, d: 6.4, at: [.5, .5, -.2] },
    P: { t: .7, c: 0 },
    build(k) {
      k.scale(1.3, 1.3, 1.3, [.5, .5, 0]);
      k.axes("axes", [-.3, 1.4], [-.3, 1.4], null);
      floorField(k, "fld", (x, y) => F([x, y]), [-.2, 1.2, .2], [-.2, 1.2, .2], { c: "s1", r: .008, pow: .55, o: .6 });
      k.rig = pathRig(k, { r, t0: 0, t1: 1, F, h, hc: "bad", sF: .22, sV: .28, br: .04 });
      k.label("Lp0", [0, 0, 0], tx`t=0`, { dx: -30, dy: 20 });
      k.label("Lp1", [1, 1, 0], tx`t=1`, { dx: 30, dy: -16 });
      const B = () => r(k.P.t);
      k.label("LF", B, tx`\mathbf F=\langle-3t^2,\,t^2\rangle`, { c: "glow", dx: -100, dy: -40 });
      k.label("LV", B, tx`\mathbf r'=\langle1,\,2t\rangle`, { c: "accent", dx: 90, dy: 34 });
      k.label("LT", B, tx`\mathbf F\cdot\mathbf r'=-3t^2+2t^3`, { c: "bad", dx: 80, dy: 40 });
      k.label("Lw", [.5, .25, -.3], tx`\int_0^1(-3t^2+2t^3)\,dt`, { c: "bad", dy: 60, line: false });
      k.label("Ans", [.5, .25, -.3], tx`W=-\tfrac12`, { c: "glow", dy: 60, line: false });
    },
    update(P, k) { k.rig.at(P.t); k.o.cur.upto(P.c); },
    steps: [
      { cap: tx`On the curve \(x=t\) and \(y=t^2\), so the bead feels \(\mathbf F=\langle-3t^2,\,t^2\rangle\). Most of that push points left.`, add: "axes fld C Lp0 Lp1 bead Fb LF", from: { t: .05 }, set: { t: .7 }, dur: 2.4 },
      { cap: tx`The velocity \(\mathbf r'(t)=\langle1,2t\rangle\) points along the curve, the way the bead moves.`, drop: "LF", add: "Vb LV" },
      { cap: tx`The dot product keeps only the part of the push along the motion. That part, \(-3t^2+2t^3\), points backward against the bead.`, drop: "LV", add: "Tb LT" },
      { cap: tx`Add those backward pushes over the whole path. The curtain hangs below the curve because the dot product is negative from start to finish.`, drop: "LT fld", add: "cur stk Lw", from: { c: .002, t: .01 }, set: { c: 1, t: 1 }, dur: 2.8 },
      { cap: tx`\(\left[-t^3+\tfrac{t^4}{2}\right]_0^1=-1+\tfrac12=-\tfrac12\). The field does negative work, fighting the motion.`, drop: "Lw", add: "Ans" }
    ]
  };
})();

S["ex30-5"] = (() => {
  const r = t => [2 * t * t, -5 * t * t, 0], F = p => { const q = hypot(p[0], p[1]) ** 3; return [p[0] / q, p[1] / q]; };
  const h = t => 1 / (29 * t ** 4);
  return {
    cam: { y: -2.76, p: .5, d: 4.6, at: [4, -10, .015] },
    P: { t: 1.3, c: 1 },
    build(k) {
      k.scale(.09, .09, 20, [4, -10, 0]);
      k.grid("grid", [-2, 10, 2], [-22, 2, 2], 0, { o: .2 });
      floorField(k, "fld", (x, y) => F([x, y]), [-2, 10, 2], [-22, 2, 2], { c: "s1", r: .009, pow: .35, o: .6, skip: (x, y) => hypot(x, y) < 1 });
      k.dot("O", { c: "ink", r: .04, p: [0, 0, 0] });
      k.label("LO", [0, 0, 0], tx`\text{origin}`, { c: "ink", dx: -30, dy: 20, line: false });
      k.rig = pathRig(k, { r, t0: 1, t1: 2, F, h, hc: "good", tc: "good", sF: 80, sV: .3 });
      k.label("Lp0", r(1), tx`t=1`, { dx: -34, dy: -16 });
      k.label("Lp1", r(2), tx`t=2`, { dx: 34, dy: -16 });
      const B = () => r(k.P.t);
      k.label("Lr", B, tx`\|\mathbf r\|=\sqrt{29}\,t^2`, { c: "cursor", dx: -90, dy: 30 });
      k.label("LV", B, tx`\mathbf r'=\langle4t,-10t\rangle`, { c: "accent", dx: 80, dy: 30 });
      k.label("LT", B, tx`\mathbf F\cdot\mathbf r'=\dfrac{2}{\sqrt{29}\,t^3}`, { c: "good", dx: 90, dy: -40 });
      k.label("Ans", r(1.5), tx`\tfrac{3}{4\sqrt{29}}\approx0.1393`, { c: "glow", dx: 60, dy: -70 });
    },
    update(P, k) { k.rig.at(P.t); k.o.cur.upto(P.c); },
    steps: [
      { cap: tx`On this curve \(x^2+y^2=29t^4\), so the distance from the origin is \(\sqrt{29}\,t^2\). The field points straight out and fades fast with distance.`, add: "grid fld O LO C Lp0 Lp1 bead Fb Lr", from: { t: 1.01 }, set: { t: 1.5 }, dur: 2.4 },
      { cap: tx`\(\mathbf r'(t)=\langle4t,-10t\rangle\) points along the same line, away from the origin.`, drop: "Lr", add: "Vb LV" },
      { cap: tx`Force and velocity point the same way, so the dot product is positive. It simplifies to \(\dfrac{2}{\sqrt{29}\,t^3}\).`, drop: "LV", add: "LT" },
      { cap: tx`The curtain's height is the push along the path. It's tall near the start and almost flat at the far end, because the push fades like one over distance squared.`, drop: "LT", add: "cur stk", from: { c: 1.002, t: 1.01 }, set: { c: 2, t: 2 }, dur: 2.8 },
      { cap: tx`\(\tfrac{2}{\sqrt{29}}\left(-\tfrac18+\tfrac12\right)=\dfrac{3}{4\sqrt{29}}\approx0.1393\). Positive, because the bead moves with the field.`, add: "Ans" }
    ]
  };
})();

S["ex30-6"] = (() => {
  const r = t => [t * t, sqrt(t), t], F = p => [p[2], p[0], p[1]];
  const parts = [t => 2 / 3 * (t ** 3 - 1), t => (t ** 2.5 - 1) / 5, t => 2 / 3 * (t ** 1.5 - 1)], hb = .075, bx = [2, 7, 12], by = 2.7;
  return {
    cam: { y: -1.0, p: .38, d: 4.8, at: [8, 1.4, 1.8] },
    P: { t: 2.2, b: 1 },
    build(k) {
      k.scale(.1, .55, .3, [8, 1.3, 2.3]);
      k.axes("axes", [0, 17.5], [0, 3.2], [0, 5]);
      k.rig = pathRig(k, { r, t0: 1, t1: 4, F, sF: .1, sV: .35, br: .045 });
      const comp = [["dx", "s1"], ["dy", "s2"], ["dz", "s3"]];
      comp.forEach(([n, c]) => k.arrow(n, { c, r: .014 }));
      parts.forEach((_, i) => k.block("bar" + i, { c: ["s1", "s2", "s3"][i], o: .9 }));
      k.tube("shelf", [[bx[0] - 1, by, 0], [bx[2] + 1, by, 0]], { c: "muted", r: .006 });
      const B = () => r(k.P.t);
      k.label("Lp0", r(1), tx`t=1`, { dx: -30, dy: 20 });
      k.label("Lp1", r(4), tx`t=4`, { dx: 30, dy: -16 });
      k.label("LF", B, tx`\mathbf F=\langle t,\ t^2,\ \sqrt t\rangle`, { c: "glow", dx: -80, dy: -46 });
      k.label("LV", B, tx`\langle2t,\ \tfrac{1}{2\sqrt t},\ 1\rangle`, { c: "accent", dx: 80, dy: 40 });
      const top = i => () => [bx[i], by, hb * parts[i](k.P.b) / .3 * .3 + .1];
      k.label("B0", top(0), tx`z\,dx`, { c: "s1", dy: -20, line: false });
      k.label("B1", top(1), tx`x\,dy`, { c: "s2", dy: -20, line: false });
      k.label("B2", top(2), tx`y\,dz`, { c: "s3", dy: -20, line: false });
      k.label("V0", top(0), tx`42`, { c: "s1", dy: -20, line: false });
      k.label("V1", top(1), tx`\tfrac{31}{5}`, { c: "s2", dy: -24, line: false });
      k.label("V2", top(2), tx`\tfrac{14}{3}`, { c: "s3", dy: -24, line: false });
      k.label("Ans", [bx[1], by, 4.2], tx`\tfrac{793}{15}\approx52.87`, { c: "glow", dy: -40, line: false });
    },
    update(P, k) {
      const p = k.rig.at(P.t), t = P.t, v = [2 * t, 1 / (2 * sqrt(t)), 1], s = .35;
      aset(k.o.dx, p, [p[0] + v[0] * s, p[1], p[2]]); aset(k.o.dy, p, [p[0], p[1] + v[1] * s * 4, p[2]]); aset(k.o.dz, p, [p[0], p[1], p[2] + v[2] * s]);
      parts.forEach((g, i) => k.o["bar" + i].set([bx[i] - .7, by - .12, 0], [bx[i] + .7, by + .12, max(.003, hb * g(P.b))]));
    },
    steps: [
      { cap: tx`The field is \(\mathbf F=\langle z,x,y\rangle\). On the curve \(x=t^2\), \(y=\sqrt t\) and \(z=t\), so the bead feels \(\langle t,\,t^2,\,\sqrt t\rangle\).`, add: "axes C Lp0 Lp1 bead Fb LF", from: { t: 1.01 }, set: { t: 2.6 }, dur: 2.6 },
      { cap: tx`\(dx=2t\,dt\), \(dy=\tfrac{1}{2\sqrt t}\,dt\) and \(dz=dt\). The motion is mostly in \(x\). The \(y\) part is tiny, drawn 4 times longer here so you can see it.`, drop: "LF Fb", add: "Vb dx dy dz LV" },
      { cap: tx`Each piece pairs one part of the field with one direction of motion. The three bars will collect \(z\,dx\), \(x\,dy\) and \(y\,dz\) as the bead moves.`, drop: "LV dx dy dz Vb", add: "shelf bar0 bar1 bar2 B0 B1 B2 Fb", set: { b: 1 } },
      { cap: tx`Run \(t\) from 1 to 4. The bars end at \(42\), \(\tfrac{31}{5}\) and \(\tfrac{14}{3}\). Add the three.`, drop: "B0 B1 B2", add: "V0 V1 V2", from: { t: 1.01, b: 1 }, set: { t: 4, b: 4 }, dur: 3.4 },
      { cap: tx`\(42+\tfrac{31}{5}+\tfrac{14}{3}=\dfrac{793}{15}\approx52.87\). Almost all of it comes from \(z\,dx\).`, add: "Ans" }
    ]
  };
})();

S["ex30-7"] = (() => {
  const r = t => [-3 * cos(t), -3 * sin(t), 0], F = p => [-p[0], -p[1]], h = () => -3;
  return {
    cam: { y: -PI / 2, p: .9, d: 5.4, at: [0, 0, -.6] },
    P: { t: 0, c: 0 },
    build(k) {
      k.scale(.27, .27, .2, [0, 0, -1]);
      k.grid("grid", [-4, 4, 1], [-4, 4, 1], 0, { o: .2 });
      k.axes("axes", [-4.4, 4.6], [-4.4, 4.6], null);
      floorField(k, "fld", (x, y) => F([x, y]), [-4, 4, 1], [-4, 4, 1], { c: "s1", r: .011, pow: .8, o: .7 });
      k.rig = pathRig(k, { r, t0: 0, t1: TAU, F, h, hc: "bad", sF: .3, sV: .3, N: 145 });
      k.arrow("Nb", { c: "good", r: .019 });
      k.label("L0", r(0), tx`\mathbf r(0)=(-3,0)`, { dx: -70, dy: -20 });
      k.label("L1", r(PI / 2), tx`\mathbf r(\tfrac\pi2)=(0,-3)`, { dx: 60, dy: 26 });
      const B = () => r(k.P.t);
      k.label("LV", B, tx`\mathbf r'`, { c: "accent", dx: 20, dy: 40 });
      k.label("LN", B, tx`\mathbf n=\langle y',-x'\rangle`, { c: "good", dx: -90, dy: 40 });
      k.label("LF", B, tx`\mathbf F=\langle3\cos t,3\sin t\rangle`, { c: "glow", dx: 100, dy: -36 });
      k.label("Ld", [0, 0, 0], tx`\mathbf F\cdot\mathbf n=-9`, { c: "bad", dy: -20, line: false });
      k.label("Ans", [0, 0, 0], tx`-18\pi\approx-56.55`, { c: "glow", dy: -20, line: false });
    },
    update(P, k) {
      const p = k.rig.at(P.t), t = P.t, n = [-3 * cos(t), -3 * sin(t), 0];
      aset(k.o.Nb, p, [p[0] + n[0] * .3, p[1] + n[1] * .3, 0]);
      k.o.cur.upto(P.c);
    },
    steps: [
      { cap: tx`At \(t=0\) the bead is at \((-3,0)\). At \(t=\tfrac\pi2\) it's at \((0,-3)\). Left side to bottom is counterclockwise, so the right of travel is the outside.`, add: "grid axes C bead L0 L1", from: { t: 0 }, set: { t: PI / 2 }, dur: 2.4 },
      { cap: tx`The velocity \(\langle3\sin t,-3\cos t\rangle\) runs along the circle. Turning it to the right gives \(\mathbf n=\langle y',-x'\rangle\), which points outward.`, drop: "L0 L1", add: "Vb Nb LV LN", from: { t: PI / 2 }, set: { t: 2.4 }, dur: 1.8 },
      { cap: tx`On the circle \(\mathbf F=\langle3\cos t,3\sin t\rangle\). Every arrow points toward the center, so the fluid drains inward.`, drop: "LV LN", add: "fld Fb LF" },
      { cap: tx`\(\mathbf F\cdot\mathbf n=-9\cos^2t-9\sin^2t=-9\) at every point. The flow crosses against the outward normal all the way around.`, drop: "LF", add: "Ld stk", cam: { p: .6 } },
      { cap: tx`Add \(\mathbf F\cdot\mathbf n\,dt\) once around, from \(t=0\) to \(2\pi\). The curtain hangs at the same depth the whole way.`, drop: "fld Fb Vb Nb", add: "cur", from: { c: .002, t: 0 }, set: { c: TAU, t: TAU }, dur: 3.4 },
      { cap: tx`\(-9\cdot2\pi=-18\pi\approx-56.55\). Negative flux means the net flow crosses inward.`, drop: "Ld", add: "Ans" }
    ]
  };
})();

S["ex30-8"] = (() => {
  const r = t => [cos(t), sin(t), 0], F = p => [2 * p[1], -2 * p[0]], h = () => -2;
  return {
    cam: { y: -PI / 2, p: .9, d: 5.2, at: [0, 0, -.4] },
    P: { t: 0, c: 0 },
    build(k) {
      k.scale(.62, .62, .25, [0, 0, -1]);
      k.grid("grid", [-1.8, 1.8, .6], [-1.8, 1.8, .6], 0, { o: .2 });
      k.axes("axes", [-2, 2.1], [-2, 2.1], null);
      floorField(k, "fld", (x, y) => F([x, y]), [-1.8, 1.8, .45], [-1.8, 1.8, .45], { c: "s1", r: .011, pow: .7, o: .7 });
      k.rig = pathRig(k, { r, t0: 0, t1: TAU, F, h, hc: "bad", sF: .15, sV: .32, N: 145 });
      k.label("L0", r(0), tx`(1,0)\ \ t=0`, { dx: 50, dy: 10 });
      const B = () => r(k.P.t);
      k.label("LF", B, tx`\mathbf F=\langle2\sin t,-2\cos t\rangle`, { c: "glow", dx: 100, dy: -30 });
      k.label("LV", B, tx`\mathbf r'=\langle-\sin t,\cos t\rangle`, { c: "accent", dx: -100, dy: -30 });
      k.label("Ld", [0, 0, 0], tx`\mathbf F\cdot\mathbf r'=-2`, { c: "bad", dy: -20, line: false });
      k.label("Ans", [0, 0, 0], tx`-4\pi\approx-12.57`, { c: "glow", dy: -20, line: false });
    },
    update(P, k) { k.rig.at(P.t); k.o.cur.upto(P.c); },
    steps: [
      { cap: tx`The standard counterclockwise unit circle is \(\langle\cos t,\sin t\rangle\) for \(0\le t\le2\pi\). The bead starts at \((1,0)\) and goes around once.`, add: "grid axes C bead L0", from: { t: 0 }, set: { t: TAU }, dur: 3 },
      { cap: tx`On the circle \(\mathbf F=\langle2\sin t,-2\cos t\rangle\). The whole field swirls clockwise.`, drop: "L0", add: "fld Fb LF", from: { t: 0 }, set: { t: 1 }, dur: 1.4 },
      { cap: tx`The velocity \(\langle-\sin t,\cos t\rangle\) points the way the bead moves, counterclockwise.`, drop: "LF", add: "Vb LV" },
      { cap: tx`\(\mathbf F\cdot\mathbf r'=-2\sin^2t-2\cos^2t=-2\). The field pushes against the bead at every point.`, drop: "LV", add: "Tb Ld stk", cam: { p: .6 } },
      { cap: tx`Add \(-2\,dt\) once around the circle. The curtain hangs at the same depth the whole way.`, drop: "fld Fb Vb Tb", add: "cur", from: { c: .002, t: 0 }, set: { c: TAU, t: TAU }, dur: 3.4 },
      { cap: tx`\(-2\cdot2\pi=-4\pi\approx-12.57\). The bead walks counterclockwise against a clockwise swirl.`, drop: "Ld", add: "Ans" }
    ]
  };
})();
