# Lesson Studio

Turns a homework assignment, a set of guided notes, or a topic someone is curious about into one beautiful, animated, interactive HTML page: first-principles explanations, analogies, live simulations, step-by-step worked problems with hidden answers, and labeled 3D animations that step through each solution.

Each page is a single file with its math and 3D libraries built in. Web fonts load from Google Fonts and fall back to system fonts offline.

**Handing this to an agent?** Paste [`handoff/HANDOFF_PROMPT.md`](handoff/HANDOFF_PROMPT.md). The full guide is [`handoff/CLAUDE_HANDOFF.md`](handoff/CLAUDE_HANDOFF.md).

## Set up on a new computer

1. Install [Google Chrome](https://www.google.com/chrome/), Python 3 and Claude Code.
2. Install the document tools. On macOS: `brew install poppler gh` (`textutil` for docx files comes with macOS).
3. Install SymPy for checking answers: `python3 -m pip install sympy`
4. Clone the toolkit: `gh repo clone JJRicks/lesson-studio`

The tools use only the Python standard library, and KaTeX and three.js are committed under `engine/vendor/`, so there's nothing else to install.

## Make a lesson

```sh
python3 tools/new_lesson.py wk9-triple-integrals "Triple Integrals"   # scaffold from lessons/_starter
python3 tools/check.py wk9-triple-integrals                           # build to dist/ and run the automated QA
python3 tools/sheets.py wk9-triple-integrals                          # picture of every 3D step, to review by eye
python3 tools/shot.py wk9-triple-integrals "#top" --width 500         # screenshot one part of the real page
python3 tools/build.py wk9-triple-integrals                           # deliver to the output path in lesson.json
```

## Layout

| path | what |
|---|---|
| `handoff/` | the agent guide and the paste-in prompt |
| `engine/template.html` | the page skeleton |
| `engine/css/` | the design system (`base.css`) and 3D viewer styles |
| `engine/js/` | page shell, `Plot3D` canvas renderer, 3D stepper engine |
| `engine/vendor/` | KaTeX 0.16.9 and three.js r128, both MIT licensed |
| `lessons/_starter/` | the scaffold: working examples of the common components, and it passes QA as is |
| `lessons/<slug>/` | lesson sources: `lesson.json`, `body.html`, `page.js`, `scenes/`, `verify.py`, `spoilers.json` |
| `gallery/` | finished pages from before the kit, kept as references for their interactives |
| `tools/` | scaffold, build, QA, contact sheets and screenshots |
| `sources/` | git-ignored: put course PDFs and docx files here |
