/* surfaces used by the 3D explorers */
const PRESETS = {
  para: { f: (x, y) => 16 - x * x - 2 * y * y, a: 0, b: 2, c: 0, d: 2, zr: [0, 16], exact: 48, labels: { b: "2", d: "2", o: "(0,0)", z: "16" },
    tex: "z = 16 - x^2 - 2y^2 \\text{ on } [0,2]\\times[0,2] \\quad\\Rightarrow\\quad \\iint_R f\\,dA = 48" },
  wave: { f: (x, y) => Math.sin(x) * Math.cos(y), a: 0, b: Math.PI, c: 0, d: 2 * Math.PI / 3, zr: [-1, 1], exact: Math.sqrt(3), labels: { b: "π", d: "2π/3", o: "(0,0)", z: "1" },
    tex: "z = \\sin x\\cos y \\text{ on } [0,\\pi]\\times[0,\\tfrac{2\\pi}{3}] \\quad\\Rightarrow\\quad \\iint_R f\\,dA = \\sqrt3 \\approx 1.732" },
  cos: { f: (x, y) => 4 * Math.cos(x) + 7 * Math.cos(y), a: 0, b: Math.PI / 2, c: 0, d: Math.PI, zr: [-7, 11], exact: 4 * Math.PI, labels: { b: "π/2", d: "π", o: "(0,0)", z: "11" },
    tex: "z = 4\\cos x + 7\\cos y \\text{ on } [0,\\tfrac{\\pi}{2}]\\times[0,\\pi] \\quad\\Rightarrow\\quad \\iint_R f\\,dA = 4\\pi \\approx 12.566" }
};
function riemann(pre, m, n, sample) {
  const { f, a, b, c, d } = pre, dx = (b - a) / m, dy = (d - c) / n, off = { ur: 1, mid: 0.5, ll: 0 }[sample];
  const H = []; let sum = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { const h = f(a + (i + off) * dx, c + (j + off) * dy); H.push(h); sum += h * dx * dy; }
  return { H, sum, dx, dy, avg: sum / ((b - a) * (d - c)) };
}
function riemannScene(pre, st, T) {
  const { a, c, zr } = pre, R = riemann(pre, st.m, st.n, st.sample), groups = [];
  if (st.mode !== "surface") {
    let k = 0;
    for (let i = 0; i < st.m; i++) for (let j = 0; j < st.n; j++) {
      let h = R.H[k++]; if (st.melt) h += (R.avg - h) * st.melt;
      const x0 = a + i * R.dx, y0 = c + j * R.dy;
      const col = h >= 0 ? ramp(T, (h - zr[0]) / (zr[1] - zr[0])) : T.bad;
      groups.push({ at: [x0 + R.dx / 2, y0 + R.dy / 2, h / 2], faces: boxFaces(x0, x0 + R.dx, y0, y0 + R.dy, h, col, T) });
    }
  } else groups.push(...surfaceGroups(pre, T, 24));
  return { bounds: { a: pre.a, b: pre.b, c: pre.c, d: pre.d, zlo: Math.min(0, zr[0]), zhi: zr[1] }, groups, lines: st.mode === "both" ? surfaceWire(pre, T, 12) : null, labels: pre.labels, R };
}

/* ---------- hero: refining boxes ---------- */
(function hero() {
  const pre = PRESETS.para, seq = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
  let k = 3, timer = 0, playing = true;
  const st = () => ({ m: seq[k], n: seq[k], sample: "ur", mode: "both" });
  const p = new Plot3D($("#heroCv"), {
    pitch: 0.55, spin: 0.16,
    build: T => riemannScene(pre, st(), T),
    tick(dt) { if (!playing) return; timer += dt; if (timer > (k === seq.length - 1 ? 3.2 : 1.6)) { timer = 0; k = (k + 1) % seq.length; p.rebuild(); reads(); } }
  });
  function reads() {
    const R = riemann(pre, seq[k], seq[k], "ur");
    $("#hGrid").textContent = `${seq[k]} × ${seq[k]} = ${seq[k] * seq[k]} boxes`;
    $("#hSum").textContent = fx(R.sum, 3);
    $("#hGap").textContent = fx(48 - R.sum, 3);
  }
  p.rebuild(); reads();
  const b = $("#heroPlay");
  b.addEventListener("click", () => { playing = !playing; b.textContent = playing ? "Pause" : "Play"; b.setAttribute("aria-pressed", String(playing)); });
  if (reduce) b.hidden = true;
})();

/* =====================================================================
   Lagrange explorer
   ===================================================================== */
(function lagrange() {
  const R8 = Math.sqrt(8), TAU = Math.PI * 2;
  const D = {
    closest: {
      story: "Find the point on the line \\(x + y = 4\\) closest to the origin. Minimize the squared distance \\(f(x,y) = x^2 + y^2\\) subject to \\(g(x,y) = x + y - 4 = 0\\).",
      f: (x, y) => x * x + y * y, gf: (x, y) => [2 * x, 2 * y], gg: () => [1, 1],
      win: [-3, 7, -3, 7], pt: t => [2 + t, 2 - t], proj: (x, y) => ((x - 2) - (y - 2)) / 2, tr: [-5, 5], t0: -2.6,
      levels: [1, 2, 4, 8, 13, 20, 29, 40, 52], ext: [{ t: 0, k: "min" }], tlab: t => "t = " + fx(t, 2)
    },
    product: {
      story: "Find the largest and smallest values of \\(f(x,y) = xy\\) on the circle \\(x^2 + y^2 = 8\\), so \\(g(x,y) = x^2 + y^2 - 8 = 0\\).",
      f: (x, y) => x * y, gf: (x, y) => [y, x], gg: (x, y) => [2 * x, 2 * y],
      win: [-5, 5, -5, 5], pt: t => [R8 * Math.cos(t), R8 * Math.sin(t)], proj: (x, y) => { const a = Math.atan2(y, x); return a < 0 ? a + TAU : a; }, tr: [0, TAU], t0: 0.28,
      levels: [-6, -4, -2, -1, 1, 2, 4, 6], ext: [{ t: Math.PI / 4, k: "max" }, { t: 3 * Math.PI / 4, k: "min" }, { t: 5 * Math.PI / 4, k: "max" }, { t: 7 * Math.PI / 4, k: "min" }],
      tlab: t => "θ = " + Math.round(t * 180 / Math.PI) + "°"
    }
  };
  let key = "closest", ex = D[key], t = ex.t0, anim = null, T = tokens(TOK), grid = null;
  const cv = $("#lagCv"), mini = $("#lagMini"), slider = $("#lagT");
  const toS = v => Math.round((v - ex.tr[0]) / (ex.tr[1] - ex.tr[0]) * 1000), fromS = s => ex.tr[0] + s / 1000 * (ex.tr[1] - ex.tr[0]);
  function buildGrid() {
    const [x0, x1, y0, y1] = ex.win, N = 140, v = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) v.push(ex.f(x0 + (x1 - x0) * i / N, y0 + (y1 - y0) * j / N));
    grid = { N, v };
  }
  function contour(level, cb) {
    const { N, v } = grid, [x0, x1, y0, y1] = ex.win, X = i => x0 + (x1 - x0) * i / N, Y = j => y0 + (y1 - y0) * j / N, at = (i, j) => v[j * (N + 1) + i];
    const lerp = (pa, pb, va, vb) => { const tt = (level - va) / ((vb - va) || 1e-12); return [pa[0] + (pb[0] - pa[0]) * tt, pa[1] + (pb[1] - pa[1]) * tt]; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const idx = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const pa = [X(i), Y(j)], pb = [X(i + 1), Y(j)], pc = [X(i + 1), Y(j + 1)], pd = [X(i), Y(j + 1)];
      const e = { ab: () => lerp(pa, pb, a, b), bc: () => lerp(pb, pc, b, c), cd: () => lerp(pc, pd, c, d), da: () => lerp(pd, pa, d, a) };
      const S = { 1: ["da", "ab"], 2: ["ab", "bc"], 3: ["da", "bc"], 4: ["bc", "cd"], 6: ["ab", "cd"], 7: ["da", "cd"], 8: ["cd", "da"], 9: ["cd", "ab"], 11: ["cd", "bc"], 12: ["bc", "da"], 13: ["bc", "ab"], 14: ["ab", "da"] };
      if (idx === 5 || idx === 10) { const mid = (a + b + c + d) / 4 > level; const pairs = (idx === 5) === mid ? [["da", "cd"], ["ab", "bc"]] : [["da", "ab"], ["bc", "cd"]]; pairs.forEach(([u, w]) => cb(e[u](), e[w]())); }
      else { const [u, w] = S[idx]; cb(e[u](), e[w]()); }
    }
  }
  function map(W, H) {
    const [x0, x1, y0, y1] = ex.win, s = Math.min(W / (x1 - x0), H / (y1 - y0)), ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
    return { s, X: x => ox + (x - x0) * s, Y: y => H - oy - (y - y0) * s, inv: (px, py) => [x0 + (px - ox) / s, y0 + (H - oy - py) / s] };
  }
  function arrow(c, x, y, dx, dy, col, label) {
    const L = Math.hypot(dx, dy); if (L < 1e-9) return;
    const ux = dx / L, uy = dy / L, len = 58, ex2 = x + ux * len, ey = y - uy * len;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(ex2, ey); c.stroke();
    c.beginPath(); c.moveTo(ex2 + ux * 4, ey - uy * 4); c.lineTo(ex2 - ux * 9 - uy * 6, ey + uy * 9 - ux * 6); c.lineTo(ex2 - ux * 9 + uy * 6, ey + uy * 9 + ux * 6); c.closePath(); c.fill();
    c.font = `600 13px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "center"; c.fillText(label, ex2 + ux * 16, ey - uy * 16 + 4);
  }
  function draw() {
    const { c, W, H } = canvas2d(cv), M = map(W, H), [x0, x1, y0, y1] = ex.win;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.setLineDash([2, 4]);
    for (let g = Math.ceil(x0); g <= x1; g++) { c.beginPath(); c.moveTo(M.X(g), M.Y(y0)); c.lineTo(M.X(g), M.Y(y1)); c.stroke(); }
    for (let g = Math.ceil(y0); g <= y1; g++) { c.beginPath(); c.moveTo(M.X(x0), M.Y(g)); c.lineTo(M.X(x1), M.Y(g)); c.stroke(); }
    c.setLineDash([]); c.strokeStyle = rgbS(T.muted, 0.8); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(M.X(x0), M.Y(0)); c.lineTo(M.X(x1), M.Y(0)); c.moveTo(M.X(0), M.Y(y0)); c.lineTo(M.X(0), M.Y(y1)); c.stroke();
    c.strokeStyle = rgbS(T.muted, 0.55); c.lineWidth = 1.2;
    for (const lv of ex.levels) { c.beginPath(); contour(lv, (p, q) => { c.moveTo(M.X(p[0]), M.Y(p[1])); c.lineTo(M.X(q[0]), M.Y(q[1])); }); c.stroke(); }
    // constraint
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 3.5; c.beginPath();
    for (let k = 0; k <= 240; k++) { const tt = ex.tr[0] + (ex.tr[1] - ex.tr[0]) * k / 240, [px, py] = ex.pt(tt); if (k) c.lineTo(M.X(px), M.Y(py)); else c.moveTo(M.X(px), M.Y(py)); }
    if (key === "closest") { const [ax, ay] = ex.pt(-9), [bx, by] = ex.pt(9); c.moveTo(M.X(ax), M.Y(ay)); c.lineTo(M.X(bx), M.Y(by)); }
    c.stroke();
    // level curve through P
    const [px, py] = ex.pt(t), fv = ex.f(px, py);
    c.strokeStyle = rgbS(T.glow, 0.85); c.lineWidth = 2.2; c.setLineDash([7, 5]); c.beginPath();
    contour(fv, (p, q) => { c.moveTo(M.X(p[0]), M.Y(p[1])); c.lineTo(M.X(q[0]), M.Y(q[1])); }); c.stroke(); c.setLineDash([]);
    // gradients
    const gf = ex.gf(px, py), gg = ex.gg(px, py), X = M.X(px), Y = M.Y(py);
    arrow(c, X, Y, gg[0], gg[1], rgbS(T.accent), "∇g");
    arrow(c, X, Y, gf[0], gf[1], rgbS(T.glow), "∇f");
    c.fillStyle = rgbS(T.plot); c.strokeStyle = rgbS(T.ink); c.lineWidth = 2.5; c.beginPath(); c.arc(X, Y, 7, 0, 6.283); c.fill(); c.stroke();
    // readouts
    const dot = gf[0] * gg[0] + gf[1] * gg[1], nf = Math.hypot(...gf), ng = Math.hypot(...gg);
    const ang = nf > 1e-9 && ng > 1e-9 ? Math.acos(clamp(dot / (nf * ng), -1, 1)) * 180 / Math.PI : 0;
    const par = ang < 1.5 || ang > 178.5, lam = dot / (ng * ng);
    $("#lagReads").innerHTML =
      `<div><div class="k">Point</div><div class="v">(${fx(px)}, ${fx(py)})</div></div>` +
      `<div><div class="k">f there</div><div class="v">${fx(fv)}</div></div>` +
      `<div><div class="k">Angle between ∇f, ∇g</div><div class="v">${ang.toFixed(1)}°</div></div>` +
      `<div class="${par ? "hl" : ""}"><div class="k">Verdict</div><div class="v" style="font-size:.95rem">${par ? "parallel ✓ λ = " + fx(lam) : "not parallel"}</div></div>`;
    $("#lagTOut").textContent = ex.tlab(t);
    drawMini();
  }
  function drawMini() {
    const { c, W, H } = canvas2d(mini), pad = { l: 44, r: 12, t: 12, b: 22 };
    const N = 200, vals = []; let lo = 1e9, hi = -1e9;
    for (let k = 0; k <= N; k++) { const tt = ex.tr[0] + (ex.tr[1] - ex.tr[0]) * k / N, v = ex.f(...ex.pt(tt)); vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (key === "closest") hi = Math.min(hi, 40);
    const X = tt => pad.l + (tt - ex.tr[0]) / (ex.tr[1] - ex.tr[0]) * (W - pad.l - pad.r), Y = v => H - pad.b - (Math.min(v, hi) - lo) / ((hi - lo) || 1) * (H - pad.t - pad.b);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.fillStyle = rgbS(T.muted); c.font = `11px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "left";
    c.fillText("f along the constraint", pad.l, H - 6);
    c.textAlign = "right"; c.fillText(fx(hi, 0), pad.l - 6, pad.t + 8); c.fillText(fx(lo, 0), pad.l - 6, H - pad.b);
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2; c.beginPath();
    vals.forEach((v, k) => { const tt = ex.tr[0] + (ex.tr[1] - ex.tr[0]) * k / N; if (k) c.lineTo(X(tt), Y(v)); else c.moveTo(X(tt), Y(v)); }); c.stroke();
    for (const e of ex.ext) { const v = ex.f(...ex.pt(e.t)); c.fillStyle = rgbS(T.good); c.beginPath(); c.arc(X(e.t), Y(v), 4, 0, 6.283); c.fill(); c.font = `600 10px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "center"; c.fillText(e.k, X(e.t), Y(v) + (e.k === "min" ? 14 : -8)); }
    const v = ex.f(...ex.pt(t)); c.fillStyle = rgbS(T.glow); c.beginPath(); c.arc(X(t), Y(v), 6, 0, 6.283); c.fill();
  }
  function setT(v, fromSlider) { t = clamp(v, ex.tr[0], ex.tr[1]); if (!fromSlider) slider.value = toS(t); draw(); }
  function story() { const el = $("#lagStory"); el.innerHTML = `<p style="font-size:.95rem">${ex.story}</p>`; if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "\\(", right: "\\)", display: false }], throwOnError: false }); }
  function go(kind) {
    const cands = ex.ext.filter(e => e.k === kind); if (!cands.length) { $("#lagReads").querySelector(".v:last-child"); return pulse(kind); }
    const target = cands.reduce((b, e) => Math.abs(e.t - t) < Math.abs(b.t - t) ? e : b).t;
    if (reduce) return setT(target);
    const t0 = t, start = performance.now(), dur = 1100;
    cancelAnimationFrame(anim);
    const step = now => { const u = clamp((now - start) / dur, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; setT(t0 + (target - t0) * e); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function pulse() { if ($("#lagNoMax")) return; const s = $("#lagStory"); s.insertAdjacentHTML("beforeend", `<p class="note" style="padding:0" id="lagNoMax">On an endless line, \\(x^2+y^2\\) has no maximum: it keeps growing in both directions.</p>`); const n = $("#lagNoMax"); if (window.renderMathInElement) renderMathInElement(n, { delimiters: [{ left: "\\(", right: "\\)", display: false }], throwOnError: false }); setTimeout(() => n && n.remove(), 4000); }
  $("#lagMin").addEventListener("click", () => go("min"));
  $("#lagMax").addEventListener("click", () => go("max"));
  slider.addEventListener("input", () => { cancelAnimationFrame(anim); setT(fromS(+slider.value), true); });
  let dragging = false;
  const fromPointer = e => { const r = cv.getBoundingClientRect(), M = map(r.width, r.height), [x, y] = M.inv(e.clientX - r.left, e.clientY - r.top); cancelAnimationFrame(anim); setT(ex.proj(x, y)); };
  cv.addEventListener("pointerdown", e => { dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} fromPointer(e); });
  cv.addEventListener("pointermove", e => { if (dragging) fromPointer(e); });
  cv.addEventListener("pointerup", () => { dragging = false; }); cv.addEventListener("pointercancel", () => { dragging = false; });
  seg("#lagSeg", k => { key = k; ex = D[k]; t = ex.t0; buildGrid(); story(); slider.value = toS(t); draw(); });
  new ResizeObserver(draw).observe(cv);
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  buildGrid(); story(); slider.value = toS(t); draw();
})();

/* =====================================================================
   Box builder
   ===================================================================== */
(function boxes() {
  const xs = $("#boxX"), ys = $("#boxY"), heat = $("#boxHeat");
  const Z = (x, y) => (24 - x * y) / (2 * x + 2 * y);
  let T = tokens(TOK), heatImg = null;
  function svg(x, y, z) {
    const s = 13, ox = 190, oy = 92, P = (a, b, h) => [ox + (a - b) * 0.866 * s, oy + (a + b) * 0.5 * s - h * s];
    const pg = (cls, pts) => `<polygon class="${cls}" points="${pts.map(p => P(...p).map(v => v.toFixed(1)).join(",")).join(" ")}"/>`;
    let o = `<svg viewBox="0 0 380 250" role="img" aria-label="Open-top box ${x.toFixed(2)} by ${y.toFixed(2)} by ${z.toFixed(2)} feet">`;
    o += pg("bot", [[0, 0, 0], [x, 0, 0], [x, y, 0], [0, y, 0]]);
    o += pg("far", [[0, 0, 0], [0, y, 0], [0, y, z], [0, 0, z]]) + pg("far", [[0, 0, 0], [x, 0, 0], [x, 0, z], [0, 0, z]]);
    o += pg("near", [[x, 0, 0], [x, y, 0], [x, y, z], [x, 0, z]]) + pg("near", [[0, y, 0], [x, y, 0], [x, y, z], [0, y, z]]);
    const lx = P(x / 2, y, 0), ly = P(x, y / 2, 0), lz = P(x, y, z / 2);
    o += `<text x="${(lx[0] - 14).toFixed(1)}" y="${(lx[1] + 18).toFixed(1)}" text-anchor="end">x = ${x.toFixed(2)}</text>`;
    o += `<text x="${(ly[0] + 14).toFixed(1)}" y="${(ly[1] + 18).toFixed(1)}">y = ${y.toFixed(2)}</text>`;
    o += `<text x="${(lz[0] + 10).toFixed(1)}" y="${lz[1].toFixed(1)}">z = ${z.toFixed(2)}</text>`;
    return o + `</svg>`;
  }
  function paintHeat() {
    const { c, W, H } = canvas2d(heat), N = 90, cell = W / N;
    let vmax = 8 * Math.SQRT2;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = 1 + 5 * (i + 0.5) / N, y = 1 + 5 * (j + 0.5) / N, z = Z(x, y);
      c.fillStyle = z > 0 ? rgbS(ramp(T, x * y * z / vmax)) : rgbS(T.surface_2);
      c.fillRect(i * cell, H - (j + 1) * cell, cell + 0.6, cell + 0.6);
    }
    heatImg = c.getImageData(0, 0, heat.width, heat.height);
  }
  function update() {
    const x = +xs.value, y = +ys.value, z = Z(x, y), ok = z > 0;
    $("#boxXOut").textContent = x.toFixed(2) + " ft"; $("#boxYOut").textContent = y.toFixed(2) + " ft";
    $("#boxSvg").innerHTML = ok ? svg(x, y, z) : `<p class="note" style="text-align:center">The base alone (${(x * y).toFixed(1)} ft²) uses up more than 24 ft² of cardboard. Shrink it.</p>`;
    const V = ok ? x * y * z : 0, best = 8 * Math.SQRT2;
    $("#boxReads").innerHTML =
      `<div><div class="k">Height z</div><div class="v">${ok ? z.toFixed(2) + " ft" : "–"}</div></div>` +
      `<div><div class="k">Cardboard used</div><div class="v">${ok ? "24.00 ft²" : "–"}</div></div>` +
      `<div class="${ok && V > best - 0.05 ? "hl" : ""}"><div class="k">Volume</div><div class="v">${ok ? V.toFixed(2) + " ft³" : "–"}</div></div>`;
    $("#boxStatus").textContent = ok ? `${(V / best * 100).toFixed(0)}% of the best possible` : "";
    const { c, W, H } = canvas2d(heat);
    if (!heatImg || heatImg.width !== heat.width) paintHeat(); else c.putImageData(heatImg, 0, 0);
    const PX = v => (v - 1) / 5 * W, PY = v => H - (v - 1) / 5 * H;
    c.setTransform(Math.min(2, devicePixelRatio || 1), 0, 0, Math.min(2, devicePixelRatio || 1), 0, 0);
    c.strokeStyle = rgbS(T.ink); c.lineWidth = 2; c.beginPath(); c.arc(PX(x), PY(y), 7, 0, 6.283); c.stroke();
    c.fillStyle = rgbS(T.ink); c.font = `600 11px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "left";
    c.fillText("x →", W - 34, H - 6); c.save(); c.translate(12, 30); c.rotate(-Math.PI / 2); c.textAlign = "right"; c.fillText("y →", 0, 0); c.restore();
  }
  heat.addEventListener("click", e => { const r = heat.getBoundingClientRect(); xs.value = (1 + 5 * (e.clientX - r.left) / r.width).toFixed(2); ys.value = (1 + 5 * (1 - (e.clientY - r.top) / r.height)).toFixed(2); update(); });
  xs.addEventListener("input", update); ys.addEventListener("input", update);
  new ResizeObserver(() => { heatImg = null; update(); }).observe(heat);
  themeListeners.push(() => { T = tokens(TOK); heatImg = null; update(); });
  update();
})();

/* =====================================================================
   Riemann explorer (Lesson 23)
   ===================================================================== */
(function explorer() {
  const st = { pre: "para", m: 4, n: 4, sample: "ur", mode: "both" };
  const p = new Plot3D($("#rCv"), { pitch: 0.52, spin: 0.1, build: T => riemannScene(PRESETS[st.pre], st, T) });
  function reads() {
    const pre = PRESETS[st.pre], R = riemann(pre, st.m, st.n, st.sample);
    $("#rMOut").textContent = st.m; $("#rNOut").textContent = st.n;
    $("#rReads").innerHTML =
      `<div><div class="k">Δx · Δy = ΔA</div><div class="v">${R.dx.toFixed(3)} · ${R.dy.toFixed(3)}</div></div>` +
      `<div><div class="k">Σ f ΔA</div><div class="v">${fx(R.sum, 4)}</div></div>` +
      `<div><div class="k">Exact ∬ f dA</div><div class="v">${fx(pre.exact, 4)}</div></div>` +
      `<div class="hl"><div class="k">Error</div><div class="v">${fx(R.sum - pre.exact, 4)}</div></div>`;
  }
  const label = () => tex($("#rLabel"), PRESETS[st.pre].tex, false);
  $("#rM").addEventListener("input", e => { st.m = +e.target.value; p.rebuild(); reads(); });
  $("#rN").addEventListener("input", e => { st.n = +e.target.value; p.rebuild(); reads(); });
  seg("#rSam", k => { st.sample = k; p.rebuild(); reads(); });
  seg("#rMode", k => { st.mode = k; p.rebuild(); });
  seg("#rPre", k => { st.pre = k; p.rebuild(); reads(); label(); });
  p.rebuild(); reads(); label();
})();

/* =====================================================================
   Fubini loaf slicer
   ===================================================================== */
(function fubini() {
  const pre = PRESETS.para, NS = 12, M = 18;
  let dir = "x", cur = 0, timer = 0, playing = true, T = tokens(TOK);
  const lim = () => dir === "x" ? [pre.a, pre.b] : [pre.c, pre.d];
  function sliceArea(s) { // area of the cross-section at position s (Simpson)
    const n = 60, [lo, hi] = dir === "x" ? [pre.c, pre.d] : [pre.a, pre.b], h = (hi - lo) / n; let acc = 0;
    for (let k = 0; k <= n; k++) { const u = lo + k * h, v = dir === "x" ? pre.f(s, u) : pre.f(u, s); acc += v * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2); }
    return acc * h / 3;
  }
  function running(sEnd) { const [lo] = lim(), n = 60, h = (sEnd - lo) / n; let acc = 0; for (let k = 0; k <= n; k++) acc += sliceArea(lo + k * h) * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2); return acc * h / 3; }
  function build(T0) {
    T = T0; const groups = [], [lo, hi] = lim(), w = (hi - lo) / NS;
    for (let i = 0; i < NS; i++) {
      const s0 = lo + i * w + w * 0.08, s1 = lo + (i + 1) * w - w * 0.08, sm = lo + (i + 0.5) * w;
      const col = i < cur ? T.accent : i === cur ? T.glow : T.surface_2, a = i > cur ? 0.55 : 1;
      const [u0, u1] = dir === "x" ? [pre.c, pre.d] : [pre.a, pre.b];
      const us = [], hs = [];
      for (let j = 0; j <= M; j++) { const u = u0 + (u1 - u0) * j / M; us.push(u); hs.push(dir === "x" ? pre.f(sm, u) : pre.f(u, sm)); }
      const pt = (s, u, z) => dir === "x" ? [s, u, z] : [u, s, z];
      const faces = [], stl = { st: T.plot, sa: 0.5, lw: 0.6 }, nrm = (ns, nu, nz) => dir === "x" ? [ns, nu, nz] : [nu, ns, nz];
      const sect = s => [pt(s, u0, 0), ...us.map((u, j) => pt(s, u, hs[j])), pt(s, u1, 0)];
      faces.push({ ...stl, col, a, p: sect(s0), n: nrm(-1, 0, 0) }, { ...stl, col, a, p: sect(s1), n: nrm(1, 0, 0) });
      faces.push({ ...stl, col, a, p: [pt(s0, u0, 0), pt(s1, u0, 0), pt(s1, u0, hs[0]), pt(s0, u0, hs[0])], n: nrm(0, -1, 0) });
      faces.push({ ...stl, col, a, p: [pt(s0, u1, 0), pt(s1, u1, 0), pt(s1, u1, hs[M]), pt(s0, u1, hs[M])], n: nrm(0, 1, 0) });
      for (let j = 0; j < M; j++) {
        const slope = (hs[j + 1] - hs[j]) / (us[j + 1] - us[j]);
        faces.push({ col, a, p: [pt(s0, us[j], hs[j]), pt(s1, us[j], hs[j]), pt(s1, us[j + 1], hs[j + 1]), pt(s0, us[j + 1], hs[j + 1])], n: nrm(0, -slope, 1) });
      }
      const hm = Math.max(...hs);
      groups.push({ at: dir === "x" ? [sm, (u0 + u1) / 2, hm / 2] : [(u0 + u1) / 2, sm, hm / 2], faces });
    }
    return { bounds: { a: pre.a, b: pre.b, c: pre.c, d: pre.d, zlo: 0, zhi: 16 }, groups, labels: pre.labels };
  }
  const p = new Plot3D($("#fCv"), { pitch: 0.5, spin: 0.08, build, tick(dt) { if (!playing) return; timer += dt; if (timer > (cur === NS - 1 ? 2.6 : 0.6)) { timer = 0; cur = (cur + 1) % NS; $("#fK").value = cur + 1; p.rebuild(); plot(); } } });
  function plot() {
    const cv = $("#fPlot"), { c, W, H } = canvas2d(cv), pad = { l: 46, r: 14, t: 14, b: 26 }, [lo, hi] = lim(), w = (hi - lo) / NS;
    let amax = 0; for (let k = 0; k <= 40; k++) amax = Math.max(amax, sliceArea(lo + (hi - lo) * k / 40));
    const X = s => pad.l + (s - lo) / (hi - lo) * (W - pad.l - pad.r), Y = v => H - pad.b - v / (amax * 1.12) * (H - pad.t - pad.b);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    const sEnd = lo + (cur + 1) * w;
    c.fillStyle = rgbS(T.accent, 0.22); c.beginPath(); c.moveTo(X(lo), Y(0));
    for (let k = 0; k <= 60; k++) { const s = lo + (sEnd - lo) * k / 60; c.lineTo(X(s), Y(sliceArea(s))); }
    c.lineTo(X(sEnd), Y(0)); c.closePath(); c.fill();
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2.2; c.beginPath();
    for (let k = 0; k <= 80; k++) { const s = lo + (hi - lo) * k / 80; if (k) c.lineTo(X(s), Y(sliceArea(s))); else c.moveTo(X(s), Y(sliceArea(s))); } c.stroke();
    const sm = lo + (cur + 0.5) * w, am = sliceArea(sm);
    c.strokeStyle = rgbS(T.glow); c.lineWidth = 2; c.beginPath(); c.moveTo(X(sm), Y(0)); c.lineTo(X(sm), Y(am)); c.stroke();
    c.fillStyle = rgbS(T.glow); c.beginPath(); c.arc(X(sm), Y(am), 5, 0, 6.283); c.fill();
    c.fillStyle = rgbS(T.muted); c.font = `11px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "right";
    c.fillText(amax.toFixed(0), pad.l - 6, Y(amax) + 4); c.fillText("0", pad.l - 6, Y(0) + 4);
    c.textAlign = "center"; c.fillText(String(lo), X(lo), H - 8); c.fillText(String(hi), X(hi), H - 8);
    c.textAlign = "left"; c.fillText(dir === "x" ? "slice area A(x) = ∫ f dy" : "slice area B(y) = ∫ f dx", pad.l + 6, pad.t + 8);
    const v = dir === "x" ? "x" : "y";
    $("#fKOut").textContent = `${cur + 1} of ${NS}`;
    $("#fReads").innerHTML =
      `<div><div class="k">Slice at ${v} =</div><div class="v">${sm.toFixed(3)}</div></div>` +
      `<div><div class="k">Its area (inner integral)</div><div class="v">${am.toFixed(2)}</div></div>` +
      `<div class="hl"><div class="k">Added so far (outer)</div><div class="v">${running(sEnd).toFixed(2)} / 48</div></div>`;
  }
  $("#fK").addEventListener("input", e => { cur = +e.target.value - 1; playing = false; setPlay(); p.rebuild(); plot(); });
  const pb = $("#fPlay"), setPlay = () => { pb.textContent = playing ? "Pause" : "Play"; pb.setAttribute("aria-pressed", String(playing)); };
  pb.addEventListener("click", () => { playing = !playing; setPlay(); });
  if (reduce) { playing = false; pb.hidden = true; cur = 5; $("#fK").value = 6; }
  seg("#fDir", k => { dir = k; cur = 0; $("#fK").value = 1; timer = 0; p.rebuild(); plot(); });
  new ResizeObserver(plot).observe($("#fPlot"));
  themeListeners.push(plot);
  p.rebuild(); plot();
})();

/* =====================================================================
   Level it out (average value)
   ===================================================================== */
(function level() {
  const pre = PRESETS.para, st = { m: 12, n: 12, sample: "mid", mode: "boxes", melt: 0 };
  let playing = false, dirn = 1;
  const p = new Plot3D($("#aCv"), { pitch: 0.45, spin: 0.1, build: T => riemannScene(pre, st, T),
    tick(dt) { if (!playing) return; st.melt += dirn * dt * 0.45; if (st.melt >= 1) { st.melt = 1; dirn = -1; } if (st.melt <= 0) { st.melt = 0; dirn = 1; } $("#aT").value = st.melt; p.rebuild(); reads(); } });
  function reads() {
    const R = riemann(pre, 12, 12, "mid");
    $("#aTOut").textContent = Math.round(st.melt * 100) + "%";
    $("#aReads").innerHTML =
      `<div><div class="k">Volume (sand)</div><div class="v">${R.sum.toFixed(2)}</div></div>` +
      `<div><div class="k">Area of R</div><div class="v">4</div></div>` +
      `<div class="hl"><div class="k">Flat height = volume ÷ area</div><div class="v">${(R.sum / 4).toFixed(2)}</div></div>`;
  }
  $("#aT").addEventListener("input", e => { st.melt = +e.target.value; playing = false; setB(); p.rebuild(); reads(); });
  const b = $("#aPlay"), setB = () => { b.textContent = playing ? "Pause" : "▶ Animate"; b.setAttribute("aria-pressed", String(playing)); };
  b.addEventListener("click", () => { playing = !playing; setB(); });
  if (reduce) b.hidden = true;
  p.rebuild(); reads();
})();

/* =====================================================================
   Region explorer (Lesson 24)
   ===================================================================== */
(function regions() {
  const E2 = Math.exp(2), E3 = Math.exp(3);
  const R = {
    tri: { name: "Triangle (Ex. 1)", win: [-0.3, 1.45, -0.3, 1.3], eq: true,
      inside: (x, y) => x >= 0 && x <= 1 && y >= 0 && y <= x,
      outline: [[0, 0], [1, 0], [1, 1]],
      curves: [{ f: [[-0.25, -0.25], [1.35, 1.35]], lab: "y = x", at: [0.42, 0.62] }, { f: [[1, -0.25], [1, 1.25]], lab: "x = 1", at: [1.13, 0.2] }],
      I: { r: [0, 1], piece: () => ["y = 0", "y = x"], tex: "\\int_0^1\\!\\!\\int_0^{x} f\\,dy\\,dx", note: "One piece." },
      II: { r: [0, 1], piece: () => ["x = y", "x = 1"], tex: "\\int_0^1\\!\\!\\int_y^{1} f\\,dx\\,dy", note: "One piece. Either order is fine here." } },
    par: { name: "Parabola (Ex. 2)", win: [-4.2, 7.2, -2.8, 3.8], eq: true,
      inside: (x, y) => y >= -2 && y <= 3 && x >= y * y - 3 && x <= y + 3,
      outline: [...Array.from({ length: 41 }, (_, k) => { const y = -2 + 5 * k / 40; return [y * y - 3, y]; }), [6, 3], [1, -2]],
      curves: [{ g: y => y * y - 3, yr: [-2.7, 2.9], lab: "x = y² − 3", at: [-3.9, 1.2] }, { f: [[-0.8, -3.8], [7, 4]], lab: "x = y + 3", at: [4.6, 1.0] }],
      I: { r: [-3, 6], piece: x => x < 1 ? ["y = −√(x+3)", "y = √(x+3)"] : ["y = x − 3", "y = √(x+3)"], tex: "\\int_{-3}^{1}\\!\\!\\int_{-\\sqrt{x+3}}^{\\sqrt{x+3}} f\\,dy\\,dx \\;+\\; \\int_{1}^{6}\\!\\!\\int_{x-3}^{\\sqrt{x+3}} f\\,dy\\,dx", note: "Two pieces: the bottom boundary switches from the parabola to the line at x = 1." },
      II: { r: [-2, 3], piece: () => ["x = y² − 3", "x = y + 3"], tex: "\\int_{-2}^{3}\\!\\!\\int_{y^2-3}^{y+3} f\\,dx\\,dy", note: "One piece ✓ the easier choice." } },
    wide: { name: "Wide triangle (avg. value)", win: [-8.2, 8.2, -1, 8], eq: true,
      inside: (x, y) => y >= 0 && y <= 7 && x >= y - 7 && x <= 7 - y,
      outline: [[-7, 0], [7, 0], [0, 7]],
      curves: [{ f: [[-8, -1], [0.6, 7.6]], lab: "x = y − 7", at: [-5.6, 3.2] }, { f: [[8, -1], [-0.6, 7.6]], lab: "x = 7 − y", at: [5.6, 3.2] }],
      I: { r: [-7, 7], piece: x => x < 0 ? ["y = 0", "y = x + 7"] : ["y = 0", "y = 7 − x"], tex: "\\int_{-7}^{0}\\!\\!\\int_{0}^{x+7} f\\,dy\\,dx \\;+\\; \\int_{0}^{7}\\!\\!\\int_{0}^{7-x} f\\,dy\\,dx", note: "Two pieces: the top boundary switches lines at x = 0." },
      II: { r: [0, 7], piece: () => ["x = y − 7", "x = 7 − y"], tex: "\\int_{0}^{7}\\!\\!\\int_{y-7}^{7-y} f\\,dx\\,dy", note: "One piece ✓ the easier choice." } },
    exp: { name: "Between curves (practice 2)", win: [1.75, 3.25, -1.5, 22], eq: false,
      inside: (x, y) => x >= 2 && x <= 3 && y >= 1 / (6 * x) && y <= Math.exp(x),
      outline: [...Array.from({ length: 21 }, (_, k) => { const x = 2 + k / 20; return [x, 1 / (6 * x)]; }), ...Array.from({ length: 21 }, (_, k) => { const x = 3 - k / 20; return [x, Math.exp(x)]; })],
      curves: [{ h: x => Math.exp(x), xr: [1.8, 3.1], lab: "y = eˣ", at: [2.25, 15] }, { h: x => 1 / (6 * x), xr: [1.8, 3.2], lab: "y = 1/(6x)", at: [2.5, 2.2] }, { f: [[2, -1.4], [2, 21]], lab: "x = 2", at: [1.86, 20] }, { f: [[3, -1.4], [3, 21]], lab: "x = 3", at: [3.14, 20] }],
      I: { r: [2, 3], piece: () => ["y = 1/(6x)", "y = eˣ"], tex: "\\int_{2}^{3}\\!\\!\\int_{1/(6x)}^{e^{x}} f\\,dy\\,dx", note: "One piece ✓ the easier choice." },
      II: { r: [1 / 18, E3], piece: y => y < 1 / 12 ? ["x = 1/(6y)", "x = 3"] : y < E2 ? ["x = 2", "x = 3"] : ["x = ln y", "x = 3"], tex: "\\int_{1/18}^{1/12}\\!\\!\\int_{1/(6y)}^{3} f\\,dx\\,dy + \\int_{1/12}^{e^2}\\!\\!\\int_{2}^{3} f\\,dx\\,dy + \\int_{e^2}^{e^3}\\!\\!\\int_{\\ln y}^{3} f\\,dx\\,dy", note: "Three pieces: the left boundary changes twice. Not worth it." } }
  };
  let key = "tri", type = "I", s = 0.3, dirn = 1, hold = 0, T = tokens(TOK);
  const cv = $("#gCv"), slider = $("#gS");
  $("#gReg").innerHTML = Object.entries(R).map(([k, r]) => `<button type="button" data-k="${k}" aria-pressed="${k === key}">${r.name}</button>`).join("");
  $("#gReg").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $$("#gReg button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); key = b.dataset.k; setup(); draw(); });
  seg("#gType", k => { type = k; setup(); draw(); });
  function setup() { const r = R[key][type], el = $("#gSetup"); el.innerHTML = `<div id="gTex"></div><p class="note">${r.note}</p>`; tex($("#gTex"), r.tex, true); }
  function map(W, H) {
    const [x0, x1, y0, y1] = R[key].win, pad = 10;
    let sx = (W - 2 * pad) / (x1 - x0), sy = (H - 2 * pad) / (y1 - y0);
    if (R[key].eq) sx = sy = Math.min(sx, sy);
    const ox = (W - (x1 - x0) * sx) / 2, oy = (H - (y1 - y0) * sy) / 2;
    return { X: x => ox + (x - x0) * sx, Y: y => H - oy - (y - y0) * sy };
  }
  function pill(c, text, x, y, col) {
    c.font = `600 12px "JetBrains Mono", ui-monospace, monospace`; const w = c.measureText(text).width + 12;
    c.fillStyle = rgbS(T.plot, 0.92); c.strokeStyle = col; c.lineWidth = 1.5;
    c.beginPath(); if (c.roundRect) c.roundRect(x - w / 2, y - 11, w, 22, 11); else c.rect(x - w / 2, y - 11, w, 22); c.fill(); c.stroke();
    c.fillStyle = col; c.textAlign = "center"; c.fillText(text, x, y + 4);
  }
  function draw() {
    const { c, W, H } = canvas2d(cv), reg = R[key], M = map(W, H), [x0, x1, y0, y1] = reg.win;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    // grid
    const span = Math.max(x1 - x0, y1 - y0), stp = span > 12 ? 2 : span > 5 ? 1 : 0.25, ystp = reg.eq ? stp : 5;
    c.strokeStyle = rgbS(T.grid); c.setLineDash([2, 4]); c.lineWidth = 1;
    for (let g = Math.ceil(x0 / stp) * stp; g <= x1; g += stp) { c.beginPath(); c.moveTo(M.X(g), M.Y(y0)); c.lineTo(M.X(g), M.Y(y1)); c.stroke(); }
    for (let g = Math.ceil(y0 / ystp) * ystp; g <= y1; g += ystp) { c.beginPath(); c.moveTo(M.X(x0), M.Y(g)); c.lineTo(M.X(x1), M.Y(g)); c.stroke(); }
    c.setLineDash([]); c.strokeStyle = rgbS(T.muted); c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(M.X(x0), M.Y(0)); c.lineTo(M.X(x1), M.Y(0)); if (x0 < 0 && x1 > 0) { c.moveTo(M.X(0), M.Y(y0)); c.lineTo(M.X(0), M.Y(y1)); } c.stroke();
    c.fillStyle = rgbS(T.muted); c.font = `10.5px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "center";
    for (let g = Math.ceil(x0 / stp) * stp; g <= x1; g += stp) if (Math.abs(g) > 1e-9) c.fillText(+g.toFixed(2), M.X(g), M.Y(0) + 14);
    c.textAlign = "right"; const yx = x0 < 0 && x1 > 0 ? M.X(0) - 5 : M.X(x0) + 26;
    for (let g = Math.ceil(y0 / ystp) * ystp; g <= y1; g += ystp) if (Math.abs(g) > 1e-9) c.fillText(+g.toFixed(2), yx, M.Y(g) + 4);
    // region
    c.fillStyle = rgbS(T.accent, 0.18); c.strokeStyle = rgbS(T.accent); c.lineWidth = 2;
    c.beginPath(); reg.outline.forEach((p, i) => i ? c.lineTo(M.X(p[0]), M.Y(p[1])) : c.moveTo(M.X(p[0]), M.Y(p[1]))); c.closePath(); c.fill();
    // boundary curves
    c.strokeStyle = rgbS(T.ink, 0.8); c.lineWidth = 1.8;
    for (const cu of reg.curves) {
      c.beginPath();
      if (cu.f) { c.moveTo(M.X(cu.f[0][0]), M.Y(cu.f[0][1])); c.lineTo(M.X(cu.f[1][0]), M.Y(cu.f[1][1])); }
      if (cu.g) for (let k = 0; k <= 80; k++) { const y = cu.yr[0] + (cu.yr[1] - cu.yr[0]) * k / 80; if (k) c.lineTo(M.X(cu.g(y)), M.Y(y)); else c.moveTo(M.X(cu.g(y)), M.Y(y)); }
      if (cu.h) for (let k = 0; k <= 80; k++) { const x = cu.xr[0] + (cu.xr[1] - cu.xr[0]) * k / 80, y = clamp(cu.h(x), y0, y1); if (k) c.lineTo(M.X(x), M.Y(y)); else c.moveTo(M.X(x), M.Y(y)); }
      c.stroke();
      c.fillStyle = rgbS(T.ink); c.font = `600 11.5px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "center"; c.fillText(cu.lab, M.X(cu.at[0]), M.Y(cu.at[1]));
    }
    // sweep line
    const ty = reg[type], pos = ty.r[0] + (ty.r[1] - ty.r[0]) * s;
    $("#gSOut").textContent = (type === "I" ? "x = " : "y = ") + fx(pos, 2);
    const runs = [], N = 700;
    let inRun = false, start = 0, prev = 0;
    for (let k = 0; k <= N; k++) {
      const u = (type === "I" ? y0 : x0) + ((type === "I" ? y1 - y0 : x1 - x0)) * k / N;
      const ins = type === "I" ? reg.inside(pos, u) : reg.inside(u, pos);
      if (ins && !inRun) { inRun = true; start = u; }
      if (!ins && inRun) { inRun = false; runs.push([start, prev]); }
      prev = u;
    }
    if (inRun) runs.push([start, prev]);
    c.strokeStyle = rgbS(T.glow, 0.45); c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath();
    if (type === "I") { c.moveTo(M.X(pos), M.Y(y0)); c.lineTo(M.X(pos), M.Y(y1)); } else { c.moveTo(M.X(x0), M.Y(pos)); c.lineTo(M.X(x1), M.Y(pos)); }
    c.stroke(); c.setLineDash([]);
    const [loL, hiL] = ty.piece(pos);
    for (const [u0, u1] of runs) {
      const A = type === "I" ? [M.X(pos), M.Y(u0)] : [M.X(u0), M.Y(pos)], B = type === "I" ? [M.X(pos), M.Y(u1)] : [M.X(u1), M.Y(pos)];
      c.strokeStyle = rgbS(T.glow); c.lineWidth = 4; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
      c.fillStyle = rgbS(T.glow); [A, B].forEach(q => { c.beginPath(); c.arc(q[0], q[1], 5, 0, 6.283); c.fill(); });
      if (type === "I") { pill(c, "enters " + loL, A[0], Math.min(H - 14, A[1] + 22), rgbS(T.glow)); pill(c, "leaves " + hiL, B[0], Math.max(14, B[1] - 22), rgbS(T.glow)); }
      else { pill(c, "enters " + loL, Math.max(80, A[0] - 4), A[1] - 22, rgbS(T.glow)); pill(c, "leaves " + hiL, Math.min(W - 80, B[0] + 4), B[1] + 22, rgbS(T.glow)); }
    }
  }
  slider.addEventListener("input", () => { s = +slider.value / 1000; hold = performance.now() + 5000; draw(); });
  whenVisible(cv, dt => { if (performance.now() < hold) return; s += dirn * dt * 0.16; if (s > 1) { s = 1; dirn = -1; } if (s < 0) { s = 0; dirn = 1; } slider.value = Math.round(s * 1000); draw(); });
  new ResizeObserver(draw).observe(cv);
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  setup(); draw();
})();
