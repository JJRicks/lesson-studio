/* ---------- Lesson 23 scenes ---------- */
S["ex23-prop"] = {
  cam: { y: -.95, p: .46, d: 6.8, at: [-.3, .05, 3.4] },
  P: { s: 3 },
  build(k) {
    k.scale(.27, 1.3, .125, [-.3, .05, 3.6]);
    const a = -4, b = 3, Y = PI / 6, g = x => 3 * x * x, h = y => y * y * cos(6 * y ** 3), f = (x, y) => g(x) * h(y), yw = Y + .2, xw = b + .9, kx = 8.4 / 48, ky = 8.4 / .18, xs = rng(a, b, 56), ys = rng(-Y, Y, 30);
    k.f = f;
    k.flat("R", [[a, -Y], [b, -Y], [b, Y], [a, Y]], 0, { c: "accent", o: .18 });
    k.tubes("Re", [[[a, -Y, 0], [b, -Y, 0]], [[b, -Y, 0], [b, Y, 0]], [[b, Y, 0], [a, Y, 0]], [[a, Y, 0], [a, -Y, 0]]], { c: "accent", r: .012 });
    k.surf("top", (x, y) => [x, y, f(x, y)], [a, b, 56], [-Y, Y, 30], { ramp: [0, 8.6], o: .86 });
    k.surf("ghost", (x, y) => [x, y, f(x, y)], [a, b, 36], [-Y, Y, 20], { ramp: [0, 8.6], o: .22 });
    k.curt("gA", 57, { c: "glow", o: .42 }).set(xs.map(x => [x, yw, g(x) * kx]));
    k.tube("gC", xs.map(x => [x, yw, g(x) * kx]), { c: "glow", r: .016 });
    k.curt("hA", 31, { c: "s2", o: .45 }).set(ys.map(y => [xw, y, h(y) * ky]));
    k.tube("hC", ys.map(y => [xw, y, h(y) * ky]), { c: "s2", r: .016 });
    k.curt("sl", 31, { c: "s3", o: .92 });
    k.label("Lg", [-3.4, yw, g(-3.4) * kx], tx`\text{x-part: }3x^2`, { c: "glow", dx: 54, dy: -22 });
    k.label("Lh", [xw, -.3, h(.3) * ky], tx`\text{y-part: }y^2\cos(6y^3)`, { c: "s2", dx: 46, dy: 44 });
    k.label("Ls", () => [k.P.s, -.45, f(k.P.s, -.45)], tx`\text{same curve, rescaled}`, { c: "s3", dx: -96, dy: 34 });
    k.label("Lx", [-.5, yw, 3.6], tx`\int_{-4}^{3}3x^2\,dx=91`, { c: "glow", dy: -26, line: false });
    k.label("Ly", [xw, 0, 3.4], tx`\int y^2\cos(6y^3)\,dy=\tfrac{1}{18}\sin(6y^3)`, { c: "s2", dx: -36, dy: -56 });
    k.label("Lv", [xw, 0, 2.2], tx`\text{area}=\tfrac19\sin\tfrac{\pi^3}{36}`, { c: "s2", dx: -8, dy: -46 });
    k.label("Lm", [-1, 0, 7.2], tx`\text{volume}=91\times\tfrac19\sin\tfrac{\pi^3}{36}`, { c: "ink", dx: -44, dy: -42 });
    k.label("La", [-1, 0, 7.2], tx`\tfrac{91}{9}\sin\tfrac{\pi^3}{36}\approx7.671`, { c: "glow", dx: -44, dy: -42 });
  },
  update(P, k) { k.o.sl.set(rng(-PI / 6, PI / 6, 30).map(y => [P.s, y, k.f(P.s, y)])); },
  steps: [
    { cap: tx`Every slice across \(y\) is the same curve, just rescaled by \(3x^2\). That's what "x-part times y-part" looks like, and why the integral can split in two.`, add: "R Re ghost gA gC hA hC sl Lg Lh Ls", from: { s: -4 }, set: { s: 3 }, dur: 4.5 },
    { cap: tx`The \(x\) integral is just the shaded area under \(3x^2\), drawn on the back wall. It doesn't care about \(y\) at all.`, drop: "sl Ls hA hC Lh ghost Lg", add: "Lx", cam: { y: -1.45, p: .2, d: 6.6 } },
    { cap: tx`The \(y\) integral is the shaded area under the other profile. The substitution \(u=6y^3\) gives its antiderivative.`, drop: "gA gC Lx", add: "hA hC Ly", cam: { y: -.2, p: .2, d: 6.6 } },
    { cap: tx`Evaluate at \(y=\pm\frac{\pi}{6}\). The curve is symmetric about \(y=0\), so the two ends add instead of canceling.`, drop: "Ly", add: "Lv" },
    { cap: tx`The solid's volume is the product of the two shaded areas: one area from each single integral.`, drop: "Lv", add: "top gA gC Lm", cam: { y: -.95, p: .46, d: 6.8 }, dur: 1.5 },
    { cap: tx`Multiplying gives \(\frac{91}{9}\sin\frac{\pi^3}{36}\approx7.671\).`, drop: "Lm", add: "La" }
  ]
};

S["ex23-f1"] = {
  cam: { y: -1.2, p: .3, d: 6.9, at: [1, 3.55, -40] },
  P: { s: 2 },
  build(k) {
    k.scale(.75, 1.45, .0135, [1, 3.55, -40]);
    const f = (x, y) => 2 * x * x - 7 * x * x * y + 2 * y, A = x => -22.5 * x * x + 7, wy = 4.24, xs = rng(0, 2, 44);
    k.f = f; k.A = A; k.wy = wy;
    k.R = rectSolid(k, f, [0, 2], [3, 4], [-96, 8]);
    k.curt("Aw", 45, { c: "glow", o: .3 }).set(xs.map(x => [x, wy, A(x)]));
    k.tube("At", xs.map(x => [x, wy, A(x)]), { c: "glow", r: .017 });
    k.dot("Ad", { c: "glow", r: .05 });
    k.seg("e3", { c: "s1", r: .017 }); k.seg("e4", { c: "s2", r: .017 });
    k.label("Lx", [1, 3, 0], tx`x\text{ from }0\text{ to }2\ (\text{outer})`, { c: "ink", dx: -14, dy: -26 });
    k.label("Ly", [2, 3.5, 0], tx`y\text{ from }3\text{ to }4\ (\text{inner})`, { c: "ink", dx: 78, dy: 16 });
    k.label("Ls", [1.3, 3.5, -40], tx`z=f(x,y)`, { c: "s2", dx: 12, dy: 46 });
    k.label("Lf", () => [k.P.s, 3.5, f(k.P.s, 3.5)], tx`x\text{ frozen}`, { c: "glow", dx: -52, dy: 30 });
    k.label("Lt", () => [k.P.s, 3.5, f(k.P.s, 3.5) / 2], tx`\int_3^4 f\,dy`, { c: "ink", dx: 8, dy: 0, line: false });
    k.label("L4", () => [k.P.s, 4, f(k.P.s, 4)], tx`y=4`, { c: "s2", dx: 26, dy: 14 });
    k.label("L3", () => [k.P.s, 3, f(k.P.s, 3)], tx`y=3`, { c: "s1", dx: -26, dy: 14 });
    k.label("LA", [1.6, wy, A(1.6)], tx`A(x)=-\tfrac{45}{2}x^2+7`, { c: "glow", dx: 84, dy: -14 });
    k.label("La", [1, 3.5, -40], tx`\text{signed volume}=-46`, { c: "glow", dx: 12, dy: 56 });
  },
  update(P, k) {
    const s = P.s, f = k.f;
    k.R.cut.set(s + .002); k.R.slice(s);
    k.o.e3.set([s, 3, 0], [s, 3, f(s, 3)]); k.o.e4.set([s, 4, 0], [s, 4, f(s, 4)]);
    k.o.Ad.at([s, k.wy, k.A(s)]);
  },
  steps: [
    { cap: tx`The surface hangs mostly below the floor over this rectangle. In \(dy\,dx\), \(y\) runs from 3 to 4 inside, and \(x\) from 0 to 2 outside.`, add: "R Re solid Lx Ly Ls" },
    { cap: tx`Freeze \(x\) at one value. That cuts a single slice through the solid. Along it only \(y\) changes, which is why \(x\) acts like a constant.`, drop: "solid Lx Ly Ls", add: "ghost slice Lf Lt", set: { s: 1.2 }, dur: 1.4 },
    { cap: tx`Plugging in means taking the antiderivative at the \(y=4\) edge minus the \(y=3\) edge. That gives the slice's signed area, and as \(x\) changes it traces out \(A(x)=-\frac{45}{2}x^2+7\) on the back wall.`, add: "e3 e4 L3 L4 Aw At Ad LA", drop: "Lt Lf", cam: { y: -.85, p: .24, d: 6.9 } },
    { cap: tx`Slide the slice from \(x=0\) to \(x=2\). The outer integral adds up all the slice areas, filling in the whole signed volume. Near \(x=0\) the slices sit above the floor; after that they're below it.`, drop: "e3 e4 L3 L4", add: "solid", from: { s: 0 }, set: { s: 2 }, cam: { y: -1.2, p: .3, d: 6.9 }, dur: 5 },
    { cap: tx`The signed volume is \(-46\). It's negative because almost all of the solid hangs below the \(xy\)-plane.`, drop: "ghost slice Ad", add: "La" }
  ]
};

S["ex23-f2"] = {
  cam: { y: -2.25, p: .34, d: 6.4, at: [.8, .89, 2.8] },
  P: { s: PI / 2 },
  build(k) {
    k.scale(.95, 6.3, .19, [.8, .89, 3]);
    const a = PI / 2, c = PI / 4, f = (x, y) => 3 * x * x * cos(6 * y), B = (1 + sin(6)) / 2, wy = 1.04, kA = 7, xs = rng(0, a, 44);
    k.f = f; k.Ax = x => B * x * x * kA; k.wy = wy;
    k.R = rectSolid(k, f, [0, a], [c, 1], [0, 7.2]);
    k.curt("Aw", 45, { c: "glow", o: .3 }).set(xs.map(x => [x, wy, k.Ax(x)]));
    k.tube("At", xs.map(x => [x, wy, k.Ax(x)]), { c: "glow", r: .017 });
    k.dot("Ad", { c: "glow", r: .05 });
    k.label("Ls", () => [k.P.s, .93, f(k.P.s, .93) / 2], tx`3x^2\cos(6y)`, { c: "ink", dx: 2, dy: 0, line: false });
    k.label("Lc", () => [k.P.s, 1, f(k.P.s, 1)], tx`x\text{ frozen, so }3x^2\text{ is a constant}`, { c: "glow", dx: -100, dy: -34 });
    k.label("LA", [1.3, wy, k.Ax(1.3)], tx`\text{slice area}=\tfrac{x^2}{2}(1+\sin6)`, { c: "glow", dx: 70, dy: -28 });
    k.label("Lq", [.9, .95, 3.2], tx`\tfrac{1+\sin6}{2}\cdot\tfrac{\pi^3}{24}`, { c: "ink", dy: -60, dx: -10 });
    k.label("La", [.9, .95, 3.2], tx`\tfrac{\pi^3(1+\sin6)}{48}\approx0.4655`, { c: "glow", dy: -60, dx: -10 });
  },
  update(P, k) { k.R.cut.set(P.s + .002); k.R.slice(P.s); k.o.Ad.at([P.s, k.wy, k.Ax(P.s)]); },
  steps: [
    { cap: tx`Freeze \(x\). The slice is a piece of the curve \(\cos(6y)\), stretched by the constant \(3x^2\). Its area is the inner integral: \(\frac{x^2}{2}(\sin6+1)\).`, add: "R Re ghost slice Ls Lc", from: { s: PI / 2 }, set: { s: 1.1 }, dur: 1.4 },
    { cap: tx`Slide the slice from \(x=0\) to \(\frac{\pi}{2}\). Its area grows like \(x^2\), traced on the back wall, and the outer integral adds the slices up.`, drop: "Ls Lc", add: "solid Aw At Ad LA", from: { s: 0 }, set: { s: PI / 2 }, dur: 4.5 },
    { cap: tx`Every slice is the same shape, so the volume is a number, \(\frac{1+\sin6}{2}\), times \(\int_0^{\pi/2}x^2\,dx=\frac{\pi^3}{24}\).`, drop: "ghost slice Ad LA", add: "Lq" },
    { cap: tx`Multiplying gives \(\frac{\pi^3(1+\sin6)}{48}\approx0.4655\).`, drop: "Lq", add: "La" }
  ]
};

S["ex23-avg"] = {
  cam: { y: -1.05, p: 1.02, d: 7, at: [-2, 1.5, -10] },
  P: { s: 0, m: 0 },
  build(k) {
    k.scale(.42, 1.42, .0128, [-2, 1.5, -12]);
    const f = (x, y) => 4 * x + 2 * x * x * y * y - 9 * y * y * y, AV = -607 / 36;
    k.f = f; k.AV = AV; k.m0 = -1;
    k.R = rectSolid(k, f, [-4, 0], [1, 2], [-72, 40]);
    k.label("Lw", [-2, 1, 0], tx`\text{width }4`, { c: "accent", dy: 22, line: false });
    k.label("Ld", [0, 1.5, 0], tx`\text{depth }1`, { c: "accent", dx: 40, line: false });
    k.label("Lar", [-2, 1.5, 0], tx`\text{area}=4`, { c: "ink", line: false });
    k.label("Ls", () => [k.P.s, 1.5, f(k.P.s, 1.5)], tx`\int_1^2 f\,dy`, { c: "glow", dx: 50, dy: -26 });
    k.label("Lv", [-3.2, 1.9, 34], tx`\text{signed volume}=-\tfrac{607}{9}`, { c: "ink", dx: 40, dy: -26 });
    k.label("Lq", [-2, 1.5, AV], tx`f_{\text{avg}}=\,?`, { c: "glow", dx: 40, dy: 42 });
    k.label("La", [-2, 1.5, AV], tx`f_{\text{avg}}=-\tfrac{607}{36}\approx-16.86`, { c: "glow", dx: 70, dy: 42 });
  },
  update(P, k) {
    if (P.m !== k.m0) { k.m0 = P.m; k.R.set((x, y) => lerp(k.f(x, y), k.AV, P.m)); }
    k.R.cut.set(P.s + .002); k.R.slice(P.s);
  },
  steps: [
    { cap: tx`Start with the floor: a rectangle 4 wide and 1 deep, so its area is 4. We'll divide by that at the end.`, add: "R Re Lw Ld Lar" },
    { cap: tx`Now add the surface and freeze \(x\). The slice's signed area is the inner integral, \(4x+\frac{14}{3}x^2-\frac{135}{4}\).`, drop: "Lw Ld Lar", add: "ghost slice Ls", set: { s: -2.2 }, cam: { y: -1.05, p: .3, d: 6.2 }, dur: 1.4 },
    { cap: tx`Slide across \(x\) from \(-4\) to 0. Slices above and below the floor combine into a total signed volume of \(-\frac{607}{9}\).`, drop: "Ls", add: "solid Lv", from: { s: -4 }, set: { s: 0 }, dur: 4.5 },
    { cap: tx`Now level the bumpy surface flat, keeping the same signed volume. The height it settles at is volume ÷ area.`, drop: "ghost slice Lv", add: "Lq", set: { m: 1 }, dur: 3 },
    { cap: tx`The flat height is \(f_{\text{avg}}=-\frac{607}{36}\approx-16.86\). It sits below the floor because the negative part of the solid outweighs the positive part.`, drop: "Lq", add: "La" }
  ]
};
