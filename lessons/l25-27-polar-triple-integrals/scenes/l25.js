/* ---------- Lesson 25 scenes ---------- */
S["ex25-1"] = (() => {
  const T0 = 2 * PI / 3, T1 = 3 * PI / 2, f = (r, t) => 2 * t * r;
  return {
    cam: { y: 2.5, p: .55, d: 6.9, at: [-3, -.3, 26] },
    P: { sw: T1, t: 3.7, rr: 7 },
    build(k) {
      k.scale(.2, .2, .021, [-3, -.3, 26]);
      k.axes("axes", [-8.2, 2.2], [-8, 7], [0, 78]);
      k.sol = polarSolid(k, f, () => 1, () => 7, T0, T1, { ramp: [0, 66] });
      polarCell(k, "cell", 4.5, 5.2, 3.6, 3.86, f);
      k.dot("rd", { c: "cursor" });
      k.label("Lr1", polar(1, 3.75), tx`r=1`, { c: "accent", dx: 26, dy: 20 });
      k.label("Lr7", polar(7, 3.75), tx`r=7`, { c: "accent", dx: -30, dy: 16 });
      k.label("La", polar(7, T0), tx`\theta=2\pi/3`, { c: "accent", dx: -44, dy: -12 });
      k.label("Lb", polar(7, T1), tx`\theta=3\pi/2`, { c: "accent", dx: 40, dy: 18 });
      k.label("Lc", polar(4.85, 3.73, f(4.85, 3.73)), tx`\text{height }2\theta r,\ \text{base }r\,dr\,d\theta`, { c: "glow", dx: 64, dy: -46 });
      k.label("Lw", () => polar(5, k.P.t, f(5, k.P.t)), tx`228\,\theta`, { c: "glow", dx: 46, dy: -34 });
      k.label("Ans", polar(4, 3.8, 50), tx`1235\pi^2/6\approx 2031.49`, { c: "glow", dx: 0, dy: -86, line: false });
    },
    update(P, k) { k.sol.sweep(P.sw); k.sol.slice(P.t); k.o.rd.at(polar(P.rr, P.t, f(P.rr, P.t))); },
    steps: [
      { cap: tx`Every limit is a plain number, so the floor is a polar rectangle: a slice of a ring from \(120^\circ\) around to \(270^\circ\).`, add: "axes D De Lr1 Lr7 La Lb" },
      { cap: tx`Stand a thin box on one cell. Its height is the function, \(2\theta r\). Its base area is \(r\,dr\,d\theta\). That makes two \(r\)'s in the integrand.`, drop: "Lr1 Lr7 La Lb", add: "ghost cell Lc" },
      { cap: tx`Freeze \(\theta\) and add boxes along one radius, from \(r=1\) out to \(r=7\). For this angle they add up to \(228\,\theta\).`, drop: "cell Lc", add: "slice rd Lw", from: { rr: 1 }, set: { rr: 7 }, dur: 2.6 },
      { cap: tx`Now sweep \(\theta\) from \(2\pi/3\) to \(3\pi/2\). Each wall gets added in and the solid fills up. Walls farther around are taller, because the height has a \(\theta\) in it.`, drop: "rd Lw", add: "solid", from: { sw: T0 + .002, t: T0 }, set: { sw: T1, t: T1 }, dur: 4.5 },
      { cap: tx`The outer integral only needs the two end angles. Square each one, subtract, and multiply by 114.`, drop: "ghost slice", add: "La Lb" },
      { cap: tx`\(114\cdot\dfrac{65\pi^2}{36}=\dfrac{1235\pi^2}{6}\approx2031.49\).`, drop: "La Lb", add: "Ans" }
    ]
  };
})();

S["ex25-2"] = (() => {
  const T0 = PI / 2, T1 = 3 * PI / 2, f = (r, t) => r * (cos(t) + sin(t));
  return {
    cam: { y: PI + .45, p: .8, d: 6.4, at: [-.9, 0, -.25] },
    P: { sw: T1, t: 2.3 },
    build(k) {
      k.scale(.6, .6, .36, [-.9, 0, -.25]);
      k.axes("axes", [-2.8, 1], [-2.7, 2.7], [-3, 2.7]);
      k.sol = polarSolid(k, f, () => 1, () => 2, T0, T1, { ramp: [-2.83, 2] });
      k.label("Lr1", polar(1, PI + .75), tx`r=1`, { c: "accent", dx: 34, dy: -22 });
      k.label("Lr2", polar(2, PI - .7), tx`r=2`, { c: "accent", dx: 38, dy: 22 });
      k.label("La", polar(2, T0), tx`\theta=\pi/2`, { c: "accent", dx: 44, dy: 14 });
      k.label("Lb", polar(2, T1), tx`\theta=3\pi/2`, { c: "accent", dx: -46, dy: 14 });
      k.label("Lz", polar(1.5, 2.1, f(1.5, 2.1)), tx`z=x+y`, { c: "cursor", dx: 46, dy: -30 });
      k.label("Lw", () => polar(1.6, k.P.t, f(1.6, k.P.t)), tx`\tfrac73(\cos\theta+\sin\theta)`, { c: "glow", dx: 74, dy: -36 });
      k.label("Lp", polar(2, T0, 2), tx`+1`, { c: "cursor", dx: 26, dy: -20 });
      k.label("Lm", polar(2, T1, -2), tx`-1`, { c: "s1", dx: -26, dy: 20 });
      k.label("Ans", polar(1.5, PI), tx`-14/3\approx-4.667`, { c: "glow", dx: 0, dy: -96, line: false });
    },
    update(P, k) { k.sol.sweep(P.sw); k.sol.slice(P.t); },
    steps: [
      { cap: tx`\(1\le r\le2\) is a ring. The condition \(x\le0\) keeps its left half, so \(\theta\) runs from \(\pi/2\) to \(3\pi/2\).`, add: "axes D De Lr1 Lr2 La Lb" },
      { cap: tx`The height is \(z=x+y=r(\cos\theta+\sin\theta)\), a tilted plane. It rises above the floor in some places and dips below it in others. \(dA\) brings the extra \(r\) that makes \(r^2\).`, drop: "Lr1 Lr2 La Lb", add: "ghost Lz", cam: { y: PI + .45, p: .36, d: 6.4 }, dur: 1.2 },
      { cap: tx`Freeze \(\theta\). The trig part is a constant along this wall, and \(\int_1^2 r^2\,dr=\tfrac73\).`, drop: "Lz", add: "slice Lw", set: { t: 2.3 } },
      { cap: tx`Sweep \(\theta\) around the half ring. Parts above the floor add to the total. Parts below it subtract.`, drop: "Lw", add: "solid", from: { sw: T0 + .002, t: T0 }, set: { sw: T1, t: T1 }, dur: 4.5 },
      { cap: tx`\(\sin\theta-\cos\theta\) is \(+1\) at the top end and \(-1\) at the bottom end, so the bracket is \(-1-1=-2\).`, drop: "ghost slice", add: "Lp Lm" },
      { cap: tx`\(\tfrac73\cdot(-2)=-\tfrac{14}{3}\approx-4.667\). The solid has more below the floor than above it.`, drop: "Lp Lm", add: "Ans" }
    ]
  };
})();

S["ex25-3"] = (() => {
  const h = t => 1 + cos(t), f = (r, t) => r * r * sin(t);
  return {
    cam: { y: -1.3, p: .62, d: 6.3, at: [.6, .55, .55] },
    P: { sw: PI, t: 1.7 },
    build(k) {
      k.scale(1, 1, .6, [.6, .55, .55]);
      k.axes("axes", [-.7, 2.5], [-.2, 1.75], [0, 2.4]);
      k.sol = polarSolid(k, f, () => 0, h, 0, PI, { ramp: [0, 2], nT: 70 });
      k.seg("ray", { c: "glow", r: .02 });
      k.label("L0", [0, 0, 0], tx`r=0`, { c: "ink", dx: -26, dy: 18 });
      k.label("Lh", () => polar(h(k.P.t), k.P.t), tx`r=1+\cos\theta`, { c: "glow", dx: 62, dy: -22 });
      k.label("Lz", polar(1.1, 1.1, f(1.1, 1.1)), tx`z=r^2\sin\theta`, { c: "cursor", dx: 50, dy: -38 });
      k.label("Lw", () => polar(h(k.P.t) * .6, k.P.t, f(h(k.P.t) * .6, k.P.t)), tx`\tfrac14\sin\theta\,(1+\cos\theta)^4`, { c: "glow", dx: 86, dy: -42 });
      k.label("Lu", () => polar(h(k.P.t) / 2, k.P.t), tx`u=1+\cos\theta`, { c: "glow", dx: 52, dy: 28 });
      k.label("Ans", polar(.9, 1.1, 1.2), tx`8/5=1.6`, { c: "glow", dx: 0, dy: -76, line: false });
    },
    update(P, k) { k.sol.sweep(P.sw); k.sol.slice(P.t); k.o.ray.set([0, 0, .012], polar(h(P.t), P.t, .012)); },
    steps: [
      { cap: tx`Point a beam from the origin at angle \(\theta\). It starts inside at \(r=0\) and leaves through the cardioid at \(r=1+\cos\theta\). The upper half takes \(\theta\) from 0 to \(\pi\).`, add: "axes D De ray L0 Lh", from: { t: .02 }, set: { t: 1.7 }, dur: 3 },
      { cap: tx`Above each point the height is \(r^2\sin\theta\). The \(r\) from \(dA\) is already written in the problem, so the integrand is \(r^3\sin\theta\). Don't add another.`, drop: "L0 Lh", add: "ghost Lz", set: { t: .9 } },
      { cap: tx`Freeze \(\theta\) and integrate outward along the beam. For this angle the result is \(\tfrac14\sin\theta\,(1+\cos\theta)^4\).`, drop: "Lz ray", add: "slice Lw", set: { t: 1.1 } },
      { cap: tx`Let \(u\) be the beam's length, \(1+\cos\theta\). It starts at 2 and shrinks to 0 as \(\theta\) goes from 0 to \(\pi\). Flipping those limits absorbs the minus sign from \(du\).`, drop: "ghost slice Lw", add: "ray Lu", from: { t: .002 }, set: { t: 2.2 }, dur: 3.4 },
      { cap: tx`Sweep all the way around and the solid fills. What's left is \(\tfrac14\big[u^5/5\big]_0^2\).`, drop: "ray Lu", add: "solid ghost", from: { sw: .002, t: 0 }, set: { sw: PI, t: PI }, dur: 4.5 },
      { cap: tx`\(\tfrac14\cdot\tfrac{32}{5}=\dfrac{8}{5}=1.6\).`, drop: "ghost", add: "Ans" }
    ]
  };
})();

S["ex25-4"] = (() => {
  const R = sqrt(2) / 3, f = r => 2 - 9 * r * r;
  return {
    cam: { y: -.95, p: .46, d: 6.2, at: [0, 0, .8] },
    P: { sw: PI / 2, t: .75 },
    build(k) {
      k.scale(2.4, 2.4, .62, [0, 0, .8]);
      k.axes("axes", [-.62, .72], [-.62, .72], [0, 2.5]);
      k.sol = polarSolid(k, f, () => 0, () => R, 0, PI / 2, { ramp: [0, 2], go: .4 });
      k.surf("all", (t, v) => polar(R * v, t, f(R * v)), [0, TAU, 72], [0, 1, 12], { ramp: [0, 2], o: .18 });
      k.tube("rim", rng(0, TAU, 96).map(t => polar(R, t)), { c: "glow", r: .012 });
      polarCell(k, "cell", .24, .3, .55, .82, f);
      k.label("Lz", [0, 0, 2], tx`z=2-9r^2`, { c: "cursor", dx: 62, dy: -14 });
      k.label("Lrim", polar(R, -.5), tx`r=\sqrt2/3`, { c: "glow", dx: 54, dy: 22 });
      k.label("Lt", polar(R, PI / 4), tx`0\le\theta\le\pi/2`, { c: "accent", dx: 66, dy: 32 });
      k.label("Lc", polar(.27, .7, f(.27)), tx`\text{height}\times r\,dr\,d\theta`, { c: "glow", dx: 70, dy: -46 });
      k.label("Lw", () => polar(R * .45, k.P.t, f(R * .45)), tx`1/9`, { c: "glow", dx: 40, dy: -46 });
      k.label("Ans", polar(.25, .7, 1.2), tx`\pi/18\approx0.1745`, { c: "glow", dx: 0, dy: -72, line: false });
    },
    update(P, k) { k.sol.sweep(P.sw); k.sol.slice(P.t); },
    steps: [
      { cap: tx`\(z=2-9(x^2+y^2)\) is a dome with its top at \(z=2\). The planes \(x=0\) and \(y=0\) cut it into four equal quarters. We'll use the first-quadrant one.`, add: "axes all solid Lz" },
      { cap: tx`Set \(z=0\) to find the rim: \(2-9r^2=0\), so \(r=\sqrt2/3\).`, drop: "solid Lz", add: "rim Lrim D De", cam: { y: -.95, p: .8, d: 6.2 } },
      { cap: tx`In polar, \(r\) runs from 0 to the rim and \(\theta\) from 0 to \(\pi/2\). Each thin box contributes its height times \(r\,dr\,d\theta\).`, drop: "all rim Lrim", add: "ghost cell Lc Lt", cam: { y: -.95, p: .46, d: 6.2 } },
      { cap: tx`Freeze \(\theta\) and add along one radius. The inner integral comes to \(1/9\), the same number at every angle.`, drop: "cell Lc Lt", add: "slice Lw", set: { t: .75 } },
      { cap: tx`Since every wall gives the same \(1/9\), sweeping across \(\theta\) just multiplies by the width of the interval.`, drop: "Lw", add: "solid", from: { sw: .002, t: 0 }, set: { sw: PI / 2, t: PI / 2 }, dur: 4 },
      { cap: tx`\(\tfrac19\cdot\tfrac{\pi}{2}=\dfrac{\pi}{18}\approx0.1745\) cubic units.`, drop: "ghost slice", add: "Ans" }
    ]
  };
})();

S["ex25-5"] = (() => {
  const h = t => -6 * sin(4 * t), T1 = 3 * PI / 2, H = .25, RR = 7.3;
  return {
    cam: { y: -1.57, p: 1.2, d: 7.2, at: [0, 0, 0] },
    P: { t: .3, sw: T1 },
    build(k) {
      k.scale(.22, .22, .22, [0, 0, 0]);
      k.axes("axes", [-7, 7], [-7, 7], null);
      k.surf("ghost", (t, v) => polar(h(t) * v, t), [0, TAU, 240], [0, 1, 2], { c: "accent", o: .16, po: true });
      k.tube("curve", rng(0, TAU, 420).map(t => polar(h(t), t, .01)), { c: "muted", r: .008 });
      k.fill = k.surf("fill", (t, v) => polar(h(t) * v, t, .02), [0, 1, 240], [0, 1, 2], { c: "accent", o: .86, lit: false });
      k.sec = k.surf("sec", () => [0, 0, 0], [-.5, .5, 8], [0, 1, 1], { c: "glow", o: .95, lit: false });
      k.seg("beam", { c: "muted", r: .012 }); k.seg("arm", { c: "glow", r: .022 }); k.dot("pt", { c: "glow", r: .06 });
      k.curt("rate", 241, { c: "s2", o: .62 }).set(rng(0, T1, 240).map(t => polar(RR, t, 18 * sin(4 * t) ** 2 * H)));
      k.tube("lev", rng(0, T1, 100).map(t => polar(RR, t, 9 * H)), { c: "cursor", r: .02 });
      k.label("Lc", polar(5.4, PI / 8 + PI), tx`r=h(\theta)`, { c: "ink", dx: -40, dy: -30 });
      k.label("Lneg", () => polar(h(k.P.t), k.P.t), tx`r<0:\ \text{far side}`, { c: "glow", dx: -66, dy: 18 });
      k.label("Lsec", () => polar(h(k.P.t) * .6, k.P.t), tx`18\sin^2 4\theta`, { c: "glow", dx: 60, dy: 32 });
      k.label("Llev", polar(RR, PI / 2 + .35, 9 * H), tx`9`, { c: "cursor", dx: 22, dy: -14 });
      k.label("Lr", polar(RR, 3 * PI / 2 - .3, 18 * H), tx`9-9\cos8\theta`, { c: "s2", dx: 58, dy: -12 });
      k.label("Ans", [0, 0, 0], tx`27\pi/2\approx42.41`, { c: "glow", dx: 0, dy: -8, line: false });
    },
    update(P, k) {
      if (k.lastSw !== P.sw) { k.lastSw = P.sw; k.fill.map((a, v) => { const t = a * P.sw; return polar(h(t) * v, t, .02); }); }
      const t = P.t, r = h(t);
      k.sec.map((a, v) => { const q = t + a * .1; return polar(h(q) * v, q, .03); });
      k.o.beam.set([0, 0, .03], polar(7, t, .03));
      k.o.arm.set([0, 0, .03], polar(r, t, .03));
      k.o.pt.at(polar(r, t, .03));
    },
    steps: [
      { cap: tx`Rays leave the origin at \(r=0\) and stop on the curve \(h(\theta)=-6\sin4\theta\). The dim outline is the full rose, eight petals in all.`, add: "axes ghost curve Lc beam arm pt", from: { t: .001 }, set: { t: PI / 8 }, dur: 2.6 },
      { cap: tx`For \(\theta\) between 0 and \(\pi/4\), \(h\) is negative. The point lands on the far side of the origin from the beam, so this petal shows up in the third quadrant.`, drop: "Lc", add: "Lneg", from: { t: .001 }, set: { t: .55 }, dur: 3 },
      { cap: tx`A thin sector of angle \(d\theta\) has area \(\tfrac12h^2\,d\theta=18\sin^24\theta\,d\theta\). Squaring removes the sign, so every petal adds positive area.`, drop: "Lneg", add: "sec Lsec", set: { t: PI / 8 } },
      { cap: tx`The ring shows the size of \(18\sin^24\theta\) at each angle. The identity rewrites it as \(9-9\cos8\theta\): a steady 9, plus a ripple that averages out to zero.`, drop: "sec Lsec beam arm pt", add: "rate lev Llev Lr", cam: { y: -1.05, p: .62, d: 8.4 }, dur: 1.8 },
      { cap: tx`Sweep \(\theta\) from 0 to \(3\pi/2\). That traces six of the eight petals, each exactly once, and only the steady 9 survives the integral.`, drop: "rate lev Llev Lr", add: "fill beam arm pt", from: { sw: .002, t: 0 }, set: { sw: T1, t: T1 }, cam: { y: -1.57, p: 1.2, d: 7.2 }, dur: 6 },
      { cap: tx`\(9\cdot\tfrac{3\pi}{2}=\dfrac{27\pi}{2}\approx42.41\) square units.`, drop: "beam arm pt", add: "Ans" }
    ]
  };
})();
