/* Drawing helpers for this lesson's 2D scenes. Coordinates are the scene's box units, y down. Cards draw with { side: true }. */
const BOX = { view: "2d", box: [12, 6, 776, 372], side: [488, 12, 292, 352] };
const AMP3 = { Vcc: "15 V", R1: "3.6 kΩ", R2: "620 Ω", R3: "2.7 kΩ", R4: "680 Ω", RL: "100 kΩ" };
const wob = (t, a = 46) => a * cos(t * 2.6);                  // an AC dot speed: back and forth

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
  /* a logarithmic ruler of standard capacitor values */
  ruler(k, n, x, y, w, title, ticks, lo, hi) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 96, title);
      const X = v => x + 20 + (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * (w - 40), yy = y + 58;
      s.wire([[x + 12, yy], [x + w - 12, yy]], "w thin");
      ticks.forEach(t => { s.wire([[X(t), yy - 9], [X(t), yy + 9]]); s.text([X(t), yy + 24], String(t), { anchor: "middle", cls: "sm" }); });
      k.rx = k.rx || {}; k.rx[n] = { X, yy };
    }, { side: true });
  },
  arrow(k, n, ruler, v, c = "cursor") {
    return k.group(n, s => { const { X, yy } = k.rx[ruler], g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); g.wire([[X(v), yy - 32], [X(v), yy + 4]], "w tint"); g.head([X(v), yy + 4], [X(v), yy - 32], 9, "head tint"); }, { side: true });
  },
  pick(k, n, ruler, v, c = "good") {
    return k.group(n, s => { const { X, yy } = k.rx[ruler], g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); svgEl("circle", { cx: X(v), cy: yy, r: 12, class: "w tint" }, g.g); }, { side: true });
  }
};
