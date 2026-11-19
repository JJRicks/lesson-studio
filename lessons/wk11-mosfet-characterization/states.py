"""Drive each interactive to its extremes: report script errors, then screenshot each state.
Copy this into a new lesson, change SLUG, STATES and LIGHT, and run:  python3 lessons/<slug>/states.py [outdir]
Each state is (section selector, actions); actions click a control or set a slider's value and fire input/change."""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from build import build
from common import CACHE, chrome, probe

SLUG = "wk11-mosfet-characterization"
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist/shots" / SLUG / "states"
OUT.mkdir(parents=True, exist_ok=True)
C = lambda sel: ["click", sel]
V = lambda sel, v: ["val", sel, v]
STATES = {
  "hero-off":     ("#top", [V("#heroG", 0), V("#heroD", 2)]),
  "hero-edge":    ("#top", [V("#heroG", 1.45), V("#heroD", 2)]),
  "hero-triode":  ("#top", [V("#heroG", 5), V("#heroD", .3)]),
  "hero-pinch":   ("#top", [V("#heroG", 3), V("#heroD", 8)]),
  "thr-zoom":     ("#thrPanel", [C('#thrSeg [data-k="zoom"]')]),
  "thr-log":      ("#thrPanel", [C('#thrSeg [data-k="log"]')]),
  "fam-1v":       ("#famPanel", [C('#famSeg [data-k="0"]')]),
  "fam-5v-plain": ("#famPanel", [C('#famSeg [data-k="4"]'), C("#famRegions")]),
  "mir-n":        ("#mirPanel", [V("#mirV", 3)]),
  "mir-p":        ("#mirPanel", [C('#mirSeg [data-k="p"]'), V("#mirV", 3)]),
  "mir-p-off":    ("#mirPanel", [C('#mirSeg [data-k="p"]'), V("#mirV", 0)]),
  "cmos-low":     ("#cmosPanel", [V("#cmosV", 0)]),
  "cmos-mid":     ("#cmosPanel", [V("#cmosV", 2.5)]),
  "cmos-high":    ("#cmosPanel", [V("#cmosV", 5)]),
  "sym":          ("#what", []),
  "dec-b":        ("#nested", [C('[data-dec="B"] .tok[data-j="5"]')]),
}
LIGHT = {"hero-pinch", "thr-zoom", "fam-5v-plain", "mir-p", "cmos-mid", "sym"}   # states shot in the light theme; the rest are dark
ACT = """function __act(list){const miss=[];for(const a of list){const el=document.querySelector(a[1]);if(!el){miss.push(a[1]);continue;}
 if(a[0]==="click")el.click();else{el.value=a[2];el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}}return miss;}"""
built = build(SLUG, deliver=False).read_text()

# 1) every state in one real-time page, collecting errors and missing controls
errjs = ACT + """const errs=[];addEventListener("error",e=>errs.push(String(e.message)));addEventListener("unhandledrejection",e=>errs.push(String(e.reason)));
const S=%s;let i=0;const keys=Object.keys(S);
function next(){if(i>=keys.length){setTimeout(()=>__report(errs),600);return;}const k=keys[i++],[sel,acts]=S[k];
 const T=document.querySelector(sel);if(T)T.scrollIntoView();const miss=__act(acts);if(miss.length)errs.push(k+": missing "+miss.join(","));setTimeout(next,450);}
setTimeout(next,1200);""" % json.dumps(STATES)
errs = probe(built, "states-err", errjs, 1280, 900, timeout=120)
print("errors:", errs or "none")

# 2) a screenshot per state, panel on its own at the top of the page
for name, (sel, acts) in STATES.items():
    hide = """const T=document.querySelector(%s);if(T){let e=T;while(e&&e.id!=="main"){[...e.parentElement.children].forEach(c=>{if(c!==e)c.style.display="none"});e=e.parentElement;}scrollTo(0,0);}dispatchEvent(new Event("resize"));""" % json.dumps(sel)
    js = ACT + "setTimeout(()=>{" + hide + "setTimeout(()=>__act(%s),300);},700);" % json.dumps(acts)
    theme = "light" if name in LIGHT else "dark"
    page = built.replace('<html lang="en">', f'<html lang="en" data-theme="{theme}">', 1)
    i = page.rindex("</body>"); page = page[:i] + "<script>" + js + "</script>" + page[i:]
    p = CACHE / "states.html"; p.write_text(page)
    png = OUT / f"{name}.png"
    chrome(p.as_uri(), 1280, 1000, f"--screenshot={png}", budget=4000, capture=False)
    print(png.name, theme)
