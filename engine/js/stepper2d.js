/* 2D backend for the steppers: the same viewer, drawing an SVG schematic (engine/js/schematic.js). Needs stepper.js first.
   A scene says view: "2d" and draws inside box [x0, y0, width, height] (default 760 x 380), y pointing down.
   Optional side: [x, y, w, h], a column of cards at the right of the box, drawn by groups made with { side: true }. On a
   phone-width stage the circuit (everything left of side's x) then fills the width and the side layer moves below it, scaled
   up, so both stay readable. Labels whose point is inside the side column follow it. */
class Kit2 {
  constructor(v) {
    this.v = v; this.o = {}; this.al = {}; this.P = v.P; this.box = v.box;
    this.flows = [];
    this.sch = new Schem(v.base, v.svg, this.flows);          // the always-visible drawing
  }
  reg(n, el, extra) { el.style.display = "none"; return this.o[n] = Object.assign({ el, v: 0, t: 0 }, extra); }
  vis(n) {
    const q = this.o[n]; if (q.lab) return;
    const on = q.v > .008; q.el.style.display = on ? "" : "none"; if (on) q.el.style.opacity = q.v.toFixed(3);
  }
  alias(n, s) { this.al[n] = words(s); }
  group(n, draw, o = {}) {                                     // a named group that steps can add and drop; draw(s) gets a Schem
    const s = new Schem(svgEl("g", { "data-n": n }, o.side ? this.v.sideL : o.under ? this.v.under : this.v.over), this.v.svg, this.flows);
    const q = this.reg(n, s.g, { s }); if (draw) draw(s); return q;
  }
  flow(n, pts, o = {}) {                                      // moving dots; set k.o[n].speed in update (units per second)
    const q = this.group(n), f = q.s.flow(pts, o); q.f = f;
    return Object.defineProperty(q, "speed", { get() { return f.speed; }, set(v) { f.speed = v; } });   // Object.assign would copy the value, not the setter
  }
  loop(n, pts, o = {}) { const q = this.group(n, null, { under: true }); q.s.loop(pts, o); return q; }
  text(n, p, str, o = {}) { const q = this.group(n), t = q.s.text(p, str, o); return Object.assign(q, { t, set(s) { if (t.textContent !== s) t.textContent = s; } }); }
  rect(n, x, y, w, h, o = {}) {
    const q = this.group(n, null, o), r = q.s.rect(x, y, w, h, o.cls || "fillc");
    if (o.c) q.el.setAttribute("style", `--c:var(--${o.c})`);
    return Object.assign(q, { r, set(x, y, w, h) { r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", max(0, w)); r.setAttribute("height", max(0, h)); } });
  }
  plot(n, o = {}) {
    const q = this.group(n, null, o), pth = q.s.path("", o.cls || "w tint", `--c:var(--${o.c || "cursor"})`);
    return Object.assign(q, { pth, set(pts) { pth.setAttribute("d", pts.length ? pd(pts) : ""); } });
  }
  label(n, p, tex, o = {}) { return makeLabel(this, n, p, tex, o); }
}

class Viz2 extends Stepper {
  stageHTML() {
    return `<div class="v3stage v2stage" tabindex="0" role="img" aria-label="Circuit diagram. Use the left and right arrow keys to change step.">
        <svg class="sch v2svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg><svg class="v2lines" aria-hidden="true"></svg><div class="v3ls"></div></div>`;
  }
  attach() { this.root.classList.add("v2"); this.svg = this.root.querySelector(".v2svg"); this.lines = this.root.querySelector(".v2lines"); this.t = 0; }
  ready() { return true; }
  noMsg() { return ""; }
  setup() {
    const box = this.box = this.def.box || [0, 0, 760, 380];
    this.svg.innerHTML = ""; this.svg.setAttribute("viewBox", box.join(" "));
    this.under = svgEl("g", {}, this.svg); this.base = svgEl("g", {}, this.svg); this.over = svgEl("g", {}, this.svg); this.sideL = svgEl("g", {}, this.svg);
    this.lay = null;
    return new Kit2(this);
  }
  teardown() { this.svg.innerHTML = ""; }
  layout() {                                                  // one view, or circuit on top and side cards below on a narrow stage
    const sd = this.def.side, W = this.stage.clientWidth, [x0, y0, w, h] = this.box, split = !!sd && W < 600 && W / w < .8;
    const key = split ? W : 0; if (key === this.lay) return; this.lay = key;
    this.svg.classList.toggle("v2split", split);
    if (!split) { this.split = null; this.svg.setAttribute("viewBox", this.box.join(" ")); this.sideL.removeAttribute("transform"); this.stage.style.height = ""; return; }
    const cw = sd[0] - x0, s1 = min(1.15, W / cw), f = min(.9, W / sd[2] * .96) / s1, gap = 6 / s1;   // f: the side layer's extra zoom
    const tx = x0 + (cw - sd[2] * f) / 2, ty = y0 + h + gap, vh = h + gap + sd[3] * f;
    this.sideL.setAttribute("transform", `translate(${tx} ${ty}) scale(${f}) translate(${-sd[0]} ${-sd[1]})`);
    this.svg.setAttribute("viewBox", [x0, y0, cw, vh].join(" "));
    this.stage.style.height = vh * s1 + "px";
    this.split = { x0, y0, cw, s1, f, tx, ty, sd };
  }
  camLerp() { return {}; }
  live(dt) {
    if (reduceMotion || !this.k.flows.length) return false;
    this.t += dt; Schem.tick(this.k.flows, dt);
    return this.k.flows.some(f => f.speed);
  }
  map(p) {                                                    // box units to stage pixels
    const W = this.stage.clientWidth, H = this.stage.clientHeight, [x0, y0, w, h] = this.box, s = min(W / w, H / h), z = this.split;
    if (z) {
      const [x, y] = p[0] >= z.sd[0] ? [z.tx + (p[0] - z.sd[0]) * z.f, z.ty + (p[1] - z.sd[1]) * z.f] : p;
      return [(x - z.x0) * z.s1 + (W - z.cw * z.s1) / 2, (y - z.y0) * z.s1];
    }
    return [(p[0] - x0) * s + (W - w * s) / 2, (p[1] - y0) * s + (H - h * s) / 2];
  }
  render() {
    if (!this.stage.clientWidth) return; this.layout();
    const W = this.stage.clientWidth, H = this.stage.clientHeight; if (!H) return;
    const k = this.k;
    for (const n in k.o) k.vis(n);
    if (this.def.update) this.def.update(this.P, k, this.t);
    let lines = "";
    for (const n in k.o) {
      const q = k.o[n]; if (!q.lab) continue;
      const on = q.t === 1 && (!q.when || q.when());
      q.el.classList.toggle("on", on); if (!q.t) continue;
      const [ax, ay] = this.map(typeof q.p === "function" ? q.p() : q.p), hw = q.el.offsetWidth / 2 + 3, hh = q.el.offsetHeight / 2 + 3;
      const lx = max(hw, min(W - hw, ax + q.dx)), ly = max(hh, min(H - hh, ay + q.dy));
      q.el.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) translate(-50%,-50%)`;
      if (q.line && on && q.v > .1) lines += `<g style="opacity:${(q.v * .85).toFixed(2)};color:${q.el.style.color}"><line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.4"/></g>`;
    }
    this.lines.innerHTML = lines;
  }
}
