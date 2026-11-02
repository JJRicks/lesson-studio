/* Page shell: helpers, theme, navigation, KaTeX pass. Shares one closure with plot3d.js and each lesson's page.js. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const themeListeners = [];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const minus = s => String(s).replace(/-/g, "−");
const fx = (v, d = 2) => minus((+v).toFixed(d));
function tex(el, s, display) { if (window.katex) { try { katex.render(s, el, { throwOnError: false, displayMode: !!display }); return; } catch (e) {} } el.textContent = s; }

/* ---------- maths ---------- */
if (window.renderMathInElement) renderMathInElement(document.body, { delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false, ignoredClasses: ["nomath"] });

/* ---------- colour helpers ---------- */
function hexRgb(h) {
  h = (h || "").trim();
  if (h[0] === "#") { if (h.length === 4) h = "#" + [...h.slice(1)].map(x => x + x).join(""); const n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const m = h.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
}
const rgbS = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const lerpC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const tokens = names => { const o = {}; names.forEach(n => { o[n.replace("-", "_")] = hexRgb(css("--" + n)); }); return o; };
const TOK = ["s1", "s2", "s3", "bad", "ink", "muted", "line", "plot", "grid", "accent", "glow", "surface-2", "good"];
function ramp(T, t) { t = clamp(t, 0, 1); return t < 0.5 ? lerpC(T.s1, T.s2, t * 2) : lerpC(T.s2, T.s3, (t - 0.5) * 2); }

/* ---------- theme ---------- */
const themeBtn = $("#themebtn");
const effectiveDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
const labelTheme = () => { themeBtn.textContent = effectiveDark() ? "Light mode" : "Dark mode"; };
const savedTheme = store.get("lesson-theme");
if (savedTheme === "dark" || savedTheme === "light") document.documentElement.dataset.theme = savedTheme;
labelTheme();
themeBtn.addEventListener("click", () => {
  const next = effectiveDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next; store.set("lesson-theme", next); labelTheme();
  themeListeners.forEach(f => f());
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { labelTheme(); themeListeners.forEach(f => f()); });

/* ---------- nav ---------- */
const toc = $("#toc"), navbtn = $("#navbtn");
let scrim = null;
function closeNav() { toc.classList.remove("open"); navbtn.setAttribute("aria-expanded", "false"); if (scrim) { scrim.remove(); scrim = null; } }
navbtn.addEventListener("click", () => {
  if (toc.classList.contains("open")) return closeNav();
  toc.classList.add("open"); navbtn.setAttribute("aria-expanded", "true");
  scrim = document.createElement("div"); scrim.className = "scrim"; scrim.addEventListener("click", closeNav); document.body.appendChild(scrim);
});
toc.addEventListener("click", e => { if (e.target.closest("a")) closeNav(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });
const spyTargets = $$("[data-title][id]"), links = $$(".toc li li a"), here = $("#here"), progress = $("#progress");
function spy() {
  const y = scrollY + 120; let cur = spyTargets[0];
  for (const t of spyTargets) if (t.getBoundingClientRect().top + scrollY <= y) cur = t;
  here.textContent = cur ? cur.dataset.title : "";
  links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur.id));
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
}
let spyQ = false;
addEventListener("scroll", () => { if (!spyQ) { spyQ = true; requestAnimationFrame(() => { spyQ = false; spy(); }); } }, { passive: true });
spy();

/* small helper: a segmented control */
function seg(id, fn) {
  const box = $(id);
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", box).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    fn(b.dataset.k);
  });
}
function canvas2d(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth || 600, H = cv.clientHeight || 300;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, W, H };
}
function whenVisible(el, frame) {
  if (reduce) return;
  let on = false, last = 0;
  const loop = now => { if (!on) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); };
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !on) { on = true; last = performance.now(); requestAnimationFrame(loop); }
    else if (!e.isIntersecting) on = false;
  })).observe(el);
}

/* multiple choice: .mcq[data-answer] holding buttons with data-k and data-fb, plus a p.mcq-fb for the feedback */
$$(".mcq").forEach(q => {
  const fb = $(".mcq-fb", q);
  q.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const ok = b.dataset.k === q.dataset.answer;
    $$("button", q).forEach(x => x.classList.remove("right", "wrong"));
    b.classList.add(ok ? "right" : "wrong");
    fb.className = "mcq-fb " + (ok ? "right" : "wrong"); fb.textContent = b.dataset.fb;
  });
});
