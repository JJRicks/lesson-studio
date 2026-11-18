/* Drawing helpers for this lesson's 2D scenes. Coordinates are the scene's box units, y down. Cards draw with { side: true }.
   SC.card/lines/ring/bars/sflow come from the wk9 lesson; levels, split and ladder are new here. */
const BOX = { view: "2d", box: [12, 6, 776, 372], side: [488, 12, 292, 352] };
const wob = (t, a = 46) => a * cos(t * 2.6);                  // an AC dot speed: back and forth
const CX = 632;                                               // the middle of a side card

const SC = {
  card(s, x, y, w, h, title) { s.rect(x, y, w, h, "soft"); if (title) s.text([x + 12, y + 17], title, { cls: "sm" }); },
  /* a card with lines of plain text */
  lines(k, n, x, y, w, title, rows, o = {}) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 30 + rows.length * (o.lh || 20), title);
      rows.forEach((r, i) => s.text([x + 14, y + 40 + i * (o.lh || 20)], r, { cls: o.cls === undefined ? "sm" : o.cls, c: o.c || "ink" }));
    }, { side: true });
  },
  ring(k, n, p, rx, ry, c = "cursor") {
    return k.group(n, s => { const g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); svgEl("ellipse", { cx: p[0], cy: p[1], rx, ry, class: "w tint" }, g.g); });
  },
  /* an empty card that a KaTeX label sits in the middle of */
  box(k, n, y, h, title = "") { return k.group(n, s => SC.card(s, 494, y, 276, h, title), { side: true }); },
  /* horizontal bars on one shared scale. rows: [{ v, c, t }] */
  bars(k, n, x, y, w, title, rows, max) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 34 + rows.length * 40, title);
      const bw = w - 28;
      rows.forEach((r, i) => {
        const yy = y + 28 + i * 40, b = s.rect(x + 14, yy + 16, Math.max(3, r.v / max * bw), 12, "fillc");
        b.setAttribute("style", `--c:var(--${r.c});opacity:.8`); s.text([x + 14, yy + 7], r.t, { cls: "sm", c: r.tc || "ink" });
      });
    }, { side: true });
  },
  /* voltage levels as lines on a card, with arrows for each drop. rows: [{ t, v }] top to bottom, v in volts; drops label the gaps */
  levels(k, n, y, h, title, rows, drops = [], c = "accent") {
    return k.group(n, s => {
      SC.card(s, 494, y, 276, h, title);
      const x0 = 520, x1 = 690, top = y + 44, bot = y + h - 20, hi = rows[0].v, lo = rows[rows.length - 1].v;
      const Y = v => hi === lo ? top : top + (hi - v) / (hi - lo) * (bot - top);
      rows.forEach(r => { const g = s.group(); g.g.setAttribute("style", `--c:var(--${r.c || c})`); g.wire([[x0, Y(r.v)], [x1, Y(r.v)]], "w tint"); s.text([x0, Y(r.v) - 10], r.t, { cls: "sm", c: "ink" }); });
      drops.forEach((d, i) => { const a = Y(rows[i].v), b = Y(rows[i + 1].v); s.arrow([712, a + 3], [712, b - 3], { c: "cursor" }); s.text([724, (a + b) / 2], d, { cls: "sm", c: "cursor" }); });
    }, { side: true });
  },
  /* a voltage split: one bar cut into the part lost inside the transistor and the part that reaches the load */
  split(k, n, y, a, b, la, lb) {
    return k.group(n, s => {
      SC.card(s, 494, y, 276, 112, "where the base wiggle goes");
      const x0 = 510, w = 244, fa = a / (a + b), xa = x0 + Math.max(4, w * fa);
      const A = s.rect(x0, y + 40, xa - x0, 22, "fillc"), B = s.rect(xa, y + 40, x0 + w - xa, 22, "fillc");
      A.setAttribute("style", "--c:var(--bad);opacity:.85"); B.setAttribute("style", "--c:var(--good);opacity:.7");
      s.text([x0, y + 30], "vb, the whole wiggle", { cls: "sm", c: "ink" });
      s.text([x0, y + 80], la, { cls: "sm", c: "bad" }); s.text([x0 + w, y + 80], lb, { cls: "sm", c: "good", anchor: "end" });
      s.text([x0, y + 98], "inside Q", { cls: "sm" }); s.text([x0 + w, y + 98], "across the load", { cls: "sm", anchor: "end" });
    }, { side: true });
  },
  /* currents on a log scale, one bar per row. rows: [{ v (amps), t, c }]; hide[i] draws the bar but not its value */
  ladder(k, n, y, title, rows, o = {}) {
    return k.group(n, s => {
      const h = 40 + rows.length * 44; SC.card(s, 494, y, 276, h, title);
      const lo = Math.log10(o.lo || 1e-5), hi = Math.log10(o.hi || 1), x0 = 510, w = 244;
      rows.forEach((r, i) => {
        const yy = y + 34 + i * 44, f = (Math.log10(r.v) - lo) / (hi - lo), b = s.rect(x0, yy + 14, Math.max(4, w * Math.min(1, Math.max(0, f))), 12, "fillc");
        b.setAttribute("style", `--c:var(--${r.c || "t3"});opacity:.85`);
        s.text([x0, yy + 4], r.t, { cls: "sm", c: "ink" }); if (!r.hide) s.text([x0 + w, yy + 4], eng(r.v, "A", 3), { cls: "sm", anchor: "end" });
      });
      s.text([x0, y + h - 10], "log scale: each step is 10×", { cls: "sm" });
    }, { side: true });
  },
  /* moving dots that live on the side layer, so they follow the cards on a narrow stage */
  sflow(k, n, pts, o = {}) {
    const q = k.group(n, null, { side: true }), f = q.s.flow(pts, o);
    return Object.defineProperty(q, "speed", { get() { return f.speed; }, set(v) { f.speed = v; } });
  },
  /* a wave strip on a card: returns its geometry; draw traces with k.plot(..., { side: true }) */
  strip(k, n, y, h, title) {
    k.group(n, s => { SC.card(s, 494, y, 276, h, title); s.wire([[508, y + h / 2 + 8], [758, y + h / 2 + 8]], "gridl"); }, { side: true });
    return { y: y + h / 2 + 8, a: h / 2 - 20 };
  },
  wave(x0, x1, y, a, t, ph = 0) { return rng(0, 1, 120).map(u => [lerp(x0, x1, u), y - a * sin(2.6 * (t - (1 - u) * 5) + ph)]); }
};

/* AC view of a circuit drawn with a src/acg pair: m = 0 is the real circuit, 1 is the AC circuit */
function viewAC(h, m) { h.short(m); h.op("src", 1 - m); h.op("acg", m); }
