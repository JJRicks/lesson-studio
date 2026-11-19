/* Drawing helpers for this lesson's 2D scenes. Coordinates are the scene's box units, y down. Cards draw with { side: true }.
   SC.card/lines/ring/box come from the wk9 and wk10 lessons; ltPane is new: an LTspice plot window on a side card. */
const BOX = { view: "2d", box: [12, 6, 776, 372], side: [488, 12, 292, 352] };
const CX = 632;                                               // the middle of a side card
const FAM = ["muted", "t1", "t2", "t3", "t4"];                // one colour per stepped curve

const SC = {
  card(s, x, y, w, h, title) { s.rect(x, y, w, h, "soft"); if (title) s.text([x + 12, y + 17], title, { cls: "sm" }); },
  lines(k, n, x, y, w, title, rows, o = {}) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 30 + rows.length * (o.lh || 20), title);
      rows.forEach((r, i) => s.text([x + 14, y + 40 + i * (o.lh || 20)], r, { cls: o.cls === undefined ? "sm" : o.cls, c: o.c || "ink" }));
    }, { side: true });
  },
  ring(k, n, p, rx, ry, c = "cursor") {
    return k.group(n, s => { const g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); svgEl("ellipse", { cx: p[0], cy: p[1], rx, ry, class: "w tint" }, g.g); });
  },
  box(k, n, y, h, title = "") { return k.group(n, s => SC.card(s, 494, y, 276, h, title), { side: true }); }
};

/* an LTspice plot window on a side card. o = { x: [lo, hi, ticks, fmt], y: [lo, hi, ticks, fmt], title, c }.
   Returns { X(v), Y(i), L, R, top, bot } so traces drawn with k.plot(..., { side: true }) land on its axes. */
function ltPane(k, n, y, h, o) {
  const L = 556, R = 760, top = y + 28, bot = y + h - 24;
  const X = v => L + (v - o.x[0]) / (o.x[1] - o.x[0]) * (R - L);
  const Y = v => bot - (v - o.y[0]) / (o.y[1] - o.y[0]) * (bot - top);
  k.group(n, s => {
    SC.card(s, 494, y, 276, h, "");
    s.text([CX + 14, y + 15], o.title || "Id(M1)", { anchor: "middle", cls: "sm", c: o.c || "good" });
    for (const t of o.x[2]) { s.wire([[X(t), top], [X(t), bot]], "gridl"); s.text([X(t), bot + 13], o.x[3](t), { anchor: "middle", cls: "sm" }); }
    for (const t of o.y[2]) { s.wire([[L, Y(t)], [R, Y(t)]], "gridl"); s.text([L - 5, Y(t)], o.y[3](t), { anchor: "end", cls: "sm" }); }
  }, { side: true });
  return { X, Y, L, R, top, bot };
}
const fV = t => (+t.toFixed(2)) + "V", fmA = t => Math.round(t * 1e3) + "mA", fuA = t => t ? Math.round(t * 1e6) + "µ" : "0";
const fnmA = t => t ? "−" + Math.round(-t * 1e3) + "mA" : "0mA", fnuA = t => t ? "−" + Math.round(-t * 1e6) + "µ" : "0";
/* points of a curve on a pane, up to fraction u of the sweep. The curve stops where it leaves the pane, like a zoomed
   LTspice plot, rather than running along the edge and looking as if the current had levelled off there. */
function curvePts(P, xs, ys, u = 1) {
  const n = Math.max(0, Math.min(xs.length, Math.round(xs.length * u))), out = [];
  for (let j = 0; j < n; j++) {
    const X = P.X(xs[j]), Y = P.Y(ys[j]);
    if (Y < P.top - .5 || Y > P.bot + .5) {
      if (out.length) { const [x0, y0] = out[out.length - 1], yb = Y < P.top ? P.top : P.bot, f = (yb - y0) / (Y - y0); out.push([x0 + (X - x0) * f, yb]); }
      break;
    }
    out.push([X, Y]);
  }
  return out;
}
/* a cursor: a vertical and a horizontal dashed line through a point, drawn as two plots */
function cursorLines(k, P, x, y) { k.o.cv.set([[P.X(x), P.top - 4], [P.X(x), P.bot]]); k.o.chz.set([[P.L, P.Y(y)], [P.R, P.Y(y)]]); }
