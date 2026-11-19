/* MOSFET characterization: the live interactives. Every demo runs LTspice's BSS123 model (a cousin of the 2N7002 from the same
   library), never the homework's 2N7002 or BSS84, so nothing here shows an answer. */
let T = tokens(TOK);
const redraws = [];
themeListeners.push(() => { T = tokens(TOK); redraws.forEach(f => f()); });
const cell = (k, v, hl) => `<div${hl ? ' class="hl"' : ""}><div class="k">${k}</div><div class="v">${v}</div></div>`;
const lerp = (a, b, u) => a + (b - a) * u;
const fV = t => (+t.toFixed(2)) + "V", fA = d => t => eng(t, "A", d);
function tag(c, x, y, s, col, align = "left", size = 11, w = 600) { c.font = `${w} ${size}px ${css("--f-mono")}`; c.textAlign = align; c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left"; }

/* ---------- an LTspice-style plot: SVG traces, a dashed grid, and a cursor you drag or move with the arrow keys ----------
   o = { x: {min, max, ticks, fmt}, y: {min, max, ticks, fmt, log, lmin, lmax, lticks}, traces: [{ xs, ys, c }], h, hn, aria,
         title, hl: [{ y, label, c }] dashed reference lines, under(plot) -> SVG drawn beneath the traces, cur: { ti, i, onMove } } */
let ltUid = 0;
class LtPlot {
  constructor(host, o) { this.host = host; this.o = o; this.id = "lt" + (++ltUid); this.drag = false; new ResizeObserver(() => this.render()).observe(host); this.render(); }
  get cur() { return this.o.cur; }
  dims() { const W = Math.max(300, this.host.clientWidth || 700), n = W < 520; return { W, H: n ? (this.o.hn || 230) : (this.o.h || 290), l: n ? 58 : 68, r: 16, t: 22, b: 30 }; }
  X(x) { const d = this.d, a = this.o.x; return d.l + (x - a.min) / (a.max - a.min) * (d.W - d.l - d.r); }
  Y(y) {
    const d = this.d, a = this.o.y, top = d.t, bot = d.H - d.b;
    if (a.log) { const lo = Math.log10(a.lmin), hi = Math.log10(a.lmax), v = Math.log10(Math.max(Math.abs(y), a.lmin * .2)); return bot - (v - lo) / (hi - lo) * (bot - top); }
    return bot - (y - a.min) / (a.max - a.min) * (bot - top);
  }
  path(tr) { let p = ""; for (let k = 0; k < tr.xs.length; k++) p += (k ? "L" : "M") + this.X(tr.xs[k]).toFixed(1) + " " + Math.max(-3000, Math.min(3000, this.Y(tr.ys[k]))).toFixed(1); return p; }
  render() {
    const d = this.d = this.dims(), o = this.o, a = o.y, x0 = d.l, x1 = d.W - d.r, y0 = d.t, y1 = d.H - d.b;
    let s = `<svg viewBox="0 0 ${d.W} ${d.H}" height="${d.H}" tabindex="0" role="slider" aria-label="${o.aria}">`;
    s += `<defs><clipPath id="${this.id}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><rect class="bg" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>`;
    if (o.under) s += `<g clip-path="url(#${this.id})">${o.under(this)}</g>`;
    for (const t of o.x.ticks) { const X = this.X(t); s += `<line class="gr" x1="${X}" x2="${X}" y1="${y0}" y2="${y1}"/><text class="tk" x="${X}" y="${d.H - 10}" text-anchor="middle">${o.x.fmt(t)}</text>`; }
    for (const t of a.log ? a.lticks : a.ticks) { const Y = this.Y(t); s += `<line class="gr" x1="${x0}" x2="${x1}" y1="${Y}" y2="${Y}"/><text class="tk" x="${x0 - 6}" y="${Y + 4}" text-anchor="end">${a.fmt(t)}</text>`; }
    s += `<g clip-path="url(#${this.id})">`;
    for (const h of o.hl || []) { const Y = this.Y(h.y); if (Y < y0 || Y > y1) continue; s += `<line x1="${x0}" x2="${x1}" y1="${Y}" y2="${Y}" style="stroke:var(--${h.c || "cursor"});stroke-width:1.5;stroke-dasharray:7 5"/><text class="tk" x="${h.right ? x1 - 8 : x0 + 8}" y="${Y - 6}" text-anchor="${h.right ? "end" : "start"}" style="fill:var(--${h.c || "cursor"});font-weight:600">${h.label}</text>`; }
    o.traces.forEach((tr, ti) => { s += `<path class="tr" data-ti="${ti}" pathLength="1" d="${this.path(tr)}" style="stroke:var(--${tr.c})"/>`; });
    s += `</g><rect class="ax" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>`;
    s += `<text class="ttl" x="${(x0 + x1) / 2}" y="${y0 - 7}" text-anchor="middle" style="fill:var(--good)">${o.title || "Id(M1)"}</text><g class="cur"></g></svg>`;
    this.host.innerHTML = s; this.svg = this.host.firstChild; this.bind(); this.update();
  }
  bind() {
    const svg = this.svg, toI = e => { const r = svg.getBoundingClientRect(), d = this.d, px = (e.clientX - r.left) * d.W / r.width; return this.nearest(this.o.x.min + (px - d.l) / (d.W - d.l - d.r) * (this.o.x.max - this.o.x.min)); };
    svg.addEventListener("pointerdown", e => { this.drag = true; svg.setPointerCapture(e.pointerId); this.set(toI(e)); });
    svg.addEventListener("pointermove", e => { if (this.drag) this.set(toI(e)); });
    const end = () => { this.drag = false; }; svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
    svg.addEventListener("keydown", e => { const k = e.shiftKey ? 10 : 1; if (e.key === "ArrowRight") { this.set(this.cur.i + k); e.preventDefault(); } else if (e.key === "ArrowLeft") { this.set(this.cur.i - k); e.preventDefault(); } });
  }
  nearest(x) { const xs = this.o.traces[this.cur.ti].xs; let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] < x) lo = m; else hi = m; } return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi; }
  set(i) { this.cur.i = Math.max(0, Math.min(this.o.traces[this.cur.ti].xs.length - 1, i)); this.update(); }
  update() {
    const c = this.cur; if (!c || !this.svg) return;
    const tr = this.o.traces[c.ti], x = tr.xs[c.i], y = tr.ys[c.i], d = this.d, X = this.X(x), Y = this.Y(y);
    let s = "";
    if (X >= d.l - 1 && X <= d.W - d.r + 1) {
      s += `<line class="cv" x1="${X}" x2="${X}" y1="${d.t}" y2="${d.H - d.b}"/>`;
      if (Y >= d.t && Y <= d.H - d.b) s += `<line class="ch" x1="${d.l}" x2="${d.W - d.r}" y1="${Y}" y2="${Y}"/><circle class="mk" cx="${X}" cy="${Y}" r="5.5" style="fill:var(--${tr.c})"/>`;
    }
    this.svg.querySelector(".cur").innerHTML = s;
    this.svg.setAttribute("aria-valuetext", this.o.x.fmt(x) + ", " + eng(y, "A"));
    c.onMove && c.onMove(c.i, x, y);
  }
  /* draw the traces one after another, like LTspice stepping its second source; status(k, fraction) or status(null) at the end */
  run(dur, status) {
    const paths = [...this.svg.querySelectorAll("path.tr")], n = paths.length;
    if (reduce) { status && status(null); return; }
    paths.forEach(p => { p.style.transition = "none"; p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = "1"; });
    void this.svg.getBoundingClientRect();
    paths.forEach((p, k) => { p.style.transition = `stroke-dashoffset ${dur}ms linear ${k * dur}ms`; p.style.strokeDashoffset = "0"; });
    const t0 = performance.now(), tick = t => { const e = t - t0, k = Math.floor(e / dur); if (k >= n) { status && status(null); return; } status && status(k, (e % dur) / dur); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
}

/* ---------- hero: inside an n-channel MOSFET. Electrons gather under the gate and stream from source to drain ---------- */
(function hero() {
  const cv = $("#heroCv"), sG = $("#heroG"), sD = $("#heroD"), reads = $("#heroReads"), status = $("#heroStatus"), m = MOS.BSS123;
  const R = (a, b) => a + Math.random() * (b - a);
  const wells = Array.from({ length: 170 }, (_, k) => ({ side: k % 2, a: Math.random(), b: Math.sqrt(R(.02, 1)), j: R(0, 6.3) }));
  const holes = Array.from({ length: 54 }, () => ({ x: Math.random(), y: Math.random(), j: R(0, 6.3) }));
  const chan = [];
  let q, t = 0;
  function solve() {
    const vg = +sG.value, vd = +sD.value, id = mosId(m, vg, vd), vdi = Math.max(0, vd - id * (m.Rs + m.Rd));
    const q0 = vgst(m, vg - id * m.Rs), sat = q0 <= vdi * m.mtr, vde = Math.min(vdi * m.mtr, q0), C = q0 * vde - vde * vde / 2;
    const xp = sat ? 1 - Math.min(.18, .3 * (1 - q0 / Math.max(vdi, 1e-6))) : 1;            // where the channel ends
    const Q = x => x >= xp ? 0 : sat ? q0 * Math.sqrt(Math.max(0, 1 - x / xp)) : Math.sqrt(Math.max(0, q0 * q0 - 2 * x * C));
    let mean = 0; for (let k = 0; k < 24; k++) mean += Q((k + .5) / 24) / 24;
    q = { vg, vd, id, q0, sat, xp, Q, n: Math.round(170 * Math.min(1, mean / 3.2)), reg: regionOf(m, vg, vd) };
    const pick = () => { for (let k = 0; k < 30; k++) { const x = Math.random() * q.xp; if (Math.random() * q.q0 < Q(x)) return x; } return Math.random() * q.xp; };
    while (chan.length < q.n) chan.push({ x: pick(), u: Math.random(), j: R(0, 6.3) });
    while (chan.length > q.n) chan.splice(Math.floor(Math.random() * chan.length), 1);
  }
  function step(dt) {
    if (q.id < 1e-7) return;
    const F = .55 * clamp((Math.log10(q.id) + 7) / 7, 0, 1);
    for (const e of chan) {
      e.x += dt * (e.x >= q.xp ? 2.4 : Math.min(2.4, F / Math.max(q.Q(e.x), .05)));
      if (e.x > 1) { e.x -= 1; e.u = Math.random(); }
    }
  }
  function draw() {
    const { c, W, H } = canvas2d(cv), surf = 128, bot = H - 26, wd = 66;
    const sx = [W * .06, W * .35], dx = [W * .65, W * .94], gx = [W * .31, W * .69], cx0 = sx[1], cx1 = dx[0];
    const scx = (sx[0] + sx[1]) / 2, dcx = (dx[0] + dx[1]) / 2, rx = (sx[1] - sx[0]) / 2;
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.fillStyle = css("--preg"); c.fillRect(14, surf, W - 28, bot - surf);                                   // p-type body
    const dep = 8 + 30 * Math.sqrt(clamp(q.vg / m.Vto, 0, 1));
    c.fillStyle = rgbS(T.plot, .55); c.fillRect(cx0, surf, cx1 - cx0, dep);                                // depletion: holes pushed away
    c.fillStyle = css("--nreg");
    for (const x of [scx, dcx]) { c.beginPath(); c.ellipse(x, surf, rx, wd, 0, 0, Math.PI); c.fill(); }    // n+ wells
    const L = x => cx0 + x * (cx1 - cx0), th = x => 3 + 22 * q.Q(x) / 3.2;
    if (q.q0 > .02) {                                                                                      // the channel: a thin n-type sheet
      c.beginPath(); c.moveTo(cx0 - 2, surf);
      for (let k = 0; k <= 60; k++) { const x = k / 60; c.lineTo(L(x), surf + (x < q.xp ? th(x) : 0)); }
      c.lineTo(cx1 + 2, surf); c.closePath(); c.fill();
      c.strokeStyle = rgbS(T.accent, .55); c.lineWidth = 1.2; c.beginPath();                              // the sheet's lower edge
      for (let k = 0; k <= 60; k++) { const x = k / 60; if (x > q.xp) break; c[k ? "lineTo" : "moveTo"](L(x), surf + th(x)); } c.stroke();
    }
    /* holes in the body, pushed down under the gate */
    c.strokeStyle = rgbS(T.muted, .9); c.lineWidth = 1.2;
    for (const h of holes) {
      let x = 18 + h.x * (W - 36), y = surf + 8 + h.y * (bot - surf - 14);
      const inWell = [scx, dcx].some(w => ((x - w) / (rx + 6)) ** 2 + ((y - surf) / (wd + 6)) ** 2 < 1);
      if (inWell) continue;
      if (x > cx0 - 6 && x < cx1 + 6) y = Math.max(y, surf + dep + 6 + h.y * 10);
      c.beginPath(); c.arc(x + Math.sin(t * 1.3 + h.j) * 1.2, y + Math.cos(t * 1.1 + h.j) * 1.2, 2.6, 0, 6.3); c.stroke();
    }
    /* electrons: crowded in the n+ wells, and in the channel when there is one */
    c.fillStyle = rgbS(T.cursor);
    for (const e of wells) {
      const w = e.side ? dcx : scx, th2 = e.a * Math.PI, x = w + Math.cos(th2) * rx * e.b * .92, y = surf + 3 + Math.sin(th2) * (wd - 6) * e.b;
      c.beginPath(); c.arc(x + Math.sin(t * 2 + e.j) * 1.1, y + Math.cos(t * 1.7 + e.j) * 1.1, 2.3, 0, 6.3); c.fill();
    }
    for (const e of chan) {
      const x = L(Math.min(1, e.x)), y = e.x < q.xp ? surf + 1.5 + e.u * Math.max(1, th(e.x) - 3) : surf + 3 + (e.x - q.xp) / Math.max(.01, 1 - q.xp) * 9;
      c.beginPath(); c.arc(x, y + Math.sin(t * 3 + e.j) * .5, 2.2, 0, 6.3); c.fill();
    }
    /* oxide, gate, contacts and leads */
    c.fillStyle = rgbS(T.surface_2); c.fillRect(gx[0], surf - 10, gx[1] - gx[0], 10); c.strokeStyle = rgbS(T.line); c.lineWidth = 1; c.strokeRect(gx[0], surf - 10, gx[1] - gx[0], 10);
    c.fillStyle = rgbS(T.accent); c.fillRect(gx[0], surf - 36, gx[1] - gx[0], 26);
    const np = Math.round(q.vg * 5);
    for (let k = 0; k < np; k++) tag(c, gx[0] + (k + .5) * (gx[1] - gx[0]) / np, surf - 15, "+", rgbS(T.plot), "center", 13, 700);
    c.fillStyle = rgbS(T.muted); for (const x of [scx, dcx]) c.fillRect(x - 22, surf - 7, 44, 7);
    c.strokeStyle = rgbS(T.ink); c.lineWidth = 1.6; c.beginPath();
    for (const [x, y] of [[scx, surf - 7], [(gx[0] + gx[1]) / 2, surf - 36], [dcx, surf - 7]]) { c.moveTo(x, 34); c.lineTo(x, y); } c.stroke();
    tag(c, scx, 24, "S · 0 V", rgbS(T.ink), "center", 12);
    tag(c, (gx[0] + gx[1]) / 2, 24, `G · ${q.vg.toFixed(2)} V`, rgbS(T.ink), "center", 12);
    tag(c, dcx, 24, `D · ${q.vd.toFixed(2)} V`, rgbS(T.ink), "center", 12);
    /* names */
    const ink = rgbS(T.ink), mu = rgbS(T.muted);
    tag(c, gx[0] + 4, surf - 42, "gate (metal)", mu, "left", 10.5, 500);
    tag(c, gx[1] + 6, surf - 1, "oxide", mu, "left", 10.5, 500);
    tag(c, scx, surf + wd + 16, "n+ source", ink, "center", 11);
    tag(c, dcx, surf + wd + 16, "n+ drain", ink, "center", 11);
    tag(c, 22, bot - 8, "p-type body (tied to the source)", ink, "left", 11);
    if (q.q0 > .3) tag(c, (cx0 + cx1) / 2, surf + dep + 16, "channel ↑   depletion: holes pushed away", mu, "center", 10.5, 500);
    else tag(c, (cx0 + cx1) / 2, surf + dep + 16, q.vg > .4 ? "holes pushed away, no channel yet" : "no channel: back-to-back junctions", mu, "center", 10.5, 500);
    if (q.sat && q.id > 1e-4 && q.xp < .985) { const x = L(q.xp), yb = surf + dep + 26; c.strokeStyle = rgbS(T.bad); c.lineWidth = 1.4; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x, surf + 1); c.lineTo(x, yb); c.stroke(); c.setLineDash([]); tag(c, x, yb + 12, "pinch-off", rgbS(T.bad), "center", 10.5); }
  }
  function readouts() {
    $("#heroGOut").textContent = q.vg.toFixed(2) + " V"; $("#heroDOut").textContent = q.vd.toFixed(2) + " V";
    status.textContent = q.reg === "cutoff" ? "off: no channel" : q.sat ? "pinched off: the current levels out" : "channel end to end: acts like a resistor";
    reads.innerHTML = cell("drain current I<sub>D</sub>", eng(q.id, "A", 3), true) + cell("gate current", "0 A") +
      cell("base current a BJT needs (β = 100)", eng(q.id / 100, "A", 3)) + cell("region", q.reg);
  }
  const upd = () => { solve(); readouts(); draw(); };
  sG.addEventListener("input", upd); sD.addEventListener("input", upd);
  upd(); redraws.push(draw); new ResizeObserver(draw).observe(cv);
  whenVisible(cv, dt => { t += dt; step(dt); draw(); });
})();

/* ---------- topic: the symbols, n-channel and p-channel ---------- */
(function symbols() {
  const s = Schem.svg($("#symFig"), [0, 0, 520, 236], "Two MOSFET symbols. The n-channel one has its arrow pointing in toward the channel, with the drain on top. The p-channel one has its arrow pointing out, with the source on top.");
  const n = s.mosfet([90, 124]), p = s.mosfet([330, 124], { p: true, sTop: true });
  for (const [m, x] of [[n, 90], [p, 330]]) { s.wire([[x - 36, m.G[1]], m.G]); s.wire([m.D, [m.D[0], m.D[1] + (m.D[1] < 124 ? -20 : 20)]]); s.wire([m.S, [m.S[0], m.S[1] + (m.S[1] < 124 ? -20 : 20)]]); }
  s.text([130, 26], "n-channel · 2N7002", { anchor: "middle" }); s.text([370, 26], "p-channel · BSS84", { anchor: "middle" });
  s.text([48, 112], "G", { anchor: "end" }); s.text([288, 112], "G", { anchor: "end" });
  s.text([148, 64], "D drain"); s.text([148, 190], "S source"); s.text([388, 64], "S source"); s.text([388, 190], "D drain");
  s.text([130, 226], "arrow points in", { anchor: "middle", cls: "sm" }); s.text([370, 226], "arrow points out", { anchor: "middle", cls: "sm" });
  s.text([150, 124], "body tied to S", { cls: "sm" }); s.text([390, 124], "body tied to S", { cls: "sm" });
})();

/* ---------- topic: finding a threshold with a cursor (BSS123) ---------- */
(function threshold() {
  const m = MOS.BSS123, xs = sweepX(.5, 3, .001), ys = xs.map(v => mosId(m, v, v)), reads = $("#thrReads");
  const HL = [{ y: 250e-6, label: "250 µA" }, { y: 1e-3, label: "1 mA", c: "t2", right: true }];
  const X1 = { min: .5, max: 3, ticks: [.5, .8, 1.1, 1.4, 1.7, 2, 2.3, 2.6, 2.9], fmt: fV };
  const VIEW = {
    full: { x: X1, y: { min: 0, max: .35, ticks: [0, .05, .1, .15, .2, .25, .3, .35], fmt: t => Math.round(t * 1e3) + "mA" }, hl: [] },
    zoom: { x: { min: 1.2, max: 1.8, ticks: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8], fmt: fV }, y: { min: 0, max: 1.1e-3, ticks: [0, 2e-4, 4e-4, 6e-4, 8e-4, 1e-3], fmt: t => t >= 1e-3 ? "1mA" : t ? Math.round(t * 1e6) + "µA" : "0" }, hl: HL },
    log: { x: X1, y: { log: true, lmin: 1e-9, lmax: 1, lticks: [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1], fmt: fA(1) }, hl: HL }
  };
  const plot = new LtPlot($("#thrPlot"), {
    ...VIEW.full, h: 290, hn: 236, aria: "Drain current against gate voltage for a BSS123 with its drain tied to its gate. Drag to move the cursor.",
    traces: [{ xs, ys, c: "good" }],
    cur: { ti: 0, i: 1700, onMove(i, x, y) {
      const r = y / 250e-6, off = (r - 1) * 100, hit = Math.abs(off) < 1.6, big = v => v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US");
      const cmp = r >= 1.1 ? big(r) + "× too high" : r <= 1 / 1.1 ? (r > 0 ? big(1 / r) + "× too low" : "far too low") : (off >= 0 ? "+" : "−") + Math.abs(off).toFixed(1) + "%";
      reads.innerHTML = cell("Horz · V<sub>GS</sub>", x.toFixed(3) + " V") + cell("Vert · Id(M1)", eng(y, "A", 5), hit) +
        cell("compared with 250 µA", cmp) +
        cell("so V<sub>T</sub> is", hit ? x.toFixed(3) + " V <span class=\"hintok\">✓</span>" : "keep dragging");
    } }
  });
  seg("#thrSeg", k => { Object.assign(plot.o, VIEW[k]); plot.render(); });
})();

/* ---------- .dc decoders ---------- */
const DEC = {
  A: [[".dc", "Analysis type: a DC sweep. LTspice solves the circuit's steady state again and again, nudging one source each time. No time passes."],
    ["Vgs", "The source to sweep: the voltage source you named Vgs. Its values become the x-axis."],
    ["0.5", "Start at 0.5 V. That's safely below any threshold, so the curve starts flat."],
    ["3.0", "Stop at 3.0 V. By then the 2N7002 carries over 100 mA."],
    ["1m", "Step 1 mV (m means milli). (3.0 − 0.5)/0.001 + 1 = 2,501 points, fine enough to land a cursor near 250 µA."]],
  B: [[".dc", "A DC sweep, this time with two sources."],
    ["Vds", "1st source: Vds, swept for every curve. It becomes the x-axis."],
    ["0", "Inner start: 0 V on the drain."], ["10", "Inner stop: 10 V."], ["0.1", "Inner step: 0.1 V, so 101 points per curve."],
    ["Vgs", "2nd source: Vgs. It changes once per curve, so each Vgs value gets its own trace.", 1],
    ["1", "Outer start: 1 V on the gate.", 1], ["5", "Outer stop: 5 V.", 1], ["1", "Outer step: 1 V, so 1, 2, 3, 4 and 5 V: five curves, 505 solves in all.", 1]]
};
$$(".tokens[data-dec]").forEach(box => {
  const key = box.dataset.dec, exp = document.getElementById("dec" + key + "-exp");
  box.innerHTML = DEC[key].map((t, j) => `<button type="button" class="tok${t[2] ? " g2" : ""}" aria-pressed="false" data-j="${j}">${t[0]}</button>`).join("");
  box.addEventListener("click", e => {
    const b = e.target.closest(".tok"); if (!b) return;
    $$(".tok", box).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const t = DEC[key][+b.dataset.j]; exp.innerHTML = `<b class="mono">${t[0]}</b> · ${t[1]}`;
  });
});

/* ---------- topic: the three regions, on a family of curves (BSS123) ---------- */
(function family() {
  const m = MOS.BSS123, xs = sweepX(0, 10, .02), G = [1, 2, 3, 4, 5], C = ["muted", "t1", "t2", "t3", "t4"], reads = $("#famReads"), st = $("#famStatus");
  const traces = G.map((g, j) => ({ xs, ys: xs.map(v => mosId(m, g, v)), c: C[j] }));
  const edge = []; for (let g = m.Vto + .12; g <= 6.2; g += .02) { const q = kneeOf(m, g); if (q.v < 10.5) edge.push([q.v, q.i]); }
  let showR = true;
  const regions = P => {
    const d = P.d, top = d.t, bot = d.H - d.b, l = d.l, r = d.W - d.r, pts = edge.map(([v, i]) => `${P.X(v).toFixed(1)},${Math.max(top - 5, P.Y(i)).toFixed(1)}`);
    if (!showR) return "";
    return `<rect x="${l}" y="${top}" width="${r - l}" height="${bot - top}" style="fill:var(--act);opacity:.75"/>` +
      `<polygon points="${l},${bot} ${pts.join(" ")} ${P.X(edge[edge.length - 1][0]).toFixed(1)},${top - 5} ${l},${top - 5}" style="fill:var(--nreg);opacity:.85"/>` +
      `<polyline points="${pts.join(" ")}" style="fill:none;stroke:var(--ink);stroke-width:1.3;stroke-dasharray:5 4;opacity:.7"/>` +
      `<text class="bl" x="${l + 8}" y="${top + 16}">TRIODE · a resistor</text><text class="bl" x="${r - 8}" y="${top + 16}" text-anchor="end">SATURATION · a current source</text>`;
  };
  let sel = 3;
  const plot = new LtPlot($("#famPlot"), {
    x: { min: 0, max: 10, ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], fmt: t => t + "V" },
    y: { min: 0, max: 1.2, ticks: [0, .2, .4, .6, .8, 1, 1.2], fmt: t => t ? Math.round(t * 1e3) + "mA" : "0" },
    h: 310, hn: 250, under: regions, traces, aria: "A family of five drain-current curves for a BSS123, one per gate voltage from 1 to 5 V. Drag to move the cursor.",
    cur: { ti: sel, i: 100, onMove(i, x, y) {
      const g = G[this.ti], reg = regionOf(m, g, x);
      const like = reg === "cutoff" ? "an open switch" : reg === "triode" ? `a ${eng(x / y, "Ω", 3)} resistor` : `a ${eng(y, "A", 3)} current source`;
      reads.innerHTML = cell("Horz · V<sub>DS</sub>", x.toFixed(2) + " V") + cell(`Id(M1) at V<sub>GS</sub> = ${g} V`, eng(y, "A", 4), true) + cell("region", reg) + cell("acts like", like);
    } }
  });
  seg("#famSeg", k => { plot.cur.ti = +k; plot.update(); });
  $("#famRegions").addEventListener("change", e => { showR = e.target.checked; plot.render(); });
  st.textContent = "Press Run sweep to watch LTspice build the curves.";
  $("#famRun").addEventListener("click", () => plot.run(1100, (k, f) => {
    st.textContent = k === null ? "done: 5 curves × 501 points" : `outer: Vgs = ${G[k]} V · inner: Vds = ${(f * 10).toFixed(1)} V`;
  }));
})();

/* ---------- topic: the p-channel mirror. The same test circuit, built for n and for p ---------- */
(function mirror() {
  const box = $("#mirSch"), sV = $("#mirV"), reads = $("#mirReads"), status = $("#mirStatus"), m = MOS.BSS123;
  const ALT = { n: "An n-channel test circuit: the source at ground, the gate and drain tied together and raised by a source.",
    p: "A p-channel test circuit: the source at ground on top, the gate and drain tied together and pulled below it by a source." };
  let mode = "n", s, h, f, t = 0;
  function draw() {
    box.replaceChildren(); s = Schem.svg(box, [24, 62, 456, 292], ALT[mode]);
    h = mode === "n" ? drawP1(s, { name: "BSS123", dc: false }) : drawP3(s, { name: "p-twin", dc: false });
    f = s.flow(h.f.main, { c: "t3", gap: 16 });
  }
  function upd() {
    const v = +sV.value, i = mosId(m, v, v), n = mode === "n", sg = x => (x < 0 ? "−" : x > 0 ? "+" : "") + Math.abs(x).toFixed(2) + " V";
    $("#mirVOut").textContent = v.toFixed(2) + " V";
    status.textContent = n ? "n-channel: gate above the source" : "p-channel: gate below the source";
    reads.innerHTML = cell("V<sub>GS</sub>", sg(n ? v : -v), n) + cell("V<sub>SG</sub>", sg(n ? -v : v), !n) +
      cell("Id(M1), as LTspice prints it", eng(n ? i : -i, "A", 4), true) + cell("current flows", n ? "into the drain" : "out of the drain");
    f.speed = spdI(i);
  }
  seg("#mirSeg", k => { mode = k; draw(); upd(); });
  sV.addEventListener("input", upd); draw(); upd();
  whenVisible(box, dt => { Schem.tick(s.flows, dt); });
})();

/* ---------- topic: CMOS, an n-channel and a p-channel sharing one input ---------- */
(function cmos() {
  const box = $("#cmosSch"), cv = $("#cmosCv"), sV = $("#cmosV"), reads = $("#cmosReads"), m = MOS.BSS123, VDD = 5;
  const s = Schem.svg(box, [20, 8, 380, 312], "A CMOS inverter. A p-channel transistor runs from 5 V down to the output, and an n-channel transistor runs from the output down to ground. Both gates connect to the input.");
  const P = s.mosfet([170, 112], { p: true, sTop: true }), N = s.mosfet([170, 236]);
  s.wire([P.S, [214, 40]]); s.wire([[190, 40], [238, 40]], "w bar"); s.text([248, 40], "5 V");
  s.wire([P.D, N.D]); s.node([214, 174]); s.wire([[214, 174], [300, 174]]); const fo = s.net([300, 174], { w: 46 }); s.text(fo, "Vout", { anchor: "middle", cls: "sm" });
  s.wire([N.S, [214, 300]]); s.gnd([214, 300]);
  s.wire([P.G, [120, 112], [120, 236], N.G]); s.node([120, 174]); s.wire([[120, 174], [96, 174]]); const fi = s.net([96, 174], { left: true, w: 40 }); s.text(fi, "Vin", { anchor: "middle", cls: "sm" });
  s.text([150, 84], "p", { anchor: "end", cls: "sm" }); s.text([150, 268], "n", { anchor: "end", cls: "sm" });
  const fl = s.flow([[214, 40], ...P.thru.slice().reverse(), ...N.thru, [214, 300]], { c: "t3", gap: 16 });
  /* a little output slope (2% per volt, like a real part's channel-length modulation) gives the midpoint one answer */
  const In = (vin, vo) => mosId(m, vin, vo) * (1 + .02 * vo), Ip = (vin, vo) => mosId(m, VDD - vin, VDD - vo) * (1 + .02 * (VDD - vo));
  const solve = vin => { let lo = 0, hi = VDD; for (let k = 0; k < 60; k++) { const vo = (lo + hi) / 2; if (Ip(vin, vo) > In(vin, vo)) lo = vo; else hi = vo; } const vo = (lo + hi) / 2; return { vo, i: In(vin, vo) }; };
  const curve = sweepX(0, 5, .025).map(v => [v, solve(v)]);
  let q;
  const state = vg => vg < m.Vto - .15 ? "off" : vg > 3.6 ? "on" : "partly on";
  function draw() {
    const { c, W, H } = canvas2d(cv), l = 46, r = W - 14, top = 24, bot = H - 30, X = v => l + v / 5 * (r - l), Y = v => bot - v / 5 * (bot - top);
    c.fillStyle = rgbS(T.plot); c.fillRect(0, 0, W, H);
    c.strokeStyle = rgbS(T.grid); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath();
    for (let v = 0; v <= 5; v++) { c.moveTo(X(v), top); c.lineTo(X(v), bot); c.moveTo(l, Y(v)); c.lineTo(r, Y(v)); } c.stroke(); c.setLineDash([]);
    for (let v = 0; v <= 5; v++) { tag(c, X(v), bot + 16, v + "V", rgbS(T.muted), "center", 10.5, 500); tag(c, l - 6, Y(v) + 4, v + "V", rgbS(T.muted), "right", 10.5, 500); }
    const Ym = Math.max(...curve.map(p => p[1].i));
    c.fillStyle = rgbS(T.t3, .22); c.beginPath(); c.moveTo(X(0), bot); curve.forEach(([v, p]) => c.lineTo(X(v), bot - p.i / Ym * (bot - top) * .5)); c.lineTo(X(5), bot); c.fill();
    c.strokeStyle = rgbS(T.accent); c.lineWidth = 2.4; c.beginPath(); curve.forEach(([v, p], k) => k ? c.lineTo(X(v), Y(p.vo)) : c.moveTo(X(v), Y(p.vo))); c.stroke();
    tag(c, l + 6, top - 8, "Vout against Vin", rgbS(T.accent)); tag(c, r, top - 8, "shaded: supply current", rgbS(T.t3), "right");
    const vin = +sV.value; c.fillStyle = rgbS(T.cursor); c.beginPath(); c.arc(X(vin), Y(q.vo), 5.5, 0, 6.3); c.fill();
  }
  function upd() {
    const vin = +sV.value; q = solve(vin);
    $("#cmosVOut").textContent = vin.toFixed(2) + " V";
    reads.innerHTML = cell("Vout", q.vo.toFixed(2) + " V", true) + cell("current from the 5 V supply", q.i < 1e-9 ? "below 1 nA" : eng(q.i, "A", 3), true) +
      cell("p-channel (top)", state(VDD - vin)) + cell("n-channel (bottom)", state(vin));
    fl.speed = spdI(q.i); draw();
  }
  sV.addEventListener("input", upd); upd(); redraws.push(draw); new ResizeObserver(draw).observe(cv);
  whenVisible(box, dt => Schem.tick(s.flows, dt));
})();

/* ---------- "check your answer before revealing": one box per answer the homework asks for ---------- */
const CHECK = {
  p1: ["VT", "V", 1.567, [], [[1.6, "That's the model's Vto parameter, typed into the library. The homework asks for the measured threshold: the cursor's Horz value where Id is closest to 250 µA."]]],
  p3: ["VSG at Id = −1 mA", "V", 2.156, [[-2.156, "Right, and that's VT with its sign. The sweep's cursor reads the positive |VT| = 2.156 V, which is the number the homework expects to see."]],
    [[2.1, "That's the model's |Vto| from the library. The homework asks for the cursor's Horz value where Id(M1) is closest to −1 mA."]]]
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
      const v = Number(input.value.replace(/[−–]/g, "-").replace(/,/g, "").replace(/\s*m?V$/i, "").trim());
      let r, ok = false;
      const alt = alts.find(a => sig3(v, a[0])), hint = hints.find(h => Math.abs(v - h[0]) < 1e-9);
      if (!input.value.trim() || !isFinite(v)) r = `Enter a number in ${unit}.`;
      else if (sig3(v, target)) { ok = true; r = "That matches to three significant figures."; }
      else if (alt) { ok = true; r = alt[1]; }
      else if (hint) r = hint[1];
      else if (sig3(-v, target)) r = "Right size, wrong sign. Which way does the cursor's Horz value point?";
      else if (sig3(v / 1000, target)) r = `Off by a factor of 1000. Enter it in ${unit}, not mV.`;
      else r = "Not yet. Check which point the cursor sits on, and read its Horz value.";
      msg.textContent = r; msg.className = "checkmsg " + (ok ? "ok" : "no");
    });
    rev.before(d);
  }
});
