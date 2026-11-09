/* ---------- Lesson 27 scenes ---------- */
S["ex27-1"] = {
  cam: { y: -.72, p: .42, d: 6.6, at: [.9, .9, 2] },
  P: { sw: PI / 2 },
  build(k) {
    k.scale(.58, .58, .36, [.9, .9, 2]);
    k.axes("axes", [0, 3.1], [0, 3.1], [0, 5]);
    k.sol = polarSolid(k, () => 4, () => 0, () => 2, 0, PI / 2, { c: "s2", go: .3, nR: 4 });
    k.tube("topE", rng(0, PI / 2, 40).map(t => polar(2, t, 4)), { c: "ink", r: .008, o: .55 });
    k.surf("fr", (r, v) => [r, 0, v * r * r], [0, 2, 24], [0, 1, 1], { c: "s2", o: .9 });
    k.tube("er", [[0, 0, .01], [2, 0, .01]], { c: "s2", r: .018 });
    k.surf("ft", (t, v) => polar(2 + v * sin(t) * .55, t, .01), [0, PI / 2, 30], [0, 1, 1], { c: "s3", o: .9 });
    k.tube("et", rng(0, PI / 2, 40).map(t => polar(2, t, .01)), { c: "s3", r: .018 });
    k.surf("fz", (z, v) => [0, 2 + v * z * .17, z], [0, 4, 24], [0, 1, 1], { c: "bad", o: .9 });
    k.tube("ez", [[0, 2, 0], [0, 2, 4]], { c: "bad", r: .018 });
    k.label("Lq", polar(2, .8, 4), tx`r=2`, { c: "ink", dx: 42, dy: -22 });
    k.label("Lh", [2, 0, 2], tx`z=4`, { c: "ink", dx: 40, dy: 2 });
    k.label("Lr", [1.6, 0, 1.3], tx`\int r^2dr=8/3`, { c: "s2", dx: 74, dy: 18 });
    k.label("Lt", polar(2.4, .75), tx`\int\sin\theta\,d\theta=1`, { c: "cursor", dx: 100, dy: 34 });
    k.label("Lz", [0, 2.5, 3], tx`\int z\,dz=8`, { c: "bad", dx: 58, dy: -22 });
    k.label("Ans", [1, 1, 4], tx`64/3\approx21.33`, { c: "glow", dx: 0, dy: -46, line: false });
  },
  update(P, k) { k.sol.sweep(P.sw); },
  steps: [
    { cap: tx`The limits describe a quarter of a cylinder, radius 2 and height 4. The second \(r\) in the integrand is the \(dV\) factor, already written for you.`, add: "axes D De solid topE Lq Lh" },
    { cap: tx`Every limit is a number and the integrand is a product, so the integral splits into three factors, one along each direction.`, drop: "Lq Lh top wo wi wa wb", add: "ghost" },
    { cap: tx`The \(r\) factor comes from the fin along the radius, whose height is \(r^2\). Its area is \(\tfrac83\).`, add: "fr er Lr" },
    { cap: tx`The \(\theta\) factor comes from the fin around the rim, whose size is \(\sin\theta\). Its area is 1.`, add: "ft et Lt" },
    { cap: tx`The \(z\) factor comes from the fin up the side, whose size is \(z\). Its area is 8. Multiply all three results.`, add: "fz ez Lz" },
    { cap: tx`\(8\cdot1\cdot\tfrac83=\dfrac{64}{3}\approx21.33\).`, drop: "Lr Lt Lz", add: "Ans" }
  ]
};

S["ex27-2"] = (() => {
  const roof = (r, t) => r * cos(t) + 2;
  return {
    cam: { y: -.72, p: .44, d: 6.3, at: [.9, .9, 1.5] },
    P: { sw: PI / 2, m: 0, t: .7, sr: 1.3, st: .7 },
    build(k) {
      k.scale(.62, .62, .5, [.9, .9, 1.5]);
      k.axes("axes", [0, 3], [0, 3], [0, 4.6]);
      const P = k.P;
      k.sol = polarSolid(k, (r, t) => lerp(roof(r, t), 1, P.m), () => 0, () => 2, 0, PI / 2, { ramp: [.8, 4], go: .3 });
      k.seg("stick", { c: "glow", r: .022 });
      k.dot("p1", { c: "glow", r: .036 });
      k.label("Lr", polar(2, .7), tx`r=2`, { c: "accent", dx: 40, dy: 20 });
      k.label("Lq", polar(1.2, .6), tx`\text{quarter disk}`, { c: "accent", dx: 8, dy: 40 });
      k.label("Lz", polar(1.6, .5, roof(1.6, .5)), tx`z=r\cos\theta+2`, { c: "cursor", dx: 54, dy: -30 });
      k.label("Lw", polar(1, 1.2, roof(1, 1.2)), tx`\text{weight }1/(r\cos\theta+2)`, { c: "ink", dx: -76, dy: -44 });
      k.label("Lc", polar(1.2, .7, 1), tx`\text{length}\times\text{weight}=1`, { c: "glow", dx: 76, dy: -44 });
      k.label("Ls", () => polar(1.1, k.P.t, 1), tx`\int_0^2 r\,dr=2`, { c: "glow", dx: 60, dy: -38 });
      k.label("Ans", polar(1, .8, 1), tx`\pi\ (\text{area of the quarter disk})`, { c: "glow", dx: 0, dy: -86, line: false });
    },
    update(P, k) {
      k.sol.sweep(P.sw, P.m); k.sol.slice(P.t);
      const z = lerp(roof(P.sr, P.st), 1, P.m), a = polar(P.sr, P.st, 0), b = polar(P.sr, P.st, z);
      k.o.stick.set(a, b); k.o.p1.at(b);
    },
    steps: [
      { cap: tx`\(x^2+y^2\le4\) with \(x,y\ge0\) is a quarter of a disk. That shadow has \(0\le r\le2\) and \(0\le\theta\le\pi/2\).`, add: "axes D De Lr Lq" },
      { cap: tx`A stick runs from the floor up to the slanted plane \(z=x+2\). In cylindrical that top is \(z=r\cos\theta+2\).`, drop: "Lq", add: "ghost stick p1 Lz", from: { sr: .3, st: .2 }, set: { sr: 1.3, st: .7 }, dur: 2 },
      { cap: tx`The function is \(\dfrac{1}{x+2}\), and \(dV=r\,dz\,dr\,d\theta\). So each bit of a stick carries a weight of \(\dfrac{1}{r\cos\theta+2}\), times \(r\).`, drop: "Lr", add: "solid Lw" },
      { cap: tx`There's no \(z\) in the integrand, so the \(z\) integral multiplies by the stick's length. That length equals the denominator, and they cancel. Watch every stick become the same: height 1, leaving just \(r\).`, drop: "Lz Lw ghost", add: "Lc", from: { m: 0 }, set: { m: 1 }, dur: 3 },
      { cap: tx`What's left is \(\int_0^2 r\,dr\) at each angle, then a sweep across \(\theta\). A flat slab of height 1 has the same number for its volume as its base has for its area.`, drop: "Lc stick p1", add: "slice Ls", from: { sw: .002, t: 0 }, set: { sw: PI / 2, t: PI / 2 }, dur: 4 },
      { cap: tx`\(2\cdot\tfrac{\pi}{2}=\pi\). That's exactly the area of the quarter disk.`, drop: "slice Ls", add: "Ans" }
    ]
  };
})();

S["ex27-3"] = {
  cam: { y: -.72, p: .42, d: 5.6, at: [0, 0, .42] },
  P: { p: 1, f: PI / 2, t: 2.2, th: .9 },
  build(k) {
    k.scale(1.2, 1.2, 1.2, [0, 0, .42]);
    k.axes("axes", [-1.4, 1.4], [-1.4, 1.4], [0, 1.45]);
    const P = k.P;
    k.surf("ghost", (t, f) => sph(1, t, f), [0, TAU, 56], [0, PI / 2, 14], { c: "s2", o: .18 });
    k.tube("eq", rng(0, TAU, 96).map(t => polar(1, t)), { c: "accent", r: .01 });
    k.surf("D", (r, t) => polar(r, t), [0, 1, 4], [0, TAU, 72], { c: "accent", o: .2, po: true });
    k.top = k.surf("top", (a, f) => sph(1, a, f), [0, 1, 72], [0, PI / 2, 14], { c: "s2", o: 1 });   // opaque so it writes depth and hides the fan inside it
    k.fan = k.surf("fan", (u, v) => sph(u, 0, v), [0, 1, 10], [0, 1, 24], { c: "glow", o: .9 });
    k.fan0 = k.surf("fan0", (u, v) => sph(u, 0, v * PI / 2), [0, 1, 10], [0, 1, 24], { c: "s1", o: .4 });
    k.alias("solid", "top fan0");
    k.seg("rod", { c: "cursor", r: .02 }); k.dot("tip", { c: "cursor", r: .036 });
    k.label("LR", sph(1, .1, .55), tx`\rho\le1`, { c: "ink", dx: 44, dy: -16 });
    k.label("LE", polar(1, -.7), tx`\phi=\pi/2\ (\text{equator})`, { c: "accent", dx: 70, dy: 24 });
    k.label("Lr", () => sph(.6, P.th, .6), tx`\tfrac13\sin\phi`, { c: "cursor", dx: 54, dy: -22 });
    k.label("Lf", () => sph(.6, P.th, .6), tx`1/3`, { c: "glow", dx: 40, dy: -26 });
    k.label("Lt", [0, 0, 1], tx`\theta\ \text{goes all the way around}`, { c: "ink", dx: 8, dy: -24, line: false });
    k.label("Ans", [0, 0, 1], tx`2\pi/3\approx2.094`, { c: "glow", dx: 0, dy: -30, line: false });
  },
  update(P, k) {
    const key = P.th.toFixed(4) + "|" + P.f.toFixed(4) + "|" + P.t.toFixed(4);
    if (key !== k.key) {
      k.key = key;
      k.fan.map((u, v) => sph(u, P.th, v * P.f));
      k.top.map((a, f) => sph(1, a * P.t, f));
    }
    k.o.rod.set([0, 0, 0], sph(P.p, P.th, .6)); k.o.tip.at(sph(P.p, P.th, .6));
  },
  steps: [
    { cap: tx`\(\rho\) from 0 to 1 fills a unit ball. \(\phi\) from 0 to \(\pi/2\) stops at the equator, and \(\theta\) goes all the way around. The integrand is only the \(dV\) factor, so this is a volume.`, add: "axes ghost eq D LR LE" },
    { cap: tx`Fix the two angles and integrate along one straight rod, from the origin out to \(\rho=1\). That gives \(\tfrac13\sin\phi\).`, drop: "LR LE", add: "rod tip Lr", from: { p: .02 }, set: { p: 1 }, dur: 2 },
    { cap: tx`Swing the rod down from the pole to the equator. That fans out a flat quarter disk, and the \(\phi\) integral comes to \(\tfrac13\).`, drop: "rod tip Lr", add: "fan Lf", from: { f: .02 }, set: { f: PI / 2 }, dur: 2.8 },
    { cap: tx`Spin the fan once around the \(z\)-axis. It sweeps out the hemisphere, and each bit of \(\theta\) adds the same \(\tfrac13\).`, drop: "Lf", add: "solid Lt", from: { t: .002, th: 0 }, set: { t: TAU, th: TAU - .002 }, dur: 5 },
    { cap: tx`\(\tfrac13\cdot2\pi=\dfrac{2\pi}{3}\approx2.094\), the volume of a hemisphere of radius 1.`, drop: "fan Lt ghost", add: "Ans" }
  ]
};

S["ex27-4"] = {
  cam: { y: -1.2, p: .48, d: 5.7, at: [0, .4, .35] },
  P: { p: 1, f: PI / 2, t: PI, th: 1.2 },
  build(k) {
    k.scale(1.3, 1.3, 1.3, [0, .4, .35]);
    k.axes("axes", [-1.42, 1.42], [-.3, 1.42], [0, 1.4]);
    const P = k.P, rs = [.25, .5, .75, 1], cols = ["s1", "t2", "s2", "s3"];
    k.surf("flr", (r, t) => polar(r, t, .001), [0, 1, 6], [0, PI, 36], { c: "accent", o: .32, po: true });
    k.surf("wall", (r, f) => sph(r, 0, f), [0, 1, 6], [-PI / 2, PI / 2, 36], { c: "s1", o: .24 });
    k.tubes("edge", [rng(0, PI, 60).map(t => polar(1, t)), rng(-PI / 2, PI / 2, 60).map(f => sph(1, 0, f)), [[-1, 0, 0], [1, 0, 0]]], { c: "accent", r: .009 });
    k.shells = rs.map((r, i) => k.surf("sh" + i, () => [0, 0, 0], [0, PI, 44], [0, PI / 2, 14], { c: cols[i], o: i === 3 ? .5 : .62 }));
    k.alias("shells", "sh0 sh1 sh2 sh3");
    k.rs = rs;
    k.brk = k.surf("brk", () => [0, 0, 0], [0, 1, 4], [0, 1, 4], { c: "glow", o: .96 });
    k.seg("rod", { c: "cursor", r: .02 }); k.dot("tip", { c: "cursor", r: .036 });
    k.tube("arcF", rng(0, PI / 2, 30).map(f => sph(1, PI, f)), { c: "t2", r: .018 });
    k.tube("arcT", rng(0, PI, 50).map(t => polar(1, t)), { c: "s3", r: .018 });
    k.label("Lz", [0, 0, 1], tx`z\ge0`, { c: "ink", dx: -36, dy: -6 });
    k.label("Ly", [0, 1, 0], tx`y\ge0`, { c: "ink", dx: 38, dy: 14 });
    k.label("Lro", sph(1, .5, .9), tx`\rho\le1`, { c: "ink", dx: 42, dy: -16 });
    k.label("Lf", sph(.55, 2.2, .75), tx`f=5\rho^2`, { c: "cursor", dx: 62, dy: -44 });
    k.label("Ldv", () => sph(.62, P.th, .8), tx`\rho^2\sin\phi\,d\rho\,d\phi\,d\theta`, { c: "glow", dx: 88, dy: -42 });
    k.label("Lp", () => sph(.72, P.th, .7), tx`\int_0^1 5\rho^4\,d\rho=1`, { c: "cursor", dx: 74, dy: -34 });
    k.label("LF", sph(1, PI, .8), tx`\phi:\ 1`, { c: "t2", dx: -44, dy: -14 });
    k.label("LT", polar(1, 1.2), tx`\theta:\ \text{width of }[0,\pi]`, { c: "cursor", dx: 86, dy: 22 });
    k.label("Ans", [0, .35, 1], tx`\pi`, { c: "glow", dx: 0, dy: -26, line: false });
  },
  update(P, k) {
    const key = P.p.toFixed(4);
    if (key !== k.key) { k.key = key; k.shells.forEach((sh, i) => { const r = min(k.rs[i], P.p); sh.map((t, f) => sph(r, t, f)); }); }
    const a = .62, b = .8, th = P.th;
    k.brk.map((u, v) => sph(a + .24, lerp(th - .17, th + .17, u), lerp(b - .17, b + .17, v)));
    k.o.rod.set([0, 0, 0], sph(P.p, th, .7)); k.o.tip.at(sph(P.p, th, .7));
  },
  steps: [
    { cap: tx`Inside the unit sphere means \(0\le\rho\le1\). Above the equator means \(0\le\phi\le\pi/2\). The side with \(y\ge0\) means \(0\le\theta\le\pi\). Together they make a quarter of a ball.`, add: "axes flr wall edge sh3 Lz Ly Lro" },
    { cap: tx`\(5(x^2+y^2+z^2)=5\rho^2\), so the function depends on distance only. Each onion shell has one constant value, larger as you go out.`, drop: "Lz Ly Lro", add: "shells Lf" },
    { cap: tx`A tiny spherical piece has volume \(\rho^2\sin\phi\,d\rho\,d\phi\,d\theta\). Its \(\rho^2\) multiplies the function's \(5\rho^2\), giving \(5\rho^4\sin\phi\).`, drop: "Lf", add: "brk Ldv", cam: { y: -1.4, p: .5, d: 5.4 } },
    { cap: tx`Limits are constants and the integrand is a product, so it splits. Along one rod, the \(\rho\) factor is \(\int_0^1 5\rho^4\,d\rho\), which is exactly 1.`, drop: "brk Ldv", add: "rod tip Lp", from: { p: .02 }, set: { p: 1 }, cam: { y: -1.2, p: .48, d: 5.7 }, dur: 3 },
    { cap: tx`The \(\phi\) factor, the arc down from the pole, is \(\int_0^{\pi/2}\sin\phi\,d\phi=1\). The \(\theta\) factor is the width of its interval, along the half circle.`, drop: "rod tip Lp", add: "arcF arcT LF LT" },
    { cap: tx`\(1\cdot1\cdot\pi=\pi\).`, drop: "LF LT arcF arcT", add: "Ans" }
  ]
};
