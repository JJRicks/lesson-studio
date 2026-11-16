"""Drive each interactive to its extremes: report script errors, then screenshot each state.
Copy this into a new lesson, change SLUG, STATES and LIGHT, and run:  python3 lessons/<slug>/states.py [outdir]
Each state is (section selector, actions); actions click a control or set a slider's value and fire input/change."""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from build import build
from common import CACHE, chrome, probe

SLUG = "wk10-mass-fields-line-integrals"
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist/shots" / SLUG / "states"
OUT.mkdir(parents=True, exist_ok=True)
C = lambda sel: ["click", sel]
V = lambda sel, v: ["val", sel, v]
STATES = {
  "hero-swirl":   ("#top", [C('#heroSeg [data-k="swirl"]')]),
  "hero-wind":    ("#top", [C('#heroSeg [data-k="wind"]'), C("#heroPlay")]),
  "bal-zero":     ("#balPanel", [V("#balA", 0), V("#balB", 0)]),
  "bal-max":      ("#balPanel", [V("#balA", 4), V("#balB", 4)]),
  "tw-lo":        ("#twPanel", [V("#twA", .2), V("#twB", 1)]),
  "tw-hi":        ("#twPanel", [V("#twA", 1), V("#twB", .2)]),
  "fx-shear":     ("#fxPanel", [C('#fxPre [data-k="shear"]')]),
  "fx-saddle-unit": ("#fxPanel", [C('#fxPre [data-k="saddle"]'), C('#fxLen [data-k="unit"]')]),
  "fx-allmax":    ("#fxPanel", [V("#fxA", 2), V("#fxB", 2), V("#fxC", 2), V("#fxD", 2)]),
  "fx-zero":      ("#fxPanel", [V("#fxA", 0), V("#fxB", 0), V("#fxC", 0), V("#fxD", 0)]),
  "gr-two":       ("#grPanel", [C('#grSeg [data-k="two"]')]),
  "gr-saddle":    ("#grPanel", [C('#grSeg [data-k="saddle"]')]),
  "cu-1":         ("#cuPanel", [V("#cuN", 1)]),
  "cu-40":        ("#cuPanel", [V("#cuN", 40)]),
  "llA-loop-across": ("#llAPanel", [C('#llAField [data-k="source"]'), C('#llAPath [data-k="loop"]'), C('#llAMode [data-k="across"]')]),
  "llA-line-t0":  ("#llAPanel", [C('#llAField [data-k="shear"]'), C('#llAPath [data-k="line"]'), V("#llAT", 0)]),
  "llB-wind-arc": ("#llBPanel", [C('#llBField [data-k="wind"]'), C('#llBPath [data-k="arc"]'), C('#llBMode [data-k="along"]'), V("#llBT", 500)]),
  "llB-swirl-loop": ("#llBPanel", [C('#llBField [data-k="swirl"]'), C('#llBPath [data-k="loop"]'), C('#llBMode [data-k="across"]')]),
}
LIGHT = {"bal-max", "fx-allmax", "llB-wind-arc"}   # states shot in the light theme; the rest are dark
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
