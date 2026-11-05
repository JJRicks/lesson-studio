/* 3D backend for the steppers: one shared WebGL renderer, blitted into each example's canvas. Needs stepper.js first. */
const T3 = THREE;
const col = n => new T3.Color(css("--" + n));

const GL = {
  r: null, failed: false, w: 0, h: 0,
  get() {
    if (this.r || this.failed) return this.r;
    try {
      const r = new T3.WebGLRenderer({ antialias: true, alpha: false });
      r.setPixelRatio(1); r.localClippingEnabled = true; r.setScissorTest(true); this.r = r;
    } catch (e) { this.failed = true; }
    return this.r;
  },
  fit(w, h) { if (w > this.w || h > this.h) { this.w = max(w, this.w); this.h = max(h, this.h); this.r.setSize(this.w, this.h, false); } }
};

class Poly extends T3.Curve {
  constructor(p) { super(); this.p = p; }
  getPoint(t, o = new T3.Vector3()) { const n = this.p.length - 1, s = t * n, i = min(n - 1, floor(s)); return o.copy(this.p[i]).lerp(this.p[i + 1], s - i); }
}

/* ---------- scene-building kit: all coordinates are maths coordinates, z up ---------- */
class Kit {
  constructor(v) { this.v = v; this.o = {}; this.al = {}; this.s = [1, 1, 1]; this.c = [0, 0, 0]; this.ord = 1; this.P = v.P; this.scene = v.scene; }
  scale(sx, sy, sz, c) { this.s = [sx, sy, sz]; this.c = c; }
  W(p) { return new T3.Vector3((p[0] - this.c[0]) * this.s[0], (p[1] - this.c[1]) * this.s[1], (p[2] - this.c[2]) * this.s[2]); }
  mat(o = {}) {
    const lit = o.lit !== false, p = { side: T3.DoubleSide, transparent: true, opacity: 1 };
    if (o.ramp) p.vertexColors = true; else p.color = col(o.c || "accent");
    if (o.clip) p.clippingPlanes = o.clip;
    if (o.po) Object.assign(p, { polygonOffset: true, polygonOffsetFactor: 1.5, polygonOffsetUnits: 2 });
    if (lit) { p.shininess = o.sh ?? 30; p.specular = new T3.Color(0x1c1c1c); if (o.emi && !o.ramp) p.emissive = col(o.c || "accent").multiplyScalar(o.emi); }
    const m = new (lit ? T3.MeshPhongMaterial : T3.MeshBasicMaterial)(p);
    m.userData.op = o.o ?? 1; return m;
  }
  reg(n, obj, mats, extra) {
    obj.renderOrder = this.ord++; obj.traverse(m => { m.frustumCulled = false; m.renderOrder = obj.renderOrder; });
    obj.visible = false; this.scene.add(obj);
    return this.o[n] = Object.assign({ obj, mats, v: 0, t: 0 }, extra);
  }
  vis(n) {
    const q = this.o[n]; if (q.lab) return;
    const on = q.v > .008; q.obj.visible = on; if (!on) return;
    for (const m of q.mats) { const op = m.userData.op * q.v; m.opacity = op; m.transparent = op < .995; m.depthWrite = op >= .995; }
  }
  alias(n, s) { this.al[n] = words(s); }
  surf(n, fn, U, V, o = {}) {
    const [u0, u1, nu] = U, [v0, v1, nv] = V, N = (nu + 1) * (nv + 1), pos = new Float32Array(N * 3), cl = o.ramp ? new Float32Array(N * 3) : null, idx = [];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(pos, 3)); if (cl) g.setAttribute("color", new T3.BufferAttribute(cl, 3)); g.setIndex(idx);
    const m = this.mat(o), mesh = new T3.Mesh(g, m), k = this, RC = ["s1", "s2", "s3"].map(c => { const q = col(c); return [q.r, q.g, q.b]; });
    const paint = t => { t = clamp01(t); const [a, b, f] = t < .5 ? [RC[0], RC[1], t * 2] : [RC[1], RC[2], t * 2 - 1]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; };
    const q = this.reg(n, mesh, [m], {
      map(f) {
        let t = 0;
        for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
          const p = f(u0 + (u1 - u0) * i / nu, v0 + (v1 - v0) * j / nv), w = k.W(p);
          pos[t * 3] = w.x; pos[t * 3 + 1] = w.y; pos[t * 3 + 2] = w.z;
          if (cl) cl.set(paint((p[2] - o.ramp[0]) / (o.ramp[1] - o.ramp[0])), t * 3);
          t++;
        }
        g.attributes.position.needsUpdate = true; if (cl) g.attributes.color.needsUpdate = true; g.computeVertexNormals();
      }
    });
    q.map(fn); return q;
  }
  poly(n, pts, o = {}) {
    const N = pts.length, g = new T3.BufferGeometry(), pos = new Float32Array(N * 3), idx = [], k = this;
    for (let i = 1; i < N - 1; i++) idx.push(0, i, i + 1);
    g.setAttribute("position", new T3.BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = this.mat(o), q = this.reg(n, new T3.Mesh(g, m), [m], {
      set(ps) { ps.forEach((p, i) => { const w = k.W(p); pos[i * 3] = w.x; pos[i * 3 + 1] = w.y; pos[i * 3 + 2] = w.z; }); g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }
    });
    q.set(pts); return q;
  }
  flat(n, pts, z, o = {}) { return this.poly(n, pts.map(p => [p[0], p[1], z]), { po: true, ...o }); }
  curt(n, N, o = {}) {           // a wall standing on a polyline: set([[x, y, zTop, zBottom = 0], ...])
    const pos = new Float32Array(N * 6), idx = [], g = new T3.BufferGeometry(), k = this;
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute("position", new T3.BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = this.mat(o);
    return this.reg(n, new T3.Mesh(g, m), [m], {
      set(l) {
        l.forEach((p, i) => {
          const a = k.W([p[0], p[1], p[3] ?? 0]), b = k.W([p[0], p[1], p[2]]);
          pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
        });
        g.attributes.position.needsUpdate = true; g.computeVertexNormals(); return this;
      }
    });
  }
  tubes(n, lists, o = {}) {
    const m = this.mat({ lit: false, ...o }), G = new T3.Group(), rad = o.r ?? .012;
    for (const pts of lists) {
      const P = pts.map(p => this.W(p)), geo = new T3.TubeGeometry(new Poly(P), max(1, P.length - 1), rad, 8, false);
      G.add(new T3.Mesh(geo, m));
    }
    return this.reg(n, G, [m]);
  }
  tube(n, pts, o = {}) { return this.tubes(n, [pts], o); }
  seg(n, o = {}) {
    const m = this.mat({ lit: false, ...o }), mesh = new T3.Mesh(new T3.CylinderGeometry(o.r ?? .012, o.r ?? .012, 1, 10, 1, true), m), Y = new T3.Vector3(0, 1, 0), k = this;
    return this.reg(n, mesh, [m], {
      set(a, b) {
        const A = k.W(a), B = k.W(b), d = B.clone().sub(A), L = d.length() || 1e-4;
        mesh.position.copy(A).addScaledVector(d, .5); mesh.quaternion.setFromUnitVectors(Y, d.normalize()); mesh.scale.set(1, L, 1); return this;
      }
    });
  }
  arrow(n, o = {}) {
    const rad = o.r ?? .017, hl = rad * 5.2, m = this.mat({ emi: .08, ...o }), G = new T3.Group(), k = this, Y = new T3.Vector3(0, 1, 0);
    const sg = new T3.CylinderGeometry(rad, rad, 1, 12, 1); sg.translate(0, .5, 0);
    const shaft = new T3.Mesh(sg, m), head = new T3.Mesh(new T3.ConeGeometry(rad * 2.7, hl, 16), m); G.add(shaft, head);
    return this.reg(n, G, [m], {
      a: [0, 0, 0], b: [0, 0, 0],
      set(a, b) {
        this.a = a; this.b = b;
        const A = k.W(a), d = k.W(b).sub(A), L = max(d.length(), hl * 1.05);
        G.position.copy(A); G.quaternion.setFromUnitVectors(Y, d.normalize());
        shaft.scale.set(1, L - hl, 1); head.position.y = L - hl / 2; return this;
      }
    });
  }
  dot(n, o = {}) {
    const m = this.mat({ emi: .15, ...o }), mesh = new T3.Mesh(new T3.SphereGeometry(o.r ?? .042, 20, 14), m), k = this;
    const q = this.reg(n, mesh, [m], { at(p) { this.p = p; mesh.position.copy(k.W(p)); return this; } });
    if (o.p) q.at(o.p); return q;
  }
  wedge(n, o = {}) {             // a filled angle marker: set(apex, a, b, radius, fraction = 1) opens from direction a toward b, in maths units
    const q = this.surf(n, () => [0, 0, 0], [0, 1, 1], [0, 1, 28], o), dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2], unit = u => { const m = hypot(u[0], u[1], u[2]) || 1; return u.map(c => c / m); };
    q.set = (O, a, b, R, f = 1) => {
      const e1 = unit(a), d = dot(e1, unit(b)), th = acos(max(-1, min(1, d))) * f, bb = unit(b), e2 = unit(bb.map((c, i) => c - d * e1[i]));
      q.map((u, v) => O.map((c, i) => c + u * R * (cos(v * th) * e1[i] + sin(v * th) * e2[i]))); return q;
    };
    return q;
  }
  ball(n, o = {}) {
    const m = this.mat(o), mesh = new T3.Mesh(new T3.SphereGeometry(1, 48, 32), m), k = this;
    return this.reg(n, mesh, [m], { at(p, rWorld) { mesh.position.copy(k.W(p)); mesh.scale.setScalar(max(rWorld, 1e-3)); return this; } });
  }
  block(n, o = {}) {
    const m = this.mat(o), mesh = new T3.Mesh(new T3.BoxGeometry(1, 1, 1), m), k = this;
    return this.reg(n, mesh, [m], {
      set(a, b) { const A = k.W(a), B = k.W(b); mesh.position.copy(A).add(B).multiplyScalar(.5); mesh.scale.set(max(abs(B.x - A.x), 1e-4), max(abs(B.y - A.y), 1e-4), max(abs(B.z - A.z), 1e-4)); return this; }
    });
  }
  grid(n, X, Y, z, o = {}) {
    const v = [], [x0, x1, dx] = X, [y0, y1, dy] = Y;
    for (let x = x0; x <= x1 + 1e-9; x += dx) { const a = this.W([x, y0, z]), b = this.W([x, y1, z]); v.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    for (let y = y0; y <= y1 + 1e-9; y += dy) { const a = this.W([x0, y, z]), b = this.W([x1, y, z]); v.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(v, 3));
    const m = new T3.LineBasicMaterial({ color: col(o.c || "muted"), transparent: true, opacity: 1 }); m.userData.op = o.o ?? .32;
    return this.reg(n, new T3.LineSegments(g, m), [m]);
  }
  axes(n, X, Y, Z, o = {}) {
    const a = o.at || [0, 0, 0], names = [], lab = o.lab || ["x", "y", "z"], dirs = [[X, 0], [Y, 1], [Z, 2]];
    dirs.forEach(([R, i]) => {
      if (!R) return;
      const p0 = a.slice(), p1 = a.slice(); p0[i] = R[0]; p1[i] = R[1];
      const nm = n + "_" + i; this.arrow(nm, { c: "muted", r: .0075, emi: .1 }).set(p0, p1); names.push(nm);
      const ln = n + "_l" + i; this.label(ln, p1, lab[i], { c: "muted", sm: true, dx: i === 2 ? 0 : 10, dy: i === 2 ? -11 : 6, plain: true }); names.push(ln);
    });
    this.al[n] = names;
  }
  label(n, p, tex, o = {}) { return makeLabel(this, n, p, tex, o); }
  cut(axis) {
    const i = "xyz".indexOf(axis), n = new T3.Vector3(i === 0 ? -1 : 0, i === 1 ? -1 : 0, i === 2 ? -1 : 0), pl = new T3.Plane(n, 1e3), k = this;
    return { pl, set(v) { pl.constant = (v - k.c[i]) * k.s[i]; } };
  }
}

/* ---------- one example's 3D viewer ---------- */
class Viz extends Stepper {
  stageHTML() {
    return `<div class="v3stage" tabindex="0" role="img" aria-label="3D diagram. Use the left and right arrow keys to change step, or drag to rotate.">
        <canvas class="v3cv"></canvas><div class="v3ls"></div><span class="v3hint">drag to rotate</span></div>`;
  }
  attach() {
    this.cv = this.root.querySelector(".v3cv"); this.ctx = this.cv.getContext("2d");
    this.stage.addEventListener("pointerdown", e => { this.drag = { x: e.clientX, y: e.clientY, cy: this.cam?.y, cp: this.cam?.p }; try { this.stage.setPointerCapture(e.pointerId); } catch (_) {} });
    this.stage.addEventListener("pointermove", e => {
      if (!this.drag || !this.cam) return;
      this.cam.y = this.drag.cy - (e.clientX - this.drag.x) * .009;
      this.cam.p = max(.04, min(1.54, this.drag.cp + (e.clientY - this.drag.y) * .007));
      this.root.classList.add("moved"); this.dirty = true; V3.kick();
    });
    const end = () => { this.drag = null; }; this.stage.addEventListener("pointerup", end); this.stage.addEventListener("pointercancel", end);
  }
  ready() { return !!GL.get(); }
  noMsg() { return "This browser couldn't start WebGL, so the 3D view is off. The steps below still work."; }
  setup() {
    const s = this.scene = new T3.Scene();
    s.add(new T3.AmbientLight(0xffffff, .66));
    const d1 = new T3.DirectionalLight(0xffffff, .42); d1.position.set(-2, -3, 5); s.add(d1);
    const d2 = new T3.DirectionalLight(0xffffff, .14); d2.position.set(3, 2, 1); s.add(d2);
    this.cam3 = new T3.PerspectiveCamera(26, 2, .1, 80); this.cam3.up.set(0, 0, 1);
    this.bg = col("plot");
    return new Kit(this);
  }
  teardown() { this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  camLerp(c0, c1, e) {
    const dy = ((c1.y - c0.y + PI) % TAU + TAU) % TAU - PI;
    return { y: c0.y + dy * e, p: lerp(c0.p, c1.p, e), d: lerp(c0.d, c1.d, e), at: c0.at.map((v, j) => lerp(v, c1.at[j], e)) };
  }
  render() {
    const g = GL.get(); if (!g || !this.built) return;
    const W = this.stage.clientWidth, H = this.stage.clientHeight; if (!W || !H) return;
    const dpr = min(2, devicePixelRatio || 1), w = round(W * dpr), h = round(H * dpr), k = this.k, c = this.cam, cam = this.cam3, P = this.P;
    GL.fit(w, h);
    for (const n in k.o) k.vis(n);
    if (this.def.update) this.def.update(P, k);
    const asp = W / H, d = c.d * max(1, 1.5 / asp), at = k.W(c.at);
    cam.position.set(at.x + d * cos(c.p) * cos(c.y), at.y + d * cos(c.p) * sin(c.y), at.z + d * sin(c.p));
    cam.aspect = asp; cam.updateProjectionMatrix(); cam.lookAt(at); cam.updateMatrixWorld();
    g.setViewport(0, 0, w, h); g.setScissor(0, 0, w, h); g.setClearColor(this.bg, 1); g.render(this.scene, cam);
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    const x = this.ctx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h); x.globalAlpha = 1;
    x.drawImage(g.domElement, 0, GL.h - h, w, h, 0, 0, w, h);
    const v = new T3.Vector3();
    for (const n in k.o) {
      const q = k.o[n]; if (!q.lab) continue;
      const on = q.t === 1 && (!q.when || q.when());
      q.el.classList.toggle("on", on); if (!q.t) continue;
      v.copy(k.W(typeof q.p === "function" ? q.p() : q.p)).project(cam);
      const ax = (v.x + 1) / 2 * W, ay = (1 - v.y) / 2 * H, hw = q.el.offsetWidth / 2 + 3, hh = q.el.offsetHeight / 2 + 3;
      const lx = max(hw, min(W - hw, ax + q.dx)), ly = max(hh, min(H - hh, ay + q.dy));
      q.el.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) translate(-50%,-50%)`;
      if (q.line && on && q.v > .1) {
        x.globalAlpha = q.v * .85; x.strokeStyle = q.css; x.fillStyle = q.css; x.lineWidth = 1.3 * dpr;
        x.beginPath(); x.moveTo(ax * dpr, ay * dpr); x.lineTo(lx * dpr, ly * dpr); x.stroke();
        x.beginPath(); x.arc(ax * dpr, ay * dpr, 2.4 * dpr, 0, TAU); x.fill(); x.globalAlpha = 1;
      }
    }
  }
}

/* a solid over a rectangle: floor, surface, four walls, a see-through ghost of the surface, and a moving slice */
function rectSolid(k, f, X, Y, ramp, axis = "x") {
  const [a, b] = X, [c, d] = Y, cut = k.cut(axis), clip = [cut.pl], n = 41, xs = rng(a, b, n - 1), ys = rng(c, d, n - 1);
  k.flat("R", [[a, c], [b, c], [b, d], [a, d]], 0, { c: "accent", o: .2 });
  k.tubes("Re", [[[a, c, 0], [b, c, 0]], [[b, c, 0], [b, d, 0]], [[b, d, 0], [a, d, 0]], [[a, d, 0], [a, c, 0]]], { c: "accent", r: .012 });
  const top = k.surf("top", (x, y) => [x, y, f(x, y)], [a, b, 44], [c, d, 26], { ramp, clip, o: .97 });
  const gh = k.surf("ghost", (x, y) => [x, y, f(x, y)], [a, b, 30], [c, d, 18], { ramp, o: .24 });
  const w = [k.curt("w1", n, { c: "s1", o: .42, clip }), k.curt("w2", n, { c: "s1", o: .42, clip }), k.curt("w3", n, { c: "s1", o: .42, clip }), k.curt("w4", n, { c: "s1", o: .42, clip })];
  const set = g => {
    top.map((x, y) => [x, y, g(x, y)]); gh.map((x, y) => [x, y, g(x, y)]);
    w[0].set(xs.map(x => [x, c, g(x, c)])); w[1].set(xs.map(x => [x, d, g(x, d)]));
    w[2].set(ys.map(y => [a, y, g(a, y)])); w[3].set(ys.map(y => [b, y, g(b, y)]));
  };
  set(f);
  k.alias("solid", "top w1 w2 w3 w4");
  k.curt("slice", n, { c: "glow", o: .9 });
  return { cut, set, ys, xs, slice: s => k.o.slice.set(ys.map(y => [s, y, f(s, y)])) };
}
