/* Runs inside a built lesson. __CONFIG__ is replaced by check.py. */
(() => {
const CFG = __CONFIG__, wait = ms => new Promise(r => setTimeout(r, ms));
setTimeout(async () => {
  const R = { errors: [], katexErrors: 0, unrendered: [], overflow: [], steppers: 0, steps: 0, articles: 0, orphans: [], noScene: [], stepCounts: [], warnings: [], leaks: [], noReveal: [], flow: [], viewport: [innerWidth, innerHeight], sticky: null };
  try {
    document.documentElement.style.scrollBehavior = "auto";
    R.katexErrors = document.querySelectorAll(".katex-error").length;
    R.unrendered = [...document.querySelectorAll("main p, main li, main h3, main h4, main h5, main td, main summary, main button, main small")]
      .filter(e => !e.querySelector("p,li") && /\\\(|\\\[/.test(e.textContent)).map(e => e.textContent.slice(0, 70)).slice(0, 8);
    const W = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > W + 1) R.overflow.push("page scrolls sideways: " + document.documentElement.scrollWidth + " > " + W);
    R.overflow.push(...[...document.querySelectorAll("main *")].filter(e => e.getBoundingClientRect().right > W + 1 && !e.closest(".tbl,.mbox,.katex-display,.eqs,.katex,.schem-scroll,pre,.v3ls"))
      .slice(0, 8).map(e => e.tagName + "." + (e.getAttribute("class") || "") + "#" + e.id));
    R.noReveal = [...document.querySelectorAll("article.prob")].filter(p => !p.querySelector("details.reveal")).map(p => p.id);
    R.articles = document.querySelectorAll("article.prob").length;
    R.noScene = [...document.querySelectorAll("article.prob")].filter(p => !p.querySelector(".v3")).map(p => p.id);
    const visibleText = root => { const c = root.cloneNode(true); c.querySelectorAll("details.reveal,.v3ls,.v3cap,script,style").forEach(n => n.remove()); return c.textContent; };
    for (const [id, list] of Object.entries(CFG.spoilers)) {
      const root = id === "_page" ? document.querySelector("main") : document.getElementById(id); if (!root) continue;
      const t = visibleText(root);
      for (const s of list) { const m = t.match(new RegExp(s)); if (m) R.leaks.push((id === "_page" ? "page" : id + " written text") + ` shows ${JSON.stringify(s)}: ...${t.slice(Math.max(0, m.index - 30), m.index + 30)}...`); }
    }
    const api = window.__V3;
    if (api) {
      const { V3 } = api; R.steppers = V3.list.length; R.orphans = api.orphans || [];
      for (const v of V3.list) {
        const id = v.prob.id;
        if (v.def.steps.length !== v.n + 1) R.stepCounts.push(`${id}: ${v.def.steps.length} scene steps, expected ${v.n} written steps + 1 answer step`);
        try {
          v.ensure(); if (!v.built) { R.warnings.push(id + ": scene did not build (no WebGL?)"); continue; }
          for (let i = 0; i <= v.n; i++) v.jump(i);
          v.jump(0); R.steps += v.n + 1;
        } catch (e) { R.errors.push(`scene ${id} crashed: ${e.message}`); continue; }
        const res = (CFG.spoilers[id] || []).map(s => new RegExp(s));
        if (!res.length) R.leaks.push(id + ": no spoiler patterns listed in spoilers.json");
        v.def.steps.slice(0, -1).forEach((st, i) => {
          for (const re of res) if (re.test(st.cap)) R.leaks.push(`${id} step ${i + 1} caption matches ${re}`);
          for (const n of v.states[i].vis) { const q = v.k.o[n]; if (q && q.lab) for (const re of res) if (re.test(q.el.textContent)) R.leaks.push(`${id} step ${i + 1} label ${n} matches ${re}: ${q.el.textContent.slice(0, 40)}`); }
        });
      }
      R.warnings.push(...(window.__v3warn || []));
      if (CFG.flow && V3.list.length) {
        const v = V3.list[0], ok = (c, m) => R.flow.push((c ? "ok   " : "FAIL ") + m), next = v.root.querySelector(".v3next");
        v.prob.scrollIntoView(); await wait(150);
        for (let i = 0; i < v.n - 1; i++) { next.click(); await wait(20); }
        ok(v.i === v.n - 1, "Next walks to the last written step");
        ok(v.rev.open === false, "answer stays locked until asked for");
        ok(v.lis[v.n - 1].classList.contains("v3on"), "matching written step is highlighted");
        next.click(); await wait(100);
        ok(v.rev.open && v.i === v.n, "Reveal answer opens the reveal and shows the answer step");
        v.rev.open = false; await wait(100);
        ok(v.i === v.n - 1, "closing the reveal locks the answer again");
        v.lis[0].dispatchEvent(new MouseEvent("click", { bubbles: true })); await wait(20);
        ok(v.i === 0, "clicking a written step jumps the scene");
        next.click(); await wait(((v.def.steps[1].dur || 1.1) * 1000) + 500);
        const st = v.states[1].P; ok(!v.tr && Object.keys(st).every(k => Math.abs(v.P[k] - st[k]) < 1e-6), "animated step finishes on its exact end state");
        const y = v.prob.getBoundingClientRect().top + scrollY; scrollTo(0, y + 260); await wait(120);
        R.sticky = { position: getComputedStyle(v.root).position, top: Math.round(v.root.getBoundingClientRect().top) };
      }
    }
  } catch (e) { R.errors.push("probe threw: " + e.message); }
  R.errors.push(...(window.__errs || []));
  __report(R);
}, 1400);
})();
