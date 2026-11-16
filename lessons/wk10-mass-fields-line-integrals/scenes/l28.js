/* ---------- Lesson 28 scenes: mass, moments, center of mass, moment of inertia ---------- */
S["ex28-1"] = (() => {
  const f = (x, y) => 3 * y * sqrt(x);
  return {
    cam: { y: -1.1, p: .5, d: 4.7, at: [1.1, 1.3, 4.6] },
    P: { c: 2 },
    build(k) {
      k.scale(.55, .55, .075, [1, 1.5, 5]);
      k.axes("axes", [0, 2.9], [0, 3.9], [0, 15]);
      k.rs = rectSolid(k, f, [0, 2], [0, 3], [0, 12.8]);
      fin(k, "fx", [0, -.6], [2, -.6], s => 4 * sqrt(s), 0, 2, { c: "s1" });
      fin(k, "fy", [2.6, 0], [2.6, 3], s => 1.9 * s, 0, 3, { c: "s2" });
      k.label("Lx", [1, 0, 0], tx`0\le x\le2`, { dx: -20, dy: 36 });
      k.label("Ly", [2, 1.5, 0], tx`0\le y\le3`, { dx: 66, dy: 22 });
      k.label("Lr", [2, 3, f(2, 3)], tx`\rho=3y\sqrt x`, { c: "cursor", dx: 46, dy: -24 });
      k.label("Lm", [1.2, 1.8, 6], tx`m=\iint_R\rho\,dA`, { c: "accent", dx: -70, dy: -80 });
      k.label("Lfx", [1.3, -.6, 4.2], tx`\int_0^2\sqrt x\,dx`, { c: "s1", dx: -70, dy: -34 });
      k.label("Lfx2", [1.3, -.6, 4.2], tx`\int_0^2\sqrt x\,dx=\tfrac{4\sqrt2}{3}`, { c: "s1", dx: -70, dy: -34 });
      k.label("Lfy", [2.6, 2.2, 3.8], tx`\int_0^3 3y\,dy`, { c: "s2", dx: 76, dy: -26 });
      k.label("Lfy2", [2.6, 2.2, 3.8], tx`\int_0^3 3y\,dy=\tfrac{27}{2}`, { c: "s2", dx: 76, dy: -26 });
      k.label("Ans", [1, 1.5, 12], tx`m=18\sqrt2\approx25.46`, { c: "glow", dy: -40, line: false });
    },
    update(P, k) { k.rs.cut.set(P.c + .002); },
    steps: [
      { cap: tx`The plate covers \(0\le x\le2\) and \(0\le y\le3\). The see-through surface is the density \(3y\sqrt x\). It's highest at the corner \((2,3)\).`, add: "axes R Re ghost Lx Ly Lr" },
      { cap: tx`Mass is density times area, added over the whole plate. That's the volume under the density surface.`, drop: "Lx Ly", add: "solid Lm", from: { c: .001 }, set: { c: 2 }, dur: 2.6 },
      { cap: tx`The density is \(\sqrt x\) times \(3y\), and every limit is a number. So the volume equals the area of the \(x\) fin times the area of the \(y\) fin.`, drop: "Lm Lr solid", add: "fxs fys Lfx Lfy", cam: { y: -.78, p: .22, d: 5 } },
      { cap: tx`The \(x\) fin is the curve \(\sqrt x\) from 0 to 2. Its area is \(\tfrac23x^{3/2}\) at \(x=2\), which is \(\tfrac{4\sqrt2}{3}\).`, drop: "Lfx", add: "Lfx2" },
      { cap: tx`The \(y\) fin is the line \(3y\) from 0 to 3, a triangle with area \(\tfrac12\cdot3\cdot9=\tfrac{27}{2}\). Multiply the two areas.`, drop: "Lfy", add: "Lfy2" },
      { cap: tx`\(\tfrac{4\sqrt2}{3}\cdot\tfrac{27}{2}=18\sqrt2\approx25.46\).`, drop: "fxs fys Lfx2 Lfy2", add: "solid Ans", cam: { y: -1.1, p: .5, d: 4.7 } }
    ]
  };
})();

S["ex28-2"] = (() => {
  const g = m => (x, y) => y * lerp(1, x, m);
  return {
    cam: { y: -1.05, p: .45, d: 3.6, at: [3.5, 4.5, 4] },
    P: { m: 0, c: 4, px: 3.3, py: 4.6 },
    build(k) {
      k.scale(.36, .36, .05, [2.3, 2.7, 7]);
      k.axes("axes", [0, 5.2], [0, 6.3], [0, 23]);
      k.rs = rectSolid(k, g(0), [3, 4], [4, 5], [0, 20]);
      k.tube("Yax", [[0, 0, 0], [0, 6, 0]], { c: "glow", r: .022 });
      k.label("LY", [0, 5.6, 0], tx`y\text{-axis}`, { c: "glow", dx: -44, dy: -10 });
      k.seg("arm", { c: "cursor", r: .016 }); k.dot("pd", { c: "cursor", r: .04 });
      k.label("Larm", () => [k.P.px / 2, k.P.py, 0], tx`x`, { c: "cursor", dy: -18, line: false });
      fin(k, "fx", [3, 3.5], [4, 3.5], s => 2.3 * s, 3, 4, { c: "s1" });
      fin(k, "fy", [4.5, 4], [4.5, 5], s => 2.3 * s, 4, 5, { c: "s2" });
      k.label("Lx", [3.5, 4, 0], tx`3\le x\le4`, { dx: -30, dy: 40 });
      k.label("Ly", [4, 4.5, 0], tx`4\le y\le5`, { dx: 70, dy: 20 });
      k.label("Lr", [4, 5, 5], tx`\rho=y`, { c: "cursor", dx: 40, dy: -26 });
      k.label("Lxy", [4, 5, 20], tx`x\rho=xy`, { c: "cursor", dx: 44, dy: -26 });
      k.label("Lfx", [3.4, 3.5, 7.8], tx`\int_3^4x\,dx`, { c: "s1", dx: -80, dy: -30 });
      k.label("Lfx2", [3.4, 3.5, 7.8], tx`\int_3^4x\,dx=\tfrac72`, { c: "s1", dx: -80, dy: -30 });
      k.label("Lfy", [4.5, 4.7, 10.8], tx`\int_4^5y\,dy`, { c: "s2", dx: 70, dy: -24 });
      k.label("Lfy2", [4.5, 4.7, 10.8], tx`\int_4^5y\,dy=\tfrac92`, { c: "s2", dx: 70, dy: -24 });
      k.label("Ans", [3.5, 4.5, 20], tx`M_y=\tfrac{63}{4}=15.75`, { c: "glow", dy: -40, line: false });
    },
    update(P, k) {
      if (k.lm !== P.m) { k.lm = P.m; k.rs.set(g(P.m)); }
      k.rs.cut.set(P.c + .002);
      k.o.arm.set([0, P.py, .02], [P.px, P.py, .02]); k.o.pd.at([P.px, P.py, .02]);
    },
    steps: [
      { cap: tx`The plate is a 1-by-1 square with \(3\le x\le4\) and \(4\le y\le5\). The block's height is the density \(\rho=y\), a gentle ramp from 4 up to 5.`, add: "axes R Re solid Lx Ly Lr" },
      { cap: tx`\(M_y\) measures turning about the \(y\)-axis. A piece at \((x,y)\) sits \(x\) units from that axis, so it counts \(x\) times its mass.`, drop: "solid Lr Lx Ly", add: "Yax LY arm pd Larm", from: { px: 3.05, py: 4.15 }, set: { px: 3.9, py: 4.75 }, dur: 2.2, cam: { y: -1.2, p: .55, d: 4.8, at: [2.5, 2.9, 4] } },
      { cap: tx`Multiply the density by \(x\) and the block becomes \(xy\), taller on the far side. That's an \(x\) piece times a \(y\) piece over a rectangle, so it splits.`, drop: "arm pd Larm LY Yax", add: "solid Lxy fxs fys Lfx Lfy", from: { m: 0 }, set: { m: 1 }, dur: 2, cam: { y: -.8, p: .25, d: 3.8, at: [3.7, 4.3, 8] } },
      { cap: tx`The \(x\) fin is a trapezoid over \([3,4]\) with area \(\tfrac72\). The \(y\) fin over \([4,5]\) has area \(\tfrac92\). Multiply them.`, drop: "Lfx Lfy", add: "Lfx2 Lfy2" },
      { cap: tx`\(\tfrac72\cdot\tfrac92=\tfrac{63}{4}=15.75\).`, drop: "fxs fys Lfx2 Lfy2 Lxy", add: "Ans" }
    ]
  };
})();

S["ex28-3"] = (() => {
  const H = 2.6, sh = [(x, y) => x * y ** 3 / 192, (x, y) => x * x * y ** 3 / 576, (x, y) => x * y ** 4 / 768];
  const g = m => { const i = min(1, floor(m)), u = m - i; return (x, y) => H * lerp(sh[i](x, y), sh[i + 1](x, y), u); };
  return {
    cam: { y: -1.05, p: .5, d: 4.8, at: [1.5, 2, 1.1] },
    P: { m: 0, c: 3 },
    build(k) {
      k.scale(.4, .4, .38, [1.5, 2, 1.2]);
      k.axes("axes", [0, 3.8], [0, 4.9], [0, 3.2]);
      k.rs = rectSolid(k, g(0), [0, 3], [0, 4], [0, H]);
      k.dot("mid", { c: "ink", r: .04, p: [1.5, 2, 0] });
      k.label("Lmid", [1.5, 2, 0], tx`\text{middle}`, { c: "ink", dx: -40, dy: 26 });
      k.label("Lx", [1.5, 0, 0], tx`0\le x\le3`, { dx: -10, dy: 34 });
      k.label("Ly", [3, 2, 0], tx`0\le y\le4`, { dx: 64, dy: 18 });
      k.label("Lrho", [3, 4, H], tx`\rho=xy^3`, { c: "cursor", dx: 48, dy: -20 });
      k.label("Lxr", [3, 4, H], tx`x\rho=x^2y^3`, { c: "cursor", dx: 54, dy: -20 });
      k.label("Lyr", [3, 4, H], tx`y\rho=xy^4`, { c: "cursor", dx: 54, dy: -20 });
      k.label("Lm", [1.5, 2, H], tx`m=288`, { c: "accent", dy: -64, line: false });
      k.label("Lmy", [1.5, 2, H], tx`M_y=576`, { c: "accent", dy: -64, line: false });
      k.label("Lmx", [1.5, 2, H], tx`M_x=\tfrac{4608}{5}`, { c: "accent", dy: -64, line: false });
      k.label("Ldiv", [1.5, 2, H], tx`\bar x=\dfrac{M_y}{m}\qquad\bar y=\dfrac{M_x}{m}`, { c: "accent", dy: -70, line: false });
      k.tube("pin", [[2, 3.2, 0], [2, 3.2, H + .4]], { c: "glow", r: .02 });
      k.dot("pdot", { c: "glow", r: .055, p: [2, 3.2, 0] });
      k.label("Ans", [2, 3.2, H + .4], tx`(\bar x,\bar y)=\left(2,\tfrac{16}{5}\right)`, { c: "glow", dx: 40, dy: -30 });
    },
    update(P, k) {
      if (k.lm !== P.m) { k.lm = P.m; k.rs.set(g(P.m)); }
      k.rs.cut.set(P.c + .002);
    },
    steps: [
      { cap: tx`The plate covers \(0\le x\le3\) and \(0\le y\le4\). The surface is the density \(xy^3\), which climbs steeply toward \(y=4\). You need three integrals, \(m\), \(M_y\) and \(M_x\).`, add: "axes R Re ghost mid Lmid Lx Ly Lrho" },
      { cap: tx`The mass is the volume under the density. It splits into \(\int_0^3x\,dx\cdot\int_0^4y^3\,dy=\tfrac92\cdot64=288\).`, drop: "Lx Ly", add: "solid Lm", from: { c: .001 }, set: { c: 3 }, dur: 2.4 },
      { cap: tx`For \(M_y\), weight each piece by its distance \(x\) from the \(y\)-axis. The surface becomes \(x^2y^3\) and leans toward large \(x\). Heights are rescaled to fit.`, drop: "Lm Lrho", add: "Lmy Lxr", from: { m: 0 }, set: { m: 1 }, dur: 1.8 },
      { cap: tx`For \(M_x\), weight by the distance \(y\) from the \(x\)-axis. The surface becomes \(xy^4\) and leans even harder toward \(y=4\).`, drop: "Lmy Lxr", add: "Lmx Lyr", set: { m: 2 }, dur: 1.8 },
      { cap: tx`Each moment divided by the mass gives one coordinate of the balance point.`, drop: "Lmx Lyr", add: "Ldiv Lrho", set: { m: 0 }, dur: 1.5 },
      { cap: tx`\(\bar x=\tfrac{576}{288}=2\) and \(\bar y=\tfrac{4608}{5}\div288=\tfrac{16}{5}\). A pin at \(\left(2,\tfrac{16}{5}\right)\) balances the plate, up and to the right of the middle.`, drop: "Ldiv Lrho", add: "pin pdot Ans" }
    ]
  };
})();

S["ex28-4"] = (() => {
  const H = 1.5, w = (x, y) => H * x * x * y ** 4 / 64, G = [1.4, 1.3];
  return {
    cam: { y: -1.0, p: .42, d: 5.2, at: [1, .8, .1] },
    P: { a: 0, c: 2 },
    build(k) {
      k.scale(.6, .6, .6, [1, 0, 0]);
      k.tube("spin", [[-.7, 0, 0], [2.8, 0, 0]], { c: "glow", r: .02 });
      k.label("Lspin", [2.8, 0, 0], tx`x\text{-axis}`, { c: "glow", dx: 40, dy: 14 });
      k.flat("plate", [[0, 0], [2, 0], [2, 2], [0, 2]], 0, { c: "accent", o: .22 });
      k.tube("pe", [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0], [0, 0, 0]], { c: "accent", r: .01 });
      const rn = srand(11), pts = [];
      while (pts.length < 700) { const x = 2 * rn(), y = 2 * rn(); if (rn() * 16 < x * x * y * y) pts.push([x, y, .012]); }
      cloud(k, "grains", pts, { c: "ink", size: 3.2, o: .7 });
      k.seg("arm", { c: "cursor", r: .014 }); k.dot("gd", { c: "cursor", r: .045 });
      k.tube("ring", along(t => [G[0], G[1] * cos(t), G[1] * sin(t)], 0, TAU, 72), { c: "cursor", r: .006, o: .55 });
      k.label("Larm", () => [G[0], G[1] / 2 * cos(k.P.a), G[1] / 2 * sin(k.P.a)], tx`y`, { c: "cursor", dx: 14, dy: -8, line: false });
      k.label("Lc", () => [2, 2 * cos(k.P.a), 2 * sin(k.P.a)], tx`(2,2)`, { c: "muted", dx: 26, dy: -10, line: false });
      k.rs = rectSolid(k, w, [0, 2], [0, 2], [0, H]);
      fin(k, "fx", [0, -.5], [2, -.5], s => .32 * s * s, 0, 2, { c: "s1" });
      fin(k, "fy", [2.5, 0], [2.5, 2], s => .085 * s ** 4, 0, 2, { c: "s2" });
      k.label("Lw", [2, 2, H], tx`y^2\rho=x^2y^4`, { c: "cursor", dx: 50, dy: -20 });
      k.label("Lfx", [1.5, -.5, .72], tx`\int_0^2x^2\,dx`, { c: "s1", dx: -80, dy: -30 });
      k.label("Lfx2", [1.5, -.5, .72], tx`\int_0^2x^2\,dx=\tfrac83`, { c: "s1", dx: -80, dy: -30 });
      k.label("Lfy", [2.5, 1.8, .9], tx`\int_0^2y^4\,dy`, { c: "s2", dx: 70, dy: -30 });
      k.label("Lfy2", [2.5, 1.8, .9], tx`\int_0^2y^4\,dy=\tfrac{32}{5}`, { c: "s2", dx: 70, dy: -30 });
      k.label("Ans", [1, 1, 1.3], tx`I_x=\tfrac{256}{15}\approx17.07`, { c: "glow", dy: -50, line: false });
    },
    update(P, k) {
      for (const n of ["plate", "pe", "grains"]) k.o[n].obj.rotation.x = P.a;
      const q = [G[0], G[1] * cos(P.a), G[1] * sin(P.a)];
      k.o.arm.set([G[0], 0, 0], q); k.o.gd.at(q);
      k.rs.cut.set(P.c + .002);
    },
    steps: [
      { cap: tx`Spin the plate about the \(x\)-axis. A grain at \((x,y)\) swings around a circle of radius \(y\), so \(y\) is its distance from the axis. The grains crowd toward \((2,2)\).`, add: "spin Lspin plate pe grains arm gd ring Larm Lc", from: { a: 0 }, set: { a: TAU }, dur: 3.4 },
      { cap: tx`Each grain counts \(y^2\) times its mass. As a surface that's \(y^2\cdot x^2y^2=x^2y^4\), and \(I_x\) is the volume under it. Heights are scaled to fit.`, drop: "plate pe grains arm gd ring Larm Lc", add: "R Re solid ghost Lw", from: { c: .001 }, set: { c: 2 }, dur: 2.4 },
      { cap: tx`\(x^2y^4\) is \(x^2\) times \(y^4\) over a square. So the volume is the area of the \(x^2\) fin times the area of the \(y^4\) fin.`, drop: "solid Lw", add: "fxs fys Lfx Lfy", cam: { y: -.8, p: .25, d: 5 } },
      { cap: tx`\(\int_0^2x^2\,dx=\tfrac83\) and \(\int_0^2y^4\,dy=\tfrac{32}{5}\). The \(y^4\) fin shoots up near \(y=2\), where the far edge does most of the resisting. Multiply the two.`, drop: "Lfx Lfy", add: "Lfx2 Lfy2" },
      { cap: tx`\(\tfrac83\cdot\tfrac{32}{5}=\tfrac{256}{15}\approx17.07\), in units of mass times length squared.`, drop: "R Re ghost fxs fys Lfx2 Lfy2", add: "plate pe grains Ans", from: { a: 0 }, set: { a: TAU }, dur: 3, cam: { y: -1.0, p: .42, d: 5.2 } }
    ]
  };
})();

S["ex28-5"] = (() => {
  const rho = (x, y, z) => 4 * x + 6 * y + 5 * z, G = [2.3, 4.6, 4.4], C = [41 / 26, 45 / 13, 44 / 13], M = [1.5, 3, 3];
  return {
    cam: { y: -.85, p: .4, d: 6, at: [1.5, 3, 2.9] },
    P: {},
    build(k) {
      k.scale(.26, .26, .26, M);
      k.axes("axes", [0, 4.4], [0, 7.5], [0, 7.5]);
      boxEdges(k, "box", [0, 0, 0], [3, 6, 6]);
      const rn = srand(5), pts = [];
      while (pts.length < 1600) { const p = [3 * rn(), 6 * rn(), 6 * rn()]; if (rn() * 78 < rho(...p)) pts.push(p); }
      cloud(k, "grains", pts, { c: "ink", size: 3, o: .55 });
      k.poly("Pyz", [[0, 0, 0], [0, 6, 0], [0, 6, 6], [0, 0, 6]], { c: "s1", o: .2 });
      k.poly("Pxz", [[0, 0, 0], [3, 0, 0], [3, 0, 6], [0, 0, 6]], { c: "s2", o: .2 });
      k.poly("Pxy", [[0, 0, 0], [3, 0, 0], [3, 6, 0], [0, 6, 0]], { c: "s3", o: .22 });
      k.dot("g", { c: "cursor", r: .045, p: G });
      k.tube("ax", [[0, G[1], G[2]], G], { c: "s1", r: .016 });
      k.tube("ay", [[G[0], 0, G[2]], G], { c: "s2", r: .016 });
      k.tube("az", [[G[0], G[1], 0], G], { c: "s3", r: .016 });
      k.label("Lax", [G[0] / 2, G[1], G[2]], tx`x`, { c: "s1", dy: -16, line: false });
      k.label("Lay", [G[0], G[1] / 2, G[2]], tx`y`, { c: "s2", dy: -16, line: false });
      k.label("Laz", [G[0], G[1], G[2] / 2], tx`z`, { c: "s3", dx: 14, line: false });
      k.label("Lrho", [3, 6, 6], tx`\rho=4x+6y+5z`, { c: "cursor", dx: 60, dy: -24 });
      const top = [3, 6, 3];
      k.label("Lm", top, tx`m=4212`, { c: "accent", dx: 130, line: false });
      k.label("LMyz", top, tx`M_{yz}=\iiint x\rho\,dV=6642`, { c: "s1", dx: 130, line: false });
      k.label("LMxz", top, tx`M_{xz}=\iiint y\rho\,dV=14580`, { c: "s2", dx: 130, line: false });
      k.label("LMxy", top, tx`M_{xy}=\iiint z\rho\,dV=14256`, { c: "s3", dx: 130, line: false });
      k.label("Ldiv", top, tx`\bar x=\tfrac{M_{yz}}{m}\quad\bar y=\tfrac{M_{xz}}{m}\quad\bar z=\tfrac{M_{xy}}{m}`, { c: "accent", dx: 130, line: false });
      k.dot("mid", { c: "ink", r: .05, p: M });
      k.label("Lmid", M, tx`\text{box center}`, { c: "ink", dx: -70, dy: 30 });
      k.dot("com", { c: "glow", r: .065, p: C });
      k.tubes("cl", [[M, [C[0], 3, 3]], [[C[0], 3, 3], [C[0], C[1], 3]], [[C[0], C[1], 3], C]], { c: "glow", r: .011 });
      k.label("Ans", C, tx`\left(\tfrac{41}{26},\tfrac{45}{13},\tfrac{44}{13}\right)`, { c: "glow", dx: 80, dy: -40 });
    },
    steps: [
      { cap: tx`Each dot is a grain of mass. They crowd toward the far corner, where \(4x+6y+5z\) is largest. Adding the density over the box gives \(m=4212\).`, add: "axes box grains Lrho Lm" },
      { cap: tx`\(M_{yz}\) weights each grain by its distance \(x\) from the \(yz\)-plane, the wall shaded here.`, drop: "Lm", add: "Pyz ax g Lax LMyz" },
      { cap: tx`\(M_{xz}\) uses the distance \(y\) from the \(xz\)-plane, so each grain counts \(y\) times its mass.`, drop: "Pyz ax Lax LMyz", add: "Pxz ay Lay LMxz" },
      { cap: tx`\(M_{xy}\) uses the height \(z\) above the \(xy\)-plane, the floor.`, drop: "Pxz ay Lay LMxz", add: "Pxy az Laz LMxy" },
      { cap: tx`Divide each moment by the mass to get each coordinate. For comparison, the plain center of the box is \((1.5,3,3)\).`, drop: "Pxy az Laz LMxy g", add: "mid Lmid Ldiv" },
      { cap: tx`\(\left(\tfrac{41}{26},\tfrac{45}{13},\tfrac{44}{13}\right)\approx(1.577,3.462,3.385)\). It sits past the box center on every axis, toward the heavy corner.`, drop: "Ldiv", add: "com cl Ans" }
    ]
  };
})();
