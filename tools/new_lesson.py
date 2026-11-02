#!/usr/bin/env python3
"""Scaffold a lesson from lessons/_starter.

usage: python3 tools/new_lesson.py <slug> "<Page title>"
"""
import json, re, shutil, sys
from common import LESSONS


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    slug, title = sys.argv[1:]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        sys.exit("Slugs are lowercase letters, digits and hyphens, e.g. wk9-triple-integrals")
    d = LESSONS / slug
    if d.exists():
        sys.exit(f"{d} already exists. Existing lessons are the reference library: don't overwrite them.")
    shutil.copytree(LESSONS / "_starter", d)
    cfg = json.loads((d / "lesson.json").read_text())
    cfg["title"] = cfg["brand"] = title
    (d / "lesson.json").write_text(json.dumps(cfg, indent=2) + "\n")
    print("the starter's demo content and scenes/example.js are placeholders: replace them, don't add alongside them")
    print(f"created {d}\nnext: python3 tools/check.py {slug}")


if __name__ == "__main__":
    main()
