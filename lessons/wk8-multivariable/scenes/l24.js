/* ---------- Lesson 24 scenes ---------- */
S["ex24-1"] = {
  cam: { y: -1, p: .4, d: 6.5, at: [.55, .42, 1.3] },
  P: { s: 1, ty: 0 },
  build(k) {
    k.scale(1.7, 1.7, .5, [.55, .42, 1.3]);
    const cx = k.cut("x"), cy = k.cut("y"), clip = [cx.pl, cy.pl]; k.cx = cx; k.cy = cy;
    k.axes("axes", [-.14, 1.32], [-.14, 1.3], [0, 3.5]);
    k.poly("base", [[0, 0, 0], [1, 0, 0], [1, 1, 0]], { c: "accent", o: .34, po: true });
    k.tubes("be", [[[0, 0, 0], [1, 0, 0]], [[1, 0, 0], [1, 1, 0]], [[1, 1, 0], [0, 0, 0]]], { c: "accent", r: .013 });
    k.poly("roof", [[0, 0, 3], [1, 0, 2], [1, 1, 1]], { c: "s2", o: .94, clip });
    k.poly("wa", [[0, 0, 0], [1, 0, 0], [1, 0, 2], [0, 0, 3]], { c: "s1", o: .4, clip });
    k.poly("wb", [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 2]], { c: "s1", o: .4, clip });
    k.poly("wc", [[0, 0, 0], [1, 1, 0], [1, 1, 1], [0, 0, 3]], { c: "s1", o: .4, clip });
    k.alias("solid", "roof wa wb wc");
    k.tubes("edge", [[[0, 0, 3], [1, 0, 2]], [[1, 0, 2], [1, 1, 1]], [[1, 1, 1], [0, 0, 3]], [[0, 0, 0], [0, 0, 3]], [[1, 0, 0], [1, 0, 2]], [[1, 1, 0], [1, 1, 1]]], { c: "ink", r: .006, o: .55 });
    k.poly("sl", [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], { c: "glow", o: .92 });
    k.seg("fl", { c: "glow", r: .02 });
    k.label("Lyx", [.55, .55, 0], tx`y=x`, { c: "accent", dx: -34, dy: -8 });
    k.label("Lx1", [1, .45, 0], tx`x=1`, { c: "accent", dx: 34, dy: 10 });
    k.label("Lr", [.45, .2, 3 - .65], tx`z=3-x-y`, { c: "s2", dx: 12, dy: -46 });
    k.label("Li0", () => [k.P.s, 0, 0], tx`y=0`, { c: "glow", dx: 18, dy: 20 });
    k.label("Li1", () => [k.P.s, k.P.s, 0], tx`y=x`, { c: "glow", dx: 34, dy: 8 });
    k.label("Lj0", () => [k.P.s, k.P.s, 0], tx`x=y`, { c: "glow", dx: -32, dy: 12 });
    k.label("Lj1", () => [1, k.P.s, 0], tx`x=1`, { c: "glow", dx: 34, dy: 8 });
    k.label("La", [.5, .25, 2.5], tx`V=1\text{ both ways}`, { c: "glow", dx: 12, dy: -56 });
  },
  update(P, k) {
    const s = P.s, two = P.ty > .5;
    k.cx.set(two ? 9 : s + .002); k.cy.set(two ? s + .002 : 9);
    if (!two) { k.o.sl.set([[s, 0, 0], [s, s, 0], [s, s, 3 - 2 * s], [s, 0, 3 - s]]); k.o.fl.set([s, 0, .02], [s, s, .02]); }
    else { k.o.sl.set([[s, s, 0], [1, s, 0], [1, s, 2 - s], [s, s, 3 - 2 * s]]); k.o.fl.set([s, s, .02], [1, s, .02]); }
  },
  steps: [
    { cap: tx`A triangular floor, a slanted roof \(z=3-x-y\), and walls straight up from the triangle's edges. That's the prism.`, add: "axes base be solid edge Lyx Lx1 Lr" },
    { cap: tx`Type I: slices at fixed \(x\). On the floor, each vertical line enters at \(y=0\) and leaves at \(y=x\). Sweep \(x\) from 0 to 1 to build the solid.`, drop: "Lyx Lx1 Lr", add: "sl fl Li0 Li1", from: { s: .001, ty: 0 }, set: { s: 1, ty: 0 }, dur: 4.5 },
    { cap: tx`Type II: slices at fixed \(y\). Each horizontal line enters at \(x=y\) and leaves at \(x=1\). Sweep \(y\) from 0 to 1. Same solid, cut the other way.`, drop: "Li0 Li1", add: "Lj0 Lj1", from: { s: .001, ty: 1 }, set: { s: 1, ty: 1 }, cam: { y: -1.75, p: .4, d: 6.5 }, dur: 4.5 },
    { cap: tx`Two different slicings of one solid, so the two integrals must give the same number. If they didn't, you'd know a limit was wrong.`, drop: "sl fl Lj0 Lj1", add: "Lyx Lx1", cam: { y: -1, p: .4, d: 6.5 } },
    { cap: tx`\(V=1\) cubic unit either way.`, drop: "Lyx Lx1", add: "La" }
  ]
};

S["ex24-2"] = {
  cam: { y: -PI / 2, p: 1.5, d: 6, at: [1.5, .5, 0] },
  P: { s: -2, h: 1 },
  build(k) {
    k.scale(.205, .205, .0125, [1.5, .5, 50]);
    const L = y => y * y - 3, Rr = y => y + 3, f = (x, y) => 3 * x * x + y * y, cut = k.cut("y"), clip = [cut.pl], ys = rng(-2, 3, 60), n = 41;
    k.f = f; k.L = L; k.Rr = Rr; k.cutY = cut;
    k.grid("grid", [-4, 7, 1], [-3, 4, 1], 0);
    const D = (y, v) => L(y) + v * (Rr(y) - L(y));
    k.surf("D", (y, v) => [D(y, v), y, 0], [-2, 3, 50], [0, 1, 6], { c: "accent", o: .24, po: true });
    k.tube("par", rng(-2.6, 3.3, 80).map(y => [L(y), y, 0]), { c: "accent", r: .017 });
    k.tube("lin", [[-.6, -3.6, 0], [7, 4, 0]], { c: "s2", r: .017 });
    k.dot("p1", { c: "ink", p: [1, -2, 0] }); k.dot("p2", { c: "ink", p: [6, 3, 0] });
    k.seg("sw", { c: "glow", r: .021 });
    k.surf("top", (y, v) => { const x = D(y, v); return [x, y, f(x, y)]; }, [-2, 3, 60], [0, 1, 16], { ramp: [0, 118], clip, o: .96 });
    k.surf("ghost", (y, v) => { const x = D(y, v); return [x, y, f(x, y)]; }, [-2, 3, 40], [0, 1, 12], { ramp: [0, 118], o: .22 });
    k.curt("wP", 61, { c: "s1", o: .4, clip }).set(ys.map(y => [L(y), y, f(L(y), y)]));
    k.curt("wL", 61, { c: "s1", o: .4, clip }).set(ys.map(y => [Rr(y), y, f(Rr(y), y)]));
    k.alias("solid", "top wP wL");
    k.curt("slice", n, { c: "glow", o: .9 });
    k.label("Lp", [L(2.2), 2.2, 0], tx`x=y^2-3`, { c: "accent", dx: -48, dy: -14 });
    k.label("Ll", [5, 2, 0], tx`x=y+3`, { c: "s2", dx: 46, dy: 10 });
    k.label("L1", [1, -2, 0], tx`(1,-2)`, { c: "ink", dx: 40, dy: 12 });
    k.label("L2", [6, 3, 0], tx`(6,3)`, { c: "ink", dx: 34, dy: -12 });
    k.label("Le", () => [L(k.P.s), k.P.s, 0], tx`\text{enters}`, { c: "glow", dx: -36, dy: -14 });
    k.label("Lq", () => [Rr(k.P.s), k.P.s, 0], tx`\text{leaves}`, { c: "glow", dx: 36, dy: 12 });
    k.label("Lw", () => { const y = k.P.s, x = (L(y) + Rr(y)) / 2; return [x, y, f(x, y)]; }, tx`\text{wall area}=-y^6+8y^4+\cdots`, { c: "glow", dx: -40, dy: -44 });
    k.label("Lz", [5, 1.6, 90], tx`z=3x^2+y^2`, { c: "s3", dx: 30, dy: -18 });
    k.label("La", [2, .5, 60], tx`\tfrac{2375}{7}\approx339.29`, { c: "glow", dx: 0, dy: -70 });
  },
  update(P, k) {
    const y = P.s, a = k.L(y), b = k.Rr(y);
    k.o.sw.set([a, y, .3], [b, y, .3]);
    k.o.slice.set(rng(a, b, 40).map(x => [x, y, k.f(x, y)]));
    k.cutY.set(y + .002);
  },
  steps: [
    { cap: tx`The floor region sits between the parabola \(x=y^2-3\) and the line \(x=y+3\). Setting them equal shows they meet at \((1,-2)\) and \((6,3)\).`, add: "grid D par lin p1 p2 Lp Ll L1 L2" },
    { cap: tx`Sweep a horizontal line from \(y=-2\) up to \(y=3\). It always enters through the parabola and leaves through the line, so one integral is enough: Type II.`, drop: "Lp Ll", add: "sw Le Lq", from: { s: -2 }, set: { s: 3 }, dur: 4 },
    { cap: tx`Stand a wall on that line, reaching up to the surface \(z=3x^2+y^2\). The inner integral is that wall's area, a polynomial in \(y\).`, drop: "Le Lq L1 L2 grid", add: "ghost slice Lw Lz", set: { s: 1 }, cam: { y: -1.05, p: .36, d: 5.7, at: [1.5, .5, 42] }, dur: 1.8 },
    { cap: tx`Slide the wall from \(y=-2\) to \(y=3\). The outer integral adds up every wall, filling in the solid.`, drop: "Lw sw", add: "solid", from: { s: -2 }, set: { s: 3 }, dur: 4.5 },
    { cap: tx`The total comes to \(\frac{2375}{7}\approx339.29\).`, drop: "ghost slice Lz", add: "La" }
  ]
};

S["ex24-vol"] = {
  cam: { y: -.12, p: .42, d: 6.5, at: [1.5, 6, 6.4] },
  P: { s: 4, drop: 0 },
  build(k) {
    k.scale(.4, .1, .095, [1.5, 6, 6.4]);
    const cut = k.cut("x"), clip = [cut.pl]; k.cutX = cut;
    k.axes("axes", [0, 5.1], [0, 19], [0, 19]);
    k.poly("pl", [[4, 0, 0], [0, 16, 0], [0, 0, 16]], { c: "s2", o: .62, clip });
    k.poly("ghost", [[4, 0, 0], [0, 16, 0], [0, 0, 16]], { c: "s2", o: .2 });
    k.poly("D", [[0, 0, 0], [4, 0, 0], [0, 16, 0]], { c: "accent", o: .38, po: true });
    k.tube("De", [[4, 0, 0], [0, 16, 0]], { c: "accent", r: .02 });
    k.poly("wX", [[0, 0, 0], [0, 16, 0], [0, 0, 16]], { c: "s1", o: .35, clip });
    k.poly("wY", [[0, 0, 0], [4, 0, 0], [0, 0, 16]], { c: "s1", o: .35, clip });
    k.alias("solid", "pl wX wY");
    k.tubes("tet", [[[4, 0, 0], [0, 0, 16]], [[0, 16, 0], [0, 0, 16]], [[4, 0, 0], [0, 16, 0]]], { c: "ink", r: .007, o: .55 });
    k.dot("ix", { c: "ink", p: [4, 0, 0] }); k.dot("iy", { c: "ink", p: [0, 16, 0] }); k.dot("iz", { c: "ink", p: [0, 0, 16] });
    k.seg("fl", { c: "glow", r: .021 });
    k.poly("sl", [[0, 0, 0], [0, 1, 0], [0, 0, 1]], { c: "glow", o: .92 });
    k.label("Lp", [1.6, 5, 5.6], tx`z=16-4x-y`, { c: "s2", dx: 34, dy: -40 });
    k.label("Li1", [4, 0, 0], tx`4`, { c: "ink", dx: 8, dy: 16, line: false });
    k.label("Li2", [0, 16, 0], tx`16`, { c: "ink", dx: 16, dy: 12, line: false });
    k.label("Li3", [0, 0, 16], tx`16`, { c: "ink", dx: -18, line: false });
    k.label("Ld", [2, 8, 0], tx`4x+y=16`, { c: "accent", dx: 60, dy: 14 });
    k.label("Lf", [1.2, 3.8, 0], tx`D`, { c: "accent", line: false });
    k.label("L0", () => [k.P.s, 0, 0], tx`y=0`, { c: "glow", dx: -30, dy: 18 });
    k.label("L1", () => [k.P.s, 16 - 4 * k.P.s, 0], tx`y=16-4x`, { c: "glow", dx: 50, dy: 16 });
    k.label("Ls", () => [k.P.s, (16 - 4 * k.P.s) / 3, (16 - 4 * k.P.s) / 3], tx`\text{area}=\tfrac12(16-4x)^2`, { c: "glow", dx: -82, dy: -38 });
    k.label("La", [1, 4, 5], tx`V=\tfrac{512}{3}\approx170.67`, { c: "glow", dx: 60, dy: -50 });
  },
  update(P, k) {
    const s = P.s, Y = 16 - 4 * s;
    k.cutX.set(s + .004);
    k.o.fl.set([s, 0, .05], [s, Y, .05]);
    k.o.sl.set([[s, 0, 0], [s, Y, 0], [s, 0, Y]]);
  },
  steps: [
    { cap: tx`Solved for \(z\), the plane becomes a height function. It crosses the three axes at 4, 16 and 16, and the first octant keeps only the corner piece.`, add: "axes pl ix iy iz tet Lp Li1 Li2 Li3" },
    { cap: tx`The plane meets the floor (\(z=0\)) along the line \(4x+y=16\). With the two axes, that closes off the triangle \(D\), the region we integrate over.`, add: "D De Ld Lf", drop: "pl Lp", cam: { y: -1.3, p: 1.2, d: 6.7 }, dur: 1.5 },
    { cap: tx`Type I: \(x\) goes from 0 to 4. At each \(x\), a line across the floor runs from \(y=0\) to \(y=16-4x\). It shrinks as \(x\) grows.`, drop: "Ld Lf", add: "fl L0 L1", from: { s: .02 }, set: { s: 3.2 }, dur: 3.5 },
    { cap: tx`Over that line, the slice is a triangle: both legs are \(16-4x\), since the height at \(y=0\) is \(16-4x\). So its area, the inner integral, is \(\frac12(16-4x)^2\).`, drop: "L0 L1", add: "ghost sl Ls", set: { s: 1.5 }, cam: { y: -.12, p: .42, d: 6.5 }, dur: 1.6 },
    { cap: tx`Slide from \(x=0\) to \(x=4\). The triangles shrink to nothing as they fill the tetrahedron, and the outer integral adds them up.`, drop: "Ls fl", add: "solid", from: { s: .02 }, set: { s: 3.99 }, dur: 4.5 },
    { cap: tx`\(V=\frac{512}{3}\approx170.67\) cubic units, which matches \(\frac16\cdot4\cdot16\cdot16\) for a tetrahedron.`, drop: "ghost sl", add: "La" }
  ]
};

S["ex24-area"] = {
  cam: { y: -PI / 2, p: 1.48, d: 6.1, at: [4, 950, 0] },
  P: { s: 7 },
  build(k) {
    k.scale(.37, 1.7 / 2300, .45, [4, 950, .5]);
    const top = x => 2 * exp(x), bot = x => 1 / (2 * x), cut = k.cut("x"), clip = [cut.pl], xs = rng(1, 7, 90);
    k.top = top; k.bot = bot; k.cutX = cut;
    k.axes("axes", [.4, 7.7], [-120, 2420], null, { at: [.6, 0, 0] });
    k.surf("D", (x, v) => [x, lerp(bot(x), top(x), v), 0], [1, 7, 90], [0, 1, 2], { c: "accent", o: .26, po: true });
    k.tube("T", rng(1, 7, 120).map(x => [x, top(x), 0]), { c: "accent", r: .017 });
    k.tube("B", rng(1, 7, 60).map(x => [x, bot(x), 0]), { c: "s2", r: .017 });
    k.tubes("V", [[[1, 0, 0], [1, top(1), 0]], [[7, 0, 0], [7, top(7), 0]]], { c: "muted", r: .009 });
    k.surf("roof", (x, v) => [x, lerp(bot(x), top(x), v), 1], [1, 7, 90], [0, 1, 2], { c: "s2", o: .9, clip });
    k.curt("wT", 91, { c: "s1", o: .42, clip }).set(xs.map(x => [x, top(x), 1]));
    k.curt("wB", 91, { c: "s1", o: .42, clip }).set(xs.map(x => [x, bot(x), 1]));
    k.poly("wE", [[7, bot(7), 0], [7, top(7), 0], [7, top(7), 1], [7, bot(7), 1]], { c: "s1", o: .42, clip });
    k.alias("slab", "roof wT wB wE");
    k.poly("st", [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], { c: "glow", o: .92 });
    k.label("LT", [6.4, top(6.4), 0], tx`y=2e^x`, { c: "accent", dx: -56, dy: -6 });
    k.label("LB", [4, bot(4), 0], tx`y=\tfrac{1}{2x}\ (\text{almost on the axis})`, { c: "s2", dx: -6, dy: 26 });
    k.label("Lv", [1, 0, 0], tx`x=1`, { c: "muted", dx: -6, dy: 18, line: false });
    k.label("Lw", [7, 0, 0], tx`x=7`, { c: "muted", dx: 6, dy: 18, line: false });
    k.label("Lh", [6.9, 900, 1], tx`\text{height }1`, { c: "s2", dx: 44, dy: -16 });
    k.label("Ls", () => [k.P.s, top(k.P.s), 1], tx`\text{strip length}=2e^x-\tfrac{1}{2x}`, { c: "glow", dx: -104, dy: -18 });
    k.label("La", [6.6, 700, 1], tx`A\approx2186.86`, { c: "glow", dx: -90, dy: -46 });
  },
  update(P, k) {
    const s = P.s, b = k.bot(s), t = k.top(s);
    k.cutX.set(s + .002);
    k.o.st.set([[s, b, 0], [s, t, 0], [s, t, 1], [s, b, 1]]);
  },
  steps: [
    { cap: tx`\(2e^x\) soars while \(\frac{1}{2x}\) stays near the axis, so \(2e^x\) is always the top curve. The \(y\)-axis is squeezed a lot to fit: the top curve reaches about 2193.`, add: "axes D T B V LT LB Lv Lw" },
    { cap: tx`\(\iint_D1\,dA\) is the volume of a slab of height 1 on the region, and height 1 makes volume equal area. One strip runs from the bottom curve to the top curve.`, add: "st Ls Lh", set: { s: 6.3 }, cam: { y: -1.2, p: .55, d: 6.3, at: [4, 950, .5] }, dur: 1.7 },
    { cap: tx`Slide the strip from \(x=1\) to \(x=7\). Nearly all of the area piles up in the last stretch, where \(e^x\) takes off.`, drop: "Lh", add: "slab", from: { s: 1 }, set: { s: 7 }, dur: 5 },
    { cap: tx`\(A=2e^7-2e-\frac12\ln7\approx2186.86\) square units.`, drop: "st Ls", add: "La" }
  ]
};

S["ex24-avg"] = {
  cam: { y: -PI / 2, p: 1.48, d: 6.3, at: [0, 3, 0] },
  P: { s: 0, q: 0, m: 0, c: 7 },
  build(k) {
    k.scale(.19, .19, .0118, [0, 3, 10]);
    const AV = 35 / 3, D = (y, v) => (y - 7) + v * (14 - 2 * y), cut = k.cut("y"), clip = [cut.pl]; k.cutY = cut; k.key = "";
    k.flat("floor", [[-8, -1], [8, -1], [8, 8], [-8, 8]], 0, { c: "surface-2", o: .5 });
    k.grid("grid", [-8, 8, 2], [-1, 7, 2], 0);
    k.axes("axes", [-8.5, 8.8], [-1, 8.4], null);
    k.poly("D", [[-7, 0, 0], [7, 0, 0], [0, 7, 0]], { c: "accent", o: .3, po: true });
    k.tubes("De", [[[-7, 0, 0], [0, 7, 0]], [[7, 0, 0], [0, 7, 0]]], { c: "accent", r: .016 });
    k.poly("st", [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], { c: "glow", o: .92 });
    const top = k.surf("top", (y, v) => [D(y, v), y, 0], [0, 7, 28], [0, 1, 14], { ramp: [-63, 63], clip, o: .95 });
    const gh = k.surf("ghost", (y, v) => [D(y, v), y, 0], [0, 7, 20], [0, 1, 10], { ramp: [-63, 63], o: .24 });
    const w = ["a", "b", "c"].map(n => k.curt("w" + n, 31, { c: "s1", o: .4, clip }));
    k.alias("solid", "top wa wb wc");
    k.curt("slice", 41, { c: "glow", o: .9 });
    k.roof = (x, y) => lerp(9 * (1 - k.P.q) * x + 5 * y, AV, k.P.m);
    k.apply = () => {
      top.map((y, v) => { const x = D(y, v); return [x, y, k.roof(x, y)]; }); gh.map((y, v) => { const x = D(y, v); return [x, y, k.roof(x, y)]; });
      const e = (p, q) => rng(0, 1, 30).map(t => { const x = lerp(p[0], q[0], t), y = lerp(p[1], q[1], t); return [x, y, k.roof(x, y)]; });
      w[0].set(e([-7, 0], [0, 7])); w[1].set(e([7, 0], [0, 7])); w[2].set(e([-7, 0], [7, 0]));
    };
    k.label("Ll", [-3.6, 3.4, 0], tx`x=y-7`, { c: "accent", dx: -50, dy: -12 });
    k.label("Lr", [3.6, 3.4, 0], tx`x=7-y`, { c: "accent", dx: 50, dy: -12 });
    k.label("La1", [-7, 0, 0], tx`(-7,0)`, { c: "ink", dx: -10, dy: 18, line: false });
    k.label("La2", [7, 0, 0], tx`(7,0)`, { c: "ink", dx: 10, dy: 18, line: false });
    k.label("La3", [0, 7, 0], tx`(0,7)`, { c: "ink", dy: -16, line: false });
    k.label("Ls", () => [7 - k.P.s, k.P.s, 0], tx`\text{length }14-2y`, { c: "glow", dx: 62, dy: -6 });
    k.label("Lar", [0, 2.4, 0], tx`\text{area}=49`, { c: "ink", dy: 30, line: false });
    k.label("Lr1", [-3.5, 1.6, -28], tx`\text{left side below}`, { c: "s1", dx: -46, dy: 34 });
    k.label("Lr2", [3.8, 1.6, 40], tx`\text{right side above}`, { c: "s3", dx: 40, dy: -34 });
    k.label("L5", [0, 3, 15], tx`z=5y`, { c: "s2", dx: 42, dy: -34 });
    k.label("Lv", [0, 2, 12], tx`\text{volume}=\tfrac{1715}{3}`, { c: "ink", dx: 52, dy: -48 });
    k.label("Lq", [0, 2.4, AV], tx`f_{\text{avg}}=\,?`, { c: "glow", dx: 50, dy: -36 });
    k.label("La", [0, 2.4, AV], tx`f_{\text{avg}}=\tfrac{35}{3}\approx11.67`, { c: "glow", dx: 66, dy: -36 });
  },
  update(P, k) {
    const key = P.q + "|" + P.m; if (key !== k.key) { k.key = key; k.apply(); }
    const y = P.s;
    k.o.st.set([[y - 7, y, .2], [7 - y, y, .2], [7 - y - .25, y + .25, .2], [y - 7 + .25, y + .25, .2]]);
    k.o.slice.set(rng(y - 7, 7 - y, 40).map(x => [x, y, k.roof(x, y)]));
    k.cutY.set(P.c + .002);
  },
  steps: [
    { cap: tx`A triangle with corners \((-7,0)\), \((7,0)\) and \((0,7)\). A horizontal line runs from \(x=y-7\) on the left to \(x=7-y\) on the right, so one integral covers it: Type II.`, add: "floor grid axes D De Ll Lr La1 La2 La3" },
    { cap: tx`Each horizontal strip has length \((7-y)-(y-7)=14-2y\). Sweep it from \(y=0\) to \(y=7\) to add up the area: 49.`, drop: "Ll Lr", add: "st Ls Lar", from: { s: 0 }, set: { s: 6.6 }, dur: 3.5 },
    { cap: tx`Add the roof \(z=9x+5y\) and stand a wall on one strip. The roof dips below the floor on the left and rises on the right by the same amount. Over the whole strip the \(9x\) tilt cancels, leaving a level \(5y\).`, drop: "st Ls Lar La1 La2 La3 floor grid axes", add: "ghost slice Lr1 Lr2", set: { s: 2.5, q: 1 }, win: { s: [0, .25], q: [.45, 1] }, cam: { y: -1.2, p: .36, d: 5.8, at: [0, 3, 12] }, dur: 3.6 },
    { cap: tx`With the tilt gone, each wall has area \(5y(14-2y)\). Slide from \(y=0\) to \(y=7\): the outer integral adds them up to \(\frac{1715}{3}\).`, drop: "Lr1 Lr2", add: "solid L5", from: { c: 0, s: 0 }, set: { c: 7, s: 7 }, dur: 4.5 },
    { cap: tx`Level the roof flat, keeping the volume the same. The height it settles at is volume ÷ area.`, drop: "ghost slice L5", add: "Lq", set: { m: 1 }, dur: 2.6 },
    { cap: tx`\(f_{\text{avg}}=\frac{1715/3}{49}=\frac{35}{3}\approx11.67\).`, drop: "Lq", add: "La" }
  ]
};
