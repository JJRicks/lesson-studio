/* =====================================================================
   Plot3D: a tiny orthographic renderer (painter's algorithm + culling)
   ===================================================================== */
class Plot3D {
  constructor(cv, o) {
    this.cv = cv; this.ctx = cv.getContext("2d"); this.o = o;
    this.yaw = o.yaw ?? -0.68; this.pitch = o.pitch ?? 0.5; this.spin = o.spin ?? 0.14; this.hold = 0; this.running = false;
    this.T = tokens(TOK);
    themeListeners.push(() => { this.T = tokens(TOK); this.rebuild(); });
    cv.style.touchAction = "pan-y";
    cv.addEventListener("pointerdown", e => { this.drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
    cv.addEventListener("pointermove", e => {
      if (!this.drag) return;
      this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * 0.01;
      this.pitch = clamp(this.drag.pitch + (e.clientY - this.drag.y) * 0.006, 0.1, 1.4);
      this.hold = performance.now() + 6000; if (!this.running) this.draw();
    });
    const end = () => { this.drag = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.tabIndex = 0;
    cv.addEventListener("keydown", e => {
      const k = e.key;
      if (k === "ArrowLeft") this.yaw -= 0.12; else if (k === "ArrowRight") this.yaw += 0.12;
      else if (k === "ArrowUp") this.pitch = clamp(this.pitch + 0.08, 0.1, 1.4); else if (k === "ArrowDown") this.pitch = clamp(this.pitch - 0.08, 0.1, 1.4);
      else return;
      e.preventDefault(); this.hold = performance.now() + 6000; this.draw();
    });
    new ResizeObserver(() => { this.size(); this.draw(); }).observe(cv);
    this.size();
    if (!reduce) new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? this.start() : this.stop())).observe(cv);
  }
  size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.W = this.cv.clientWidth || 600; this.H = this.cv.clientHeight || 340;
    this.cv.width = Math.round(this.W * dpr); this.cv.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  rebuild() { this.scene = this.o.build(this.T); this.draw(); }
  start() {
    if (this.running) return; this.running = true; let last = performance.now();
    const loop = now => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (this.o.tick) this.o.tick(dt);
      if (!this.drag && now > this.hold) this.yaw += this.spin * dt;
      this.draw(); requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop() { this.running = false; }
  draw() {
    const sc = this.scene; if (!sc) return;
    const c = this.ctx, W = this.W, H = this.H, T = this.T, B = sc.bounds;
    c.clearRect(0, 0, W, H); c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    const L = Math.max(B.b - B.a, B.d - B.c), mx = (B.a + B.b) / 2, my = (B.c + B.d) / 2;
    const zs = 1.15 / Math.max(1e-9, B.zhi - B.zlo), mz = (B.zlo + B.zhi) / 2;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const s = Math.min(0.29 * W, 0.33 * H), ox = W / 2, oy = H / 2 - 0.01 * H;
    const P = (x, y, z) => {
      const X = (x - mx) / L * 2, Y = (y - my) / L * 2, Z = (z - mz) * zs;
      const Xr = X * cy - Y * sy, Yr = X * sy + Y * cy;
      return [ox + Xr * s, oy - (Yr * sp + Z * cp) * s, Yr * cp - Z * sp];
    };
    const cam = [-cp * sy, -cp * cy, sp], nx = L / 2, nz = 1 / zs, light = [-0.35, -0.55, 0.76];
    const dotCam = n => n[0] * nx * cam[0] + n[1] * nx * cam[1] + n[2] * nz * cam[2];
    const shade = (col, n, two) => {
      if (!n) return col;
      const a = n[0] * nx, b = n[1] * nx, d = n[2] * nz, m = Math.hypot(a, b, d) || 1;
      let k = (a * light[0] + b * light[1] + d * light[2]) / m;
      if (two && dotCam(n) < 0) k = -k;
      const f = 0.62 + 0.38 * Math.max(0, k);
      return [col[0] * f, col[1] * f, col[2] * f];
    };
    const poly = (pts, fill, stroke, lw) => {
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 0.6; c.stroke(); }
    };
    poly([P(B.a, B.c, 0), P(B.b, B.c, 0), P(B.b, B.d, 0), P(B.a, B.d, 0)], rgbS(T.accent, 0.07), rgbS(T.muted, 0.6), 1);
    const gs = sc.groups.map(g => ({ g, dep: P(g.at[0], g.at[1], g.at[2])[2] }));
    gs.sort((u, v) => v.dep - u.dep);
    for (const { g } of gs) for (const f of g.faces) {
      if (f.n && !f.two && dotCam(f.n) <= 0) continue;
      poly(f.p.map(q => P(q[0], q[1], q[2])), rgbS(shade(f.col, f.n, f.two), f.a ?? 1), f.st ? rgbS(f.st, f.sa ?? 0.5) : null, f.lw);
    }
    if (sc.lines) for (const ln of sc.lines) {
      c.strokeStyle = rgbS(ln.col, ln.a ?? 1); c.lineWidth = ln.w || 1; c.beginPath();
      ln.p.forEach((q, i) => { const r = P(q[0], q[1], q[2]); if (i) c.lineTo(r[0], r[1]); else c.moveTo(r[0], r[1]); }); c.stroke();
    }
    // axes
    const e = 0.16 * L, zTop = B.zhi + 0.1 * (B.zhi - B.zlo), zBot = Math.min(0, B.zlo);
    const ax = [[[B.a, B.c, 0], [B.b + e, B.c, 0], "x"], [[B.a, B.c, 0], [B.a, B.d + e, 0], "y"], [[B.a, B.c, zBot], [B.a, B.c, zTop], "z"]];
    c.strokeStyle = rgbS(T.ink, 0.7); c.lineWidth = 1.3; c.fillStyle = rgbS(T.ink); c.textAlign = "center";
    c.font = `600 12px "JetBrains Mono", ui-monospace, monospace`;
    for (const [p0, p1, lab] of ax) {
      const a = P(...p0), b = P(...p1);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
      c.fillText(lab, b[0] + dx / dl * 10, b[1] + dy / dl * 10 + 4);
    }
    c.font = `11px "JetBrains Mono", ui-monospace, monospace`; c.fillStyle = rgbS(T.muted);
    const lb = sc.labels || {};
    const put = (x, y, z, s) => { const q = P(x, y, z); c.fillText(s, q[0], q[1] + 15); };
    if (lb.b) put(B.b, B.c, 0, "x=" + lb.b);
    if (lb.d) put(B.a, B.d, 0, "y=" + lb.d);
    if (lb.o) put(B.a, B.c, 0, lb.o);
    if (lb.z) { const q = P(B.a, B.c, B.zhi); c.textAlign = "right"; c.fillText(lb.z, q[0] - 7, q[1] + 4); }
  }
}

/* box faces for a column over [x0,x1]×[y0,y1] up (or down) to height h */
function boxFaces(x0, x1, y0, y1, h, col, T) {
  const zt = Math.max(0, h), zb = Math.min(0, h), st = { st: T.plot, sa: 0.6, lw: 0.6 };
  return [
    { ...st, col, p: [[x0, y0, zt], [x1, y0, zt], [x1, y1, zt], [x0, y1, zt]], n: [0, 0, 1] },
    { ...st, col, p: [[x0, y0, zb], [x1, y0, zb], [x1, y1, zb], [x0, y1, zb]], n: [0, 0, -1] },
    { ...st, col, p: [[x0, y0, zb], [x0, y1, zb], [x0, y1, zt], [x0, y0, zt]], n: [-1, 0, 0] },
    { ...st, col, p: [[x1, y0, zb], [x1, y1, zb], [x1, y1, zt], [x1, y0, zt]], n: [1, 0, 0] },
    { ...st, col, p: [[x0, y0, zb], [x1, y0, zb], [x1, y0, zt], [x0, y0, zt]], n: [0, -1, 0] },
    { ...st, col, p: [[x0, y1, zb], [x1, y1, zb], [x1, y1, zt], [x0, y1, zt]], n: [0, 1, 0] }
  ];
}
function surfaceGroups(pre, T, N, alpha) {
  const { f, a, b, c, d, zr } = pre, out = [];
  const X = i => a + (b - a) * i / N, Y = j => c + (d - c) * j / N;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const p = [[X(i), Y(j)], [X(i + 1), Y(j)], [X(i + 1), Y(j + 1)], [X(i), Y(j + 1)]].map(([x, y]) => [x, y, f(x, y)]);
    const u = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]], v = [p[3][0] - p[1][0], p[3][1] - p[1][1], p[3][2] - p[1][2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const h = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4;
    out.push({ at: [(X(i) + X(i + 1)) / 2, (Y(j) + Y(j + 1)) / 2, h], faces: [{ p, n, two: true, col: h >= 0 ? ramp(T, (h - zr[0]) / (zr[1] - zr[0])) : T.bad, a: alpha ?? 1, st: T.plot, sa: 0.35, lw: 0.5 }] });
  }
  return out;
}
function surfaceWire(pre, T, N) {
  const { f, a, b, c, d } = pre, lines = [], M = 30;
  for (let i = 0; i <= N; i++) {
    const x = a + (b - a) * i / N, y = c + (d - c) * i / N, l1 = [], l2 = [];
    for (let k = 0; k <= M; k++) { const yy = c + (d - c) * k / M, xx = a + (b - a) * k / M; l1.push([x, yy, f(x, yy)]); l2.push([xx, y, f(xx, y)]); }
    lines.push({ p: l1, col: T.ink, a: 0.32, w: 1 }, { p: l2, col: T.ink, a: 0.32, w: 1 });
  }
  return lines;
}
