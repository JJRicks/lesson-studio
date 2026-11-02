/* ---------- attach a viewer to every worked example, build each scene as it nears the screen ---------- */
Object.keys(S).forEach(id => { const p = document.getElementById(id); if (p) V3.list.push(new Viz(p, S[id])); });
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target.__v3;
  if (e.isIntersecting) { V3.vis.add(v); v.ensure(); v.dirty = true; V3.kick(); } else V3.vis.delete(v);
}), { rootMargin: "160px" });
V3.list.forEach(v => { v.root.__v3 = v; io.observe(v.root); });
const retheme = () => V3.list.forEach(v => v.rebuild());
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
window.__V3 = { S, Viz, V3, orphans: Object.keys(S).filter(id => !document.getElementById(id)) };
