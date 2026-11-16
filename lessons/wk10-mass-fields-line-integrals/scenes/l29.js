/* ---------- Lesson 29 scenes: vector fields ---------- */
const TOP = { y: -PI / 2, p: 1.08 };   // looking down at the floor, x to the right, y up the screen

S["ex29-1"] = {
  cam: { ...TOP, d: 5, at: [.5, -1.1, 0] },
  P: {},
  build(k) {
    k.scale(.42, .42, .42, [.5, -1.1, 0]);
    k.grid("grid", [-2, 3, 1], [-3, 1, 1], 0, { o: .25 });
    k.axes("axes", [-2.5, 3.5], [-3.5, 1.5], null);
    k.dot("pt", { c: "ink", r: .05, p: [1, -2, 0] });
    k.label("Lpt", [1, -2, 0], tx`(1,-2)`, { dx: 36, dy: 24 });
    k.arrow("Px", { c: "s1", r: .022 }).set([1, -2, .02], [-1, -2, .02]);
    k.arrow("Qy", { c: "s2", r: .022 }).set([-1, -2, .02], [-1, -1.4, .02]);
    k.arrow("Fa", { c: "glow", r: .026 }).set([1, -2, .05], [-1, -1.4, .05]);
    k.label("LF", [-1.7, .7, 0], tx`\mathbf F=\dfrac{4x}{y}\,\mathbf i+\dfrac{-5x-4y}{x-2y}\,\mathbf j`, { line: false });
    k.label("LP", [0, -2, 0], tx`P(1,-2)=\dfrac{4(1)}{-2}`, { c: "s1", dy: 40 });
    k.label("LQ", [-1, -1.7, 0], tx`Q(1,-2)=\dfrac{-5+8}{1+4}`, { c: "s2", dx: -100 });
    k.label("Ans", [0, -1.7, 0], tx`\mathbf F(1,-2)=\left\langle-2,\tfrac35\right\rangle`, { c: "glow", dx: 20, dy: -70 });
  },
  steps: [
    { cap: tx`Every point in the plane gets its own arrow. To find the one at \((1,-2)\), compute \(P\) and \(Q\) there.`, add: "grid axes pt Lpt LF" },
    { cap: tx`\(P\) is the arrow's sideways part. \(P(1,-2)=\tfrac{4(1)}{-2}\) is negative, so this part points left.`, add: "Px LP" },
    { cap: tx`\(Q\) is the up-down part. Watch the signs: \(-4(-2)=+8\), so the top is \(-5+8\) and \(Q\) is positive. This part points up.`, add: "Qy LQ" },
    { cap: tx`\(\mathbf F(1,-2)=\left\langle-2,\tfrac35\right\rangle\). Its tail sits on the point, and it points left and a little up.`, drop: "LP LQ", add: "Fa Ans" }
  ]
};

S["ex29-2"] = (() => {
  const six = [[2, 0], [0, 2], [-2, 0], [0, -2], [2, 2], [-2, -2]], vec = ["1,0", "0,1", "-1,0", "0,-1", "1,1", "-1,-1"];
  const off = [[34, 22], [-30, -18], [-34, -22], [34, 18], [30, 26], [-34, 22]];
  return {
    cam: { ...TOP, d: 6, at: [0, -.1, 0] },
    P: { g: 0, f: 0 },
    build(k) {
      k.scale(.33, .33, .33, [0, 0, 0]);
      k.grid("grid", [-3, 3, 1], [-3, 3, 1], 0, { o: .22 });
      k.axes("axes", [-3.6, 3.7], [-3.6, 3.7], null);
      const D = [], LP = [], LV = [];
      six.forEach((p, i) => {
        k.dot("d" + i, { c: "cursor", r: .05, p: [p[0], p[1], 0] }); D.push("d" + i);
        k.label("Lp" + i, [p[0], p[1], 0], `(${p[0]},${p[1]})`, { c: "cursor", sm: true, dx: off[i][0], dy: off[i][1], line: false }); LP.push("Lp" + i);
        k.label("Lv" + i, [p[0], p[1], 0], `\\langle ${vec[i]}\\rangle`, { c: "glow", dx: off[i][0], dy: off[i][1] + (off[i][1] > 0 ? 22 : -22), line: false }); LV.push("Lv" + i);
      });
      k.alias("dots", D.join(" ")); k.alias("Lps", LP.join(" ")); k.alias("Lvs", LV.join(" "));
      k.six = arrows(k, "six", six.map(p => [p[0], p[1], .03]), () => [0, 0, 0], { c: "glow", r: .017 });
      k.fld = floorField(k, "fld", (x, y) => [x / 2, y / 2], [-3, 3, 1], [-3, 3, 1], { scale: .5, c: "s1", r: .012, z: .01, o: .8, skip: (x, y) => six.some(p => abs(p[0] - x) < .01 && abs(p[1] - y) < .01) });
      k.tubes("rays", rng(0, TAU, 16).slice(0, 16).map(a => [[0, 0, .004], [4 * cos(a), 4 * sin(a), .004]]), { c: "muted", r: .005, o: .45 });
      k.tubes("rings", [1, 2, 3].map(R => ringPts([0, 0], R, .004)), { c: "muted", r: .005, o: .45 });
      k.label("Ans", [0, 3.4, 0], tx`\text{away from the origin, length }\tfrac12\sqrt{x^2+y^2}`, { c: "glow", dy: -26, line: false });
    },
    update(P, k) {
      if (k.lg !== P.g) { k.lg = P.g; k.six.set(p => [p[0] / 2 * P.g, p[1] / 2 * P.g, 0]); }
      if (k.lf !== P.f) { k.lf = P.f; k.fld.set(p => k.fld.fit(p, P.f)); }
    },
    steps: [
      { cap: tx`Start with points where the arithmetic is easy, on the axes and the diagonal.`, add: "grid axes dots Lps" },
      { cap: tx`Halve each coordinate to get the vector at that point. At \((2,2)\), that's \(\langle1,1\rangle\).`, add: "Lvs" },
      { cap: tx`Put each arrow's tail on its own point. The arrow for \((2,0)\) runs from \((2,0)\) to \((3,0)\).`, drop: "Lps", add: "six", from: { g: 0 }, set: { g: 1 }, dur: 1.8 },
      { cap: tx`Fill in the rest the same way. Compare each arrow's direction with the line from the origin, and watch the lengths as you move out.`, drop: "Lvs", add: "fld", from: { f: 0 }, set: { f: 1 }, dur: 2.2 },
      { cap: tx`Every arrow points straight away from the origin, and its length is half the point's distance from the origin.`, add: "rays rings Ans" }
    ]
  };
})();

S["ex29-3"] = (() => {
  const X = [-3.2, 0, 3.2], h = 1.1, sp = .55;
  const tile = (k, n, cx, F, o = {}) => {
    floorField(k, n, (x, y) => F(x - cx, y), [cx - h, cx + h, sp], [-h, h, sp], { c: "s1", r: .012, pow: o.pow ?? 1, len: .85 });
    k.tube(n + "f", sqr(cx, 0, h + .22), { c: "muted", r: .006, o: .6 });
    k.alias(n + "s", `${n} ${n}f`);
  };
  return {
    cam: { ...TOP, p: 1.12, d: 4.7, at: [0, -.15, 0] },
    P: {},
    build(k) {
      k.scale(.36, .36, .36, [0, 0, 0]);
      tile(k, "tR", X[0], (x, y) => [x, y]);
      tile(k, "tT", X[2], (x, y) => [y, -x]);
      tile(k, "fa", X[0], (x, y) => [2 * y, -2 * x]);
      tile(k, "fb", X[1], (x, y) => [2 * x * y, -5 * x], { pow: .7 });
      tile(k, "fc", X[2], (x, y) => [5 * x, 5 * y]);
      const B = [0, -h - .22, 0], at = cx => [cx, B[1], 0];
      k.label("LtR", at(X[0]), tx`\text{radial: }ax\,\mathbf i+ay\,\mathbf j`, { dy: 24, line: false });
      k.label("LtT", at(X[2]), tx`\text{rotational: }ay\,\mathbf i-ax\,\mathbf j`, { dy: 24, line: false });
      k.label("La", at(X[0]), tx`(a)\ 2y\,\mathbf i-2x\,\mathbf j`, { dy: 24, line: false });
      k.label("Lb", at(X[1]), tx`(b)\ 2xy\,\mathbf i-5x\,\mathbf j`, { dy: 24, line: false });
      k.label("Lc", at(X[2]), tx`(c)\ 5x\,\mathbf i+5y\,\mathbf j`, { dy: 24, line: false });
      const T = cx => [cx, h + .22, 0];
      k.label("Aa", T(X[0]), tx`\text{rotational, }a=2\text{, clockwise}`, { c: "glow", dy: -22, line: false });
      k.label("Ab", T(X[1]), tx`\text{neither}`, { c: "glow", dy: -22, line: false });
      k.label("Ac", T(X[2]), tx`\text{radial, }a=5`, { c: "glow", dy: -22, line: false });
      const arc = rng(PI * .85, PI * .2, 30).map(a => [X[0] + 1.02 * cos(a), 1.02 * sin(a), .03]);
      k.tube("cw", arc, { c: "glow", r: .02 });
      const e = arc[arc.length - 1], a1 = PI * .2 - .14;
      k.arrow("cwh", { c: "glow", r: .02 }).set(arc[arc.length - 4], [X[0] + 1.02 * cos(a1), 1.02 * sin(a1), .03]);
      k.tubes("rays", rng(0, TAU, 8).slice(0, 8).map(a => [[X[2] + .2 * cos(a), .2 * sin(a), .02], [X[2] + 1.25 * cos(a), 1.25 * sin(a), .02]]), { c: "glow", r: .008, o: .55 });
    },
    steps: [
      { cap: tx`Two patterns to match. Radial has \(x\) with \(\mathbf i\) and \(y\) with \(\mathbf j\), with one number \(a\). Rotational swaps the letters and puts a minus on the \(\mathbf j\) term.`, add: "tRs tTs LtR LtT" },
      { cap: tx`(a) \(P=2y\) and \(Q=-2x\). Line it up with both templates and look for one number \(a\) that fits.`, drop: "tRs tTs LtR LtT", add: "fas La" },
      { cap: tx`(b) \(P=2xy\) is a product of letters, and neither template has one. The numbers 2 and 5 also differ.`, add: "fbs Lb" },
      { cap: tx`(c) \(P=5x\) and \(Q=5y\). Compare with the templates the same way.`, add: "fcs Lc" },
      { cap: tx`(a) rotational with \(a=2\), turning clockwise. (b) neither. (c) radial with \(a=5\), pointing outward.`, add: "Aa Ab Ac cw cwh rays" }
    ]
  };
})();

S["ex29-4"] = (() => {
  const X = [-1.75, 1.75], s = .2, ta = [[1, 0], [0, 1]];
  const Fa = (x, y) => [y, -4 * x], Fb = (x, y) => { const r = hypot(x, y); return [y / r, -x / r]; };
  return {
    cam: { ...TOP, p: 1.12, d: 4.2, at: [0, -.1, 0] },
    P: {},
    build(k) {
      k.scale(.4, .4, .4, [0, 0, 0]);
      const at = (cx, p) => [cx + p[0], p[1], .02];
      const fld = (n, cx, F, skip) => {
        floorField(k, n, (x, y) => F(x - cx, y), [cx - 1, cx + 1, .5], [-1, 1, .5], { scale: s, c: "s1", r: .012, skip: (x, y) => skip(x - cx, y) });
        k.tube(n + "f", sqr(cx, 0, 1.35), { c: "muted", r: .006, o: .6 });
      };
      fld("fa", X[0], Fa, (x, y) => ta.some(p => abs(p[0] - x) < .01 && abs(p[1] - y) < .01));
      fld("fb", X[1], Fb, (x, y) => hypot(x, y) < .01);
      k.alias("fas", "fa faf"); k.alias("fbs", "fb fbf");
      ta.forEach((p, i) => {
        const v = Fa(...p), A = at(X[0], p);
        k.arrow("ta" + i, { c: "glow", r: .02 }).set(A, [A[0] + v[0] * s, A[1] + v[1] * s, .02]);
        k.tube("ra" + i, ringPts(A, s, .02), { c: "cursor", r: .006 });
        k.dot("da" + i, { c: "cursor", r: .03, p: A });
      });
      k.alias("testA", "ta0 ta1 ra0 ra1 da0 da1");
      [[1, 0], [0, 1], [-1, -1]].forEach((p, i) => k.tube("rb" + i, ringPts(at(X[1], p), s, .02), { c: "cursor", r: .006 }));
      k.alias("ringsB", "rb0 rb1 rb2");
      k.tube("hole", ringPts([X[1], 0], .07, .02, 24), { c: "bad", r: .01 });
      k.arrow("leg", { c: "glow", r: .02 }).set([-.12, 1.1, .02], [.08, 1.1, .02]);
      k.tube("legr", ringPts([-.12, 1.1], s, .02), { c: "cursor", r: .006 });
      k.label("Lleg", [-.12, 1.1, 0], tx`\text{length }1`, { c: "cursor", dy: -30, line: false });
      k.label("La", [X[0], -1.35, 0], tx`(a)\ y\,\mathbf i-4x\,\mathbf j`, { dy: 24, line: false });
      k.label("Lb", [X[1], -1.35, 0], tx`(b)\ \tfrac{y}{\sqrt{x^2+y^2}}\,\mathbf i-\tfrac{x}{\sqrt{x^2+y^2}}\,\mathbf j`, { dy: 26, line: false });
      k.label("La0", at(X[0], [1, -.4]), tx`\sqrt{16}`, { c: "glow", dx: 30, line: false });
      k.label("La1", at(X[0], [0, 1]), tx`\sqrt{1}`, { c: "glow", dx: -40, dy: 0, line: false });
      k.label("Lhole", [X[1], 0, 0], tx`\text{undefined}`, { c: "bad", sm: true, dy: 18, line: false });
      k.label("Aa", [X[0], 1.35, 0], tx`\text{(a) not unit}`, { c: "glow", dy: -24, line: false });
      k.label("Ab", [X[1], 1.35, 0], tx`\text{(b) unit, except at the origin}`, { c: "glow", dy: -24, line: false });
    },
    steps: [
      { cap: tx`A unit field has every arrow exactly 1 long. Arrows here are drawn at one fifth of true length, and the ring shows length 1 at that scale.`, add: "faf fbf La Lb leg legr Lleg" },
      { cap: tx`(a) \(\|\mathbf F\|=\sqrt{y^2+16x^2}\). At \((1,0)\) that's \(\sqrt{16}\), and at \((0,1)\) it's \(\sqrt1\). Compare each arrow with its ring.`, drop: "leg legr Lleg", add: "fa testA La0 La1" },
      { cap: tx`(b) The squared length has \(x^2+y^2\) on top and bottom. The formula divides by zero at the origin, marked with an open circle.`, add: "fb ringsB hole Lhole" },
      { cap: tx`(a) No. Its length is 4 at \((1,0)\) but 1 at \((0,1)\). (b) Yes. Every arrow has length 1, and the origin isn't in its domain.`, add: "Aa Ab" }
    ]
  };
})();

S["ex29-5"] = (() => {
  const W = 1.15, Z0 = -.85;
  const fa = (u, v) => 5 * u ** 4 * v ** 3 + u * v ** 4, fb = (u, v) => 3 * cos(u) * sin(v);
  const A = (u, v) => [W * u, W * v, fa(u, v) / 6 * .8], B = (u, v) => [W * u / PI, W * v / PI, fb(u, v) / 3 * .62];
  const sl = [   // surface, fixed value, direction (0 = walk in x), walk range
    { F: A, fix: .75, dir: 0, r: [-1, 1] }, { F: A, fix: .7, dir: 1, r: [-1, 1] },
    { F: B, fix: 1.2, dir: 0, r: [-PI, PI] }, { F: B, fix: -.7, dir: 1, r: [-PI, PI] }];
  const pt = (s, w) => s.dir ? s.F(s.fix, w) : s.F(w, s.fix);
  return {
    cam: { y: -1.05, p: .5, d: 6.6, at: [0, 0, -.1] },
    P: { w0: .4, w1: .3, w2: .8, w3: .9 },
    build(k) {
      k.scale(1, 1, 1, [0, 0, 0]);
      k.surf("sa", A, [-1, 1, 40], [-1, 1, 40], { ramp: [-.8, .8], o: .9 });
      k.surf("sb", B, [-PI, PI, 48], [-PI, PI, 48], { ramp: [-.62, .62], o: .9 });
      k.surf("sbg", B, [-PI, PI, 48], [-PI, PI, 48], { ramp: [-.62, .62], o: .25 });
      k.grid("gr", [-W, W, W / 5], [-W, W, W / 5], Z0, { o: .25 });
      sl.forEach((s, i) => {
        k.tube("sl" + i, rng(s.r[0], s.r[1], 80).map(w => pt(s, w)), { c: "glow", r: .014 });
        k.dot("d" + i, { c: "cursor", r: .04 }); k.arrow("t" + i, { c: "cursor", r: .018 });
        k.label("L" + i, () => pt(s, k.P["w" + i]), i % 2 ? tx`\text{slope}=f_y` : tx`\text{slope}=f_x`, { c: "cursor", dx: 60, dy: -40 });
        k.alias("S" + i, `sl${i} d${i} t${i} L${i}`);
      });
      const g = (x, y) => { const u = x * PI / W, v = y * PI / W; return [-3 * sin(u) * sin(v), 3 * cos(u) * cos(v)]; };
      floorField(k, "gb", g, [-W, W, W / 5], [-W, W, W / 5], { z: Z0 + .01, c: "s1", r: .009, pow: .6 });
      k.label("La", [-W, -W, Z0], tx`(a)\ f=5x^4y^3+xy^4`, { dx: -80, line: false });
      k.label("Lb", [-W, -W, Z0], tx`(b)\ f=3\cos x\sin y`, { dx: -80, line: false });
      k.label("Ab", [.66, -W, Z0], tx`(b)\ \nabla f=\langle-3\sin x\sin y,\ 3\cos x\cos y\rangle`, { c: "glow", dy: 30, line: false });
    },
    update(P, k) {
      sl.forEach((s, i) => {
        const w = P["w" + i], p = pt(s, w), e = 1e-3, q = pt(s, w + e), d = q.map((c, j) => c - p[j]), L = hypot(...d);
        k.o["d" + i].at(p); aset(k.o["t" + i], p, p.map((c, j) => c + d[j] / L * .42));
      });
    },
    steps: [
      { cap: tx`(a) Freeze \(y\) and walk in the \(x\) direction along the highlighted slice. Its slope is \(f_x\). Each term keeps its \(y\) factor as a constant multiplier.`, add: "sa La S0", from: { w0: -.85 }, set: { w0: .55 }, dur: 2.4 },
      { cap: tx`Now freeze \(x\) and walk in the \(y\) direction. The slope of this slice is \(f_y\), and the \(x\) factors are the constants.`, drop: "S0", add: "S1", from: { w1: -.85 }, set: { w1: .45 }, dur: 2.4 },
      { cap: tx`(b) Freeze \(y\), so \(3\sin y\) is a constant multiplier. The slope along \(x\) comes from \(\cos x\), whose derivative is \(-\sin x\).`, drop: "sa La S1", add: "sb Lb S2", from: { w2: -2.6 }, set: { w2: .8 }, dur: 2.6 },
      { cap: tx`Freeze \(x\). Now \(3\cos x\) is the constant, and \(\sin y\) has derivative \(\cos y\). The two slopes together make \(\langle f_x,f_y\rangle\).`, drop: "S2", add: "S3", from: { w3: -2.6 }, set: { w3: .9 }, dur: 2.6 },
      { cap: tx`(a) \(\nabla f=\langle20x^3y^3+y^4,\,15x^4y^2+4xy^3\rangle\). (b) \(\nabla f=\langle-3\sin x\sin y,\,3\cos x\cos y\rangle\). The arrows under (b) point uphill.`, drop: "S3 Lb sb", add: "sbg gr gb Ab", cam: { p: .75 } }
    ]
  };
})();

S["ex29-6"] = (() => {
  const F = (x, y, z) => [2 * x * y * z - y * cos(x * y), x * x * z - x * cos(x * y), x * x * y], s = .2, pts = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) pts.push([x, y, z]);
  return {
    cam: { y: -.95, p: .4, d: 5.6, at: [0, 0, 0] },
    P: { cx: 0, cy: 0, cz: 0 },
    build(k) {
      k.scale(.6, .6, .6, [0, 0, 0]);
      boxEdges(k, "box", [-1, -1, -1], [1, 1, 1], { o: .35 });
      k.axes("axes", [-1.5, 1.6], [-1.5, 1.6], [-1.5, 1.6]);
      cloud(k, "pts", pts, { c: "ink", size: 5, o: .7 });
      arrows(k, "Fv", pts, p => F(...p).map(c => c * s), { c: "accent", r: .016, o: .4 });
      k.G = arrows(k, "Gv", pts, () => [0, 0, 0], { c: "glow", r: .009 });
      k.label("LF", [1, -1, 1], tx`\mathbf F\ \text{(wide arrows)}`, { c: "accent", dx: 70, dy: -20 });
      k.label("Lfx", [0, 0, 1.4], tx`f_x=2xyz-y\cos(xy)`, { c: "glow", dy: -30, line: false });
      k.label("Lfy", [0, 0, 1.4], tx`f_y=x^2z-x\cos(xy)`, { c: "glow", dy: -30, line: false });
      k.label("Lfz", [0, 0, 1.4], tx`f_z=x^2y`, { c: "glow", dy: -30, line: false });
      k.label("Ans", [0, 0, 1.4], tx`\nabla f=\mathbf F`, { c: "glow", dy: -30, line: false });
    },
    update(P, k) {
      const key = P.cx + "," + P.cy + "," + P.cz; if (k.lk === key) return; k.lk = key;
      k.G.set(p => { const f = F(...p); return [f[0] * P.cx * s, f[1] * P.cy * s, f[2] * P.cz * s]; });
    },
    steps: [
      { cap: tx`\(f\) is a potential for \(\mathbf F\) when \(\nabla f=\mathbf F\) at every point. The wide arrows are \(\mathbf F\) on a grid. Build \(\nabla f\) one part at a time.`, add: "box axes pts Fv LF" },
      { cap: tx`\(f_x=2xyz-y\cos(xy)\). The thin arrows show only this \(x\) part at each point. Compare it with \(P\).`, add: "Gv Lfx", from: { cx: 0 }, set: { cx: 1 }, dur: 1.6 },
      { cap: tx`Add \(f_y=x^2z-x\cos(xy)\) as the \(y\) part. Compare it with \(Q\).`, drop: "Lfx", add: "Lfy", from: { cy: 0 }, set: { cy: 1 }, dur: 1.6 },
      { cap: tx`Add \(f_z=x^2y\) as the \(z\) part. Compare it with \(R\).`, drop: "Lfy", add: "Lfz", from: { cz: 0 }, set: { cz: 1 }, dur: 1.6 },
      { cap: tx`Yes. All three parts match, so the thin arrows run right along \(\mathbf F\). \(f\) is a potential function and \(\mathbf F\) is conservative.`, drop: "Lfz", add: "Ans" }
    ]
  };
})();

S["ex29-7"] = (() => {
  const X = [-1.9, 1.9], h = 1.2, wp = [-.85, -.3, .3, .85];
  const Fa = (x, y) => [3 * x ** 4 * y ** 5, 3 * x ** 5 * y ** 4], Fb = (x, y) => [x ** 3 * cos(y), 3 * y * cos(x)];
  const curl = [() => 0, (x, y) => -3 * y * sin(x) + x ** 3 * sin(y)];
  return {
    cam: { y: -PI / 2, p: .95, d: 4.6, at: [0, -.15, 0] },
    P: { t: 0 },
    build(k) {
      k.scale(.4, .4, .4, [0, 0, 0]);
      [Fa, Fb].forEach((F, i) => {
        const cx = X[i], n = "ab"[i];
        floorField(k, "f" + n, (x, y) => F(x - cx, y), [cx - h, cx + h, .4], [-h, h, .4], { c: "s1", r: .011, pow: .45, len: .8 });
        k.tube("fr" + n, sqr(cx, 0, h + .2), { c: "muted", r: .006, o: .6 });
        const W = [];
        wp.forEach((x, a) => wp.forEach((y, b) => { const nm = `w${n}${a}${b}`; paddle(k, nm, [cx + x, y, 0], .07, { c: "cursor" }); W.push(nm); }));
        k.alias("W" + n, W.join(" "));
      });
      k.wheels = ["a", "b"].map((n, i) => wp.flatMap((x, a) => wp.map((y, b) => [k.o[`w${n}${a}${b}`], curl[i](x, y)])));
      k.label("LFa", [X[0], -h - .2, 0], tx`(a)\ \langle3x^4y^5,\ 3x^5y^4\rangle`, { dy: 24, line: false });
      k.label("LFb", [X[1], -h - .2, 0], tx`(b)\ \langle x^3\cos y,\ 3y\cos x\rangle`, { dy: 24, line: false });
      k.label("LPa", [X[0], h + .2, 0], tx`P_y=Q_x=15x^4y^4`, { c: "cursor", dy: -22, line: false });
      k.label("LPb", [X[1], h + .2, 0], tx`P_y\ne Q_x`, { c: "cursor", dy: -22, line: false });
      k.surf("pot", (u, v) => [X[0] + u, v, .6 * u ** 5 * v ** 5 * .3], [-h, h, 36], [-h, h, 36], { ramp: [-1.1, 1.1], o: .45 });
      k.label("Aa", [X[0], h + .2, 0], tx`\text{could be: }f=\tfrac35x^5y^5`, { c: "glow", dy: -52, line: false });
      k.label("Ab", [X[1], h + .2, 0], tx`\text{not conservative}`, { c: "glow", dy: -52, line: false });
    },
    update(P, k) { for (const list of k.wheels) for (const [q, c] of list) q.spin(c / 2 * P.t); },
    steps: [
      { cap: tx`\(P_y\) tracks how the sideways push changes as you move up. \(Q_x\) tracks how the up-down push changes as you move right. If they differ, the flow twists and paddle wheels spin.`, add: "fa fb fra frb Wa Wb LFa LFb" },
      { cap: tx`(a) \(P_y=15x^4y^4\) and \(Q_x=15x^4y^4\). Run the flow. The wheels on the left feel no twist.`, add: "LPa", from: { t: 0 }, set: { t: 6 }, dur: 3.5 },
      { cap: tx`(b) \(P_y=-x^3\sin y\) but \(Q_x=-3y\sin x\). Run the flow again and watch the wheels on the right.`, add: "LPb", from: { t: 0 }, set: { t: 6 }, dur: 3.5 },
      { cap: tx`Equal cross partials allow a conservative field. Unequal ones rule it out, because a conservative field never sets the wheels turning.`, from: { t: 0 }, set: { t: 6 }, dur: 3.5 },
      { cap: tx`(a) could be conservative, and it is. \(f=\tfrac35x^5y^5\) has gradient \(\langle3x^4y^5,3x^5y^4\rangle\). (b) is not conservative.`, drop: "LPa LPb", add: "pot Aa Ab", cam: { p: .7 } }
    ]
  };
})();
