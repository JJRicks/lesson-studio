/* SVG schematic kit. Coordinates are viewBox units with y pointing down; a point is [x, y].
   Included in page.js's closure when libs has "schematic", and in the stepper's closure when libs has "stepper2d".
   Styles live in engine/css/schematic.css. Colours are token names without "--" (accent, t1, t3, cursor, good ...). */
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const a in attrs || {}) e.setAttribute(a, attrs[a]);
  if (parent) parent.appendChild(e);
  return e;
}
const pd = pts => pts.map((p, i) => (i ? "L" : "M") + (+p[0]).toFixed(1) + " " + (+p[1]).toFixed(1)).join("");
const unitDir = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L, L]; };
let schUid = 0;

class Schem {
  /* make an <svg class="sch"> filling `parent`, showing the box [x0, y0, width, height] */
  static svg(parent, box, label) {
    const s = svgEl("svg", { viewBox: box.join(" "), class: "sch", preserveAspectRatio: "xMidYMid meet" }, parent);
    if (label) { s.setAttribute("role", "img"); s.setAttribute("aria-label", label); } else s.setAttribute("aria-hidden", "true");
    return new Schem(s, s, []);
  }
  /* move every flow's dots along by dt seconds; flows is the list a Schem collects in .flows */
  static tick(flows, dt) { for (const f of flows) { f.off -= f.speed * dt; f.el.style.strokeDashoffset = f.off.toFixed(2); } }
  constructor(g, root, flows) { this.g = g; this.root = root || g.ownerSVGElement || g; this.flows = flows || []; }
  group(cls) { return new Schem(svgEl("g", cls ? { class: cls } : {}, this.g), this.root, this.flows); }
  path(d, cls = "w", style) { const e = svgEl("path", { d, class: cls }, this.g); if (style) e.setAttribute("style", style); return e; }
  wire(pts, cls = "w") { return this.path(pd(pts), cls); }
  head(tip, from, size = 11, cls = "head") {         // a filled arrowhead at tip, pointing away from `from`
    const [ux, uy] = unitDir(from, tip), w = size * .45;
    return this.path(pd([tip, [tip[0] - ux * size - uy * w, tip[1] - uy * size + ux * w], [tip[0] - ux * size + uy * w, tip[1] - uy * size - ux * w]]) + "Z", cls);
  }
  arrow(a, b, o = {}) {                              // a line with a head at b
    const g = this.group("arrow" + (o.c ? "" : "")); if (o.c) g.g.setAttribute("style", `--c:var(--${o.c})`);
    const [ux, uy] = unitDir(a, b), s = o.size || 10;
    g.wire([a, [b[0] - ux * s * .6, b[1] - uy * s * .6]], "w tint"); g.head(b, a, s, "head tint"); return g.g;
  }
  node(p) { return svgEl("circle", { cx: p[0], cy: p[1], r: 3.6, class: "nd" }, this.g); }
  res(a, b, o = {}) {                                // zigzag resistor between two pins
    const [ux, uy, L] = unitDir(a, b), nx = -uy, ny = ux, body = Math.min(L - 8, o.len || 46), s = (L - body) / 2, n = 6, amp = o.amp || 7.5;
    const at = t => [a[0] + ux * t, a[1] + uy * t], pts = [a, at(s)];
    for (let i = 0; i < n; i++) { const c = at(s + body * (i + .5) / n), sg = i % 2 ? -1 : 1; pts.push([c[0] + nx * amp * sg, c[1] + ny * amp * sg]); }
    pts.push(at(s + body), b);
    return this.path(pd(pts), "w");
  }
  diode(a, k, o = {}) {                              // anode a, cathode k; o.led adds light arrows; returns { m, P }
    const [ux, uy] = unitDir(a, k), nx = -uy, ny = ux, m = [(a[0] + k[0]) / 2, (a[1] + k[1]) / 2], h = o.h || 10;
    const P = (t, w) => [m[0] + ux * t + nx * w, m[1] + uy * t + ny * w];
    this.path(pd([a, P(-h, 0)]) + pd([P(h, 0), k]));
    this.path(pd([P(-h, -h), P(-h, h), P(h, 0)]) + "Z", "w body");
    this.path(pd([P(h, -h * 1.05), P(h, h * 1.05)]));
    return { m, P };
  }
  led(a, k, o = {}) {                                // an LED with a glow you can dim: returns { set(brightness 0..1) }
    const id = "sg" + (++schUid), c = o.c || "cursor", side = o.side || 1;
    const grad = svgEl("radialGradient", { id }, this.root.querySelector("defs") || svgEl("defs", {}, this.root));
    svgEl("stop", { offset: "0", style: `stop-color:var(--${c});stop-opacity:.95` }, grad);
    svgEl("stop", { offset: ".42", style: `stop-color:var(--${c});stop-opacity:.35` }, grad);
    svgEl("stop", { offset: "1", style: `stop-color:var(--${c});stop-opacity:0` }, grad);
    const m = [(a[0] + k[0]) / 2, (a[1] + k[1]) / 2], R = o.r || 44;
    const glow = svgEl("circle", { cx: m[0], cy: m[1], r: R, fill: `url(#${id})`, class: "glow" }, this.g);
    const d = this.diode(a, k, o), rays = this.group("rays");
    rays.g.setAttribute("style", `--c:var(--${c})`);
    for (const t of [-3, 5]) {
      const s = d.P(t, 13 * side), e = d.P(t + 9, 25 * side);
      rays.wire([s, e], "w tint thin"); rays.head(e, s, 6, "head tint");
    }
    const set = b => { b = Math.max(0, Math.min(1, b)); glow.style.opacity = b.toFixed(3); glow.setAttribute("r", (R * (.55 + .45 * b)).toFixed(1)); rays.g.style.opacity = (.15 + .85 * Math.min(1, b * 3)).toFixed(3); };
    set(o.on ?? 0);
    return { set, m, glow };
  }
  /* bipolar transistor. B is where the base wire meets the bar. Options: pnp, eTop (emitter above; default: npn below, pnp above),
     left (mirror so the body sits left of the base). Returns its pins { B, C, E }. */
  bjt(B, o = {}) {
    const [x, y] = B, sx = o.left ? -1 : 1, pnp = !!o.pnp, eTop = o.eTop ?? pnp, cy = eTop ? 1 : -1;
    this.wire([[x, y - 16], [x, y + 16]], "w bar");
    const C1 = [x, y + cy * 7], C2 = [x + sx * 20, y + cy * 21], C = [x + sx * 20, y + cy * 36];
    const E1 = [x, y - cy * 7], E2 = [x + sx * 20, y - cy * 21], E = [x + sx * 20, y - cy * 36];
    this.wire([C1, C2, C]); this.wire([E1, E2, E]);
    const t = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    if (pnp) this.head(t(E2, E1, .62), E2, 10); else this.head(t(E1, E2, .9), E1, 10);
    return { B, C, E };
  }
  vsrc(c, o = {}) {                                  // DC source, + on top; returns { top, bot }
    const r = o.r || 19;
    svgEl("circle", { cx: c[0], cy: c[1], r, class: "w body" }, this.g);
    this.path(`M${c[0] - 5} ${c[1] - 8}H${c[0] + 5}M${c[0]} ${c[1] - 13}V${c[1] - 3}M${c[0] - 5} ${c[1] + 8}H${c[0] + 5}`, "w thin");
    return { top: [c[0], c[1] - r], bot: [c[0], c[1] + r] };
  }
  gnd(p) { this.path(`M${p[0]} ${p[1]}V${p[1] + 10}M${p[0] - 13} ${p[1] + 10}H${p[0] + 13}L${p[0]} ${p[1] + 22}Z`, "w"); return p; }
  net(p, o = {}) {                                   // an LTspice-style net flag starting at p, pointing right (or o.left)
    const s = o.left ? -1 : 1, w = o.w || 52, h = 13, x = p[0], y = p[1];
    this.path(`M${x} ${y}L${x + s * 10} ${y - h}H${x + s * w}L${x + s * (w + 12)} ${y}L${x + s * w} ${y + h}H${x + s * 10}Z`, "w body");
    return [x + s * (w + 12) / 2 + s * 4, y];
  }
  coil(a, b, o = {}) {                               // inductor: n bumps between a and b, bulging to the side o.side (1 or -1)
    const [ux, uy, L] = unitDir(a, b), n = o.n || 4, body = Math.min(L - 10, o.len || 84), s = (L - body) / 2, r = body / n / 2, sw = (o.side || 1) > 0 ? 1 : 0;
    const at = t => [a[0] + ux * t, a[1] + uy * t];
    let d = pd([a, at(s)]);
    for (let i = 1; i <= n; i++) { const p = at(s + 2 * r * i); d += `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sw} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }
    return this.path(d + pd([at(s + body), b]).replace("M", "L"), "w");
  }
  lever(pivot, len, o = {}) {                        // a switch blade; set(angle in degrees, 0 = pointing down)
    const g = this.group("lever"), l = g.wire([pivot, [pivot[0], pivot[1] + len]], "w");
    svgEl("circle", { cx: pivot[0], cy: pivot[1], r: 3.4, class: "w body" }, g.g);
    return { g: g.g, set: deg => l.setAttribute("transform", `rotate(${(-deg).toFixed(2)} ${pivot[0]} ${pivot[1]})`) };
  }
  lamp(c, o = {}) {                                  // a bulb that lights: returns { set(brightness) }
    const r = o.r || 17, id = "sg" + (++schUid), col = o.c || "cursor";
    const grad = svgEl("radialGradient", { id }, this.root.querySelector("defs") || svgEl("defs", {}, this.root));
    svgEl("stop", { offset: "0", style: `stop-color:var(--${col});stop-opacity:.9` }, grad);
    svgEl("stop", { offset: "1", style: `stop-color:var(--${col});stop-opacity:0` }, grad);
    const glow = svgEl("circle", { cx: c[0], cy: c[1], r: r * 2.6, fill: `url(#${id})`, class: "glow" }, this.g);
    svgEl("circle", { cx: c[0], cy: c[1], r, class: "w body" }, this.g);
    const k = r * .62; this.path(`M${c[0] - k} ${c[1] - k}L${c[0] + k} ${c[1] + k}M${c[0] + k} ${c[1] - k}L${c[0] - k} ${c[1] + k}`, "w thin");
    const set = b => { glow.style.opacity = Math.max(0, Math.min(1, b)).toFixed(3); }; set(0);
    return { set, top: [c[0], c[1] - r], bot: [c[0], c[1] + r] };
  }
  rect(x, y, w, h, cls = "w body") { return svgEl("rect", { x, y, width: w, height: h, rx: 3, class: cls }, this.g); }
  text(p, s, o = {}) {
    const e = svgEl("text", { x: p[0], y: p[1], class: "txt" + (o.cls ? " " + o.cls : ""), "text-anchor": o.anchor || "start", "dominant-baseline": "middle" }, this.g);
    if (o.c) e.setAttribute("style", `fill:var(--${o.c})`);
    e.textContent = s; return e;
  }
  /* current flow: dots that travel along pts. Set .speed (units per second, along the path direction) and call Schem.tick */
  flow(pts, o = {}) {
    const el = this.path(pd(pts), "flow", `--c:var(--${o.c || "cursor"});stroke-dasharray:0 ${o.gap || 16}`);
    const f = { el, speed: 0, off: 0 }; this.flows.push(f); return f;
  }
  loop(pts, o = {}) { return this.path(pd(pts) + (o.closed ? "Z" : ""), "hl", `--c:var(--${o.c || "cursor"})`); }
}
