/* MOSFET switches: the live interactives. Every demo uses a practice part (VT = 1.5 V, β = 0.18 A/V² for n-channel and
   0.08 A/V² for p-channel) and a 47 Ω load, never the homework's numbers. */
let T = tokens(TOK);
const redraws = [];
themeListeners.push(() => { T = tokens(TOK); redraws.forEach(f => f()); });
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;
const DEMO = { VT: 1.5, bn: .18, bp: .08, R: 47, Vdd: 5 };
function tag(c, x, y, s, col, align = "left", size = 11, w = 600) { c.font = `${w} ${size}px ${css("--f-mono")}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }
function line(c, pts, col, w = 2, dash) { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.setLineDash([]); }
function dot(c, x, y, col, r = 5.5) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); }
/* a plain plot frame: dashed grid, tick labels, and X/Y maps. o = { x: [lo, hi, ticks, fmt], y: [lo, hi, ticks, fmt] } */
function frame(cv, o) {
  const { c, W, H } = canvas2d(cv), l = 58, r = W - 16, top = 22, bot = H - 30;
  const X = v => l + (v - o.x[0]) / (o.x[1] - o.x[0]) * (r - l), Y = v => bot - (v - o.y[0]) / (o.y[1] - o.y[0]) * (bot - top);
  c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
  c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath();
  for (const t of o.x[2]) { c.moveTo(X(t), top); c.lineTo(X(t), bot); } for (const t of o.y[2]) { c.moveTo(l, Y(t)); c.lineTo(r, Y(t)); } c.stroke(); c.setLineDash([]);
  c.strokeStyle = rgbS(T.muted, .7); c.strokeRect(l, top, r - l, bot - top);
  for (const t of o.x[2]) tag(c, X(t), bot + 17, o.x[3](t), rgbS(T.muted), "center", 10.5, 500);
  for (const t of o.y[2]) tag(c, l - 6, Y(t) + 4, o.y[3](t), rgbS(T.muted), "right", 10.5, 500);
  const clip = () => { c.save(); c.beginPath(); c.rect(l, top, r - l, bot - top); c.clip(); };
  return { c, W, H, l, r, top, bot, X, Y, clip };
}
const fA = t => t ? Math.round(t * 1000) + "mA" : "0", fV = t => t + "V";

/* ---------- hero: a MOSFET switch and its load line ---------- */
(function hero() {
  const box = $("#heroSch"), cv = $("#heroCv"), sV = $("#heroV"), reads = $("#heroReads"), status = $("#heroStatus"), { VT, R, Vdd } = DEMO;
  const ALT = { n: "An n-channel low-side switch: a 47 Ω load from the 5 V supply to the drain, the source grounded, and Vin on the gate.",
    p: "A p-channel high-side switch: the source on the 5 V supply, the drain feeding a 47 Ω load to ground, and Vin on the gate." };
  let mode = "n", s, h, f, q;
  function draw() {
    box.replaceChildren(); s = Schem.svg(box, [20, 22, 430, 340], ALT[mode]);
    h = mode === "n" ? drawN(s, { r1: "47 Ω (load)", name: "practice part" }) : drawP(s, { r1: "47 Ω (load)", name: "practice part" });
    f = s.flow(h.f.main, { c: "t3", gap: 16 });
  }
  function solve() {
    const vin = +sV.value, n = mode === "n", beta = n ? DEMO.bn : DEMO.bp, vg = n ? vin : Vdd - vin, op = switchPoint(beta, vg - VT, R, Vdd);
    q = { vin, n, beta, vg, ...op, vout: n ? op.v : Vdd - op.v };
  }
  function plot() {
    const P = frame(cv, { x: [0, 5, [0, 1, 2, 3, 4, 5], fV], y: [0, .12, [0, .02, .04, .06, .08, .1, .12], fA] }), c = P.c, vov = q.vg - VT;
    P.clip();
    if (vov > 0) { c.fillStyle = css("--nreg"); c.globalAlpha = .6; c.fillRect(P.l, P.top, P.X(Math.min(5, vov)) - P.l, P.bot - P.top); c.globalAlpha = 1; }
    const curve = []; for (let k = 0; k <= 300; k++) { const v = k / 60; curve.push([P.X(v), P.Y(sah(q.beta, vov, v).i)]); }
    line(c, [[P.X(0), P.Y(Vdd / R)], [P.X(Vdd), P.Y(0)]], rgbS(T.t3), 2.4);
    line(c, curve, rgbS(T.accent), 2.6);
    line(c, [[P.X(q.v), P.bot], [P.X(q.v), P.Y(q.i)], [P.l, P.Y(q.i)]], rgbS(T.ink, .55), 1.2, [3, 3]);
    dot(c, P.X(q.v), P.Y(q.i), rgbS(T.cursor), 6);
    c.restore();
    const vn = q.n ? "VDS" : "VSD", gn = q.n ? "VGS" : "VSG";
    tag(c, P.r - 6, P.top + 15, `M1's curve at ${gn} = ${q.vg.toFixed(2)} V`, rgbS(T.accent), "right");
    tag(c, P.r - 6, P.top + 31, "load line: what R1 allows", rgbS(T.t3), "right");
    tag(c, P.r - 6, P.bot - 8, `voltage across M1 (${vn})`, rgbS(T.muted), "right", 10.5, 500);
  }
  function upd() {
    solve(); plot();
    $("#heroVOut").textContent = q.vin.toFixed(2) + " V"; h.t.vin.textContent = q.vin.toFixed(1) + " V";
    const on = q.reg === "triode" && q.v < .6, off = q.reg === "cutoff";
    status.textContent = off ? "switch off: no channel" : on ? (q.n ? "switch on: Vout pulled down" : "switch on: Vout pulled up") : "partly on: M1 is fighting the load";
    reads.innerHTML = cell("Vout", q.vout.toFixed(2) + " V", true) + cell("current through the load", eng(q.i, "A", 3)) +
      cell(`voltage across M1`, q.v.toFixed(3) + " V") + cell("M1 acts like", off ? "an open switch" : eng(q.v / q.i, "Ω", 3)) + cell("region", q.reg) + cell("heat in M1", eng(q.v * q.i, "W", 3));
    f.speed = spdI(q.i);
  }
  seg("#heroSeg", k => { mode = k; sV.value = k === "n" ? 5 : 0; draw(); upd(); });
  sV.addEventListener("input", upd); draw(); upd(); redraws.push(plot); new ResizeObserver(plot).observe(cv);
  whenVisible(box, dt => Schem.tick(s.flows, dt));
})();

/* ---------- topic 1a: Sah's two equations, and where each one applies ---------- */
(function sahPanel() {
  const cv = $("#sahCv"), sG = $("#sahG"), sD = $("#sahD"), reads = $("#sahReads"), { VT, bn } = DEMO;
  function draw() {
    const vg = +sG.value, vd = +sD.value, vov = vg - VT, P = frame(cv, { x: [0, 6, [0, 1, 2, 3, 4, 5, 6], fV], y: [0, 1.2, [0, .2, .4, .6, .8, 1, 1.2], fA] }), c = P.c;
    $("#sahGOut").textContent = vg.toFixed(2) + " V"; $("#sahDOut").textContent = vd.toFixed(2) + " V";
    const tri = v => bn * (vov * v - v * v / 2), sat = bn / 2 * vov * vov, real = sah(bn, vov, vd);
    P.clip();
    if (vov > 0) {
      c.fillStyle = css("--nreg"); c.globalAlpha = .55; c.fillRect(P.l, P.top, P.X(vov) - P.l, P.bot - P.top); c.globalAlpha = 1;
      c.fillStyle = css("--act"); c.globalAlpha = .55; c.fillRect(P.X(vov), P.top, P.r - P.X(vov), P.bot - P.top); c.globalAlpha = 1;
      const past = []; for (let k = 0; k <= 80; k++) { const v = vov + k / 80 * vov; past.push([P.X(v), P.Y(Math.max(0, tri(v)))]); }
      line(c, past, rgbS(T.bad), 2, [6, 5]);
      line(c, [[P.l, P.Y(sat)], [P.X(vov), P.Y(sat)]], rgbS(T.t2), 1.6, [6, 5]);
      const cur = []; for (let k = 0; k <= 240; k++) { const v = k / 40; cur.push([P.X(v), P.Y(sah(bn, vov, v).i)]); }
      line(c, cur, rgbS(T.accent), 2.8);
      line(c, [[P.X(vov), P.top], [P.X(vov), P.bot]], rgbS(T.ink, .6), 1.2, [3, 3]);
      tag(c, P.X(vov) + 5, P.top + 14, "edge: VDS = VGS − VT", rgbS(T.ink), "left", 10.5);
    } else line(c, [[P.l, P.bot - 1], [P.r, P.bot - 1]], rgbS(T.accent), 2.8);
    dot(c, P.X(vd), P.Y(real.i), rgbS(T.cursor), 6);
    c.restore();
    tag(c, P.r - 6, P.bot - 8, "dashed red: the triode formula used past its edge", rgbS(T.bad), "right", 10.5, 500);
    reads.innerHTML = cell("region", real.reg, true) + cell("triode formula gives", vov > 0 ? eng(tri(vd), "A", 3) + (tri(vd) < 0 ? " (impossible)" : "") : "–") +
      cell("saturation formula gives", vov > 0 ? eng(sat, "A", 3) : "–") + cell("Sah's answer, I<sub>D</sub>", eng(real.i, "A", 3), true);
  }
  sG.addEventListener("input", draw); sD.addEventListener("input", draw); draw(); redraws.push(draw); new ResizeObserver(draw).observe(cv);
})();

/* ---------- topic 1b: one datasheet point pins β ---------- */
(function fitPanel() {
  const cv = $("#fitCv"), sB = $("#fitB"), reads = $("#fitReads"), { VT } = DEMO, PT = [4.5, .81];
  function draw() {
    const b = +sB.value, P = frame(cv, { x: [0, 6, [0, 1, 2, 3, 4, 5, 6], fV], y: [0, 1.4, [0, .2, .4, .6, .8, 1, 1.2, 1.4], fA] }), c = P.c;
    $("#fitBOut").textContent = b.toFixed(3) + " A/V²";
    const at = sah(b, PT[0] - VT, 99).i, err = (at / PT[1] - 1) * 100, hit = Math.abs(err) < 1.2;
    P.clip();
    const cur = []; for (let k = 0; k <= 240; k++) { const v = k / 40; cur.push([P.X(v), P.Y(sah(b, v - VT, 99).i)]); }
    line(c, cur, rgbS(T.accent), 2.8);
    line(c, [[P.X(PT[0]), P.Y(at)], [P.X(PT[0]), P.Y(PT[1])]], rgbS(T.cursor, .8), 1.4, [3, 3]);
    c.restore();
    c.strokeStyle = rgbS(hit ? T.good : T.cursor); c.lineWidth = 2.4; c.beginPath(); c.arc(P.X(PT[0]), P.Y(PT[1]), 8, 0, 6.3); c.stroke();
    tag(c, P.X(PT[0]) - 12, P.Y(PT[1]) - 12, "datasheet: 0.81 A at 4.5 V", rgbS(hit ? T.good : T.cursor), "right");
    tag(c, P.X(VT), P.bot - 8, "VT", rgbS(T.muted), "center", 10.5);
    tag(c, P.r - 6, P.bot - 8, "VGS (saturation, so VDS is large)", rgbS(T.muted), "right", 10.5, 500);
    reads.innerHTML = cell("your curve at 4.5 V", eng(at, "A", 3), hit) + cell("the datasheet's point", "810mA") +
      cell("miss", hit ? '<span class="hintok">on it ✓</span>' : (err > 0 ? "+" : "−") + Math.abs(err).toFixed(0) + "%") + cell("2 I<sub>D</sub> / (V<sub>GS</sub> − V<sub>T</sub>)²", "0.180 A/V²");
  }
  sB.addEventListener("input", draw); draw(); redraws.push(draw); new ResizeObserver(draw).observe(cv);
})();

/* ---------- topics 1c and 2c: RDS(on) against gate drive ---------- */
function rdsPanel(id, both) {
  const cv = $(`#${id}Cv`), sG = $(`#${id}G`), reads = $(`#${id}Reads`), { VT, bn, bp } = DEMO, VD = .1;
  const rds = (b, vg) => { const r = sah(b, vg - VT, VD); return r.i > 0 ? VD / r.i : Infinity; };
  function draw() {
    const vg = +sG.value, P = frame(cv, { x: [2.5, 10, [2.5, 3.3, 5, 7.5, 10], t => t + "V"], y: [0, 12, [0, 2, 4, 6, 8, 10, 12], t => String(t)] }), c = P.c;
    $(`#${id}GOut`).textContent = vg.toFixed(2) + " V";
    P.clip();
    const curve = b => { const pts = []; for (let k = 0; k <= 300; k++) { const v = 2.5 + k / 300 * 7.5; pts.push([P.X(v), P.Y(Math.min(40, rds(b, v)))]); } return pts; };
    const est = []; for (let k = 0; k <= 300; k++) { const v = 2.5 + k / 300 * 7.5; est.push([P.X(v), P.Y(Math.min(40, 1 / (bn * (v - VT))))]); }
    line(c, est, rgbS(T.muted), 1.6, [6, 5]);
    line(c, curve(bn), rgbS(T.accent), 2.8);
    if (both) line(c, curve(bp), rgbS(T.t3), 2.8);
    line(c, [[P.X(vg), P.top], [P.X(vg), P.bot]], rgbS(T.ink, .5), 1.2, [3, 3]);
    dot(c, P.X(vg), P.Y(rds(bn, vg)), rgbS(T.accent), 5.5); if (both) dot(c, P.X(vg), P.Y(rds(bp, vg)), rgbS(T.t3), 5.5);
    c.restore();
    tag(c, P.X(3.3), P.top + 14, "3.3 V logic", rgbS(T.muted), "center", 10.5); tag(c, P.X(5), P.top + 14, "5 V logic", rgbS(T.muted), "center", 10.5);
    tag(c, P.r - 6, P.top + 14, both ? "n-channel" : "exact, at VDS = 0.1 V", rgbS(T.accent), "right");
    if (both) tag(c, P.r - 6, P.top + 30, "p-channel, same size", rgbS(T.t3), "right");
    tag(c, P.r - 6, P.top + (both ? 46 : 30), "dashed: estimate 1/(β(VGS − VT))", rgbS(T.muted), "right", 10.5, 500);
    tag(c, P.l + 6, P.top - 8, "RDS(on), ohms", rgbS(T.muted), "left", 10.5, 500);
    const rn = rds(bn, vg), rp = rds(bp, vg);
    reads.innerHTML = both
      ? cell("n-channel R<sub>DS(on)</sub>", eng(rn, "Ω", 3), true) + cell("p-channel R<sub>DS(on)</sub>", eng(rp, "Ω", 3), true) + cell("p over n", (rp / rn).toFixed(2) + "×") + cell("β<sub>n</sub> / β<sub>p</sub>", (bn / bp).toFixed(2))
      : cell("R<sub>DS(on)</sub>", eng(rn, "Ω", 3), true) + cell("estimate 1/(β(V<sub>GS</sub> − V<sub>T</sub>))", eng(1 / (bn * (vg - VT)), "Ω", 3)) +
        cell("heat at 1 A, I²R", eng(rn, "W", 3)) + cell("voltage lost at 1 A", eng(rn, "V", 3));
  }
  sG.addEventListener("input", draw); draw(); redraws.push(draw); new ResizeObserver(draw).observe(cv);
}
rdsPanel("rds", false);
rdsPanel("cmp", true);

/* ---------- "check your answer before revealing" ---------- */
const CHECK = {
  p1a: ["βn", "A/V²", 1 / 9, [], [[1 / 18, "That's ID/(VGS − VT)². Sah's square law has βn/2 in front, so βn is twice that."], [.04, "That leaves out VT. The overdrive is VGS − VT = 3 V."]]],
  p1b: ["ID", "mA", 64.4444, [], [[500, "That's the saturation current. Check the region first: VDS = 0.2 V is far below VGS − VT."], [66.6667, "Close. That leaves out the −VDS²/2 term in the triode equation."]]],
  p1c: ["RDS(on)", "Ω", 3.10345, [], [[3, "That's the estimate 1/(βn(VGS − VT)). Divide 0.2 V by part b's exact current instead."]]],
  p2a: ["βp", "A/V²", 4 / 75, [], [[4 / 150, "That's |ID|/(VSG − |VT|)². The square law has βp/2 in front, so βp is twice that."]]],
  p2b: ["ID", "mA", -30.9333, [[30.9333, "Right size. As a drain current it's negative, −30.93 mA, because it flows out of a p-channel part's drain."]],
    [[240, "That's the saturation current. VSD = 0.2 V puts the switch in triode."], [32, "Close. That leaves out the −VSD²/2 term."], [-32, "Close. That leaves out the −VSD²/2 term."]]],
  p2c: ["RDS(on)", "Ω", 6.46552, [], [[6.25, "That's the estimate 1/(βp(VSG − |VT|)). Divide 0.2 V by part b's exact current instead."]]]
};
const sig3 = (v, x) => Math.abs(v - x) <= .5 * Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 2) * 1.02;
document.addEventListener("DOMContentLoaded", () => {
  for (const [id, [name, unit, target, alts, hints]] of Object.entries(CHECK)) {
    const art = document.getElementById(id), rev = art && art.querySelector("details.reveal"); if (!rev) continue;
    const d = document.createElement("details"); d.className = "deeper check";
    d.innerHTML = `<summary>Check your answer before revealing</summary><div><form><label><span>Your ${name}, in ${unit}</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="a number"></label><button type="submit" class="btn">Check</button></form><p class="checkmsg" role="status"></p></div>`;
    const input = d.querySelector("input"), msg = d.querySelector(".checkmsg");
    d.querySelector("form").addEventListener("submit", e => {
      e.preventDefault();
      const v = Number(input.value.replace(/[−–]/g, "-").replace(/,/g, "").replace(/\s*(m?A|A\/V²|A\/V\^2|Ω|ohms?)$/i, "").trim());
      let r, ok = false;
      const alt = alts.find(a => sig3(v, a[0])), hint = hints.find(h => sig3(v, h[0]));
      if (!input.value.trim() || !isFinite(v)) r = `Enter a number in ${unit}.`;
      else if (sig3(v, target)) { ok = true; r = "That matches to three significant figures."; }
      else if (alt) { ok = true; r = alt[1]; }
      else if (hint) r = hint[1];
      else if (sig3(-v, target)) r = "Right size, wrong sign.";
      else if (sig3(v / 1000, target) || sig3(v * 1000, target)) r = `Off by a factor of 1000. Enter it in ${unit}.`;
      else r = "Not yet. Check the region first, then go back through the steps above.";
      msg.textContent = r; msg.className = "checkmsg " + (ok ? "ok" : "no");
    });
    rev.before(d);
  }
});
