/* ---------- Lesson 26 scenes ---------- */
S["ex26-1"] = {
  cam: { y: -.95, p: .42, d: 6.3, at: [3.2, 2.7, .1] },
  P: { x: 5, g: 4, c: 1, y: 2.5, z: .55 },
  build(k) {
    k.scale(.44, .44, .85, [3, 3, .45]);
    k.axes("axes", [0, 5.9], [0, 4.8], [0, 1.6]);
    k.block("ghost", { c: "accent", o: .14 }).set([1, 2, 0], [5, 4, 1]);
    const c = [[1, 2], [5, 2], [5, 4], [1, 4]], loop = z => [0, 1, 2, 3, 0].map(i => [c[i][0], c[i][1], z]);
    k.tubes("edge", [loop(0), loop(1), ...c.map(p => [[p[0], p[1], 0], [p[0], p[1], 1]])], { c: "ink", r: .006, o: .55 });
    k.block("stick", { c: "glow" }); k.block("sheet", { c: "s2", o: .9 }); k.block("fill", { c: "accent", o: .85 });
    k.label("Lx", [3, 2, 0], tx`1\le x\le5`, { c: "ink", dx: 16, dy: 32 });
    k.label("Ly", [5, 3, 0], tx`2\le y\le4`, { c: "ink", dx: 56, dy: 18 });
    k.label("Lz", [5, 2, .5], tx`0\le z\le1`, { c: "ink", dx: 56, dy: -8 });
    k.label("Ls", () => [k.P.x, k.P.y, k.P.z + .1], tx`12+4yz^2`, { c: "glow", dx: 40, dy: -36 });
    k.label("Lq", [3, 3.4, .62], tx`24+24z^2`, { c: "cursor", dx: 46, dy: -40 });
    k.label("Ans", [3, 3, 1], tx`32`, { c: "glow", dx: 0, dy: -62, line: false });
  },
  update(P, k) {
    k.o.stick.set([1, P.y, P.z], [P.x, P.y + .14, P.z + .09]);
    k.o.sheet.set([1, 2, P.z], [5, P.g, P.z + .09]);
    k.o.fill.set([1, 2, 0], [5, 4, P.c]);
  },
  steps: [
    { cap: tx`The order \(dx\,dy\,dz\) means \(x\) comes first, then \(y\), then \(z\). The limits outline a box.`, add: "axes ghost edge Lx Ly Lz" },
    { cap: tx`Line tiny cubes up along \(x\) into a stick. \(y\) and \(z\) stay frozen. The stick totals \(12+4yz^2\).`, drop: "Lx Ly Lz", add: "stick Ls", from: { x: 1.02 }, set: { x: 5 }, dur: 2.4 },
    { cap: tx`Lay sticks side by side along \(y\) to make a sheet. Only \(z\) is still frozen, and the sheet totals \(24+24z^2\).`, drop: "stick Ls", add: "sheet Lq", from: { g: 2.02 }, set: { g: 4 }, dur: 2.4 },
    { cap: tx`Stack sheets along \(z\) to build the block. That's the last integral, and only numbers remain.`, drop: "sheet Lq", add: "fill", from: { c: .01 }, set: { c: 1 }, dur: 2.8 },
    { cap: tx`\(24+8=32\).`, add: "Ans" }
  ]
};

S["ex26-2"] = (() => {
  const L = Math.log(3);
  return {
    cam: { y: -.72, p: .3, d: 7.3, at: [.55, 1.4, -1.72] },
    P: {},
    build(k) {
      k.scale(.92, .92, .78, [.55, 1.4, -1.5]);
      k.axes("axes", [0, 2.3], [0, 2.7], [-3.4, .25]);
      k.block("box", { c: "accent", o: .5 }).set([0, 1, -3], [L, 2, -2]);
      const c = [[0, 1], [L, 1], [L, 2], [0, 2]], loop = z => [0, 1, 2, 3, 0].map(i => [c[i][0], c[i][1], z]);
      k.tubes("edge", [loop(-2), loop(-3), ...c.map(p => [[p[0], p[1], -3], [p[0], p[1], -2]])], { c: "ink", r: .006, o: .55 });
      k.surf("fx", (x, v) => [x, 1, -2 + v * exp(2 * x) * .09], [0, L, 30], [0, 1, 1], { c: "s1", o: .85 });
      k.surf("fy", (y, v) => [L, y, -2 + v * y * y * .2], [1, 2, 24], [0, 1, 1], { c: "s2", o: .85 });
      k.surf("fz", (z, v) => [L + v * (-z * z * z) * .027, 1, z], [-3, -2, 24], [0, 1, 1], { c: "bad", o: .8 });
      k.tube("ex", [[0, 1, -2], [L, 1, -2]], { c: "s1", r: .016 });
      k.tube("ey", [[L, 1, -2], [L, 2, -2]], { c: "s2", r: .016 });
      k.tube("ez", [[L, 1, -3], [L, 1, -2]], { c: "bad", r: .016 });
      k.label("Lb", [L / 2, 1.5, -3], tx`\text{all limits are numbers}`, { c: "ink", dx: 16, dy: 44 });
      k.label("Lfl", [.2, 2.4, 0], tx`z=0\ \text{is way up here}`, { c: "muted", dx: 40, dy: -18 });
      k.label("Lx", [L * .8, 1, -1.82], tx`\int e^{2x}dx=4`, { c: "s1", dx: -96, dy: -56 });
      k.label("Ly", [L, 1.7, -1.75], tx`\int y^2dy=7/3`, { c: "s2", dx: 70, dy: -44 });
      k.label("Lz", [L + .4, 1, -2.7], tx`\int z^3dz=-65/4`, { c: "bad", dx: 72, dy: 22 });
      k.label("Ans", [L / 2, 1.5, -2.5], tx`-455/3\approx-151.67`, { c: "glow", dx: 0, dy: -8, line: false });
    },
    steps: [
      { cap: tx`The integrand is a function of \(x\), times one of \(y\), times one of \(z\), and every limit is a number. So the box's three directions don't interact, and the integral splits.`, add: "axes box edge Lb Lfl" },
      { cap: tx`The curve on this edge is \(e^{2x}\). Its area over \([0,\ln3]\) is the \(x\) factor: \(\tfrac12(9-1)=4\).`, drop: "Lb Lfl", add: "fx ex Lx" },
      { cap: tx`Along \(y\), the curve is \(y^2\). Its area over \([1,2]\) is the \(y\) factor, \(\tfrac73\).`, add: "fy ey Ly" },
      { cap: tx`Along \(z\), the curve is \(z^3\), which is negative on \([-3,-2]\). That's the red fin, pointing the opposite way. The factor is \(-\tfrac{65}{4}\).`, add: "fz ez Lz" },
      { cap: tx`The three factors multiply: \(4\cdot\tfrac73\cdot\left(-\tfrac{65}{4}\right)\). The 4's cancel.`, cam: { y: -.72, p: .42, d: 7.3 } },
      { cap: tx`\(-\dfrac{455}{3}\approx-151.67\).`, drop: "Lx Ly Lz", add: "Ans" }
    ]
  };
})();

S["ex26-3"] = {
  cam: { y: -.5, p: .45, d: 5.5, at: [.33, .33, .3] },
  P: { x: .3, y: .25, m: 1, c: 1 },
  build(k) {
    k.scale(1.4, 1.4, 1.4, [.33, .33, .3]);
    const cut = k.cut("x"); k.cutX = cut;
    k.axes("axes", [0, 1.2], [0, 1.2], [0, 1.2]);
    tetra(k, [cut.pl]);
    k.poly("ghostS", [[1, 0, 0], [0, 1, 0], [0, 0, 1]], { c: "s2", o: .18 });
    k.seg("stick", { c: "glow", r: .018 }); k.seg("line", { c: "cursor", r: .014 });
    k.dot("p0", { c: "ink", r: .03 }); k.dot("p1", { c: "glow", r: .03 });
    k.poly("sh", [[0, 0, 0], [1, 0, 0], [0, 1, 0]], { c: "accent", o: .5, po: true });
    k.poly("sheet", [[0, 0, 0], [0, 1, 0], [0, 0, 1]], { c: "glow", o: .85 });
    const X = () => k.P.x, Y = () => k.P.y;
    k.label("Lb", () => [X(), Y(), 0], tx`z=0`, { c: "ink", dx: 32, dy: 20 });
    k.label("Lt", () => [X(), Y(), 1 - X() - Y()], tx`z=1-x-y`, { c: "glow", dx: 62, dy: -22 });
    k.label("L0", () => [X(), 0, 0], tx`y=0`, { c: "cursor", dx: -8, dy: 26 });
    k.label("L1", () => [X(), 1 - X(), 0], tx`y=1-x`, { c: "cursor", dx: 48, dy: 12 });
    k.label("Lx", [.75, 0, 0], tx`0\le x\le1`, { c: "ink", dx: 28, dy: 28 });
    k.label("Lst", () => [X(), Y(), (1 - X() - Y()) * .6], tx`(5x-3y)(1-x-y)`, { c: "glow", dx: 92, dy: -36 });
    k.label("Lsh", () => [X(), (1 - X()) * .3, (1 - X()) * .3], tx`(1-x)^2(6x-1)/2`, { c: "glow", dx: 92, dy: -44 });
    k.label("Ans", [.3, .25, .3], tx`1/12`, { c: "glow", dx: 0, dy: -66, line: false });
  },
  update(P, k) {
    const x = P.x, y = P.y, top = 1 - x - y;
    k.o.stick.set([x, y, .002], [x, y, top]); k.o.p0.at([x, y, 0]); k.o.p1.at([x, y, top]);
    k.o.line.set([x, 0, .004], [x, 1 - x, .004]);
    k.o.sheet.set([[x, 0, 0], [x, 1 - x, 0], [x, 0, 1 - x]]);
    k.cutX.set(P.c + .002);
  },
  steps: [
    { cap: tx`Push a vertical stick up through the solid. It enters through the floor at \(z=0\) and leaves through the slanted face at \(z=1-x-y\).`, add: "axes tet te stick p0 p1 Lb Lt", from: { y: .02 }, set: { y: .25 }, dur: 1.9 },
    { cap: tx`Flatten the solid to its shadow on the floor. Setting \(z=0\) in the plane gives the edge \(x+y=1\), so a line across the shadow runs from \(y=0\) to \(y=1-x\).`, drop: "tet stick p0 p1 Lb Lt", add: "sh line L0 L1", cam: { y: -.7, p: .95, d: 6.2 }, dur: 1.4 },
    { cap: tx`The line sweeps from \(x=0\) to \(x=1\), and those are the outer limits.`, drop: "L0 L1", add: "Lx", from: { x: .004 }, set: { x: .3 }, dur: 2 },
    { cap: tx`\(f\) has no \(z\) in it, so each stick contributes \(f\) times its own length: \((5x-3y)(1-x-y)\).`, drop: "sh line Lx", add: "tet stick p0 p1 Lst", cam: { y: -.5, p: .45, d: 5.5 }, dur: 1.2 },
    { cap: tx`Stand a triangular sheet at this \(x\). Adding its sticks along \(y\) gives one expression in \(x\). It's negative when \(x\) is small, because of the \(-3y\) term.`, drop: "tet stick p0 p1 Lst", add: "sheet Lsh ghostS", set: { x: .3 } },
    { cap: tx`Slide the sheet from \(x=0\) to \(x=1\) and the solid fills up. Substituting \(u=1-x\) turns this into a plain polynomial integral.`, drop: "Lsh", add: "tet", from: { x: .002, c: .002 }, set: { x: .998, c: 1 }, dur: 4.5 },
    { cap: tx`\(\tfrac12\left(\tfrac53-\tfrac32\right)=\dfrac{1}{12}\).`, drop: "sheet ghostS", add: "Ans", set: { x: .3 } }
  ]
};

S["ex26-4"] = {
  cam: { y: -.95, p: .42, d: 6.4, at: [1.5, 1, 22] },
  P: { s: 3, c: 3, px: 2.2, py: 1.1 },
  build(k) {
    k.scale(.45, .45, .03, [1.5, 1, 22]);
    k.axes("axes", [0, 3.7], [0, 2.8], [0, 62]);
    const f = (x, y) => 4 * x * x + 4 * y * y + 4;
    k.f = f; k.rs = rectSolid(k, f, [0, 3], [0, 2], [0, 56]);
    k.seg("stick", { c: "glow", r: .022 });
    k.dot("p0", { c: "ink", r: .03 }); k.dot("p1", { c: "glow", r: .03 });
    k.label("Lz", [2.6, 1.6, f(2.6, 1.6)], tx`z=4x^2+4y^2+4`, { c: "cursor", dx: -30, dy: -30 });
    k.label("Lr", [1.5, 1, 0], tx`[0,3]\times[0,2]`, { c: "accent", dx: 40, dy: 34 });
    k.label("Ls", () => [k.P.px, k.P.py, f(k.P.px, k.P.py) * .55], tx`\text{length }4x^2+4y^2+4`, { c: "glow", dx: 94, dy: -20 });
    k.label("Lw", () => [k.P.s, 1, f(k.P.s, 1)], tx`8x^2+56/3`, { c: "glow", dx: 54, dy: -30 });
    k.label("Ans", [1.5, 1, 36], tx`128`, { c: "glow", dx: 0, dy: -80, line: false });
  },
  update(P, k) {
    k.rs.cut.set(P.c + .002); k.rs.slice(P.s);
    const z = k.f(P.px, P.py);
    k.o.stick.set([P.px, P.py, 0], [P.px, P.py, z]); k.o.p0.at([P.px, P.py, 0]); k.o.p1.at([P.px, P.py, z]);
  },
  steps: [
    { cap: tx`\(f=1\) measures volume. Sticks run from the floor to the paraboloid, and the shadow is the rectangle \([0,3]\times[0,2]\).`, add: "axes R Re ghost Lz Lr" },
    { cap: tx`With \(f=1\), the \(z\) integral is just the stick's length: top minus bottom. Move the stick and watch it change with both \(x\) and \(y\).`, drop: "Lr", add: "stick p0 p1 Ls", from: { px: .5, py: .4 }, set: { px: 2.2, py: 1.1 }, dur: 2.2 },
    { cap: tx`Line sticks up along \(y\) to make a wall at fixed \(x\). The wall's area is the \(y\) integral: \(8x^2+\tfrac{56}{3}\).`, drop: "stick p0 p1 Ls Lz", add: "slice Lw", set: { s: 1.8 } },
    { cap: tx`Slide the wall from \(x=0\) to \(x=3\). The last integral adds up every wall and fills the solid.`, drop: "Lw", add: "solid", from: { s: .001, c: .001 }, set: { s: 3, c: 3 }, dur: 4.5 },
    { cap: tx`\(72+56=128\) cubic units.`, drop: "ghost slice", add: "Ans" }
  ]
};

S["ex26-5"] = {
  cam: { y: -.5, p: .45, d: 5.5, at: [.33, .33, .3] },
  P: { x: .3, y: .25 },
  build(k) {
    k.scale(1.4, 1.4, 1.4, [.33, .33, .3]);
    k.axes("axes", [0, 1.2], [0, 1.2], [0, 1.2]);
    tetra(k);
    k.seg("stick", { c: "glow", r: .018 });
    k.poly("sheet", [[0, 0, 0], [0, 1, 0], [0, 0, 1]], { c: "glow", o: .85 });
    const n = 8, g = .46, bin = { cold: [], warm: [], hot: [], uni: [] };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let l = 0; l < n; l++) {
      if (i + j + l + 1.5 > n) continue;
      const a = i + .5, b = j + .5, c = l + .5, lo = [(a - g) / n, (b - g) / n, (c - g) / n], hi = [(a + g) / n, (b + g) / n, (c + g) / n];
      const key = a / n < .34 ? "cold" : a / n < .67 ? "warm" : "hot", nm = `${key}${i}_${j}_${l}`, un = `uni${i}_${j}_${l}`;
      k.block(nm, { c: { cold: "s1", warm: "s2", hot: "s3" }[key], o: .95 }).set(lo, hi); bin[key].push(nm);
      k.block(un, { c: "glow", o: .95 }).set(lo, hi); bin.uni.push(un);
    }
    for (const key in bin) k.alias(key, bin[key].join(" "));
    k.alias("heat", "cold warm hot");
    k.label("Lz", () => [k.P.x, k.P.y, 1 - k.P.x - k.P.y], tx`z=1-x-y`, { c: "glow", dx: 62, dy: -22 });
    k.label("Lx", [.75, 0, 0], tx`0\le x\le1`, { c: "ink", dx: 28, dy: 28 });
    k.label("Ly", [.3, .7, 0], tx`y=1-x`, { c: "ink", dx: 42, dy: 18 });
    k.label("Lv", [.3, .2, .3], tx`V=1/6`, { c: "s2", dx: 0, dy: -66, line: false });
    k.label("Ls", () => [k.P.x, k.P.y, (1 - k.P.x - k.P.y) * .6], tx`T\cdot(1-x-y)`, { c: "glow", dx: 74, dy: -36 });
    k.label("Lq", () => [k.P.x, (1 - k.P.x) * .3, (1 - k.P.x) * .3], tx`\text{sticks at this }x`, { c: "glow", dx: 84, dy: -44 });
    k.label("Lhot", [.85, .05, .05], tx`\text{hotter}`, { c: "cursor", dx: 44, dy: 22 });
    k.label("Lcold", [.04, .8, .05], tx`\text{cooler}`, { c: "s1", dx: 46, dy: 20 });
    k.label("Lsum", [.3, .2, .3], tx`147/40`, { c: "glow", dx: 0, dy: -66, line: false });
    k.label("Ans", [.3, .2, .3], tx`22.05\,{}^\circ\text{C}`, { c: "glow", dx: 0, dy: -66, line: false });
  },
  update(P, k) {
    const x = P.x, y = P.y;
    k.o.stick.set([x, y, .002], [x, y, 1 - x - y]);
    k.o.sheet.set([[x, 0, 0], [x, 1 - x, 0], [x, 0, 1 - x]]);
  },
  steps: [
    { cap: tx`This is the same tetrahedron as Example 3, so the limits match: \(z\) up to the slanted face, \(y\) up to \(1-x\), \(x\) from 0 to 1.`, add: "axes tet te stick Lz Lx Ly" },
    { cap: tx`Find the volume with \(\tfrac13\times\) base \(\times\) height. The base triangle has area \(\tfrac12\) and the height is 1.`, drop: "stick Lz Lx Ly", add: "Lv" },
    { cap: tx`\(T\) has no \(z\), so each stick contributes \(T\) times its own length.`, drop: "Lv", add: "stick Ls", from: { y: .05 }, set: { y: .25 }, dur: 1.6 },
    { cap: tx`Add the sticks across \(y\) to get one sheet at this \(x\). Its total depends only on \(x\).`, drop: "tet stick Ls", add: "sheet Lq", set: { x: .3 } },
    { cap: tx`Slide through \(x\) and add the sheets. The pieces are colored by temperature, and the total comes to \(\tfrac{147}{40}\). That's temperature times volume, so it isn't the answer yet.`, drop: "sheet Lq te", add: "heat Lhot Lcold Lsum", dur: 1.5 },
    { cap: tx`Spread the heat evenly and every piece reaches one temperature. That temperature is the total divided by the volume, which means multiplying \(\tfrac{147}{40}\) by 6.`, drop: "heat Lhot Lcold Lsum", add: "uni", dur: 2 },
    { cap: tx`\(T_{\text{avg}}=\dfrac{441}{20}=22.05\,{}^\circ\text{C}\).`, add: "Ans" }
  ]
};
