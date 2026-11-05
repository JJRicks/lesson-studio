#!/usr/bin/env python3
"""Rebuild, then render a contact sheet of every step of every stepper (3D or 2D) at real size, labels and captions included.

usage: python3 tools/sheets.py <slug> [example-id ...] [--light]
Writes dist/sheets/<slug>/<example-id>-dark.png (or -light). Open each one and look at it: this is the only check that
catches collided labels, cropped objects and camera angles that hide the point of the step. Sheets show each step's end
state. To see a sweep part-way through, use tools/shot.py --mid.
"""
import json, math, sys
from build import build
from common import CACHE, DIST, chrome, lesson_dir, probe

CSS = """<style>article.prob{border:0!important;box-shadow:none!important}.prob-body{padding:0!important}.ask,.v3wrap>ol,.v3wrap>details,.v3bar,.v3hint{display:none!important}
.v3{position:static!important}.v3stage{height:360px!important}.v3l{transition:none!important}.v3cap{min-height:0!important;padding:5px 12px!important}
.v3cap .v3t{display:none}.topbar{display:none}</style></head>"""

SHEET = """setTimeout(()=>{const {S,Viz}=__V3,def=S[%s],n=def.steps.length-1;
document.body.innerHTML='<div id="G" style="display:grid;grid-template-columns:repeat(2,740px);gap:6px;padding:6px"></div>';
const G=document.getElementById("G");
def.steps.forEach((st,i)=>{const a=document.createElement("article");a.className="prob";a.id="t"+i;
a.innerHTML='<div class="prob-body"><p class="ask">q</p><ol class="steps">'+Array.from({length:n},()=>'<li><h5>Step</h5></li>').join("")+'</ol><details class="reveal"><summary>r</summary></details></div>';
G.append(a);const v=new Viz(a,def);v.unlocked=true;v.build();v.jump(i);});},700);"""


def main(argv):
    theme = "light" if "--light" in argv else "dark"
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    slug, ids = args[0], args[1:]
    lesson_dir(slug)
    page = build(slug, deliver=False).read_text()
    info = probe(page, "sheet-index", 'setTimeout(()=>__report(window.__V3?__V3.V3.list.map(v=>[v.prob.id,v.def.steps.length]):[]),800)', 800, 800)
    if not info:
        sys.exit("This lesson has no steppers.")
    out = DIST / "sheets" / slug
    out.mkdir(parents=True, exist_ok=True)
    for id_, n in info:
        if ids and id_ not in ids:
            continue
        html = page.replace("</head>", CSS, 1).replace('<html lang="en">', f'<html lang="en" data-theme="{theme}">', 1)
        i = html.rindex("</body>")
        html = html[:i] + "<script>" + SHEET % json.dumps(id_) + "</script>" + html[i:]
        p = CACHE / f"sheet_{id_}.html"
        p.write_text(html)
        png = out / f"{id_}-{theme}.png"
        chrome(p.as_uri(), 1510, math.ceil(n / 2) * 450 + 160, f"--screenshot={png}", budget=6000, capture=False)
        print(png)


if __name__ == "__main__":
    main(sys.argv[1:])
