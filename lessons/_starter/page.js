/* Page-specific interactives. This file shares a closure with engine/js/shell.js (see the handoff guide, section 7).
   Replace the demo below with the lesson's own interactives. */
(function demo() {
  const cv = $("#demoCv"), slider = $("#demoA");
  let T = tokens(TOK), t = 0;
  function draw() {
    const { c, W, H } = canvas2d(cv), A = +slider.value, mid = H / 2, scale = H * .22;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2.5; c.beginPath();
    for (let x = 0; x <= W; x += 2) { const y = mid - A * scale * Math.sin(x / W * 12 - t); if (x) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
    $("#demoAOut").textContent = fx(A);
    $("#demoPk").textContent = fx(A);
    $("#demoArea").textContent = fx(2 * A);
    $("#demoStatus").textContent = "live";
  }
  slider.addEventListener("input", draw);
  themeListeners.push(() => { T = tokens(TOK); draw(); });
  new ResizeObserver(draw).observe(cv);
  whenVisible(cv, dt => { t += dt * 1.6; draw(); });     // runs only on screen, and never under reduced motion
  draw();
})();
