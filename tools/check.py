#!/usr/bin/env python3
"""Rebuild a lesson and run the automated QA. Exit status 0 means every check passed.

usage: python3 tools/check.py <slug>

Checks: script errors, KaTeX failures, unrendered math, sideways overflow at 500px, a reveal on every worked example,
and for 3D steppers: step counts, unknown object names, answer leaks before the reveal, and the stepping and lock flow.
This cannot judge whether a picture is right. Look at tools/sheets.py output for that.
"""
import json, pathlib, sys
from build import build
from common import lesson_dir, probe

TOOLS = pathlib.Path(__file__).parent


def run(page, cfg, name, width, height):
    js = (TOOLS / "probe.js").read_text().replace("__CONFIG__", json.dumps(cfg))
    return probe(page, name, js, width, height)


def main(slug):
    d = lesson_dir(slug)
    page = build(slug).read_text()
    sp = d / "spoilers.json"
    spoilers = json.loads(sp.read_text()) if sp.exists() else {}
    narrow = run(page, {"spoilers": spoilers, "flow": False}, "check-narrow", 500, 900)
    wide = run(page, {"spoilers": spoilers, "flow": True}, "check-wide", 1280, 1100)
    fails = []
    def need(cond, msg, detail=None):
        print(("  ok    " if cond else "  FAIL  ") + msg)
        if not cond:
            fails.append(msg)
            for line in (detail or [])[:10]:
                print("          " + str(line))
    need(not narrow["errors"] and not wide["errors"], "no script errors", narrow["errors"] + wide["errors"])
    need(wide["katexErrors"] == 0, "all math typeset", [f'{wide["katexErrors"]} KaTeX errors'])
    need(not wide["unrendered"], "no raw TeX left on the page", wide["unrendered"])
    need(not narrow["overflow"], "no sideways overflow at 500px", narrow["overflow"])
    need(not wide["noReveal"], "every worked example has a reveal", wide["noReveal"])
    if wide["steppers"]:
        need(not wide["stepCounts"], f'{wide["steppers"]} steppers, {wide["steps"]} steps: counts match the written steps', wide["stepCounts"])
        need(not wide["warnings"], "every step names real objects", wide["warnings"])
        need(not wide["leaks"], "no answers leak before the reveal", wide["leaks"])
        bad = [l for l in wide["flow"] if l.startswith("FAIL")]
        need(bool(wide["flow"]) and not bad, f'stepping and answer lock work ({len(wide["flow"])} checks)', bad)
        s = wide["sticky"] or {}
        need(s.get("position") == "sticky" and abs(s.get("top", 0) - 64) <= 2, "viewer sticks under the top bar on tall screens", [s])
    print("\nPASS" if not fails else f"\n{len(fails)} check(s) failed")
    print("Now view the pictures: python3 tools/sheets.py " + slug if wide["steppers"] else "Now look at the page yourself.")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
