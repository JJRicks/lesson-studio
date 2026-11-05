/* Drawing helpers for this lesson's 2D scenes: part names on the three circuits, and the side cards
   (a voltage budget, an E24 ruler, an LTspice printout). Coordinates are the scene's box units, y down. */
/* The card helpers draw with { side: true }, so a scene that declares side: [...] can move them below the circuit on a phone. */
const SC = {
  npnText(s, h, o = {}) {
    s.text([98, 117], "Vcc"); s.text([98, 135], "5 V", { cls: "sm" });
    s.text([348, 68], "R2"); s.text([312, 141], "white", { anchor: "end", cls: "sm" }); s.text([312, 158], "LED", { anchor: "end" });
    s.text(h.flag, "Vce", { anchor: "middle", cls: "sm" });
    s.text([352, 252], "Q1"); if (o.part !== false) s.text([352, 270], "2N3904", { cls: "sm" });
    s.text([210, 241], "R1", { anchor: "middle" });
    s.text([98, 292], "Vin"); s.text([98, 310], o.vin || "3.3 V", { cls: "sm" });
  },
  pnpText(s, h, o = {}) {
    s.text([98, 117], "Vcc"); s.text([98, 135], "5 V", { cls: "sm" });
    s.text([352, 88], "Q1"); if (o.part !== false) s.text([352, 106], "2N3906", { cls: "sm" });
    s.text([233, 75], "R1", { anchor: "middle" });
    s.text([178, 222], "Vin"); s.text([178, 240], o.vin || "0 V", { cls: "sm" });
    s.text(h.flag, "Vc", { anchor: "middle", cls: "sm" });
    s.text([312, 182], "green", { anchor: "end", cls: "sm" }); s.text([312, 199], "LED", { anchor: "end" }); s.text([348, 252], "R2");
  },
  relayText(s, h, o = {}) {
    s.text([98, 117], "Vcc"); s.text([98, 135], "12 V", { cls: "sm" }); s.text([252, 112], "D1", { anchor: "end" });
    s.text([376, 110], "coil"); s.text([376, 128], "800 Ω", { cls: "sm" }); s.text([408, 168], "relay", { anchor: "middle", cls: "sm" });
    s.text([478, 224], "lamp");
    s.text(h.acFlag, "120 V AC", { anchor: "middle", cls: "sm" }); s.text(h.nFlag, "Neutral", { anchor: "middle", cls: "sm" }); s.text(h.inFlag, "Vin", { anchor: "middle", cls: "sm" });
    s.text([382, 252], "Q1"); s.text([382, 270], "2N3904", { cls: "sm" }); s.text([215, 241], "R1", { anchor: "middle" });
    if (o.vin !== false) s.text([62, 288], o.vin || "3.3 V", { anchor: "middle", cls: "sm" });
  },
  card(s, x, y, w, h, title) { s.rect(x, y, w, h, "soft"); if (title) s.text([x + 12, y + 17], title, { cls: "sm" }); },
  /* a stacked bar: the loop's supply voltage, split among the parts that spend it. parts: [{ v, c, t }] */
  budget(k, n, x, y, w, title, total, parts) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 92, title);
      const bw = w - 24, sc = bw / total; let cx = x + 12;
      parts.forEach((p, i) => {
        const pw = Math.max(p.v * sc, 3), r = s.rect(cx, y + 30, pw, 22, "fillc");
        r.setAttribute("style", `--c:var(--${p.c});opacity:.78`);
        const last = i === parts.length - 1, first = i === 0, tx = first ? x + 12 : last ? x + w - 12 : cx + pw / 2;
        s.text([tx, y + (i % 2 ? 82 : 66)], p.t, { cls: "sm", anchor: first ? "start" : last ? "end" : "middle", c: p.tc || "ink" });
        cx += pw;
      });
    }, { side: true });
  },
  /* a linear stretch of the E24 list with an optional arrow at the calculated value */
  ruler(k, n, x, y, w, title, ticks, lo, hi, mark) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 92, title);
      const X = v => x + 22 + (v - lo) / (hi - lo) * (w - 44), yy = y + 54;
      s.wire([[x + 16, yy], [x + w - 16, yy]], "w thin");
      ticks.forEach(t => { s.wire([[X(t), yy - 9], [X(t), yy + 9]]); s.text([X(t), yy + 23], t.toFixed(1), { anchor: "middle", cls: "sm" }); });
      if (mark != null) { const g = s.group(); g.g.setAttribute("style", "--c:var(--cursor)"); g.wire([[X(mark), yy - 30], [X(mark), yy + 4]], "w tint"); g.head([X(mark), yy + 4], [X(mark), yy - 30], 9, "head tint"); }
      k.rx = k.rx || {}; k.rx[n] = X;
    }, { side: true });
  },
  /* a highlight ring on one tick of a ruler made above */
  pick(k, n, ruler, v, y, c = "good") {
    return k.group(n, s => { const x = k.rx[ruler](v), g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); svgEl("circle", { cx: x, cy: y + 54, r: 12, class: "w tint" }, g.g); }, { side: true });
  },
  /* an LTspice-style printout. rows: [[name, value]] */
  op(k, n, x, y, w, rows, title = "--- Operating Point ---") {
    return k.group(n, s => {
      SC.card(s, x, y, w, 30 + rows.length * 24, title);
      rows.forEach(([a, b], i) => { s.text([x + 14, y + 42 + i * 24], a); s.text([x + w - 14, y + 42 + i * 24], b, { anchor: "end", c: b === "?" ? "muted" : "ink" }); });
    }, { side: true });
  },
  /* a text card: lines of plain text */
  lines(k, n, x, y, w, title, rows, o = {}) {
    return k.group(n, s => {
      SC.card(s, x, y, w, 30 + rows.length * (o.lh || 20), title);
      rows.forEach((r, i) => s.text([x + 14, y + 40 + i * (o.lh || 20)], r, { cls: o.cls === undefined ? "sm" : o.cls, c: o.c || "ink" }));
    }, { side: true });
  },
  ring(k, n, p, rx, ry, c = "cursor") {
    return k.group(n, s => { const g = s.group(); g.g.setAttribute("style", `--c:var(--${c})`); svgEl("ellipse", { cx: p[0], cy: p[1], rx, ry, class: "w tint" }, g.g); });
  }
};
