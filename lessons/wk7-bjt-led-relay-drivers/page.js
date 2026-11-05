/* BJT LED & relay drivers: the live interactives. Circuit maths comes from shared.js, a port of verify.py, so every
   number here is the same Gummel-Poon + LED-model solve that reproduces the LTspice answers. */
let T = tokens(TOK);
themeListeners.push(() => { T = tokens(TOK); });
const tc = n => css("--" + n);
const amps = v => eng(v, "A"), volts = (v, d = 3) => eng(v, "V", d);
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;

/* a chart frame on a 2D canvas. o = { x:[a,b], y:[a,b], xt, yt, xl, yl, fx, fy, pad } */
function chart(c, W, H, o) {
  const p = Object.assign({ l: 50, r: 14, t: 14, b: 38 }, o.pad || {});
  const X = v => p.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * (W - p.l - p.r);
  const Y = v => H - p.b - (v - o.y[0]) / (o.y[1] - o.y[0]) * (H - p.t - p.b);
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
  c.font = `11px ${css("--f-mono")}`; c.lineWidth = 1;
  for (const v of o.xt) { const x = X(v); c.strokeStyle = rgbS(T.grid); c.beginPath(); c.moveTo(x, p.t); c.lineTo(x, H - p.b); c.stroke(); c.fillStyle = rgbS(T.muted); c.textAlign = "center"; c.fillText(o.fx ? o.fx(v) : String(v), x, H - p.b + 15); }
  for (const v of o.yt) { const y = Y(v); c.strokeStyle = rgbS(T.grid); c.beginPath(); c.moveTo(p.l, y); c.lineTo(W - p.r, y); c.stroke(); c.fillStyle = rgbS(T.muted); c.textAlign = "right"; c.fillText(o.fy ? o.fy(v) : String(v), p.l - 6, y + 4); }
  c.fillStyle = rgbS(T.muted); c.textAlign = "center";
  if (o.xl) c.fillText(o.xl, (p.l + W - p.r) / 2, H - 6);
  if (o.yl) { c.save(); c.translate(12, (p.t + H - p.b) / 2); c.rotate(-Math.PI / 2); c.fillText(o.yl, 0, 0); c.restore(); }
  c.textAlign = "left";
  return { X, Y, p };
}
function stroke(c, pts, col, w = 2, dash) { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.setLineDash([]); }
function blob(c, x, y, col, r = 5) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = rgbS(T.plot); c.lineWidth = 2; c.stroke(); }
function tag(c, x, y, s, col, align = "left") { c.font = `600 11px ${css("--f-mono")}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }
const slideIdx = (el, vals, out, fmt) => { const v = vals[+el.value]; if (out) out.textContent = fmt ? fmt(v) : fmtOhm(v); return v; };

/* ---------- hero: one pin, three jobs ---------- */
(function hero() {
  const box = $("#heroSch"), pin = $("#heroPin"), reads = $("#heroReads"), why = $("#heroWhy"), status = $("#heroStatus");
  const M = {
    npn: { hi: 3.3, R1: 1500, R2: 100, box: [24, 14, 424, 336] },
    pnp: { hi: 5, R1: 2700, R2: 130, box: [24, 14, 424, 336] },
    relay: { hi: 3.3, R1: 1000, box: [30, 14, 632, 336] }
  };
  let mode = "npn", high = true, s, h, F = {}, vinT, field, lit = 0, arm = 0, t = 0, r = {};
  function draw() {
    const m = M[mode], txt = (p, a, o) => s.text(p, a, o);
    box.innerHTML = ""; box.style.setProperty("--ar", (m.box[2] / m.box[3]).toFixed(3));
    s = Schem.svg(box, m.box, mode === "relay" ? "npn relay driver: the pin drives the base through R1, the transistor switches a relay coil on 12 volts, and the relay's contacts switch a 120 volt lamp"
      : mode === "pnp" ? "pnp LED driver: the emitter sits on 5 volts, the pin pulls the base through R1, and the collector feeds a green LED and R2 to ground"
      : "npn LED driver: the pin drives the base through R1, and the collector pulls current from 5 volts through R2 and a white LED");
    if (mode === "npn") {
      h = drawNpnLed(s);
      txt([98, 117], "Vcc"); txt([98, 135], "5 V", { cls: "sm" }); txt([348, 68], "R2"); txt([348, 86], fmtOhm(m.R2), { cls: "sm" });
      txt([312, 141], "white", { anchor: "end", cls: "sm" }); txt([312, 158], "LED", { anchor: "end" }); txt(h.flag, "Vce", { anchor: "middle", cls: "sm" });
      txt([352, 252], "Q1"); txt([352, 270], "2N3904", { cls: "sm" }); txt([210, 241], "R1", { anchor: "middle" }); txt([210, 286], fmtOhm(m.R1), { anchor: "middle", cls: "sm" });
      txt([98, 292], "pin"); vinT = txt([98, 310], "", { cls: "sm" });
    } else if (mode === "pnp") {
      h = drawPnpLed(s);
      txt([98, 117], "Vcc"); txt([98, 135], "5 V", { cls: "sm" }); txt([352, 88], "Q1"); txt([352, 106], "2N3906", { cls: "sm" });
      txt([233, 75], "R1", { anchor: "middle" }); txt([233, 119], fmtOhm(m.R1), { anchor: "middle", cls: "sm" });
      txt([178, 222], "pin"); vinT = txt([178, 240], "", { cls: "sm" }); txt(h.flag, "Vc", { anchor: "middle", cls: "sm" });
      txt([312, 182], "green", { anchor: "end", cls: "sm" }); txt([312, 199], "LED", { anchor: "end" }); txt([348, 252], "R2"); txt([348, 270], fmtOhm(m.R2), { cls: "sm" });
    } else {
      h = drawRelay(s);
      field = s.group(); field.g.setAttribute("style", "--c:var(--t4)");
      field.path("M360 62C318 62 318 174 360 174C402 174 402 62 360 62Z", "w tint thin dash"); field.path("M360 52C300 52 300 184 360 184C420 184 420 52 360 52Z", "w tint thin dash");
      txt([98, 117], "Vcc"); txt([98, 135], "12 V", { cls: "sm" }); txt([252, 112], "D1", { anchor: "end" });
      txt([376, 110], "coil"); txt([376, 128], "400 Ω", { cls: "sm" }); txt([488, 162], "relay", { anchor: "end", cls: "sm" });
      txt([478, 224], "lamp"); txt([478, 241], "AC load", { cls: "sm" });
      txt(h.acFlag, "120 V AC", { anchor: "middle", cls: "sm" }); txt(h.nFlag, "Neutral", { anchor: "middle", cls: "sm" }); txt(h.inFlag, "pin", { anchor: "middle", cls: "sm" });
      txt([382, 252], "Q1"); txt([382, 270], "2N3904", { cls: "sm" }); txt([215, 241], "R1", { anchor: "middle" }); txt([215, 286], fmtOhm(m.R1), { anchor: "middle", cls: "sm" });
      vinT = txt([62, 286], "", { anchor: "middle", cls: "sm" });
    }
    F.c = s.flow(h.fc, { c: "t3" }); F.b = s.flow(h.fb, { c: "t1" }); F.ac = mode === "relay" ? s.flow(h.fac, { c: "cursor", gap: 18 }) : null;
    update(true);
  }
  function paint() {
    if (mode === "relay") {
      h.lever.set(26 * (1 - arm)); h.lamp.set(arm > .97 ? .85 + .15 * Math.abs(Math.sin(t * 4.4)) : 0);
      field.g.style.opacity = Math.min(1, r.IC / 0.03).toFixed(2);
    } else h.led.set(lit);
  }
  function update(instant) {
    const m = M[mode], vin = high ? m.hi : 0;
    let q;
    if (mode === "pnp") { const p = pnpDrive(vin, 5, m.R1, m.R2); q = { IB: -p.IB, IC: -p.IC, V: p.VEC, beta: p.beta }; }
    else { const p = mode === "npn" ? npnDrive(vin, 5, m.R1, m.R2, Q3904, WHITE) : npnDrive(vin, 12, m.R1, 400); q = { IB: p.IB, IC: p.IC, V: p.VCE, beta: p.beta }; }
    r = q; F.c.speed = speedOf(q.IC); F.b.speed = speedOf(q.IB);
    vinT.textContent = (mode === "relay" ? "" : "") + fx(vin, 1) + " V";
    pin.setAttribute("aria-pressed", String(high)); $(".pt b", pin).textContent = high ? `HIGH · ${fx(m.hi, 1)} V` : "LOW · 0 V";
    const on = q.IC > 1e-3, vl = mode === "pnp" ? "V<sub>EC</sub>" : "V<sub>CE</sub>", load = mode === "relay" ? "coil" : "LED";
    reads.innerHTML = cell("I<sub>B</sub> · from the pin", amps(q.IB)) + cell(`I<sub>C</sub> · ${load}`, amps(q.IC), true) + cell(vl, volts(q.V)) + cell("I<sub>C</sub> ÷ I<sub>B</sub>", q.IB > 1e-7 ? fx(q.beta, 1) : "–");
    status.textContent = mode === "relay" ? (on ? "relay closed · lamp on" : "relay open · lamp off") : on ? "LED on" : "LED off";
    const ratio = q.IB > 1e-7 ? Math.round(q.IC / q.IB) : 0;
    why.innerHTML = mode === "npn" ? (on ? `${fx(vin, 1)} V on the pin pushes ${amps(q.IB)} through R1 into the base. That holds Q1 fully on, so the 5 V supply pushes ${amps(q.IC)} through the LED, ${ratio} times what the pin supplies.` : "0 V on the pin: no base current, so Q1 is off and blocks the collector. The LED stays dark.")
      : mode === "pnp" ? (on ? `0 V on the pin sits far below the 5 V emitter, so ${amps(q.IB)} flows out of the base into the pin. That turns Q1 on, and ${amps(q.IC)} flows out of the collector through the green LED. LOW means on.` : "5 V on the pin matches the emitter, so nothing pushes current out of the base. Q1 is off and the LED is dark. This circuit is “active low”.")
      : (on ? `${amps(q.IB)} into the base lets ${amps(q.IC)} flow through the 400 Ω coil. Its magnetism pulls the switch closed, and the lamp runs on 120 V AC that never touches the pin's side of the circuit.` : "No base current means no coil current. The spring holds the switch open and the lamp is off.");
    if (instant || reduce) { lit = Math.min(1, q.IC / 0.02); arm = on ? 1 : 0; paint(); }
  }
  seg("#heroSeg", k => { mode = k; high = k !== "pnp"; draw(); });
  pin.addEventListener("click", () => { high = !high; update(); });
  whenVisible(box, dt => {
    t += dt; Schem.tick(s.flows, dt);
    const target = Math.min(1, r.IC / 0.02); lit += (target - lit) * (1 - Math.exp(-dt / .12));
    if (mode === "relay") { const goal = r.IC > 1e-3 ? 1 : 0; arm += Math.sign(goal - arm) * Math.min(Math.abs(goal - arm), dt * 7); F.ac.speed = arm > .97 ? 70 * Math.cos(t * 4.4) : 0; }
    paint();
  });
  draw();
})();

/* ---------- an LED and its resistor ---------- */
(function ledLab() {
  const cv = $("#ledCv"), rs = $("#ledR"), vs = $("#ledV"), reads = $("#ledReads"), status = $("#ledStatus");
  const RV = [0, 10, 22, 33, 47, 68, 82, 100, 150, 220, 330, 470, 680, 1000];
  let which = "w";
  seg("#ledSeg", k => { which = k; draw(); });
  function draw() {
    const R = RV[+rs.value], V = +vs.value, d = which === "w" ? WHITE : GREEN, col = tc(which === "w" ? "led-w" : "led-g");
    $("#ledROut").textContent = R ? fmtOhm(R) : "0 Ω · none"; $("#ledVOut").textContent = fx(V, 1) + " V";
    const I = R ? bisect(i => V - i * R - ledV(i, d), 1e-15, V / R, 80) : ledI(V, d), VL = R ? ledV(I, d) : V;
    const { c, W, H } = canvas2d(cv), xm = Math.max(5, Math.ceil(V)), g = chart(c, W, H, { x: [0, xm], y: [0, 0.05], xt: [...Array(xm + 1).keys()], yt: [0, .01, .02, .03, .04, .05], fy: v => (v * 1e3) + " mA", xl: "voltage across the LED (V)", pad: { l: 56 } });
    c.fillStyle = rgbS(T.cursor, .08); c.fillRect(g.X(0), g.Y(0.05), g.X(xm) - g.X(0), g.Y(0.02) - g.Y(0.05));
    tag(c, g.X(0) + 6, g.Y(0.02) - 6, "20 mA: the design current", rgbS(T.cursor));
    const curve = []; for (let v = 0; v <= xm; v += xm / 400) { const i = ledI(v, d); if (i > 0.05) { curve.push([g.X(v), g.Y(0.05)]); break; } curve.push([g.X(v), g.Y(i)]); }
    stroke(c, curve, col, 3);
    if (R) {
      const i0 = V / R, pts = i0 > 0.05 ? [[g.X(V - 0.05 * R), g.Y(0.05)], [g.X(V), g.Y(0)]] : [[g.X(0), g.Y(i0)], [g.X(V), g.Y(0)]];
      stroke(c, pts, rgbS(T.accent), 2, [6, 4]); tag(c, g.X(V) - 4, g.Y(0) - 8, "resistor line", rgbS(T.accent), "right");
    }
    const ok = I <= 0.05;
    if (ok) blob(c, g.X(VL), g.Y(I), rgbS(T.ink), 5.5);
    const b = Math.min(1.25, I / 0.02), gx = W - 46, gy = 46, gr = 12 + 26 * Math.min(1, b);
    if (ok && I > 1e-4) { const grd = c.createRadialGradient(gx, gy, 0, gx, gy, gr); grd.addColorStop(0, col); grd.addColorStop(1, "transparent"); c.globalAlpha = Math.min(1, .25 + b); c.fillStyle = grd; c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, 9, 0, 7); c.stroke();
    if (!ok) { c.fillStyle = rgbS(T.bad); c.font = `700 15px ${css("--f-display")}`; c.textAlign = "center"; c.fillText(`${eng(I, "A")} would flow. The LED is gone.`, W / 2, g.Y(0.035)); c.textAlign = "left"; }
    reads.innerHTML = cell("LED current", ok ? amps(I) : eng(I, "A"), true) + cell("V<sub>LED</sub>", volts(VL)) + cell("V<sub>R</sub> = I·R", R ? volts(I * R) : "0 V") + cell("LED power", eng(I * VL, "W"));
    status.textContent = !ok ? "burned out" : I < 1e-3 ? "barely lit" : I < 0.012 ? "dim" : I <= 0.025 ? "bright" : "too much current";
  }
  rs.addEventListener("input", draw); vs.addEventListener("input", draw);
  themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- saturation: why designers use beta_min = 10 ---------- */
(function satLab() {
  const cv = $("#satCv"), r1 = $("#satR1"), bb = $("#satB"), r2 = $("#satR2"), reads = $("#satReads"), badge = $("#satBadge"), why = $("#satWhy");
  const R1V = [470, 1000, 1500, 2200, 3300, 4700, 6800, 10000, 15000, 22000, 33000, 47000, 68000, 100000], R2V = [47, 68, 100, 150, 220, 330, 470];
  const icAt = (vce, ib, m) => { const vbe = bisect(v => gpI(v, v - vce, m)[1] - ib, -0.5, 1.2, 50); return gpI(vbe, vbe - vce, m)[0]; };
  function draw() {
    const R1 = slideIdx(r1, R1V, $("#satR1Out")), R2 = slideIdx(r2, R2V, $("#satR2Out")), beta = +bb.value; $("#satBOut").textContent = beta;
    const m = { ...Q3904, BF: beta }, q = npnDrive(3.3, 5, R1, R2, m, WHITE), imax = bisect(i => 5 - i * R2 - ledV(i, WHITE), 1e-12, 5 / R2, 70);
    const { c, W, H } = canvas2d(cv), g = chart(c, W, H, { x: [0, 3], y: [0, 0.04], xt: [0, .5, 1, 1.5, 2, 2.5, 3], yt: [0, .01, .02, .03, .04], fy: v => (v * 1e3) + " mA", xl: "V_CE (V)", pad: { l: 56 } });
    c.fillStyle = tc("sat"); c.globalAlpha = .55; c.fillRect(g.X(0), g.Y(0.04), g.X(0.2) - g.X(0), g.Y(0) - g.Y(0.04)); c.globalAlpha = 1;
    tag(c, g.X(0.02), g.Y(0.04) + 14, "saturation", rgbS(T.bad));
    for (const f of [0.25, 0.5, 2]) { const pts = []; for (let v = 0; v <= 3.001; v += 0.03) pts.push([g.X(v), g.Y(Math.min(0.041, icAt(v, q.IB * f, m)))]); stroke(c, pts, rgbS(T.t2, .28), 1.4); }
    const pts = []; for (let v = 0; v <= 3.001; v += 0.02) pts.push([g.X(v), g.Y(Math.min(0.041, icAt(v, q.IB, m)))]);
    stroke(c, pts, rgbS(T.t2), 2.6);
    tag(c, g.X(2.98), g.Y(Math.min(0.038, icAt(2.9, q.IB, m))) - 7, `I_B = ${amps(q.IB)}`, rgbS(T.t2), "right");
    const ll = []; for (let i = 0; i <= 0.0405; i += 0.0003) { const v = 5 - i * R2 - ledV(i, WHITE); if (v < 0) break; if (v <= 3) ll.push([g.X(v), g.Y(i)]); }
    stroke(c, ll, rgbS(T.t3), 2.4, [7, 4]); tag(c, g.X(2.98), g.Y(0) - 8, "load: LED + R2", rgbS(T.t3), "right");
    blob(c, g.X(q.VCE), g.Y(q.IC), rgbS(T.ink), 6);
    const reg = region(q.IB, q.IC, q.VCE, beta);
    badge.className = "badge " + (reg === "saturation" ? "sat" : reg === "active" ? "act" : "cut"); badge.textContent = reg;
    reads.innerHTML = cell("I<sub>B</sub> = (3.3 − V<sub>BE</sub>)/R<sub>1</sub>", amps(q.IB)) + cell("β · I<sub>B</sub>, what Q1 could pass", amps(beta * q.IB)) + cell("I<sub>C</sub>, what flows", amps(q.IC), true) + cell("V<sub>CE</sub>", volts(q.VCE)) + cell("I<sub>C</sub> ÷ I<sub>B</sub>", fx(q.IC / q.IB, 1));
    why.innerHTML = reg === "saturation"
      ? `β·I<sub>B</sub> = ${amps(beta * q.IB)} is more than the ${amps(imax)} the LED and R<sub>2</sub> can ever pass. Q1 can't use it all, so it turns fully on: V<sub>CE</sub> falls to ${volts(q.VCE)} and the load sets the current. The ratio I<sub>C</sub>/I<sub>B</sub> drops to ${fx(q.IC / q.IB, 1)}, far below β = ${beta}.`
      : `β·I<sub>B</sub> = ${amps(beta * q.IB)} is less than the ${amps(imax)} the load would allow, so the transistor is what limits the current. It sits half on, with V<sub>CE</sub> = ${volts(q.VCE)}, and the LED runs dim. A weaker transistor would make it dimmer still. A switch shouldn't depend on the part, so give it more base current.`;
  }
  [r1, bb, r2].forEach(e => e.addEventListener("input", draw));
  themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- standard 5% values ---------- */
(function e24Lab() {
  const inp = $("#e24In"), cv = $("#e24Cv"), reads = $("#e24Reads");
  function draw() {
    const r = Math.max(1, +inp.value || 1), n = e24near(r), dec = Math.pow(10, Math.floor(Math.log10(r) + 1e-9)), mant = r / dec;
    const { c, W, H } = canvas2d(cv), L = 26, R = 26, X = m => L + Math.log10(m) * (W - L - R), y0 = 46, y1 = H - 30;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    const last = [-99, -99];   // where each label row last put a value, so close neighbours drop to a second row
    E24.forEach((m, i) => {
      const a = X(m * 0.95), b = X(m * 1.05); c.fillStyle = rgbS(i % 2 ? T.t4 : T.accent, .13); c.fillRect(a, y0, b - a, y1 - y0);
      const hit = Math.abs(m * dec - n.lo) < 1e-6 * r || Math.abs(m * dec - n.hi) < 1e-6 * r;
      c.strokeStyle = hit ? rgbS(T.accent) : rgbS(T.muted, .7); c.lineWidth = hit ? 2.4 : 1; c.beginPath(); c.moveTo(X(m), y0); c.lineTo(X(m), y1); c.stroke();
      if (W > 560 || i % 2 === 0 || hit) {
        const row = X(m) - last[0] < 26 ? 1 : 0; last[row] = X(m);
        tag(c, X(m), y1 + 13 + row * 12, m.toFixed(1), hit ? rgbS(T.accent) : rgbS(T.muted), "center");
      }
    });
    c.strokeStyle = rgbS(T.cursor); c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(mant), 18); c.lineTo(X(mant), y1); c.stroke();
    c.fillStyle = rgbS(T.cursor); c.beginPath(); c.moveTo(X(mant), y0 - 2); c.lineTo(X(mant) - 6, y0 - 12); c.lineTo(X(mant) + 6, y0 - 12); c.fill();
    tag(c, Math.min(W - 8, Math.max(8, X(mant))), 14, "your value " + fmtOhm(r), rgbS(T.cursor), X(mant) > W * .75 ? "right" : X(mant) < W * .25 ? "left" : "center");
    const err = v => (v >= r ? "+" : "−") + Math.abs((v - r) / r * 100).toFixed(1) + "%";
    reads.innerHTML = cell("lower neighbour", n.lo === n.hi ? "–" : `${fmtOhm(n.lo)} (${err(n.lo)})`) + cell("upper neighbour", n.lo === n.hi ? "–" : `${fmtOhm(n.hi)} (${err(n.hi)})`) + cell("closest", n.lo === n.hi ? fmtOhm(n.lo) + " exactly" : n.tie ? "a tie" : fmtOhm(n.pick), true);
  }
  inp.addEventListener("input", draw); themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();

/* ---------- SPICE model decoder ---------- */
(function modelDecoder() {
  const box = $("#modelToks"), exp = $("#modelExp");
  const TOKS = [
    [".model", "Starts a model card: a named list of parameters that a part on the schematic can point to.", 1],
    ["WhiteLED", "The model's name. The LED's value on your schematic must match it exactly, which is why you change the value from D to WhiteLED.", 1],
    ["D", "The model type: a diode. An LED is a diode whose junction gives off light.", 1],
    ["(IS=93.1P", "Saturation current, 93.1 pA. With N, it sets how much current flows at each voltage. P means pico, ×10⁻¹².", 1],
    ["RS=42M", "Series resistance: 42 mΩ, not 42 MΩ. In SPICE, M means milli. Mega is MEG. At 20 mA it adds under 1 mV, so it barely matters here.", 1],
    ["N=6.45", "Emission coefficient. A plain silicon diode has N between 1 and 2. A big N stretches the exponential, which is how the model makes this LED turn on near 3 V instead of 0.7 V.", 1],
    ["BV=5", "Reverse breakdown at 5 V. Reverse-bias the LED harder and it conducts backwards. LEDs can't take much reverse voltage.", 0],
    ["IBV=30U", "The reverse current at the breakdown voltage, 30 µA. U means micro.", 0],
    ["+", "A + at the start of a line continues the line above it.", 0],
    ["CJO=2.97P", "Junction capacitance with no bias, 2.97 pF. It only matters when signals change quickly, so a DC operating point ignores it.", 0],
    ["VJ=.75", "Junction potential, 0.75 V. With M, it shapes how the capacitance changes with voltage. Ignored at DC.", 0],
    ["M=.333", "Grading coefficient: how fast the capacitance falls as reverse voltage grows. Ignored at DC.", 0],
    ["TT=4.32U)", "Transit time, 4.32 µs: how long stored charge takes to clear when the diode switches off. Ignored at DC.", 0]
  ];
  box.innerHTML = TOKS.map(([t, , dc], i) => `<button type="button" class="tok${dc ? "" : " dim"}" data-i="${i}" aria-pressed="${i === 5}">${t}</button>`).join("");
  const show = i => { $$("button", box).forEach((b, j) => b.setAttribute("aria-pressed", String(j === i))); exp.innerHTML = `<b>${TOKS[i][0].replace(/[()]/g, "")}</b> · ${TOKS[i][1]}`; };
  box.addEventListener("click", e => { const b = e.target.closest("button"); if (b) show(+b.dataset.i); });
  show(5);
})();

/* ---------- pnp: when does it really turn off? ---------- */
(function pnpLab() {
  const box = $("#pnpSch"), cv = $("#pnpCv"), sl = $("#pnpVin"), reads = $("#pnpReads"), status = $("#pnpStatus");
  const R1 = 2700, R2 = 130, s = Schem.svg(box, [24, 14, 424, 336], "pnp LED driver with the pin voltage set by the slider"), h = drawPnpLed(s);
  box.style.setProperty("--ar", (424 / 336).toFixed(3));
  const txt = (p, a, o) => s.text(p, a, o);
  txt([98, 117], "Vcc"); txt([98, 135], "5 V", { cls: "sm" }); txt([352, 88], "Q1"); txt([352, 106], "2N3906", { cls: "sm" });
  txt([233, 75], "R1", { anchor: "middle" }); txt([233, 119], fmtOhm(R1), { anchor: "middle", cls: "sm" }); txt([178, 222], "pin"); const vinT = txt([178, 240], "", { cls: "sm" });
  txt(h.flag, "Vc", { anchor: "middle", cls: "sm" }); txt([312, 199], "LED", { anchor: "end" }); txt([348, 252], "R2"); txt([348, 270], fmtOhm(R2), { cls: "sm" });
  const fc = s.flow(h.fc, { c: "t3" }), fb = s.flow(h.fb, { c: "t1" });
  const curve = []; for (let v = 0; v <= 5.0001; v += 0.025) curve.push([v, -pnpDrive(v, 5, R1, R2).IC]);
  let q;
  function draw() {
    const vin = +sl.value; $("#pnpVinOut").textContent = fx(vin, 2) + " V"; vinT.textContent = fx(vin, 2) + " V";
    q = pnpDrive(vin, 5, R1, R2); fc.speed = speedOf(-q.IC); fb.speed = speedOf(-q.IB); h.led.set(Math.min(1, -q.IC / 0.02));
    const { c, W, H } = canvas2d(cv), g = chart(c, W, H, { x: [0, 5], y: [0, 0.025], xt: [0, 1, 2, 3, 4, 5], yt: [0, .005, .01, .015, .02, .025], fy: v => (v * 1e3) + " mA", xl: "pin voltage V_in (V)", pad: { l: 56 } });
    for (const [v, lab, row] of [[3.3, "3.3 V HIGH", 0], [5, "5 V HIGH", 1]]) { stroke(c, [[g.X(v), g.Y(0.025)], [g.X(v), g.Y(0)]], rgbS(T.cursor, .8), 1.5, [5, 4]); tag(c, g.X(v) - 5, g.Y(0.025) + 14 + row * 14, lab, rgbS(T.cursor), "right"); }
    stroke(c, curve.map(([v, i]) => [g.X(v), g.Y(i)]), tc("led-g"), 3);
    blob(c, g.X(vin), g.Y(-q.IC), rgbS(T.ink), 6);
    tag(c, g.X(0.1), g.Y(0.0175) + 20, "|I_C| = LED current", rgbS(T.muted));   // under the flat part of the curve
    reads.innerHTML = cell("V<sub>EB</sub>", volts(q.VEB)) + cell("V<sub>EC</sub>", volts(q.VEC)) + cell("I<sub>B</sub> (LTspice sign)", amps(q.IB)) + cell("I<sub>C</sub> (LTspice sign)", amps(q.IC), true);
    status.textContent = -q.IC > 0.012 ? "LED on" : -q.IC > 1e-4 ? "LED dim" : "LED off";
  }
  sl.addEventListener("input", draw); themeListeners.push(draw); new ResizeObserver(draw).observe(cv);
  whenVisible(box, dt => Schem.tick(s.flows, dt));
  draw();
})();

/* ---------- inside a relay ---------- */
(function relayLab() {
  const cv = $("#relCv"), sl = $("#relV"), reads = $("#relReads"), status = $("#relStatus"), meter = $("#relMeter");
  const RCOIL = 400, PULL = 8.0, DROP = 2.5, GO = 0.7, GC = 0.15, G0 = 0.1;   // an example 12 V relay (not the homework one): 400 ohm coil, pulls in at 8 V, lets go at 2.5 V; gaps in mm
  let closed = false, arm = 0, t = 0;
  const force = (I, g) => Math.pow(I / (PULL / RCOIL), 2) * Math.pow((GO + G0) / (g + G0), 2);   // pull / spring, 1 at the pull-in point
  function state() {
    const V = +sl.value, I = V / RCOIL;
    if (!closed && V >= PULL) closed = true;
    if (closed && V < DROP) closed = false;
    return { V, I };
  }
  function draw() {
    const { V, I } = state(); $("#relVOut").textContent = fx(V, 1) + " V";
    const gap = GO + (GC - GO) * arm, F = force(I, gap);
    const { c, W, H } = canvas2d(cv), k = Math.min(W / 720, H / 300), ox = (W - 720 * k) / 2, oy = (H - 300 * k) / 2;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.save(); c.translate(ox, oy); c.scale(k, k);
    const steel = tc("steel"), copper = tc("copper"), ink = rgbS(T.ink), line = rgbS(T.line);
    // magnetic circuit: core, yoke, armature. Field lines follow it, moving with the current
    const ang = (1 - arm) * 0.12, hx = 330, hy = 96;
    c.save(); c.globalAlpha = Math.min(1, F > 0 ? Math.sqrt(I / 0.03) : 0);
    c.strokeStyle = rgbS(T.t4); c.lineWidth = 2; c.setLineDash([7, 7]); c.lineDashOffset = -t * 40 * Math.min(1, I / 0.03);
    for (const d of [0, 12]) { c.beginPath(); c.moveTo(180, 230 + d); c.lineTo(180, 108 - d); c.lineTo(hx - 10 + d * .5, 108 - d); c.lineTo(hx - 10 + d * .5, 250 + d); c.lineTo(180, 250 + d); c.closePath(); c.stroke(); }
    c.restore(); c.setLineDash([]);
    c.fillStyle = steel; c.fillRect(150, 112, 60, 130); c.fillRect(150, 236, 196, 18); c.fillRect(326, 100, 20, 154);
    for (let y = 124; y < 228; y += 9) { c.fillStyle = copper; c.beginPath(); c.roundRect(128, y, 104, 7, 3); c.fill(); }
    tag(c, 180, 276, "coil on an iron core", rgbS(T.muted), "center");
    // armature: pivots at the top of the yoke; the coil pulls its left end down, the spring pulls its right end down
    c.save(); c.translate(hx + 6, hy); c.rotate(ang);   // released: coil end up, contact end down
    c.fillStyle = steel; c.fillRect(-196, -6, 300, 12);
    c.fillStyle = tc("good"); c.beginPath(); c.arc(98, -8, 6, 0, 7); c.fill();
    c.restore();
    const tip = [hx + 6 + 98 * Math.cos(ang), hy + 98 * Math.sin(ang)];
    c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.moveTo(tip[0] - 14, tip[1] + 8);
    for (let i = 1; i <= 8; i++) c.lineTo(tip[0] - 14 + (i % 2 ? 8 : -8), tip[1] + 8 + i * (254 - tip[1] - 8) / 8);
    c.stroke(); tag(c, tip[0] - 2, 214, "spring", rgbS(T.muted));
    // contacts and lamp circuit
    c.fillStyle = tc("good"); c.fillRect(tip[0] - 9, 72, 18, 10);
    // the contact circuit: fixed contact, lamp, the 120 V source, and back under the spring into the yoke and armature
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2; c.beginPath(); c.moveTo(tip[0], 72); c.lineTo(tip[0], 40); c.lineTo(620, 40); c.lineTo(620, 98); c.moveTo(620, 142); c.lineTo(620, 176);
    c.moveTo(620, 224); c.lineTo(620, 284); c.lineTo(hx, 284); c.lineTo(hx, 254); c.stroke();
    c.beginPath(); c.arc(620, 200, 24, 0, 7); c.stroke(); c.beginPath(); for (let x = -12; x <= 12; x++) { const y = -7 * Math.sin(x / 12 * Math.PI); x === -12 ? c.moveTo(620 + x, 200 + y) : c.lineTo(620 + x, 200 + y); } c.stroke();
    tag(c, 652, 205, "120 V AC", rgbS(T.muted));
    const lampOn = arm > .97;
    if (lampOn) { const g = c.createRadialGradient(620, 120, 0, 620, 120, 58); g.addColorStop(0, tc("led-w")); g.addColorStop(1, "transparent"); c.globalAlpha = .85 + .15 * Math.abs(Math.sin(t * 6)); c.fillStyle = g; c.beginPath(); c.arc(620, 120, 58, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = rgbS(T.accent); c.beginPath(); c.arc(620, 120, 22, 0, 7); c.stroke(); c.beginPath(); c.moveTo(605, 105); c.lineTo(635, 135); c.moveTo(635, 105); c.lineTo(605, 135); c.stroke();
    tag(c, 652, 124, "lamp", rgbS(T.muted));
    tag(c, tip[0] + 14, 80, "contacts", rgbS(T.muted));
    c.strokeStyle = copper; c.lineWidth = 2; c.beginPath(); c.moveTo(128, 130); c.lineTo(60, 130); c.moveTo(128, 222); c.lineTo(60, 222); c.stroke();
    tag(c, 56, 126, "12 V", rgbS(T.muted), "right"); tag(c, 56, 218, "to Q1", rgbS(T.muted), "right");
    c.restore();
    meter.style.setProperty("--f", Math.min(1, F / 2).toFixed(3));
    reads.innerHTML = cell("coil current V ÷ 400 Ω", amps(I)) + cell("air gap", fx(gap, 2) + " mm") + cell("magnet pull ÷ spring", fx(F, 2), true) + cell("contacts", arm > .97 ? "closed" : arm < .03 ? "open" : "moving");
    status.textContent = closed ? "energized" : "released";
  }
  sl.addEventListener("input", () => { draw(); if (reduce) { arm = closed ? 1 : 0; draw(); } });
  $("#relOn").addEventListener("click", () => { sl.value = 12; draw(); });
  $("#relOff").addEventListener("click", () => { sl.value = 0; draw(); });
  whenVisible(cv, dt => { t += dt; const goal = closed ? 1 : 0; arm += Math.sign(goal - arm) * Math.min(Math.abs(goal - arm), dt * 6); draw(); });
  themeListeners.push(draw); new ResizeObserver(draw).observe(cv);
  state(); arm = closed ? 1 : 0; draw();
})();

/* ---------- the flyback kick ---------- */
(function kickLab() {
  const cv = $("#kickCv"), reads = $("#kickReads"), status = $("#kickStatus");
  const L = 0.3, R = 400, C = 100e-12, I0 = 0.03, V0 = 0.04, ISD = 4e-9, ND = 1.9;   // the example 400 ohm relay; L and C are assumed typical values; the diode is 1N4148-like
  let diode = true, prog = 1, t0 = 0;
  const vd = i => ND * VTH * Math.log1p(Math.max(0, i) / ISD);
  function traces() {
    const N = 4200, dt = 3e-3 / N, out = [];
    if (diode) { let i = I0; for (let n = 0; n <= N; n++) { const t = n * dt; out.push([t, 12 + vd(i), i]); i = Math.max(0, i - dt * (i * R + vd(i)) / L); } }
    else {
      const w0 = 1 / Math.sqrt(L * C), a = R / (2 * L), w = Math.sqrt(w0 * w0 - a * a), A = V0 - 12, B = (I0 / C + a * A) / w;
      for (let n = 0; n <= N; n++) { const t = n * dt, e = Math.exp(-a * t), v = 12 + e * (A * Math.cos(w * t) + B * Math.sin(w * t)); out.push([t, v, C * e * ((-a * A + w * B) * Math.cos(w * t) + (-a * B - w * A) * Math.sin(w * t))]); }
    }
    return out;
  }
  let tr = traces();
  function draw() {
    const { c, W, H } = canvas2d(cv), g = chart(c, W, H, { x: [-0.5e-3, 3e-3], y: [-10, 60], xt: [-0.5e-3, 0, 0.5e-3, 1e-3, 1.5e-3, 2e-3, 2.5e-3, 3e-3], yt: [0, 12, 20, 40, 60], fx: v => fx(v * 1e3, 1), fy: v => v + " V", xl: "time after the pin goes LOW (ms)", pad: { l: 50, r: 54 } });
    const Yi = i => g.Y(-10 + 70 * i / 0.04);
    stroke(c, [[g.X(-0.5e-3), g.Y(40)], [g.X(3e-3), g.Y(40)]], rgbS(T.bad, .7), 1.5, [6, 4]); tag(c, g.X(3e-3) - 4, g.Y(40) - 6, "2N3904 rated V_CEO = 40 V", rgbS(T.bad), "right");
    c.fillStyle = rgbS(T.muted); c.font = `11px ${css("--f-mono")}`; c.textAlign = "left";
    for (const i of [0, .01, .02, .03]) c.fillText((i * 1e3) + " mA", W - 50, Yi(i) + 4);
    const tEnd = -0.5e-3 + prog * 3.5e-3, vPts = [[g.X(-0.5e-3), g.Y(V0)], [g.X(0), g.Y(V0)]], iPts = [[g.X(-0.5e-3), Yi(I0)], [g.X(0), Yi(I0)]];
    let peak = 0;
    for (const [t, v, i] of tr) { if (t > tEnd) break; vPts.push([g.X(t), g.Y(Math.max(-10, Math.min(61, v)))]); iPts.push([g.X(t), Yi(i)]); peak = Math.max(peak, v); }
    c.save(); c.beginPath(); c.rect(g.p.l, g.p.t, W - g.p.l - g.p.r, H - g.p.t - g.p.b); c.clip();
    stroke(c, iPts, rgbS(T.t1), 2); stroke(c, vPts, rgbS(T.t3), diode ? 2.4 : 1.1); c.restore();
    tag(c, g.X(0.05e-3), g.Y(diode ? 17 : 56), diode ? "V_C clamps at 12 V + one diode drop" : `V_C rings up to about ${Math.round(peak / 10) * 10} V`, rgbS(T.t3));
    tag(c, g.X(1.1e-3), Yi(0.008) - 8, "coil current", rgbS(T.t1));
    reads.innerHTML = cell("peak V<sub>C</sub>", prog > 0.15 ? volts(peak, 3) : "–", true) + cell("energy in the coil, LI²/2", eng(0.5 * L * I0 * I0, "J")) + cell("where it goes", diode ? "heat in the coil and D1" : "a spark, or Q1 breaking down");
    status.textContent = diode ? "with D1" : "without D1";
  }
  seg("#kickSeg", k => { diode = k === "on"; tr = traces(); replay(); });
  const replay = () => { prog = reduce ? 1 : 0; t0 = performance.now(); draw(); };
  $("#kickGo").addEventListener("click", replay);
  whenVisible(cv, () => { if (prog < 1) { prog = Math.min(1, (performance.now() - t0) / 2200); draw(); } });
  themeListeners.push(draw); new ResizeObserver(draw).observe(cv); draw();
})();
