/* helpers shared by every scene in this lesson (scenes are concatenated in sorted order, so this file loads first) */
const polar = (r, t, z = 0) => [r * cos(t), r * sin(t), z];
const sph = (p, t, f) => [p * sin(f) * cos(t), p * sin(f) * sin(t), p * cos(f)];
const dedupe = pts => pts.filter((p, i) => !i || hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]) > 1e-9);

/* the floor region of a polar integral: "D" (fill) and "De" (outline) */
function polarFloor(k, lo, hi, T0, T1, nT = 64) {
  k.surf("D", (t, v) => polar(lerp(lo(t), hi(t), v), t), [T0, T1, nT], [0, 1, 4], { c: "accent", o: .3, po: true });
  const outer = rng(T0, T1, 90).map(t => polar(hi(t), t)), inner = rng(T1, T0, 90).map(t => polar(lo(t), t));
  k.tube("De", dedupe([...outer, ...inner, outer[0]]), { c: "accent", r: .013 });
}

/* a solid over a polar region. f(r, t) is the height. Adds D, De, ghost, top, four walls (alias "solid") and the glowing "slice" wall. */
function polarSolid(k, f, lo, hi, T0, T1, o = {}) {
  const nT = o.nT ?? 64, nR = o.nR ?? 12, N = 33, paint = o.ramp ? { ramp: o.ramp } : { c: o.c || "s2" };
  const at = (t, v) => { const r = lerp(lo(t), hi(t), v); return polar(r, t, f(r, t)); };
  polarFloor(k, lo, hi, T0, T1, nT);
  const ghost = k.surf("ghost", at, [T0, T1, nT], [0, 1, nR], { ...paint, o: o.go ?? .24 });
  const top = k.surf("top", at, [T0, T1, nT], [0, 1, nR], { ...paint, o: .96 });
  const wo = k.curt("wo", nT + 1, { c: "s1", o: .42 }), wi = k.curt("wi", nT + 1, { c: "s1", o: .42 }), wa = k.curt("wa", N, { c: "s1", o: .42 }), wb = k.curt("wb", N, { c: "s1", o: .42 });
  k.alias("solid", "top wo wi wa wb");
  k.curt("slice", N, { c: "glow", o: .9 });
  const ring = (g, end) => rng(T0, end, nT).map(t => { const r = g(t); return polar(r, t, f(r, t)); });
  const wall = t => rng(0, 1, N - 1).map(v => at(t, v));
  let last = NaN, lastKey;
  return {
    at, wall, slice: t => k.o.slice.set(wall(t)),
    sweep(end, key) {
      if (end === last && key === lastKey) return;
      if (key !== lastKey) ghost.map(at);
      last = end; lastKey = key;
      top.map((a, v) => at(lerp(T0, end, (a - T0) / (T1 - T0)), v));
      wo.set(ring(hi, end)); wi.set(ring(lo, end)); wa.set(wall(T0)); wb.set(wall(end));
    }
  };
}

/* one thin polar box standing on the floor; add it by its name */
function polarCell(k, name, r0, r1, t0, t1, f, o = {}) {
  const c = o.c || "glow", n = 9, opts = { c, o: .8 }, wall = pts => pts.map(([r, t]) => polar(r, t, f(r, t)));
  k.surf(name + "t", (t, r) => polar(r, t, f(r, t)), [t0, t1, 10], [r0, r1, 4], { c, o: .98 });
  k.curt(name + "a", n, opts).set(wall(rng(r0, r1, n - 1).map(r => [r, t0])));
  k.curt(name + "b", n, opts).set(wall(rng(r0, r1, n - 1).map(r => [r, t1])));
  k.curt(name + "c", n, opts).set(wall(rng(t0, t1, n - 1).map(t => [r0, t])));
  k.curt(name + "d", n, opts).set(wall(rng(t0, t1, n - 1).map(t => [r1, t])));
  k.alias(name, `${name}t ${name}a ${name}b ${name}c ${name}d`);
}

/* the tetrahedron bounded by the coordinate planes and x + y + z = 1 */
function tetra(k, clip) {
  const A = [1, 0, 0], B = [0, 1, 0], C = [0, 0, 1], O = [0, 0, 0], o = clip ? { clip } : {};
  k.poly("ts", [A, B, C], { c: "s2", o: .66, ...o });
  k.poly("tx", [O, B, C], { c: "s1", o: .3, ...o });
  k.poly("ty", [O, A, C], { c: "s1", o: .3, ...o });
  k.poly("tz", [O, A, B], { c: "accent", o: .3, po: true, ...o });
  k.alias("tet", "ts tx ty tz");
  k.tubes("te", [[A, B], [B, C], [C, A], [O, A], [O, B], [O, C]], { c: "ink", r: .006, o: .55 });
}
