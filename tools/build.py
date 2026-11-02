#!/usr/bin/env python3
"""Assemble a lesson into one standalone HTML file.

usage: python3 tools/build.py <slug>        writes dist/<slug>.html, and lesson.json's "output" path if its folder exists
"""
import base64, html, json, pathlib, re, shutil, sys
from common import DIST, ENGINE, lesson_dir

DEFAULT_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'


def katex_css():
    css = (ENGINE / "vendor/katex/katex.min.css").read_text()
    def font(m):
        data = (ENGINE / "vendor/katex/fonts" / (m.group(1) + ".woff2")).read_bytes()
        return 'src:url(data:font/woff2;base64,' + base64.b64encode(data).decode() + ') format("woff2")'
    pattern = r'src:url\(fonts/(KaTeX_[A-Za-z0-9_-]+)\.woff2\) format\("woff2"\),url\(fonts/\1\.woff\) format\("woff"\),url\(fonts/\1\.ttf\) format\("truetype"\)'
    return re.sub(pattern, font, css)


def script(src, name):
    if "</script" in src.lower():
        sys.exit(f"{name} contains a closing script tag, which would end the inline script early.")
    return "<script>" + src + "</script>"


def build(slug):
    d = lesson_dir(slug)
    cfg = json.loads((d / "lesson.json").read_text())
    libs = cfg.get("libs", [])
    read = lambda p, default="": p.read_text() if p.exists() else default

    css = (ENGINE / "css/base.css").read_text()
    if "stepper3d" in libs:
        css += "\n" + (ENGINE / "css/stepper3d.css").read_text()
    css += "\n" + read(d / "lesson.css")

    scripts = []
    if "katex" in libs:
        scripts.append(script((ENGINE / "vendor/katex/katex.min.js").read_text(), "katex"))
        scripts.append(script((ENGINE / "vendor/katex/auto-render.min.js").read_text(), "auto-render"))
    main = (ENGINE / "js/shell.js").read_text()
    if "plot3d" in libs:
        main += "\n" + (ENGINE / "js/plot3d.js").read_text()
    main += "\n" + read(d / "page.js")
    scripts.append(script('(() => {\n"use strict";\n' + main + "})();\n", "page script"))
    if "stepper3d" in libs:
        scripts.append(script((ENGINE / "vendor/three/three.min.js").read_text(), "three"))
        scenes = "".join(p.read_text() + "\n" for p in sorted((d / "scenes").glob("*.js")))
        own = (ENGINE / "js/stepper3d.js").read_text() + "\n" + scenes + (ENGINE / "js/stepper3d-init.js").read_text()
        scripts.append(script('(() => {\n"use strict";\nif (!window.THREE) return;\n' + own + "})();\n", "stepper script"))

    parts = {
        "TITLE": html.escape(cfg["title"], quote=False),
        "BRAND": html.escape(cfg.get("brand", cfg["title"]), quote=False),
        "BRAND_ICON": read(d / "icon.svg", DEFAULT_ICON).strip(),
        "KATEX_CSS": "<style>\n" + katex_css() + "\n</style>" if "katex" in libs else "",
        "CSS": css,
        "BODY": (d / "body.html").read_text(),
        "SCRIPTS": "\n".join(scripts),
    }
    page = re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: parts[m.group(1)], (ENGINE / "template.html").read_text())
    DIST.mkdir(exist_ok=True)
    out = DIST / f"{slug}.html"
    out.write_text(page)
    print(f"built {out} ({len(page) // 1024} KB)")
    target = cfg.get("output")
    if target:
        t = pathlib.Path(target)
        if t.parent.is_dir():
            shutil.copy(out, t)
            print(f"copied to {t}")
        else:
            print(f"note: output folder doesn't exist on this machine, skipped: {t.parent}")
    return out


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(sys.argv[1])
