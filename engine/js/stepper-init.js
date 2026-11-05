/* ---------- attach a viewer to every worked example, build each scene as it nears the screen ---------- */
/* a scene with view: "2d" gets an SVG viewer; any other scene gets a 3D one. Lessons list "stepper2d" and/or "stepper3d" in libs. */
const has3 = typeof Viz === "function", has2 = typeof Viz2 === "function";
function Make(prob, def) {
  const two = def.view === "2d" || !has3;
  if (two && !has2) { warn(`${prob.id}: this scene needs "stepper2d" in libs`); return null; }
  if (!two && def.view && def.view !== "3d") warn(`${prob.id}: unknown view "${def.view}"`);
  return two ? new Viz2(prob, def) : new Viz(prob, def);
}
Object.keys(S).forEach(id => { const p = document.getElementById(id); const v = p && Make(p, S[id]); if (v) V3.list.push(v); });
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target.__v3;
  if (e.isIntersecting) { V3.vis.add(v); v.ensure(); v.dirty = true; V3.kick(); } else V3.vis.delete(v);
}), { rootMargin: "160px" });
V3.list.forEach(v => { v.root.__v3 = v; io.observe(v.root); });
const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.__v3.intro(); seen.unobserve(e.target); } }), { threshold: .5 });
V3.list.forEach(v => seen.observe(v.root));
const retheme = () => V3.list.forEach(v => v.rebuild());
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
window.__V3 = { S, Viz: Make, V3, orphans: Object.keys(S).filter(id => !document.getElementById(id)) };
