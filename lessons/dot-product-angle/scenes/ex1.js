/* Example 1: the angle between a = <1,2,2> and b = <2,0,1>.
   k.scale is the same on all three axes on purpose. A stretched axis would draw the wrong angle.
   The face-on camera (y, p) looks straight down -(a x b) = <-2,-3,4>; verify.py computes it. */
S["ex1"] = {
  cam: { y: -2.4, p: .4, d: 7.8, at: [1, 1, .72] },
  P: { g: 1, c: 3, l: 1, w: 1 },
  build(k) {
    k.scale(1, 1, 1, [1, 1, 1]);
    const O = [0, 0, 0], A = [1, 2, 2], B = [2, 0, 1], lenB = sqrt(5), th = Math.acos(4 / (3 * lenB));
    const ah = A.map(v => v / 3), foot = [4 / 9, 8 / 9, 8 / 9], D = B.map((v, i) => v - foot[i]), lenD = hypot(...D), wh = D.map(v => v / lenD);
    const plane = (u, v) => [0, 1, 2].map(i => u * ah[i] + v * wh[i]), polar = (r, t) => plane(r * cos(t), r * sin(t));
    Object.assign(k, { A, B, th, polar });

    k.grid("grid", [0, 2.5, .5], [0, 2.5, .5], 0);
    k.axes("axes", [0, 2.7], [0, 2.7], [0, 2.7]);
    k.seg("tA", { c: "muted", r: .007 }).set(A, [1, 2, 0]);
    k.seg("tB", { c: "muted", r: .007 }).set(B, [2, 0, 0]);
    k.arrow("a", { c: "accent", r: .026, emi: 0 });
    k.arrow("b", { c: "glow", r: .026, emi: 0 });
    k.alias("floor", "grid axes");

    /* step 2: each pair of components, side by side on its axis */
    ["ca0", "ca1", "ca2"].forEach(n => k.seg(n, { c: "accent", r: .03 }));
    ["cb0", "cb2"].forEach(n => k.seg(n, { c: "glow", r: .03 }));
    k.alias("pairs", "ca0 ca1 ca2 cb0 cb2");

    /* steps 3 and 4: the right triangle behind each length */
    k.poly("fa", [O, [1, 0, 0], [1, 2, 0]], { c: "s2", o: .16, lit: false });
    k.poly("ta", [O, [1, 2, 0], A], { c: "s2", o: .3, lit: false });
    k.seg("fd", { c: "s2", r: .01 }).set(O, [1, 2, 0]);
    k.poly("tb", [O, [2, 0, 0], B], { c: "s2", o: .28, lit: false });
    ["la1", "la2", "la3", "lb1", "lb3"].forEach(n => k.seg(n, { c: "s2", r: .022 }));

    /* step 5 on: the flat sheet holding both arrows, the shadow, and the angle */
    k.poly("sheet", [plane(-.22, -.3), plane(3.22, -.3), plane(3.22, 2.05), plane(-.22, 2.05)], { c: "accent", o: .1, lit: false });
    k.seg("sh", { c: "s2", r: .042 }).set(O, foot);
    k.seg("dr", { c: "muted", r: .012 }).set(B, foot);
    const m = .15, F = u => foot.map((v, i) => v + u[0] * ah[i] + u[1] * wh[i]);
    k.poly("ra", [F([0, 0]), F([-m, 0]), F([-m, m]), F([0, m])], { c: "muted", o: .55, lit: false });
    k.wedge("wd", { c: "s3", o: .5, lit: false });
    k.surf("wa", (u, v) => O, [0, 1, 1], [0, 1, 36], { c: "s3", lit: false });

    k.label("La", A, tx`\mathbf a=\langle1,2,2\rangle`, { c: "accent", dx: -72, dy: -8 });
    k.label("Lb", B, tx`\mathbf b=\langle2,0,1\rangle`, { c: "glow", dx: 60, dy: -20 });
    k.label("Na", () => [k.P.g, 2 * k.P.g, 2 * k.P.g], tx`\mathbf a`, { c: "accent", dx: -16, dy: -12 });
    k.label("Nb", () => [2 * k.P.g, 0, k.P.g], tx`\mathbf b`, { c: "glow", dx: 18, dy: -14 });
    k.label("Lc0", [1.3, .07, 0], tx`x:\ 1\times2=2`, { c: "ink", dx: 34, dy: 30, when: () => k.P.c > .85 });
    k.label("Lc1", [0, 1.3, 0], tx`y:\ 2\times0=0`, { c: "ink", dx: -34, dy: 30, when: () => k.P.c > 1.85 });
    k.label("Lc2", [.07, 0, 1.75], tx`z:\ 2\times1=2`, { c: "ink", dx: 74, dy: -22, when: () => k.P.c > 2.85 });
    k.label("Ld", [2.5, 0, 2.5], tx`\mathbf a\cdot\mathbf b=2+0+2=4`, { c: "ink", line: false, when: () => k.P.c > 2.98 });
    k.label("p1", [.5, 0, 0], "1", { c: "s2", dy: 16, line: false });
    k.label("p2", [1, 1, 0], "2", { c: "s2", dx: 16, line: false });
    k.label("p3", [1, 2, 1], "2", { c: "s2", dx: 18, line: false });
    k.label("pd", [.62, 1.24, 0], tx`\sqrt5`, { c: "s2", dx: -6, dy: -18, line: false });
    k.label("Lla", [.5, 1, 1], tx`|\mathbf a|=\sqrt{1^2+2^2+2^2}=3`, { c: "accent", dx: -112, dy: -46 });
    k.label("q1", [1, 0, 0], "2", { c: "s2", dy: 16, line: false });
    k.label("q3", [2, 0, .5], "1", { c: "s2", dx: 16, line: false });
    k.label("Llb", [1, 0, .5], tx`|\mathbf b|=\sqrt{2^2+0^2+1^2}=\sqrt5`, { c: "glow", dx: -60, dy: -74 });
    k.label("Nh", plane(.67, .9), tx`|\mathbf b|=\sqrt5`, { c: "glow", dx: 66, dy: 26 });
    k.label("Lsh", plane(.67, 0), tx`\text{shadow}=4/3`, { c: "s2", dx: -92, dy: 12 });
    k.label("Lt", () => polar(1.02, k.th * k.P.w / 2), tx`\theta`, { c: "ink", when: () => k.P.w > .3 });
    k.label("Lco", plane(1.9, 1.5), tx`\cos\theta=\dfrac{\text{shadow}}{|\mathbf b|}=\dfrac{4}{3\sqrt5}`, { c: "ink", line: false });
    k.label("Lv", plane(1.9, 1.5), tx`\cos\theta\approx0.5963`, { c: "ink", line: false });
    k.label("Lans", polar(.62, th / 2), tx`\theta\approx53.4^\circ`, { c: "cursor", dx: 8, dy: -74 });
  },
  update(P, k) {
    const O = [0, 0, 0], u = v => clamp01(v), { A, B, th, polar } = k, f = [u(P.l * 3), u(P.l * 3 - 1), u(P.l * 3 - 2)];
    k.o.a.set(O, A.map(v => v * P.g));
    k.o.b.set(O, B.map(v => v * P.g));

    const c = [u(P.c), u(P.c - 1), u(P.c - 2)];
    k.o.ca0.set([0, -.07, 0], [c[0], -.07, 0]); k.o.cb0.set([0, .07, 0], [2 * c[0], .07, 0]);
    k.o.ca1.set([.07, 0, 0], [.07, 2 * c[1], 0]);
    k.o.ca2.set([.07, 0, 0], [.07, 0, 2 * c[2]]); k.o.cb2.set([-.07, 0, 0], [-.07, 0, c[2]]);

    k.o.la1.set(O, [f[0], 0, 0]); k.o.la2.set([1, 0, 0], [1, 2 * f[1], 0]); k.o.la3.set([1, 2, 0], [1, 2, 2 * f[2]]);
    const g = [u(P.l * 2), u(P.l * 2 - 1)];
    k.o.lb1.set(O, [2 * g[0], 0, 0]); k.o.lb3.set([2, 0, 0], [2, 0, g[1]]);

    const t = th * P.w;
    k.o.wd.set(O, A, B, .85, P.w);
    k.o.wa.map((a, b) => polar(.85 + .03 * a, t * b));
  },
  steps: [
    { cap: tx`Both arrows start at the origin. The thin lines drop each tip to the floor. \(\mathbf b\) has no \(y\) part, so it stands straight over the \(x\)-axis. The angle we want sits between the arrows, down at the origin.`,
      add: "floor tA tB a b La Lb", from: { g: .03 }, dur: 1.8 },
    { cap: tx`Line up matching components on each axis, blue for \(\mathbf a\) and orange for \(\mathbf b\). \(\mathbf b\) has nothing on \(y\), so that pair gives 0. The three products add to the dot product.`,
      drop: "La Lb tA tB", add: "pairs Lc0 Lc1 Lc2 Ld Na Nb", from: { c: 0 }, dur: 3.4 },
    { cap: tx`Walk the components of \(\mathbf a\). The two floor legs make one right triangle, with a long side of \(\sqrt5\). The rise of 2 makes a second right triangle, with \(\mathbf a\) as its longest side. That's the Pythagorean theorem used twice.`,
      drop: "pairs Lc0 Lc1 Lc2 Ld b Nb", add: "fa ta fd la1 la2 la3 p1 p2 p3 pd Lla", from: { l: 0 }, dur: 2.6, cam: { y: -.46, p: .42, d: 8, at: [.75, 1.1, .78] } },
    { cap: tx`Now walk \(\mathbf b\), with 2 along \(x\), 0 along \(y\) and 1 up. With no \(y\) part, one right triangle is enough.`,
      drop: "a Na fa ta fd la1 la2 la3 p1 p2 p3 pd Lla", add: "b Nb tb lb1 lb3 q1 q3 Llb", from: { l: 0 }, dur: 2, cam: { y: -1.5708, p: .2, d: 6.2, at: [1, 0, .55] } },
    { cap: tx`Any two arrows from one point lie in one flat sheet, so turn to face it. The shadow of \(\mathbf b\) on \(\mathbf a\) is the dot product over \(|\mathbf a|\), which is \(\frac43\). It's the side next to \(\theta\), and \(\mathbf b\) is the longest side, so their ratio is \(\cos\theta\).`,
      drop: "floor tb lb1 lb3 q1 q3 Llb Nb", add: "a Na sheet sh dr ra wd wa Nh Lsh Lt Lco", cam: { y: -2.1588, p: .8372, d: 8.1, at: [1.2, .54, 1] }, dur: 2 },
    { cap: tx`\(\cos^{-1}\) runs the idea backward. Open the angle from \(\mathbf a\) until its cosine reaches this value, and it lands exactly on \(\mathbf b\). Your calculator does that sweep for you.`,
      drop: "sh dr ra Lsh Lco Nh", add: "Lv", from: { w: .02 }, dur: 2.4 },
    { cap: tx`The angle between the arrows is \(\theta\approx53.4^\circ\), about 0.93 radians. That's under 90°, as the positive dot product promised.`,
      drop: "Lv Lt", add: "Lans" }
  ]
};
