#!/usr/bin/env python3
"""Rebuild, then screenshot one part of the real page, with the other sections hidden so it sits at the top.

usage: python3 tools/shot.py <slug> <css-selector> [--width 1280] [--height 1300] [--light] [--step N] [--mid]

  python3 tools/shot.py wk8 "#top"                       the hero
  python3 tools/shot.py wk8 "#topic1" --width 500        a topic at phone width
  python3 tools/shot.py wk8 "#ex1" --step 2 --light      a worked example at step 3, light theme
  python3 tools/shot.py wk8 "#ex1" --step 2 --mid        the same step halfway through its sweep

Writes dist/shots/<slug>/. Headless Chrome won't go narrower than 500px.
"""
import json, re, sys
from build import build
from common import DIST, CACHE, chrome, lesson_dir

JS = """setTimeout(()=>{const T=document.querySelector(%(sel)s);if(!T){document.body.innerHTML="<h1>no element matches "+%(sel)s+"</h1>";return;}
let e=T;while(e&&e.id!=="main"){[...e.parentElement.children].forEach(c=>{if(c!==e)c.style.display="none"});e=e.parentElement;}
scrollTo(0,0);dispatchEvent(new Event("resize"));
const api=window.__V3,step=%(step)s,mid=%(mid)s;
if(api)for(const v of api.V3.list)if(T.contains(v.root)||v.root.contains(T)){v.ensure();if(step!==null){v.unlocked=true;v.jump(step);}
 if(step!==null&&mid){const s=v.def.steps[step],A={...v.states[Math.max(0,step-1)].P,...(s.from||{})},B=v.states[step].P;for(const k in B)v.P[k]=A[k]+(B[k]-A[k])*.5;}
 v.paint();}},800);"""


def opt(argv, name, default):
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv):
    pos = []
    i = 0
    while i < len(argv):
        if argv[i] in ("--width", "--height", "--step"):
            i += 2
        elif argv[i].startswith("--"):
            i += 1
        else:
            pos.append(argv[i])
            i += 1
    if len(pos) != 2:
        sys.exit(__doc__)
    slug, sel = pos
    lesson_dir(slug)
    width, height = int(opt(argv, "--width", 1280)), int(opt(argv, "--height", 1300))
    step = opt(argv, "--step", None)
    theme = "light" if "--light" in argv else "dark"
    page = build(slug, deliver=False).read_text().replace('<html lang="en">', f'<html lang="en" data-theme="{theme}">', 1)
    page = page.replace("</head>", "<style>.v3l{transition:none!important}</style></head>", 1)
    i = page.rindex("</body>")
    page = page[:i] + "<script>" + JS % {"sel": json.dumps(sel), "step": "null" if step is None else int(step), "mid": "true" if "--mid" in argv else "false"} + "</script>" + page[i:]
    p = CACHE / "shot.html"
    p.write_text(page)
    out = DIST / "shots" / slug
    out.mkdir(parents=True, exist_ok=True)
    name = re.sub(r"[^a-z0-9-]+", "", sel.lower()) or "shot"
    png = out / f"{name}-{width}-{theme}{'-s' + step if step else ''}{'-mid' if '--mid' in argv else ''}.png"
    chrome(p.as_uri(), width, height, f"--screenshot={png}", budget=5000, capture=False)
    print(png)


if __name__ == "__main__":
    main(sys.argv[1:])
