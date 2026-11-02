/* Two live vector views on 2D canvases, sharing one renderer. The scale is the same on every axis, so angles stay honest.
   Plot3D isn't used here because it rescales z to fit its box, which would bend the very angle this page is about. */
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = a => Math.hypot(a[0], a[1], a[2]);
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const DEG = 180 / Math.PI;

function vecStage(cv, state, o = {}) {
  let T = tokens(TOK), yaw0 = o.yaw ?? -1.9, yaw = yaw0, pitch = o.pitch ?? .42, hold = 0, drag = null, clock = 0;
  /* Rock around the chosen view. A full spin would turn the sheet holding both arrows edge-on and hide the angle. */
  const rock = reduce ? 0 : (o.rock ?? .45), sway = () => rock * Math.sin(clock * .3);
  const held = () => { yaw0 = yaw - sway(); hold = performance.now() + 6000; draw(); };

  function draw() {
    const { c, W, H } = canvas2d(cv), { a, b } = state(), la = len3(a), lb = len3(b);
    const reach = Math.max(2.6, la, lb) * 1.06, s = Math.min(W, H) / (2 * reach), g = Math.ceil(reach * .86), ox = W / 2, oy = H / 2;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const P = p => [ox + s * (-sy * p[0] + cy * p[1]), oy - s * (-sp * cy * p[0] - sp * sy * p[1] + cp * p[2])];
    const line = (p, q, col, w, dash) => {
      const A = P(p), B = P(q);
      c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.setLineDash(dash || []);
      c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.setLineDash([]);
    };
    const word = (t, p, col, dx = 0, dy = 0, font = "700 15px 'JetBrains Mono', ui-monospace, monospace") => {
      const A = P(p); c.font = font; c.fillStyle = col; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, A[0] + dx, A[1] + dy);
    };
    const arrow = (q, col) => {
      const B = P(q), A = P([0, 0, 0]), d = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (d < 2) return;
      const ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d, h = Math.min(14, d * .45);
      c.strokeStyle = col; c.lineWidth = 3.4; c.lineCap = "round";
      c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0] - ux * h, B[1] - uy * h); c.stroke();
      c.fillStyle = col; c.beginPath(); c.moveTo(B[0], B[1]);
      c.lineTo(B[0] - ux * h - uy * h * .48, B[1] - uy * h + ux * h * .48);
      c.lineTo(B[0] - ux * h + uy * h * .48, B[1] - uy * h - ux * h * .48); c.closePath(); c.fill();
    };

    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    for (let i = -g; i <= g; i++) { line([i, -g, 0], [i, g, 0], rgbS(T.grid), 1); line([-g, i, 0], [g, i, 0], rgbS(T.grid), 1); }
    ["x", "y", "z"].forEach((n, i) => {
      const lo = [0, 0, 0], hi = [0, 0, 0]; lo[i] = -g; hi[i] = g + .2;
      line(lo, hi, rgbS(T.muted), 1.2);
      word(n, mul3(hi, 1.06), rgbS(T.muted), 0, 0, "12px 'JetBrains Mono', ui-monospace, monospace");
    });

    if (la > 1e-9 && lb > 1e-9) {
      const d = dot3(a, b), cosT = clamp(d / (la * lb), -1, 1), th = Math.acos(cosT), ah = mul3(a, 1 / la), bh = mul3(b, 1 / lb);
      const foot = mul3(a, d / (la * la)), sh = rgbS(d >= 0 ? T.s2 : T.bad);
      if (Math.sin(th) > 1e-3) {
        const wh = mul3([bh[0] - cosT * ah[0], bh[1] - cosT * ah[1], bh[2] - cosT * ah[2]], 1 / Math.sin(th)), r = Math.min(la, lb, 1.05) * .7;
        const at = (t, q) => [0, 1, 2].map(i => q * (Math.cos(t) * ah[i] + Math.sin(t) * wh[i]));
        c.beginPath(); c.moveTo(...P([0, 0, 0]));
        for (let i = 0; i <= 28; i++) c.lineTo(...P(at(th * i / 28, r)));
        c.closePath(); c.fillStyle = rgbS(T.s3, .3); c.fill(); c.strokeStyle = rgbS(T.s3); c.lineWidth = 1.5; c.stroke();
        word("θ", at(th / 2, r + .42), rgbS(T.ink));
      }
      if (d < 0) line([0, 0, 0], foot, rgbS(T.muted), 1.2, [2, 5]);
      line(b, foot, rgbS(T.muted), 1.4, [4, 5]);
      line([0, 0, 0], foot, sh, 7);
      arrow(a, rgbS(T.accent)); arrow(b, rgbS(T.glow));
      word("a", mul3(a, 1 + .32 / la), rgbS(T.accent)); word("b", mul3(b, 1 + .32 / lb), rgbS(T.glow));
    } else {
      if (la) arrow(a, rgbS(T.accent));
      if (lb) arrow(b, rgbS(T.glow));
    }
  }

  cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener("pointermove", e => {
    if (!drag) return;
    yaw = drag.yaw - (e.clientX - drag.x) * .01;
    pitch = clamp(drag.pitch + (e.clientY - drag.y) * .007, .04, 1.5);
    held();
  });
  const end = () => { drag = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  cv.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") yaw -= .12; else if (e.key === "ArrowRight") yaw += .12;
    else if (e.key === "ArrowUp") pitch = clamp(pitch + .08, .04, 1.5); else if (e.key === "ArrowDown") pitch = clamp(pitch - .08, .04, 1.5);
    else return;
    e.preventDefault(); held();
  });
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  whenVisible(cv, dt => { if (o.tick) o.tick(dt); if (!drag && performance.now() > hold) { clock += dt; yaw = yaw0 + sway(); } draw(); });
  draw();
  return { draw };
}

const verdict = c => Math.abs(c) < 1e-9 ? "perpendicular" : c > 1 - 1e-9 ? "same direction" : c < -1 + 1e-9 ? "opposite" : c > 0 ? "acute" : "obtuse";

/* ---------- hero: b swings around a in one flat sheet, so only the angle changes ---------- */
(function hero() {
  const a = [2, 2, 1], ah = mul3(a, 1 / 3), u = [-1 / Math.sqrt(5), 0, 2 / Math.sqrt(5)], L = 2.4;
  let th = 40, phase = Math.asin(-50 / 82), playing = !reduce;
  const b = () => [0, 1, 2].map(i => L * (Math.cos(th / DEG) * ah[i] + Math.sin(th / DEG) * u[i]));
  const slider = $("#hTh"), btn = $("#heroPlay");
  function reads() {
    const c = Math.cos(th / DEG), d = 3 * L * c, shown = Math.round(th);
    slider.value = shown; $("#hThOut").textContent = shown + "°"; $("#hAngle").textContent = shown + "°";
    $("#hCos").textContent = fx(c, 3); $("#hDot").textContent = fx(d, 2);
    $("#hWord").textContent = verdict(shown === 90 ? 0 : Math.cos(shown / DEG));
  }
  function setPlaying(on) { playing = on; btn.textContent = on ? "Pause" : "Play"; btn.setAttribute("aria-pressed", String(on)); }
  vecStage($("#heroCv"), () => ({ a, b: b() }), {
    yaw: -1.25, pitch: .5, rock: .3,
    tick(dt) { if (!playing) return; phase += .42 * dt; th = 90 + 82 * Math.sin(phase); reads(); }
  });
  slider.addEventListener("input", () => { setPlaying(false); th = +slider.value; reads(); });
  btn.addEventListener("click", () => { if (!playing) phase = Math.asin(clamp((th - 90) / 82, -1, 1)); setPlaying(!playing); });
  if (reduce) btn.hidden = true;
  reads();
})();

/* ---------- explorer: any two whole-number vectors, with every line of the method live ---------- */
(function explorer() {
  const names = ["a1", "a2", "a3", "b1", "b2", "b3"], box = names.map(n => $("#x" + n));
  let a = [0, 0, 0], b = [0, 0, 0];
  const stage = vecStage($("#xCv"), () => ({ a, b }), { yaw: -2.82, pitch: .62 });
    function read() {
    const v = box.map(s => +s.value);
    a = v.slice(0, 3); b = v.slice(3);
    names.forEach((n, i) => { $("#x" + n + "Out").textContent = minus(v[i]); });
    const d = dot3(a, b), a2 = dot3(a, a), b2 = dot3(b, b), la = Math.sqrt(a2), lb = Math.sqrt(b2);
    tex($("#xDot"), String.raw`\mathbf a\cdot\mathbf b=${[0, 1, 2].map(i => `(${a[i]})(${b[i]})`).join("+")}=${d}`, true);
    $("#xLa").textContent = fx(la, 3); $("#xLb").textContent = fx(lb, 3);
    if (!a2 || !b2) {
      tex($("#xCos"), String.raw`\text{A zero vector has no direction, so there's no angle.}`, true);
      $("#xC").textContent = "–"; $("#xTh").textContent = "–"; $("#xWord").textContent = "no angle"; $("#xWord").classList.remove("ok");
    } else {
      const c = clamp(d / (la * lb), -1, 1), th = Math.acos(c) * DEG;
      tex($("#xCos"), String.raw`\cos\theta=\frac{${d}}{\sqrt{${a2}}\,\sqrt{${b2}}}\approx ${fx(c, 4)}`, true);
      $("#xC").textContent = fx(c, 4); $("#xTh").textContent = fx(th, 1) + "°";
      $("#xWord").textContent = verdict(d === 0 ? 0 : d / (la * lb)); $("#xWord").classList.toggle("ok", d === 0);
    }
    stage.draw();
  }
  box.forEach(s => s.addEventListener("input", read));
  read();
})();
