# Lesson Studio handoff

Read all of this before starting. It's what the last agent wished it had known.

## 1. What this makes

One self-contained HTML page per lesson, opened locally by Joel, a BYU-Idaho engineering student, to learn the material. His own words on what he loves: "beautiful, animated, interactive", "that clean style", and the "electron particle generator". The page is for understanding, so a correct, clear page beats a flashy one.

## 2. The brief, in Joel's words

The original request, which still governs every lesson:

> create a beautiful, animated, interactive website lesson that clearly and simply breaks down each topic (gives a high level overview, then dives into details) using easy to understand scannable language, analogies, examples, explanations of base concepts from first principles, assumes no knowledge, and makes sure every concept is covered. Should be organized in the order of problems on the homework, and after the explanation for each topic have a section that works through each respective problem for that topic step by step and hides the final answer behind a clickable reveal.

On guided notes:

> we only need one or two problems of each type, because this is a set of teaching documents / guided notes not actually a homework assignment. the goal is to learn the individual topics

On worked examples:

> For each of the worked examples, would you be able to create a steppable labeled and simple 3D animation to really help visualize what is happening and how each part comes into play?

On lessons for fun:

> Fully animated and interactive ... I love what you did with the electron particle generator, that sort of thing is lovely

## 3. First, decide what kind of document this is

Read the document's content before deciding. Filenames lie: `Diode Circuits HW 2 condensed.docx` actually held the BJT Calculation homework. If the name and the content disagree, build from the content and tell Joel.

| kind | how to recognize it | what to do |
|---|---|---|
| Homework | Point values, numbered problems to hand in | Work **every** problem, in order. Group problems under topics, with the explanation before its problems. |
| Guided notes | "Lesson NN", blank space for in-class examples, practice with answers | Teach every topic. Work **one or two examples of each problem type**. Prefer in-lesson examples. Use a practice problem only if it's the sole example of its type. |
| Just for fun | Joel names a topic | A shorter page led by a live, physically grounded animation. No problems needed. |

If the source teaches a method without an example, add one from a standard textbook and mark it `<span class="bonus">extra, not in notes</span>`.

## 4. Workflow

**1. Read everything.** Put the source files in `sources/`. Extract text with `pdftotext -layout file.pdf -` or `textutil -convert txt -stdout file.docx`. Look at every figure: render PDF pages with `pdftoppm -r 50 -png`, and unzip a docx to read `word/media/`. Circuit values and problem data often exist only in images. Match each image to its problem by reading `document.xml` order.

**2. Solve and verify before designing anything.** Write `lessons/<slug>/verify.py` and compute every answer with SymPy or numerics. Check each answer against any hint ranges and printed solutions. For simulator homework, reproduce the model yourself: the BJT lesson solved LTspice's Gummel-Poon models in SciPy, and its answers matched every hint range. For a physical device, fit a small model to datasheet numbers and report how close it lands (the 6V6 model gives 4.3 W at 8.5% distortion against the datasheet's 4.5 W at 8%). Then drive the animations from that model so the visuals are physically real.

If a problem sits near a threshold, say which convention you used, in the reveal and to Joel. Example: VCE(sat) = 0.2 V decided two BJT problems.

**3. Plan.** List topics in document order. For each one, write the big idea, the first-principles build-up, an everyday analogy, the interactive, and the worked examples. Ask what the reader should be able to do on the page, not only read.

**4. Scaffold.** `python3 tools/new_lesson.py <slug> "<Title>"`. The starter passes QA as it stands, so keep it passing as you go. Set `kind`, `course`, `libs` and `output` in `lesson.json`. Write `output` as the absolute path for the finished page, next to the source unless told otherwise.

**5. Write `body.html`.** Follow section 5.

**6. Build the interactives** in `page.js`. See section 7. Open the hero with the single most striking live thing.

**7. Build a 3D stepper for every worked example** when the maths or physics has real geometry. See section 8. For circuits, a steppable animated 2D schematic is usually clearer than forced 3D: ask Joel if unsure.

**8. QA.** See section 9.

**9. Deliver.** See section 10.

## 5. Page anatomy and writing

Copy the markup from `lessons/_starter/body.html`, which has one of each component.

Every topic runs: **big idea → first principles → analogy → formal statement → interactive → worked examples**. Worked examples sit right after the topic they belong to.

| class | use |
|---|---|
| `.hero.load` | title, one-paragraph lede, chips, and the signature interactive |
| `.part` + `.part-head` | one per lesson or homework section |
| `.big` | the idea in two sentences |
| `.topic` | one concept; give it `id` and `data-title` so the sidebar tracks it |
| `.analogy` | an everyday picture |
| `.thm` | a boxed definition or theorem from the source |
| `.mbox` | a displayed equation |
| `.key` | the one sentence to remember |
| `.warn` | a mistake people really make |
| `details.deeper` | optional depth |
| `details.quick` | a one-line self-check |
| `article.prob` | a worked example: `.ask`, then `ol.steps`, then `details.reveal` |
| `.panel` | frames any interactive like an instrument |
| `.mcq` | multiple choice with per-option feedback; needs a small click handler in `page.js` (copy from `gallery/bjt-calculation-lesson.html`) |

Writing rules:
- Assume no prior knowledge, and define every term the first time.
- Use short, plain sentences, the way a knowledgeable person would explain it out loud.
- Say what the reader sees and does, and name things as they'd recognize them.
- Avoid em-dash asides, "not X, but Y" framing, colon-then-reveal sentences, emoji as markers, and words like "simply" or "obviously".
- Steps must stop one line before the final answer: "Compute it." The answer lives only in `details.reveal`.
- End with a cheat sheet, common mistakes, and a fully hidden answer key.
- State where the numbers came from in the footer.

Math is KaTeX, written as `\(inline\)` and `\[display\]` in `body.html`. Use `\le`, never a raw `<`, and write `&amp;` for alignment ampersands.

## 6. Design system

`engine/css/base.css` is the system. Reuse it instead of inventing a new look. Joel likes it as it stands.

- **Fonts:** Bricolage Grotesque (display), Atkinson Hyperlegible (body), JetBrains Mono (labels and data).
- **Colours:** every colour is a token with light and dark values (`--bg --surface --surface-2 --ink --muted --line --accent --glow --cursor --good --bad --plot --grid --s1 --s2 --s3 --t1 --t2 --t3 --t4`). Never write a literal colour that only works in one theme. New tokens need a definition on `:root` and both dark blocks.
- **Layout:** sticky sidebar plus a 780px reading column, collapsing to a drawer at 1000px. Must work at phone width with no sideways page scroll.
- **Motion:** animations start from a complete, readable first frame, respect `prefers-reduced-motion`, and only run while on screen.

## 7. Interactives

Code in `page.js` shares a closure with `engine/js/shell.js`, which provides `$ $$ css tokens ramp rgbS lerpC clamp fx tex seg canvas2d whenVisible themeListeners reduce`.

Available now:
- **`Plot3D`** (`engine/js/plot3d.js`, add `"plot3d"` to `libs`): a dependency-free canvas 3D renderer for box and surface scenes, with drag to rotate. `boxFaces`, `surfaceGroups` and `surfaceWire` build scenes. See the Riemann explorers in `lessons/wk8-multivariable/page.js`.
- **`page.js` in `wk8-multivariable`** also has: a gradient explorer with contours by marching squares, a draggable point on a constraint and a mini plot; an optimization builder with a heat map; a Fubini slicer with a live accumulating plot; and a sweep-line region explorer.

Reference pages, whose code is readable in the page source. Copy what you need into your lesson's `page.js`:
- `gallery/6v6-tetrode-lesson.html`: **`class TubeSim`**, the particle engine. Electrons, a pool of moving particles spawned at a rate set by a physical model, is the look Joel loved. Also a live scope, Web Audio that plays the model's waveform, a plate-curve load line with a moving operating point, and an animated schematic.
- `gallery/bjt-characterization-lesson.html`: **`class Plot`**, LTspice-style plots with draggable cursors and readouts, the electron-flow canvas, `.dc` command token decoders, and "run the sweep" animations.
- `gallery/bjt-calculation-lesson.html`: **`playground()`**, a live circuit with sliders, animated current flow and a load-line chart, plus `.mcq`.

Repeated code worth keeping belongs in `engine/`.

## 8. 3D steppers

Add `"stepper3d"` to `libs`. Each file in `lessons/<slug>/scenes/` registers one scene per worked example under the article's id. The engine moves the card's steps into a viewer with Back, Replay, Next and numbered dots, sticks it to the top of tall screens, lights up the written step, and lets a click on a written step jump the scene.

**The contract.** `steps` has exactly one entry per `<li>` in `ol.steps`, plus one final answer step. That answer step stays locked until the card's reveal is opened. Captions and labels before the answer step must not show the final answer, and `spoilers.json` lists a regex for each example so `check.py` can enforce this.

```js
S["ex1"] = {                       // the <article class="prob"> id
  cam: { y: -1.05, p: .42, d: 6.4, at: [.5, .5, .6] },  // yaw, pitch, distance, look-at (maths coordinates)
  P: { s: 1 },                     // numbers that animate between steps
  build(k, P) { ... },             // create named objects and labels, once
  update(P, k) { ... },            // move things to match P, every frame
  steps: [
    { cap: tx`What to look at, in a sentence or two.`,
      add: "names to fade in", drop: "names to fade out",
      set: { s: .3 },              // where P ends up after this step
      from: { s: 0 },              // start here on Next or Replay (use for sweeps)
      win: { s: [.4, 1] },         // run this number during part of the step
      cam: { y: -1.2, p: .4 },     // only the fields that change
      dur: 3.5 }                   // seconds, default 1.1
  ]
};
```

Visibility, numbers and camera accumulate from step to step, so Back and jumping both work. `tx` is `String.raw`, so captions use single backslashes.

**Kit.** All coordinates are maths coordinates, z up. `k.scale(sx, sy, sz, center)` maps them to a scene about 3 units wide, and comes first.

| call | makes |
|---|---|
| `k.surf(name, (u,v)=>[x,y,z], [u0,u1,nu], [v0,v1,nv], {ramp:[zlo,zhi] or c, o, clip})` | any parametric surface; `.map(fn)` re-shapes it |
| `k.poly(name, pts, opts)` / `k.flat(name, pts2D, z, opts)` | convex polygon; `.set(pts)` moves it |
| `k.curt(name, n, opts)` | wall on a polyline; `.set([[x,y,zTop,zBottom],...])` |
| `k.tube(name, pts, {c, r})` / `k.tubes(name, [pts...], opts)` | thick curves |
| `k.seg(name, opts)` | line; `.set(a, b)` |
| `k.arrow(name, opts)` | arrow; `.set(a, b)`, tip at `.b` |
| `k.dot(name, {c, r, p})` | point; `.at(p)`, position in `.p` |
| `k.ball(name, opts)` / `k.block(name, opts)` | sphere `.at(p, worldRadius)` / box `.set(a, b)` |
| `k.grid(name, [x0,x1,dx], [y0,y1,dy], z)` / `k.axes(name, X, Y, Z, {at})` | floor grid / labeled axes; pass `null` to skip an axis |
| `k.label(name, pos or ()=>pos, tex, {c, dx, dy, when, line, sm, plain})` | math label pinned to a point; `dx`/`dy` draw a leader line, `when` shows it conditionally |
| `k.alias(name, "a b c")` | a group name for `add` and `drop` |
| `k.cut("x")` | clip plane; pass `.pl` in `clip: [...]`, move with `.set(v)` |
| `rectSolid(k, f, X, Y, ramp, axis)` | a solid over a rectangle with objects `R Re top w1-w4 ghost slice`, alias `solid`, and `.cut .set(g) .slice(s)` |

Colours `c` are token names: `accent glow good bad ink muted s1 s2 s3 surface-2`.

**What makes a good scene.** Joel asked for "simple". Each step shows one new idea, and the picture does what the written step does:
- Show what the algebra means. "Eliminate λ" drew the whole line of points where the gradients can line up, and "use the constraint" lit up where that line crosses the constraint.
- Sweep slices to show integrals, and leave a translucent `ghost` so the reader sees what's left to fill.
- Move the camera to the view that proves the point. A sphere touching a plane reads best edge-on. Contour maps read best from straight above.
- Keep labels few and drop old ones as new ones arrive.
- Translucent surfaces go at opacity .2 to .4 for context, and .7 to .95 for the subject.

## 9. QA

```sh
python3 lessons/<slug>/verify.py        # answers
python3 tools/check.py <slug>           # must end in PASS
python3 tools/sheets.py <slug>          # then open every PNG in dist/sheets/<slug>/
python3 tools/sheets.py <slug> --light  # light theme
```

`check.py` covers script errors, KaTeX failures, leftover raw TeX, sideways overflow, a reveal on every example, step counts, unknown object names, answer leaks, and the real stepping and lock flow in real-time Chrome.

**It can't tell you a picture is right.** Open every contact sheet and read it like a student, step by step. Fix these on sight: labels colliding, objects cropped by the frame, a plane seen edge-on when its face matters, a scene too small in its frame, and a caption describing something the picture doesn't show. Expect to fix several per lesson. Then screenshot real sections of the page in both themes.

To screenshot one section, build a copy with the other sections hidden by CSS (`display:none`). Scrolling first gives blank headless captures, and hiding `.toc` collapses the grid, so leave it in.

Report honestly what you couldn't test, such as audio you couldn't hear, or touch on a real phone.

## 10. Deliver

- The finished page goes to the `output` path, with a filename in the style of `lagrange-double-integrals-lesson.html`. It's a local file. Publish it to the web only if Joel asks.
- Commit the lesson source and push to `main`.
- Message Joel with: the link to the file; anything surprising about the source; the answers table for homework; which assumptions affect answers; what was added beyond the source; what you checked and what you didn't. Keep it short.

## 11. Pitfalls, all learned the hard way

- **Virtual time hides animation.** Under `--virtual-time-budget` Chrome fires almost no animation frames, so IntersectionObserver and `requestAnimationFrame` don't run and working animations look broken. `tools/common.py probe()` runs in real time and reports over a local POST for this reason.
- **Headless viewports are shorter than requested:** about 143px less than `--window-size`, with a minimum width of 500px. A "390px" screenshot is a 500px page cropped.
- **`overflow:hidden` on a card disables `position:sticky`** inside it. Use `overflow:clip`. Sticky also can't work inside a CSS grid item that spans only its own row, which is why the stepper wraps the viewer and steps in `.v3wrap`.
- **Browsers cap WebGL contexts at about 16.** The stepper shares one renderer and copies each frame into each example's canvas. Don't create a renderer per example.
- **Grid and flex children need `min-width:0`,** or a long equation or code block widens the page.
- **Start animated history full.** A scrolling scope should be seeded with more history than its window, or its first frame is part empty.
- **`opacity:0` entrance animations** leave a blank page in anything that doesn't run them. Animate transforms only.
- **Unquoted heredocs mangle `${...}`.** When a script edits JS through the shell, use `<<'EOF'`.
- **Round late.** On threshold problems, rounding I_C from 2.390 to 2.4 mA gives the wrong region. Keep digits through the calculation, and show them.
- **Radians.** `sin 6` means 6 radians. Say so on the page.
- **Don't trust a garbled problem statement.** Read it, say how you interpreted it, and tell Joel.
- **On Joel's Mac, Python may log `hashlib` blake2 errors** from some imports. They're harmless pyenv noise.
- **Scratch folders get wiped between sessions.** Everything that matters lives in this repo.

## 12. Repo rules

- Instructors' PDFs and docx files never get committed. They belong in `sources/`, which is git-ignored.
- The finished lessons restate problems and contain worked answers, so this repo stays private.
- Don't rewrite other lessons. When the engine changes, run `python3 tools/check.py wk8-multivariable` to confirm it still works.
- If you learn something that would have saved you time, add it to section 11 in the same commit.
