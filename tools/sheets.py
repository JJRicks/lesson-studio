#!/usr/bin/env python3
"""Render a contact sheet of every step of every 3D stepper, labels and captions included.

usage: python3 tools/sheets.py <slug> [example-id ...] [--light]
Writes dist/sheets/<slug>/<example-id>.png. Open each one and look at it: this is the only check that catches
collided labels, cropped objects and camera angles that hide the point of the step.
"""
import json, math, sys
from common import CACHE, DIST, chrome, lesson_dir, probe

CSS = """<style>.prob{border:0!important;box-shadow:none!important}.prob-body{padding:0!important}.ask,.v3wrap>ol,.v3wrap>details,.v3bar,.v3hint{display:none!important}
.v3{position:static!important}.v3stage{height:262px!important}.v3l{transition:none!important}.v3cap{min-height:0!important;font-size:.76rem!important;line-height:1.3!important;padding:4px 8px!important}
.v3cap .v3t{display:none}.topbar{display:none}</style></head>"""

SHEET = """setTimeout(()=>{const {S,Viz}=__V3,def=S[%s],n=def.steps.length-1;
document.body.innerHTML='<div id="G" style="display:grid;grid-template-columns:repeat(3,425px);gap:6px;padding:6px"></div>';
const G=document.getElementById("G");
def.steps.forEach((st,i)=>{const a=document.createElement("article");a.className="prob";a.id="t"+i;
a.innerHTML='<div class="prob-body"><p class="ask">q</p><ol class="steps">'+Array.from({length:n},()=>'<li><h5>Step</h5></li>').join("")+'</ol><details class="reveal"><summary>r</summary></details></div>';
G.append(a);const v=new Viz(a,def);v.unlocked=true;v.build();v.jump(i);});},700);"""


def main(argv):
    light = "--light" in argv
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    slug, ids = args[0], args[1:]
    lesson_dir(slug)
    page = (DIST / f"{slug}.html").read_text()
    info = probe(page, "sheet-index", 'setTimeout(()=>__report(window.__V3?__V3.V3.list.map(v=>[v.prob.id,v.def.steps.length]):[]),800)', 800, 800)
    if not info:
        sys.exit("This lesson has no 3D steppers.")
    out = DIST / "sheets" / slug
    out.mkdir(parents=True, exist_ok=True)
    for id_, n in info:
        if ids and id_ not in ids:
            continue
        html = page.replace("</head>", CSS, 1)
        if light:
            html = html.replace('<html lang="en">', '<html lang="en" data-theme="light">', 1)
        i = html.rindex("</body>")
        html = html[:i] + "<script>" + SHEET % json.dumps(id_) + "</script>" + html[i:]
        p = CACHE / f"sheet_{id_}.html"
        p.write_text(html)
        png = out / (id_ + ("-light" if light else "") + ".png")
        chrome(p.as_uri(), 1296, math.ceil(n / 3) * 352 + 150, f"--screenshot={png}", budget=5000, capture=False)
        print(png)


if __name__ == "__main__":
    main(sys.argv[1:])
