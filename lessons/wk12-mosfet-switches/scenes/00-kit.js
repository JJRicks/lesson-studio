/* Drawing helpers for this lesson's 2D scenes. Coordinates are the scene's box units, y down. Cards draw with { side: true }.
   SC.card/lines/ring/box come from the wk9 to wk11 lessons; regionBar is new. */
const BOX = { view: "2d", box: [12, 6, 776, 372], side: [488, 12, 292, 352] };
const CX = 632;

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

/* which region? A voltage scale from 0 to max with the triode zone up to the edge (VGS − VT) and saturation past it,
   and a marker at the drain voltage. o = { edge, v, max, el: edge label, vl: marker label } */
function regionBar(k, n, y, o) {
  return k.group(n, s => {
    SC.card(s, 494, y, 276, 104, "which region?");
    const L = 512, R = 752, X = v => L + Math.min(1, v / o.max) * (R - L), top = y + 46, h = 22;
    const a = s.rect(L, top, X(o.edge) - L, h, "fillc"), b = s.rect(X(o.edge), top, R - X(o.edge), h, "fillc");
    a.setAttribute("style", "--c:var(--nreg)"); b.setAttribute("style", "--c:var(--act)");
    s.text([L + 6, top + h / 2], "triode", { cls: "sm", c: "ink" }); s.text([R - 6, top + h / 2], "saturation", { anchor: "end", cls: "sm", c: "ink" });
    s.wire([[X(o.edge), top - 4], [X(o.edge), top + h + 4]], "w thin");
    s.text([X(o.edge), top + h + 16], o.el, { anchor: "middle", cls: "sm", c: "ink" });
    const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)");
    g.head([X(o.v), top - 1], [X(o.v), top - 14], 10, "head tint");
    s.text([X(o.v) + (o.v / o.max > .7 ? -8 : 8), top - 12], o.vl, { anchor: o.v / o.max > .7 ? "end" : "start", cls: "sm", c: "cursor" });
  }, { side: true });
}
