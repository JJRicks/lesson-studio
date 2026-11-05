/* Worked-example steppers: the viewer every backend shares (steps, dots, the answer lock, tweening, fading).
   A backend draws the picture: stepper3d.js (a three.js scene) or stepper2d.js (an SVG schematic). */
const { sin, cos, tan, acos, sqrt, hypot, exp, min, max, abs, atan2, floor, round, PI } = Math, TAU = 2 * PI, tx = String.raw;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const clamp01 = v => max(0, min(1, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const rng = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const lerp = (a, b, t) => a + (b - a) * t;
const words = s => (s || "").split(/\s+/).filter(Boolean);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stickyMQ = matchMedia("(min-width:721px) and (min-height:800px)");
const mathIn = el => { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "\\(", right: "\\)", display: false }], throwOnError: false }); };
const warn = m => (window.__v3warn = window.__v3warn || []).push(m);

/* one frame loop for every viewer on screen */
const V3 = {
  list: [], vis: new Set(), raf: 0,
  kick() { if (!this.raf) this.raf = requestAnimationFrame(t => this.tick(t)); },
  tick(now) { this.raf = 0; let more = false; for (const v of this.vis) if (v.frame(now)) more = true; if (more) this.kick(); }
};

/* a math label pinned to a point; both kits use it. The backend's render() positions it. */
function makeLabel(k, n, p, tex, o = {}) {
  const el = document.createElement("div"); el.className = "v3l" + (o.sm ? " sm" : ""); el.style.color = `var(--${o.c || "ink"})`;
  if (o.plain || !window.katex) el.textContent = tex; else katex.render(tex, el, { throwOnError: false });
  k.v.ls.appendChild(el);
  return k.o[n] = { lab: true, el, p, dx: o.dx || 0, dy: o.dy || 0, v: 0, t: 0, when: o.when, line: !!(o.dx || o.dy) && o.line !== false, css: css("--" + (o.c || "ink")) };
}

/* Backends extend this and supply: stageHTML(), attach(), ready(), noMsg(), setup() returning the kit, teardown(), camLerp(c0, c1, e), render(),
   and optionally live(dt), which returns true while something keeps moving on its own. */
class Stepper {
  constructor(prob, def) {
    this.prob = prob; this.def = def; this.i = 0; this.P = {}; this.unlocked = false; this.built = false;
    const body = prob.querySelector(".prob-body"), ask = body.querySelector(".ask"), ol = body.querySelector("ol.steps"), rev = body.querySelector("details.reveal");
    this.lis = [...ol.children]; this.rev = rev; this.n = this.lis.length;
    const wrap = document.createElement("div"); wrap.className = "v3wrap";
    const el = document.createElement("div"); el.className = "v3"; this.root = el;
    el.innerHTML = this.stageHTML() + `
      <div class="v3bar"><button type="button" class="v3b" data-a="back" aria-label="Previous step">←</button>
        <div class="v3pips" role="group" aria-label="Steps"></div>
        <button type="button" class="v3b" data-a="again" aria-label="Replay this step">↻</button>
        <button type="button" class="btn v3next" data-a="next">Next →</button></div>
      <div class="v3cap" aria-live="polite"><div class="v3t"></div><p></p></div>`;
    ask.after(wrap); wrap.append(el, ol, rev);
    this.stage = el.querySelector(".v3stage"); this.ls = el.querySelector(".v3ls");
    this.nextB = el.querySelector(".v3next"); this.backB = el.querySelector('[data-a="back"]'); this.pips = el.querySelector(".v3pips");
    this.capT = el.querySelector(".v3t"); this.capP = el.querySelector(".v3cap p");
    this.pips.innerHTML = this.lis.map((_, i) => `<button type="button" data-i="${i}" aria-label="Step ${i + 1}">${i + 1}</button>`).join("") + `<button type="button" class="ans" data-i="${this.n}" aria-label="Answer">=</button>`;
    el.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.i !== undefined) return this.pick(+b.dataset.i);
      const a = b.dataset.a;
      if (a === "back") this.go(this.i - 1, "back");
      if (a === "again") this.go(this.i, "again");
      if (a === "next") this.pick(this.i + 1);
    });
    this.lis.forEach((li, i) => li.addEventListener("click", e => {
      if (e.target.closest("a,button,summary") || !getSelection().isCollapsed) return;
      this.go(i, i < this.i ? "back" : "next");
      if (!stickyMQ.matches) { const r = el.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) el.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }); }
    }));
    if (rev) rev.addEventListener("toggle", () => {
      this.unlocked = rev.open;
      if (rev.open) this.go(this.n, "next"); else if (this.i === this.n) this.go(this.n - 1, "back"); else this.ui();
    });
    this.stage.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); this.pick(this.i + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); this.go(this.i - 1, "back"); }
    });
    this.attach();
    new ResizeObserver(() => { this.dirty = true; V3.kick(); }).observe(this.stage);
    this.ui();
  }
  pick(i) {
    if (i > this.n) return;
    if (i === this.n && !this.unlocked) { if (this.rev) this.rev.open = true; return; }
    this.go(i, i < this.i ? "back" : "next");
  }
  build() {
    for (const key in this.P) delete this.P[key];
    Object.assign(this.P, this.def.P || {});
    this.ls.innerHTML = "";
    this.k = this.setup(); this.def.build(this.k, this.P);
    const k = this.k, ex = l => l.flatMap(n => k.al[n] ? ex(k.al[n]) : [n]), vis = new Set(), P = { ...this.def.P }; let cam = { ...this.def.cam };
    this.states = this.def.steps.map(st => {
      ex(words(st.drop)).forEach(n => vis.delete(n));
      ex(words(st.add)).forEach(n => { if (!k.o[n]) warn(`${this.prob.id}: a step names an unknown object, "${n}"`); vis.add(n); });
      Object.assign(P, st.set || {}); if (st.cam) cam = { ...cam, ...st.cam };
      return { vis: new Set(vis), P: { ...P }, cam: { ...cam } };
    });
    this.built = true;
  }
  ensure() {
    if (this.built || this.dead) return;
    if (!this.ready()) { this.dead = true; this.stage.insertAdjacentHTML("beforeend", `<p class="v3no">${this.noMsg()}</p>`); return; }
    this.build(); this.jump(this.i);
  }
  intro() {                      // the first time an example is really on screen, play step 1's sweep if it has one
    if (this.played) return; this.played = true;
    if (this.built && this.i === 0 && this.def.steps[0].from && !reduceMotion) this.go(0, "again");
  }
  rebuild() {
    if (!this.built) return;
    this.teardown(); this.built = false; this.tr = null; this.build(); this.jump(this.i);
  }
  setVis(st, instant) {
    const k = this.k;
    for (const n in k.o) { const q = k.o[n]; q.t = st.vis.has(n) ? 1 : 0; if (instant) q.v = q.t; }
  }
  jump(i) {
    this.i = i; const st = this.states[i];
    this.setVis(st, true); Object.assign(this.P, st.P); this.cam = { ...st.cam }; this.tr = null;
    this.ui(); this.paint();
  }
  go(i, how) {
    if (i < 0 || i > this.n) return;
    const was = this.i; this.i = i; this.ui();
    if (how !== "again" && i !== was) this.scrollTo(i);
    if (!this.built) return;
    if (how === "again" && i > 0) { const p = this.states[i - 1]; this.setVis(p, true); Object.assign(this.P, p.P); }
    const s = this.def.steps[i], st = this.states[i], fwd = how !== "back";
    this.setVis(st, false);
    const dur = reduceMotion ? 0 : (fwd ? (s.dur || 1.1) : .6) * 1000, c0 = { ...this.cam }, c1 = (s.cam || !fwd || how === "again") ? st.cam : c0;
    this.tr = { t0: performance.now(), dur, P0: { ...this.P, ...(fwd ? s.from : null) }, P1: st.P, win: fwd ? (s.win || {}) : {}, c0, c1 };
    this.dirty = true; V3.kick();
  }
  tween(u) {
    const { P0, P1, win, c0, c1 } = this.tr;
    for (const key in P1) { const w = win[key], e = ease(clamp01(w ? (u - w[0]) / (w[1] - w[0]) : u)); this.P[key] = lerp(P0[key], P1[key], e); }
    this.cam = this.camLerp(c0, c1, ease(u));
  }
  frame(now) {
    if (!this.built) return false;
    const dt = min(.05, (now - (this.last || now)) / 1000); this.last = now;
    let busy = false;
    if (this.tr) { const u = this.tr.dur ? clamp01((now - this.tr.t0) / this.tr.dur) : 1; this.tween(u); if (u >= 1) this.tr = null; else busy = true; this.dirty = true; }
    const k = this.k, a = 1 - exp(-dt / .11);
    for (const n in k.o) { const q = k.o[n]; if (q.v !== q.t) { q.v += (q.t - q.v) * a; if (abs(q.t - q.v) < .012) q.v = q.t; else busy = true; this.dirty = true; } }
    if (this.live && this.live(dt)) { busy = true; this.dirty = true; }
    if (this.dirty) { this.dirty = false; this.paint(); }
    return busy;
  }
  paint() { if (this.built) this.render(); }
  scrollTo(i) {
    if (!stickyMQ.matches || i >= this.n) return;
    const li = this.lis[i].getBoundingClientRect(), top = this.root.getBoundingClientRect().bottom + 10;
    if (li.top < top || li.bottom > innerHeight - 10) scrollBy({ top: li.top - top, behavior: reduceMotion ? "auto" : "smooth" });
  }
  ui() {
    const i = this.i, n = this.n, ans = i === n, s = this.def.steps[i];
    this.capT.innerHTML = ans ? "Answer" : `<span>Step ${i + 1} of ${n}</span> ${this.lis[i].querySelector("h5").innerHTML}`;
    this.capP.innerHTML = s.cap; mathIn(this.capP);
    this.root.classList.toggle("atans", ans);
    [...this.pips.children].forEach((b, j) => { b.classList.toggle("on", j === i); b.classList.toggle("done", j < i); b.classList.toggle("locked", j === n && !this.unlocked); });
    this.lis.forEach((li, j) => li.classList.toggle("v3on", j === i));
    this.backB.disabled = i === 0;
    this.nextB.disabled = ans;
    this.nextB.textContent = ans ? "Done" : i === n - 1 ? (this.unlocked ? "Answer →" : "Reveal answer") : "Next →";
  }
}

/* scenes register themselves here, keyed by the worked example's article id */
const S = new Proxy({}, { set(t, id, def) { if (id in t) warn("scene registered twice: " + id); t[id] = def; return true; } });
