/* helpers shared by every scene in this lesson (scenes load in sorted order, so this file comes first) */
const srand = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const along = (r, a, b, n = 80) => rng(a, b, n).map(t => { const p = r(t); return [p[0], p[1], p[2] ?? 0]; });

/* many arrows sharing one material, so a whole field is one object. fn(p) gives the arrow at p in maths units; .set(fn) re-aims them */
function arrows(k, n, pts, fn, o = {}) {
  const m = k.mat({ c: o.c || "s1", emi: .06, o: o.o ?? 1 }), G = new T3.Group(), rad = o.r ?? .011, Y = new T3.Vector3(0, 1, 0);
  const sg = new T3.CylinderGeometry(rad, rad, 1, 8, 1); sg.translate(0, .5, 0);
  const cg = new T3.ConeGeometry(rad * 2.7, 1, 12); cg.translate(0, -.5, 0);
  const parts = pts.map(() => { const s = new T3.Mesh(sg, m), h = new T3.Mesh(cg, m); G.add(s, h); return [s, h]; });
  const q = k.reg(n, G, [m], {
    set(f) {
      pts.forEach((p, i) => {
        const v = f(p), [s, h] = parts[i], A = k.W(p), B = k.W([p[0] + v[0], p[1] + v[1], p[2] + (v[2] || 0)]), d = B.clone().sub(A), L = d.length();
        const on = L > 1e-4; s.visible = h.visible = on; if (!on) return;
        const hl = min(rad * 7, L * .45); d.normalize();
        s.position.copy(A); s.quaternion.setFromUnitVectors(Y, d); s.scale.set(1, L - hl * .8, 1);
        h.position.copy(B); h.quaternion.copy(s.quaternion); h.scale.set(1, hl, 1);
      });
      return this;
    }
  });
  return q.set(fn);
}

/* a flat field: arrows on a grid at height z. Lengths: true size times o.scale, or fitted to the spacing (o.pow < 1 squeezes big ones) */
function floorField(k, n, F, X, Y, o = {}) {
  const [x0, x1, dx] = X, [y0, y1, dy] = Y, pts = [], z = o.z ?? 0, skip = o.skip || (() => false);
  for (let x = x0; x <= x1 + 1e-9; x += dx) for (let y = y0; y <= y1 + 1e-9; y += dy) if (!skip(x, y)) pts.push([x, y, z]);
  let mx = 1e-9; pts.forEach(p => { const f = F(p[0], p[1]); mx = max(mx, hypot(f[0], f[1])); });
  const L = (o.len ?? .82) * min(dx, dy);
  const fn = (p, g = 1) => {
    const f = F(p[0], p[1]), m = hypot(f[0], f[1]); if (m < 1e-9) return [0, 0, 0];
    const len = (o.scale ? m * o.scale : L * Math.pow(m / mx, o.pow ?? 1)) * g;
    return [f[0] / m * len, f[1] / m * len, 0];
  };
  const q = arrows(k, n, pts, fn, o); q.fit = fn; return q;
}

/* a wall standing on a curve r(t), from the curve up to height h(t) (negative hangs below). .upto(t) grows it from a to t */
function curtain(k, n, r, h, a, b, N = 61, o = {}) {
  const q = k.curt(n, N, o); let last = NaN;
  q.upto = t1 => {
    if (t1 === last) return q; last = t1;
    const e = max(a + 1e-4 * (b - a), t1);
    return q.set(rng(a, e, N - 1).map(t => { const p = r(t), z0 = p[2] ?? 0; return [p[0], p[1], z0 + h(t), z0]; }));
  };
  return q.upto(b);
}

/* a fin standing on a straight floor edge from A to B: a one-variable factor drawn as an area. g(s) for s in [s0, s1] */
function fin(k, n, A, B, g, s0, s1, o = {}) {
  k.surf(n, (s, v) => { const u = (s - s0) / (s1 - s0); return [lerp(A[0], B[0], u), lerp(A[1], B[1], u), v * g(s)]; }, [s0, s1, 40], [0, 1, 1], { o: .85, ...o });
  k.tube(n + "e", [[A[0], A[1], 0], [B[0], B[1], 0]], { c: o.c, r: .013 });
  k.alias(n + "s", `${n} ${n}e`);
}

/* a little paddle wheel standing on the floor; .spin(angle) turns it */
function paddle(k, n, at, size, o = {}) {
  const m = k.mat({ c: o.c || "ink", o: o.o ?? 1, emi: .05 }), G = new T3.Group(), w = size * .16, h = size * .55;
  for (let i = 0; i < 2; i++) { const b = new T3.Mesh(new T3.BoxGeometry(size * 2, w, h), m); b.rotation.z = i * PI / 2; b.position.z = h / 2; G.add(b); }
  const hub = new T3.Mesh(new T3.CylinderGeometry(w * 1.5, w * 1.5, h * 1.3, 16), m); hub.rotation.x = PI / 2; hub.position.z = h / 2; G.add(hub);
  G.position.copy(k.W(at));
  return k.reg(n, G, [m], { spin(a) { G.rotation.z = a; return this; } });
}

/* a cloud of dots, one per grain of mass */
function cloud(k, n, pts, o = {}) {
  const g = new T3.BufferGeometry(), a = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => { const w = k.W(p); a.set([w.x, w.y, w.z], i * 3); });
  g.setAttribute("position", new T3.BufferAttribute(a, 3));
  const m = new T3.PointsMaterial({ color: col(o.c || "ink"), size: o.size ?? 4, sizeAttenuation: false, transparent: true });
  m.userData.op = o.o ?? .75;
  return k.reg(n, new T3.Points(g, m), [m]);
}

/* the edges of a box */
const boxEdges = (k, n, a, b, o = {}) => {
  const [x0, y0, z0] = a, [x1, y1, z1] = b, c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], ring = z => [0, 1, 2, 3, 0].map(i => [c[i][0], c[i][1], z]);
  k.tubes(n, [ring(z0), ring(z1), ...c.map(p => [[p[0], p[1], z0], [p[0], p[1], z1]])], { c: "ink", r: .006, o: .55, ...o });
};

/* an arrow that never collapses to zero length (three.js can't aim a zero vector) */
const aset = (q, a, b) => { const d = hypot(b[0] - a[0], b[1] - a[1], (b[2] || 0) - (a[2] || 0)); return q.set(a, d < 1e-6 ? [a[0] + 1e-4, a[1], a[2] || 0] : b); };
const sqr = (cx, cy, h, z = 0) => [[cx - h, cy - h, z], [cx + h, cy - h, z], [cx + h, cy + h, z], [cx - h, cy + h, z], [cx - h, cy - h, z]];
const ringPts = (c, R, z = 0, n = 72) => rng(0, TAU, n).map(a => [c[0] + R * cos(a), c[1] + R * sin(a), z]);
function ticks(k, n, r, ts, o = {}) {
  k.alias(n, ts.map((t, i) => { const p = r(t); k.dot(n + i, { c: o.c || "accent", r: o.r ?? .024, p: [p[0], p[1], p[2] ?? 0] }); return n + i; }).join(" "));
}

/* a curve with a bead on it: the field at the bead (Fb), its velocity (Vb), the part of F along the motion (Tb),
   a stick (stk) up to the curtain height h(t), and the curtain itself (cur). .at(t) moves everything */
function pathRig(k, o) {
  const { t0, t1 } = o, R = t => { const p = o.r(t); return [p[0], p[1], p[2] ?? 0]; };
  const dr = o.dr || (t => { const e = 1e-5 * (t1 - t0), a = R(t - e), b = R(t + e); return a.map((v, i) => (b[i] - v) / (2 * e)); });
  k.tube("C", along(R, t0, t1, o.n || 160), { c: o.cc || "ink", r: o.cr ?? .015 });
  k.dot("bead", { c: "cursor", r: o.br ?? .05 });
  k.arrow("Fb", { c: "glow", r: .017 }); k.arrow("Vb", { c: "accent", r: .017 }); k.arrow("Tb", { c: o.tc || "bad", r: .021 });
  k.seg("stk", { c: o.hc || "s2", r: .011 });
  if (o.h) curtain(k, "cur", R, o.h, t0, t1, o.N || 121, { c: o.hc || "s2", o: .5 });
  const add = (a, v, s) => [a[0] + v[0] * s, a[1] + v[1] * s, a[2] + (v[2] || 0) * s];
  return {
    R, dr,
    at(t) {
      const p = R(t), v = dr(t), sp = hypot(v[0], v[1], v[2] || 0) || 1, T = v.map(c => c / sp);
      k.o.bead.at(p); aset(k.o.Vb, p, add(p, v, o.sV ?? .3));
      if (o.F) {
        const f = o.F(p), ft = f[0] * T[0] + f[1] * T[1] + (f[2] || 0) * T[2];
        aset(k.o.Fb, p, add(p, f, o.sF ?? .3)); aset(k.o.Tb, p, add(p, T, ft * (o.sF ?? .3)));
      }
      if (o.h) k.o.stk.set(p, [p[0], p[1], p[2] + o.h(t)]);
      return p;
    }
  };
}
