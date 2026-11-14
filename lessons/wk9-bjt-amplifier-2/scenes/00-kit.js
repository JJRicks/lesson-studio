/* Drawing helpers for this lesson's 2D scenes. Coordinates are the scene's box units, y down. Cards draw with { side: true }. */
const BOX = { view: "2d", box: [12, 6, 776, 372], side: [488, 12, 292, 352] };
const AMP = { Vcc: "16 V", R1: "3.3 kΩ", R2: "560 Ω", R3: "2.7 kΩ", re: "120 Ω", R4: "560 Ω", RL: "100 kΩ" };
const PI2 = { Rin: "1k", rc: "1k", expr: "I={100*I(Rin)}" };
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
  /* an LTspice-style plot pane on a card: returns { X(tms), Y(v), y0 } for traces drawn with k.plot */
  pane(k, n, y, h, name, c) {
    const x0 = 508, x1 = 756, mid = y + h / 2 + 8, amp = h / 2 - 22;
    k.group(n, s => {
      SC.card(s, 494, y, 276, h, "");
      s.text([632, y + 15], name, { anchor: "middle", cls: "sm", c });
      for (const f of [-1, 0, 1]) s.wire([[x0, mid - f * amp], [x1, mid - f * amp]], "gridl");
      for (let i = 1; i < 4; i++) s.wire([[lerp(x0, x1, i / 4), y + 24], [lerp(x0, x1, i / 4), y + h - 8]], "gridl");
    }, { side: true });
    return { X: tm => lerp(x0, x1, tm / 2), Y: f => mid - f * amp, mid, amp, x0, x1 };
  },
  /* moving dots that live on the side layer, so they follow the cards on a narrow stage */
  sflow(k, n, pts, o = {}) {
    const q = k.group(n, null, { side: true }), f = q.s.flow(pts, o);
    return Object.defineProperty(q, "speed", { get() { return f.speed; }, set(v) { f.speed = v; } });
  },
  wave(P, f) { return rng(0, 2, 160).map(tm => [P.X(tm), P.Y(f(tm))]); }
};
