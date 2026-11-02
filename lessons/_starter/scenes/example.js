/* One S["<article id>"] per worked example. steps has one entry per written step, plus a final answer step.
   Replace this file: if it stays alongside your own scenes, its S["ex1"] collides with yours and check.py fails. */
S["ex1"] = {
  cam: { y: -1.05, p: .42, d: 6.8, at: [.5, .5, .85] },
  P: { s: 1 },
  build(k) {
    k.scale(1, 1, 1, [.5, .5, .85]);   // equal scales keep angles true; pick values that fit the scene within about ±1.5
    const f = (x, y) => x + y;
    k.f = f;
    k.axes("axes", [0, 1.35], [0, 1.35], [0, 2.4]);
    k.R = rectSolid(k, f, [0, 1], [0, 1], [0, 2]);
    k.label("Lz", [.9, .6, 1.5], tx`z=x+y`, { c: "s2", dx: 44, dy: -28 });
    k.label("Ls", () => [k.P.s, .5, f(k.P.s, .5)], tx`\text{one slice}`, { c: "glow", dx: 54, dy: -24 });
    k.label("La", [.5, .5, 1], tx`V=1`, { c: "glow", dx: 40, dy: -56 });
  },
  update(P, k) { k.R.cut.set(P.s + .002); k.R.slice(P.s); },
  steps: [
    { cap: tx`The square is the floor, and the surface \(z=x+y\) is the roof. We want the volume between them.`, add: "axes R Re solid Lz" },
    { cap: tx`Freeze \(x\) to cut one slice, then slide it across. The inner integral is the slice's area, and the outer integral adds the slices up.`, drop: "Lz", add: "ghost slice Ls", from: { s: .01 }, set: { s: 1 }, dur: 3.5 },
    { cap: tx`The volume is \(V=1\).`, drop: "ghost slice Ls", add: "La" }
  ]
};
