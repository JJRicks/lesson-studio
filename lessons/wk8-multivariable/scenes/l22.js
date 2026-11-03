/* ---------- Lesson 22 scenes: caption per written step, last entry is the locked answer step ---------- */

S["ex22-1"] = {
  cam: { y: -1.05, p: .6, d: 6.9, at: [1.2, -.8, 18] },
  P: { t: 2.9, lift: 0 },
  build(k) {
    k.scale(.15, .15, .0175, [1.2, -.8, 18]);
    const F = -12, f = (x, y) => x * x + 4 * y * y - 2 * x + 8 * y, ell = (p, z) => rng(0, TAU, 96).map(a => [1 + p * cos(a), -1 + .5 * p * sin(a), z]);
    k.flat("floor", [[-8, -6.2], [10.6, -6.2], [10.6, 4.6], [-8, 4.6]], F, { c: "surface-2", o: .7 });
    k.grid("grid", [-8, 10, 2], [-6, 4, 2], F);
    k.surf("bowl", (p, a) => [1 + p * cos(a), -1 + .5 * p * sin(a), p * p - 5], [0, 8.66, 26], [0, TAU, 72], { ramp: [-5, 70], o: .74 });
    k.tubes("rings", [2.5, 4.5, 6.5, 8.5].map(p => ell(p, F)), { c: "muted", r: .007, o: .8 });
    k.tube("line", [[10.4, -1.7, F], [.1, 3.45, F]], { c: "accent", r: .024 });
    k.dot("pt", { c: "ink" }); k.arrow("gF", { c: "glow" }); k.arrow("gG", { c: "accent" });
    k.tube("locus", [[-7.6, -5.3, F], [10.2, 3.6, F]], { c: "glow", r: .018 });
    k.arrow("a1", { c: "glow", r: .012 }).set([-3, -3, F], [-4.1, -5.2, F]);
    k.arrow("a2", { c: "glow", r: .012 }).set([3, 0, F], [4.1, 2.2, F]);
    k.dot("sol", { c: "glow", p: [5, 1, F], r: .05 });
    k.seg("pin", { c: "ink", r: .012 }); k.dot("tip", { c: "glow", r: .055 });
    k.tube("ring", ell(sqrt(32), 27), { c: "glow", r: .02 });
    const tt = rng(-1.2, 3.2, 44);
    k.curt("fence", tt.length, { c: "accent", o: .3 }).set(tt.map(t => [7 - 2 * t, t, f(7 - 2 * t, t), F]));
    k.tube("fenceT", tt.map(t => [7 - 2 * t, t, f(7 - 2 * t, t)]), { c: "accent", r: .017 });
    k.label("Lb", [-5.2, -1, 40], tx`z=f(x,y)`, { c: "s2" });
    k.label("Ll", [2, 2.5, F], tx`x+2y=7`, { c: "accent", dx: -52, dy: -20 });
    k.label("LgF", () => k.o.gF.b, tx`\nabla f`, { c: "glow", dy: -14 });
    k.label("LgG", () => k.o.gG.b, tx`\nabla g`, { c: "accent", dx: 22, dy: -4, line: false });
    k.label("Lok", () => k.o.pt.p, tx`\text{lined up!}`, { c: "good", dx: -62, dy: 26, when: () => abs(k.P.t - 1) < .22 });
    k.label("Llo", [-5.6, -4.3, F], tx`y=\tfrac{x-3}{2}`, { c: "glow", dx: 48, dy: 16 });
    k.label("La1", [3.6, 1.2, F], tx`\nabla f\parallel\langle1,2\rangle`, { c: "glow", dx: 62, dy: 20 });
    k.label("Ls", [5, 1, F], tx`(5,\,1)`, { c: "glow", dx: 44, dy: -20 });
    k.label("Lq", [5, 1, 27], tx`f(5,1)=\,?`, { c: "glow", dx: 62, dy: -20 });
    k.label("La", [5, 1, 27], tx`f(5,1)=27`, { c: "glow", dx: 62, dy: -22 });
    k.label("Lr", [-3.7, -1, 27], tx`\text{level curve }f=27`, { c: "glow", dx: -30, dy: -26 });
  },
  update(P, k) {
    const y = P.t, x = 7 - 2 * y, F = -12, g = [2 * x - 2, 8 * y + 8], n = hypot(g[0], g[1]) || 1, L = 2.7, m = sqrt(5), h = F + 39 * P.lift;
    k.o.pt.at([x, y, F]);
    k.o.gF.set([x, y, F], [x + g[0] / n * L, y + g[1] / n * L, F]);
    k.o.gG.set([x, y, F], [x + L / m, y + 2 * L / m, F]);
    k.o.pin.set([5, 1, F], [5, 1, h]); k.o.tip.at([5, 1, h]);
  },
  steps: [
    { cap: tx`The bowl is the objective \(f\). The blue line on the floor is the constraint: you may only stand on that line.`, add: "floor grid bowl line Lb Ll" },
    { cap: tx`Looking straight down, the bowl's height turns into contour rings. At a point on the line, \(\nabla f\) points uphill across the rings and \(\nabla g\) points straight off the line.`, drop: "bowl Lb", add: "rings pt gF gG LgF LgG", cam: { y: -PI / 2, p: 1.5, d: 6.2, at: [1.2, -.8, -12] }, dur: 1.5 },
    { cap: tx`The system says the two arrows must line up, \(\nabla f=\lambda\nabla g\), while the point stays on the line. Watch them swing into line as the point slides.`, add: "Lok", from: { t: 2.9 }, set: { t: -.9 }, dur: 4.5 },
    { cap: tx`Eliminating \(\lambda\) finds every spot where the arrows could line up: the orange line \(y=\frac{x-3}{2}\). Everywhere on it, \(\nabla f\) points along \(\langle1,2\rangle\).`, drop: "pt gF gG LgF LgG Lok", add: "locus Llo a1 a2 La1" },
    { cap: tx`The answer has to be on both lines, and they cross at exactly one point: \((5,1)\).`, drop: "a1 a2 La1", add: "sol Ls" },
    { cap: tx`Back in 3D, lift that point straight up until it reaches the bowl. Its height there is the value we want.`, drop: "rings locus Llo Ls", add: "bowl pin tip Lq", set: { lift: 1 }, win: { lift: [.4, 1] }, cam: { y: -1.05, p: .55, d: 6.9, at: [1.2, -.8, 18] }, dur: 2 },
    { cap: tx`Height 27. A wall stands on the line, and the orange level curve \(f=27\) just touches it: everywhere else along the wall, the bowl is higher.`, drop: "Lq", add: "ring fence fenceT La Lr", cam: { y: 1.05, p: .32, d: 6.9, at: [1.8, -.2, 24] }, dur: 1.8 }
  ]
};

S["ex22-2"] = {
  cam: { y: -PI / 2, p: 1.5, d: 7.8, at: [0, 0, 0] },
  P: { th: 2.15, lift: 0 },
  build(k) {
    k.scale(.2, .2, .0155, [0, 0, 0]);
    const R = sqrt(32), f = (x, y) => 7 * x + 4 * y, s65 = sqrt(65), u = [7 / s65, 4 / s65], w = [-u[1], u[0]], A = [28 * sqrt(130) / 65, 16 * sqrt(130) / 65], Z = 4 * sqrt(130);
    k.flat("floor", [[-8, -8], [8, -8], [8, 8], [-8, 8]], 0, { c: "surface-2", o: .6 });
    k.grid("grid", [-8, 8, 2], [-8, 8, 2], 0);
    k.tube("circ", rng(0, TAU, 96).map(a => [R * cos(a), R * sin(a), 0]), { c: "accent", r: .024 });
    k.tubes("lv", [-40, -20, 0, 20, 40].map(c => { const p = [c * 7 / 65, c * 4 / 65], L = sqrt(7.6 ** 2 - hypot(p[0], p[1]) ** 2); return [[p[0] - w[0] * L, p[1] - w[1] * L, 0], [p[0] + w[0] * L, p[1] + w[1] * L, 0]]; }), { c: "muted", r: .007, o: .85 });
    k.dot("pt", { c: "ink" }); k.arrow("gF", { c: "glow" }); k.arrow("gG", { c: "accent" });
    k.tube("link", [[-7.6 * u[0], -7.6 * u[1], 0], [7.6 * u[0], 7.6 * u[1], 0]], { c: "glow", r: .018 });
    k.dot("A", { c: "glow", p: [A[0], A[1], 0] }); k.dot("B", { c: "glow", p: [-A[0], -A[1], 0] });
    k.surf("pl", (p, a) => { const x = p * cos(a), y = p * sin(a); return [x, y, f(x, y)]; }, [0, R, 12], [0, TAU, 72], { ramp: [-46, 46], o: .84 });
    k.tube("rim", rng(0, TAU, 96).map(a => [R * cos(a), R * sin(a), f(R * cos(a), R * sin(a))]), { c: "s3", r: .017 });
    k.surf("wall", (a, z) => [R * cos(a), R * sin(a), z], [0, TAU, 72], [-52, 52, 1], { c: "accent", o: .1 });
    k.seg("pA", { c: "ink", r: .012 }); k.seg("pB", { c: "ink", r: .012 }); k.dot("tA", { c: "glow", r: .05 }); k.dot("tB", { c: "glow", r: .05 });
    k.tube("tan", [[-A[0] - w[0] * 3.4, -A[1] - w[1] * 3.4, -Z], [-A[0] + w[0] * 3.4, -A[1] + w[1] * 3.4, -Z]], { c: "glow", r: .018 });
    k.label("Lc", [0, -R, 0], tx`x^2+y^2=32`, { c: "accent", dy: 20, line: false });
    k.label("Lv", [7.1, -5, 0], tx`\text{level lines of }f`, { c: "muted", dx: 2, dy: 0, line: false });
    k.label("LgF", () => k.o.gF.b, tx`\nabla f`, { c: "glow", dy: -14 });
    k.label("LgG", () => k.o.gG.b, tx`\nabla g`, { c: "accent", dy: -14 });
    k.label("Lok", () => k.o.pt.p, tx`\text{lined up!}`, { c: "good", dx: 56, dy: 24, when: () => { const d = ((k.P.th - atan2(4, 7)) % PI + PI) % PI; return min(d, PI - d) < .1; } });
    k.label("Ll", [1.75, 1, 0], tx`y=\tfrac47x`, { c: "glow", dx: -34, dy: -26 });
    k.label("LA", [A[0], A[1], 0], tx`(4.91,\,2.81)`, { c: "glow", dx: 54, dy: -16 });
    k.label("LB", [-A[0], -A[1], 0], tx`(-4.91,\,-2.81)`, { c: "glow", dx: -58, dy: 18 });
    k.label("Lp", [-4, 3.2, 12], tx`z=7x+4y`, { c: "s2", dy: -6 });
    k.label("LhA", [A[0], A[1], Z], tx`\text{high point}`, { c: "ink", dx: 40, dy: -18 });
    k.label("LhB", [-A[0], -A[1], -Z], tx`\text{low point: }f=\,?`, { c: "glow", dx: 56, dy: 20 });
    k.label("Ls", [-A[0], -A[1], -Z], tx`-4\sqrt{130}\approx-45.61`, { c: "glow", dx: 66, dy: 24 });
  },
  update(P, k) {
    const R = sqrt(32), x = R * cos(P.th), y = R * sin(P.th), L = 2.2, s65 = sqrt(65), A = [28 * sqrt(130) / 65, 16 * sqrt(130) / 65], Z = 4 * sqrt(130) * P.lift;
    k.o.pt.at([x, y, 0]);
    k.o.gF.set([x, y, 0], [x + 7 / s65 * L, y + 4 / s65 * L, 0]);
    k.o.gG.set([x, y, 0], [x + cos(P.th) * L, y + sin(P.th) * L, 0]);
    k.o.pA.set([A[0], A[1], 0], [A[0], A[1], Z]); k.o.pB.set([-A[0], -A[1], 0], [-A[0], -A[1], -Z]);
    k.o.tA.at([A[0], A[1], Z]); k.o.tB.at([-A[0], -A[1], -Z]);
  },
  steps: [
    { cap: tx`\(f\) is a tilted plane, so from above its level curves are parallel lines, and \(\nabla f=\langle7,4\rangle\) is the same arrow everywhere. \(\nabla g\) points straight out from the circle.`, add: "floor grid circ lv pt gF gG Lc Lv LgF LgG" },
    { cap: tx`Slide around the circle. The arrows line up at exactly two places: once pointing the same way, once pointing opposite ways.`, add: "Lok", from: { th: 2.15 }, set: { th: 2.15 + TAU }, dur: 6 },
    { cap: tx`Dividing the equations removes \(\lambda\) and leaves \(y=\frac47x\): the line through the center, running along \(\nabla f\).`, drop: "pt gF gG LgF LgG Lok Lv", add: "link Ll" },
    { cap: tx`That line crosses the circle at two points. Those are the only two candidates.`, add: "A B LA LB" },
    { cap: tx`Back in 3D, \(f\) is the height of the tilted plane. Above one candidate it's high, and at the other it's low. The low one is our minimum.`, drop: "lv link Ll LA LB Lc", add: "pl rim wall pA pB tA tB Lp LhA LhB", set: { lift: 1 }, win: { lift: [.4, 1] }, cam: { y: -1.1, p: .3, d: 6.6, at: [0, 0, 0] }, dur: 2 },
    { cap: tx`The minimum is \(-4\sqrt{130}\approx-45.61\). The orange level line at that height just touches the rim of the plane, the same tangency as always.`, drop: "LhB", add: "tan Ls", cam: { y: -2.25, p: .22, d: 6.6 } }
  ]
};

S["ex22-3"] = {
  cam: { y: -.15, p: .5, d: 6.4, at: [.3, .3, .3] },
  P: { m: 0, rad: 0 },
  build(k) {
    k.scale(1.3, 1.3, 1.3, [.3, .3, .3]);
    const c = 1 / 3, big = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(v => v.map(q => c + (q - c) * 1.3));
    k.axes("axes", [-.25, 1.15], [-.25, 1.15], [-.25, 1.15]);
    k.dot("O", { c: "ink", p: [0, 0, 0], r: .032 });
    k.poly("pl", big, { c: "accent", o: .34 });
    k.tubes("edge", [[big[0], big[1]], [big[1], big[2]], [big[2], big[0]]], { c: "accent", r: .01 });
    k.seg("rad", { c: "glow", r: .008, o: .75 });
    k.dot("pt", { c: "ink" }); k.arrow("gF", { c: "glow" }); k.arrow("gG", { c: "accent" });
    k.tube("ray", [[-.22, -.22, -.22], [.9, .9, .9]], { c: "good", r: .014 });
    k.ball("ball", { c: "s3", o: .42, sh: 60 });
    k.label("Lp", big[0], tx`x+y+z=1`, { c: "accent", dx: 8, dy: 22 });
    k.label("LgF", () => k.o.gF.b, tx`\nabla f`, { c: "glow", dx: 34, dy: 14, line: false });
    k.label("LgG", () => k.o.gG.b, tx`\nabla g`, { c: "accent", dx: -4, dy: -14, line: false });
    k.label("Lr", [-.12, -.12, -.12], tx`x=y=z`, { c: "good", dx: -46, dy: 14 });
    k.label("Ls", [c, c, c], tx`(\tfrac13,\tfrac13,\tfrac13)`, { c: "ink", dx: -72, dy: -26 });
    k.label("Lq", () => { const a = k.P.rad / sqrt(2); return [a, -a * .2, a * .9]; }, tx`x^2+y^2+z^2=c`, { c: "cursor", dx: -70, dy: -40 });
    k.label("La", [c, c, c], tx`c=\tfrac13`, { c: "glow", dx: -50, dy: -30 });
  },
  update(P, k) {
    const c = 1 / 3, s = [.62, .3, .08], Q = s.map(v => lerp(v, c, P.m)), n = hypot(Q[0], Q[1], Q[2]), L = .42, g = 1 / sqrt(3);
    k.o.pt.at(Q); k.o.rad.set([0, 0, 0], Q);
    k.o.gF.set(Q, Q.map(v => v + v / n * L)); k.o.gG.set(Q, Q.map(v => v + g * L));
    k.o.ball.at([0, 0, 0], max(P.rad, .001) * 1.3);
  },
  steps: [
    { cap: tx`\(\nabla f=\langle2x,2y,2z\rangle\) points straight away from the origin. \(\nabla g=\langle1,1,1\rangle\) is the plane's normal. At this random point on the plane, they disagree.`, add: "axes O pl edge rad pt gF gG Lp LgF LgG" },
    { cap: tx`\(2x=\lambda,\ 2y=\lambda,\ 2z=\lambda\) forces \(x=y=z\). Every solution lies on this green line through the origin.`, add: "ray Lr" },
    { cap: tx`Slide the point to where the green line pierces the plane. Now the arrows agree, at \(\left(\frac13,\frac13,\frac13\right)\).`, add: "Ls", set: { m: 1 }, dur: 1.8 },
    { cap: tx`\(f\) is squared distance from the origin, so its level surfaces are spheres. Inflate one until it first touches the plane: that's the smallest \(f\) gets on the plane.`, drop: "gF gG LgF LgG rad Ls Lr", add: "ball Lq", from: { rad: .12 }, set: { rad: 1 / sqrt(3) }, cam: { y: -.785, p: .1, d: 6 }, dur: 3 },
    { cap: tx`The sphere first touches when \(x^2+y^2+z^2=\frac13\), so the minimum value is \(\frac13\).`, drop: "Lq", add: "La", cam: { y: -.785, p: .1, d: 5 } }
  ]
};

S["ex22-box"] = {
  cam: { y: -1, p: .55, d: 6.8, at: [0, 0, .75] },
  P: { X: 3.6, Y: 2.2, Z: 1.4, c: 1, u: 0, fill: 0, ph: 0 },
  build(k, P) {
    k.scale(.42, .42, .42, [0, 0, .75]);
    k.flat("floor", [[-6, -5], [6, -5], [6, 5], [-6, 5]], -.03, { c: "surface-2", o: .55 });
    k.grid("grid", [-6, 6, 1], [-5, 5, 1], -.03, { o: .2 });
    const Q = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]];
    k.poly("bot", Q, { c: "accent", o: .9 }); k.poly("wF", Q, { c: "glow", o: .88 }); k.poly("wB", Q, { c: "glow", o: .88 }); k.poly("wL", Q, { c: "s2", o: .88 }); k.poly("wR", Q, { c: "s2", o: .88 });
    k.block("water", { c: "s1", o: .6 });
    k.seg("rul", { c: "ink", r: .012 }); k.dot("rt", { c: "ink", r: .03 });
    k.alias("box", "bot wF wB wL wR");
    const dim = () => {
      const S = sin(TAU * P.ph), X = P.X + 1.5 * S, Y = P.Y + 1.2 * S, zc = (24 - X * Y) / (2 * X + 2 * Y), Z = lerp(P.Z, zc, P.c), a = P.u * PI / 2;
      return { X, Y, Z, hx: X / 2, hy: Y / 2, s: sin(a) * Z, c: cos(a) * Z };
    };
    k.dim = dim;
    const lab = (n, f, t, o) => k.label(n, () => f(dim()), t, o);
    lab("Lx", d => [0, -d.hy, 0], tx`x`, { c: "ink", dy: 16, line: false });
    lab("Ly", d => [d.hx, 0, 0], tx`y`, { c: "ink", dx: 16, dy: 12, line: false });
    lab("Lz", d => [d.hx, -d.hy, d.Z / 2], tx`z`, { c: "ink", dx: 16, line: false });
    const panels = (p, xy, xz, yz) => {
      lab(p + "b", d => [0, 0, d.c * 0], xy, { c: "accent" });
      lab(p + "f", d => [0, -d.hy - d.s / 2, d.c / 2], xz, { c: "glow" });
      lab(p + "k", d => [0, d.hy + d.s / 2, d.c / 2], xz, { c: "glow" });
      lab(p + "l", d => [-d.hx - d.s / 2, 0, d.c / 2], yz, { c: "s2" });
      lab(p + "r", d => [d.hx + d.s / 2, 0, d.c / 2], yz, { c: "s2" });
      k.alias(p, [p + "b", p + "f", p + "k", p + "l", p + "r"].join(" "));
    };
    panels("A", tx`xy`, tx`xz`, tx`yz`); panels("B", tx`4z^2`, tx`2z^2`, tx`2z^2`);
    lab("Lr", d => [d.hx + .45, -d.hy, d.Z * 2], tx`2z=x`, { c: "ink", dx: 26, dy: -8 });
    lab("Lsq", d => [0, 0, d.Z], tx`x=y`, { c: "accent", dx: -34, dy: -18, line: false });
    lab("D1", d => [0, -d.hy, 0], tx`2\sqrt2`, { c: "ink", dy: 16, line: false });
    lab("D2", d => [d.hx, 0, 0], tx`2\sqrt2`, { c: "ink", dx: 32, dy: 18, line: false });
    lab("D3", d => [d.hx, -d.hy, d.Z / 2], tx`\sqrt2`, { c: "ink", dx: 26, dy: -14, line: false });
    lab("Lq", d => [0, 0, d.Z], tx`V=xyz=\,?`, { c: "glow", dy: -24, line: false });
    lab("La", d => [0, 0, d.Z], tx`V=8\sqrt2\approx11.31\text{ ft}^3`, { c: "glow", dy: -24, line: false });
  },
  update(P, k) {
    const d = k.dim(), { hx, hy, s, c } = d;
    k.o.bot.set([[-hx, -hy, 0], [hx, -hy, 0], [hx, hy, 0], [-hx, hy, 0]]);
    k.o.wF.set([[-hx, -hy, 0], [hx, -hy, 0], [hx, -hy - s, c], [-hx, -hy - s, c]]);
    k.o.wB.set([[-hx, hy, 0], [hx, hy, 0], [hx, hy + s, c], [-hx, hy + s, c]]);
    k.o.wL.set([[-hx, -hy, 0], [-hx, hy, 0], [-hx - s, hy, c], [-hx - s, -hy, c]]);
    k.o.wR.set([[hx, -hy, 0], [hx, hy, 0], [hx + s, hy, c], [hx + s, -hy, c]]);
    k.o.water.set([-hx + .03, -hy + .03, .02], [hx - .03, hy - .03, max(.03, (d.Z - .03) * P.fill)]);
    k.o.rul.set([hx + .45, -hy, 0], [hx + .45, -hy, d.Z * 2]); k.o.rt.at([hx + .45, -hy, d.Z]);
  },
  steps: [
    { cap: tx`Three numbers describe the box: a base \(x\) by \(y\), and a height \(z\). There's no lid.`, add: "floor grid box Lx Ly Lz" },
    { cap: tx`Unfold it. The cardboard is one \(xy\) bottom, two \(xz\) walls and two \(yz\) walls, and together they must total 24 ft². That's the constraint \(g=0\).`, drop: "Lx Ly Lz", add: "A", set: { u: 1 }, cam: { y: -1.25, p: 1.05, d: 7.2 }, dur: 1.6 },
    { cap: tx`Every box in this animation uses exactly 24 ft², from tall tower to shallow tray, and the volume keeps changing. The system asks for the shape where no small reshaping can add volume.`, drop: "A", set: { u: 0, ph: 1 }, from: { ph: 0 }, win: { u: [0, .22], ph: [.15, 1] }, cam: { y: -1, p: .5, d: 7.4 }, dur: 5 },
    { cap: tx`The equations pin down the shape: a square base, \(x=y\), with walls half as tall as the base is wide, \(x=2z\). This box has the right shape, but isn't yet using all the cardboard.`, add: "rul rt Lr Lsq Lz", set: { X: 2.4, Y: 2.4, Z: 1.2, c: 0, ph: 1 }, dur: 1.6 },
    { cap: tx`Lay it flat: that shape makes three equal groups, each worth \(4z^2\). So \(12z^2=24\). It grows until the cardboard is used up, at \(z^2=2\).`, drop: "rul rt Lr Lsq Lz", add: "B", set: { X: 2 * sqrt(2), Y: 2 * sqrt(2), Z: sqrt(2), u: 1 }, cam: { y: -1.25, p: 1.05, d: 7.2 }, dur: 2.2 },
    { cap: tx`Fold it back up: \(2\sqrt2\) wide, \(2\sqrt2\) deep and \(\sqrt2\) tall. Its volume is width × depth × height.`, drop: "B", add: "D1 D2 D3 Lq", set: { u: 0 }, cam: { y: -1, p: .5, d: 6.4 }, dur: 1.6 },
    { cap: tx`Fill it up: \(V=8\sqrt2\approx11.31\) ft³. No other box made from 24 ft² holds more.`, drop: "Lq", add: "water La", set: { fill: 1 }, dur: 1.8 }
  ]
};

S["ex22-two"] = {
  cam: { y: -1.2, p: .32, d: 6.8, at: [0, 0, 1] },
  P: { th: .6, lift: 0 },
  build(k) {
    k.scale(.8, .8, .8, [0, 0, 1]);
    const C = t => [cos(t), sin(t), 1 - cos(t) + sin(t)], s29 = sqrt(29), A = [-2 / s29, 5 / s29], ZA = 1 + 7 / s29, ZB = 1 - 7 / s29;
    k.flat("floor", [[-1.7, -1.7], [1.7, -1.7], [1.7, 1.7], [-1.7, 1.7]], 0, { c: "surface-2", o: .6 });
    k.grid("grid", [-1.5, 1.5, .5], [-1.5, 1.5, .5], 0);
    k.tube("circ", rng(0, TAU, 96).map(a => [cos(a), sin(a), 0]), { c: "accent", r: .018 });
    k.surf("cyl", (a, z) => [cos(a), sin(a), z], [0, TAU, 72], [-.7, 2.8, 1], { c: "accent", o: .15 });
    k.surf("pl", (p, a) => { const x = p * cos(a), y = p * sin(a); return [x, y, 1 - x + y]; }, [0, 1.65, 4], [0, TAU, 72], { c: "s2", o: .3 });
    k.tube("curve", rng(0, TAU, 120).map(C), { c: "glow", r: .02 });
    k.dot("pt", { c: "ink" }); k.arrow("gF", { c: "glow" }); k.arrow("gG", { c: "s2" }); k.arrow("gH", { c: "accent" });
    k.poly("sheet", [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], { c: "s3", o: .32 });
    k.arrow("dir", { c: "glow" }).set([0, 0, 0], [-2 * .34, 5 * .34, 0]);
    k.tube("dirL", [[2 * .3, -5 * .3, 0], [-2 * .3, 5 * .3, 0]], { c: "glow", r: .01, o: .8 });
    k.dot("fA", { c: "ink", p: [A[0], A[1], 0] }); k.dot("fB", { c: "ink", p: [-A[0], -A[1], 0] });
    k.seg("pA", { c: "ink", r: .01 }); k.seg("pB", { c: "ink", r: .01 }); k.dot("tA", { c: "glow", r: .055 }); k.dot("tB", { c: "glow", r: .055 });
    const n = [1, 2, 3].map(v => v / sqrt(14)), e1 = [2 / sqrt(5), -1 / sqrt(5), 0], e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]], Tp = [A[0], A[1], ZA];
    k.surf("lvl", (p, a) => Tp.map((v, i) => v + p * (cos(a) * e1[i] + sin(a) * e2[i])), [0, 1.15, 3], [0, TAU, 60], { c: "s3", o: .42 });
    k.label("Lc", [1, 0, 2.5], tx`x^2+y^2=1`, { c: "accent", dx: 42, dy: -12 });
    k.label("Lp", [-1.1, -.9, 1.2], tx`x-y+z=1`, { c: "s2", dx: -36, dy: 14 });
    k.label("LgF", () => k.o.gF.b, tx`\nabla f`, { c: "glow", dy: -13 });
    k.label("LgG", () => k.o.gG.b, tx`\nabla g`, { c: "s2", dx: 16, dy: -8, line: false });
    k.label("LgH", () => k.o.gH.b, tx`\nabla h`, { c: "accent", dx: 16, dy: 6, line: false });
    k.label("Lok", () => k.o.pt.p, tx`\text{fits the sheet!}`, { c: "good", dx: -72, dy: 26, when: () => { const d = abs(2 * sin(k.P.th) + 5 * cos(k.P.th)) / sqrt(1 + 2 * ((sin(k.P.th) + cos(k.P.th)) ** 2)); return d < .55; } });
    k.label("Ld", [-2 * .34, 5 * .34, 0], tx`\langle-2,\,5\rangle`, { c: "glow", dy: -14, line: false });
    k.label("LA", [A[0], A[1], 0], tx`\left(-\tfrac{2}{\sqrt{29}},\tfrac{5}{\sqrt{29}}\right)`, { c: "ink", dx: 74, dy: 16 });
    k.label("LB", [-A[0], -A[1], 0], tx`\left(\tfrac{2}{\sqrt{29}},-\tfrac{5}{\sqrt{29}}\right)`, { c: "ink", dx: 74, dy: -14 });
    k.label("LtA", Tp, tx`z=1+\tfrac{7}{\sqrt{29}}`, { c: "glow", dx: 74, dy: -14 });
    k.label("LtB", [-A[0], -A[1], ZB], tx`z=1-\tfrac{7}{\sqrt{29}}`, { c: "glow", dx: 70, dy: 16 });
    k.label("La", Tp, tx`f=3+\sqrt{29}\approx8.39`, { c: "glow", dx: 84, dy: -18 });
    k.T = [Tp, [-A[0], -A[1], ZB]];
  },
  update(P, k) {
    const p = [cos(P.th), sin(P.th), 1 - cos(P.th) + sin(P.th)], un = v => { const n = hypot(v[0], v[1], v[2]); return v.map(q => q / n); }, L = .9;
    const f = un([1, 2, 3]), g = un([1, -1, 1]), h = un([p[0], p[1], 0]), add = (a, b, s) => a.map((q, i) => q + b[i] * s);
    k.o.pt.at(p); k.o.gF.set(p, add(p, f, L)); k.o.gG.set(p, add(p, g, L * .85)); k.o.gH.set(p, add(p, h, L * .85));
    const a = add(add(p, g, .78), h, .78), b = add(add(p, g, .78), h, -.78), c = add(add(p, g, -.78), h, -.78), d = add(add(p, g, -.78), h, .78);
    k.o.sheet.set([a, b, c, d]);
    const [T, U] = k.T, l = P.lift;
    k.o.pA.set([T[0], T[1], 0], [T[0], T[1], T[2] * l]); k.o.pB.set([U[0], U[1], 0], [U[0], U[1], U[2] * l]);
    k.o.tA.at([T[0], T[1], T[2] * l]); k.o.tB.at([U[0], U[1], U[2] * l]);
  },
  steps: [
    { cap: tx`The plane and the cylinder meet in the orange curve, and the point has to stay on it. \(\nabla g\) is perpendicular to the plane, and \(\nabla h\) sticks straight out of the cylinder.`, add: "cyl pl curve pt gF gG gH Lc Lp LgF LgG LgH" },
    { cap: tx`At a best point, \(\nabla f\) must be a mix of \(\nabla g\) and \(\nabla h\), so it has to lie in the yellow sheet they span. Slide along the curve: \(\nabla f\) only fits that sheet at two places.`, drop: "Lc Lp", add: "sheet Lok", from: { th: .6 }, set: { th: .6 + TAU }, dur: 7 },
    { cap: tx`The third equation gives \(\lambda_1=3\). What's left, \(\nabla f-3\nabla g=\langle-2,5,0\rangle\), must equal \(\lambda_2\nabla h=\lambda_2\langle2x,2y,0\rangle\). So on the floor, \((x,y)\) points along \(\langle-2,5\rangle\).`, drop: "cyl pl curve pt gF gG gH sheet LgF LgG LgH Lok", add: "floor grid circ dir dirL Ld", cam: { y: -PI / 2, p: 1.5, d: 5.8, at: [0, 0, 0] }, dur: 1.5 },
    { cap: tx`The cylinder is the circle \(x^2+y^2=1\) from above. The direction \(\langle-2,5\rangle\) crosses it at two points, the same pair given by \(\lambda_2=\pm\frac{\sqrt{29}}{2}\).`, add: "fA fB LA LB" },
    { cap: tx`Lift each point up (or down) onto the plane to get \(z=1-x+y\). Now there are two candidates on the curve: compare \(f\) at each.`, drop: "dir dirL Ld LA LB fA fB floor grid", add: "cyl pl curve pA pB tA tB LtA LtB", set: { lift: 1 }, win: { lift: [.35, 1] }, cam: { y: -1.2, p: .28, d: 6.8, at: [0, 0, 1] }, dur: 1.8 },
    { cap: tx`The top point wins: \(f=3+\sqrt{29}\approx8.39\). The yellow level plane of \(f\) through it just touches the curve.`, drop: "LtA LtB pB tB cyl", add: "lvl La", cam: { y: -.2, p: .1, d: 6.8 } }
  ]
};

S["ex22-region"] = {
  cam: { y: -1.1, p: .42, d: 6.6, at: [0, 0, -75] },
  P: { th: 0, lift: 1 },
  build(k) {
    k.scale(.21, .21, .0047, [0, 0, -75]);
    const f = (x, y) => -9 * x * x - 4 * x + 3 * y * y + 5, yC = sqrt(899) / 6, zC = 241 / 3;
    k.surf("s", (p, a) => { const x = p * cos(a), y = p * sin(a); return [x, y, f(x, y)]; }, [0, 5, 24], [0, TAU, 80], { ramp: [-240, 81], o: .86 });
    k.surf("sea", (p, a) => [p * cos(a), p * sin(a), 0], [0, 5, 1], [0, TAU, 64], { c: "surface-2", o: .5, po: true });
    k.tube("circ", rng(0, TAU, 96).map(a => [5 * cos(a), 5 * sin(a), 0]), { c: "accent", r: .016 });
    k.tube("rim", rng(0, TAU, 160).map(a => [5 * cos(a), 5 * sin(a), f(5 * cos(a), 5 * sin(a))]), { c: "glow", r: .021 });
    const X0 = -2 / 9, Z0 = 49 / 9;
    k.dot("crit", { c: "ink", p: [X0, 0, Z0] });
    k.surf("flat", (p, a) => [X0 + p * cos(a), p * sin(a), Z0], [0, 1.5, 1], [0, TAU, 40], { c: "s3", o: .75 });
    k.dot("pt", { c: "ink" });
    const pts = { a: [5, 0, -240], b: [-5, 0, -200], c: [-1 / 6, yC, zC], d: [-1 / 6, -yC, zC] };
    for (const n in pts) { k.dot("d" + n, { c: "glow", p: pts[n], r: .05 }); k.seg("p" + n, { c: "ink", r: .01 }).set([pts[n][0], pts[n][1], 0], pts[n]); }
    k.seg("pz", { c: "ink", r: .01 }).set([X0, 0, 0], [X0, 0, Z0]);
    k.label("Lc", [X0, 0, Z0], tx`\left(-\tfrac29,\,0\right):\ f=\tfrac{49}{9}`, { c: "ink", dx: 40, dy: -44 });
    k.label("Lf", [X0 + 1.2, -.9, Z0], tx`\text{flat: }\nabla f=\mathbf 0`, { c: "cursor", dx: 70, dy: 22 });
    k.label("Ld", [-3.5, 3.57, 0], tx`\text{disk }x^2+y^2\le25`, { c: "accent", dx: -62, dy: -20 });
    k.label("Lr", [-3.5, -3.57, f(-3.5, -3.57)], tx`\text{the rim}`, { c: "glow", dx: -36, dy: 24 });
    k.label("LA", pts.a, tx`(5,0):\ f=-240`, { c: "ink", dx: 40, dy: 22 });
    k.label("LB", pts.b, tx`(-5,0):\ f=-200`, { c: "ink", dx: -30, dy: 24 });
    k.label("LC", pts.c, tx`\left(-\tfrac16,\ \tfrac{\sqrt{899}}{6}\right)`, { c: "glow", dx: 40, dy: -24 });
    k.label("LD", pts.d, tx`\left(-\tfrac16,\ -\tfrac{\sqrt{899}}{6}\right)`, { c: "glow", dx: -40, dy: -24 });
    k.label("LhC", pts.c, tx`f=\,?`, { c: "glow", dx: 34, dy: -22 });
    k.label("LhD", pts.d, tx`f=\,?`, { c: "glow", dx: -34, dy: -22 });
    k.label("LaC", pts.c, tx`f=\tfrac{241}{3}\approx80.33`, { c: "glow", dx: 58, dy: -24 });
    k.label("LaD", pts.d, tx`f=\tfrac{241}{3}`, { c: "glow", dx: -40, dy: -24 });
    k.label("Lz", [X0, 0, Z0], tx`f=\tfrac{49}{9}`, { c: "ink", dx: 0, dy: 26 });
  },
  update(P, k) {
    const f = (x, y) => -9 * x * x - 4 * x + 3 * y * y + 5, x = 5 * cos(P.th), y = 5 * sin(P.th);
    k.o.pt.at([x, y, f(x, y)]);
  },
  steps: [
    { cap: tx`The surface over the whole disk is a saddle. Its only flat spot is at \(\left(-\frac29,0\right)\): a critical point, so it's a candidate, but not a high point.`, add: "s circ sea crit flat Lc Lf Ld" },
    { cap: tx`Now walk the rim, the edge of the disk. Its height rises and falls as you go around. Lagrange multipliers find exactly the spots where it turns around.`, drop: "flat Lf Lc Ld", add: "rim pt Lr", from: { th: 0 }, set: { th: TAU }, dur: 6 },
    { cap: tx`\(y(6-2\lambda)=0\) gives two cases. \(y=0\) gives the two points on the \(x\)-axis. \(\lambda=3\) gives two more, at \(x=-\frac16\). Dividing by \(y\) would have lost the first two.`, drop: "pt Lr", add: "da db dc dd LA LB LC LD", cam: { y: -.75, p: .55, d: 6.8 } },
    { cap: tx`Stand a pin at each of the five candidates, from sea level to the surface, and compare heights. Two pins tie for tallest.`, drop: "LC LD", add: "pa pb pc pd pz LhC LhD Lz", dur: 1.2 },
    { cap: tx`The maximum is \(\frac{241}{3}\approx80.33\), reached at both top points on the rim, which matches your notes.`, drop: "LhC LhD", add: "LaC LaD" }
  ]
};
