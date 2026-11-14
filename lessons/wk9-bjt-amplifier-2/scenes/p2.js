/* ---------- Problem 2: the LTspice small-signal model. Panes on the right look like LTspice's plot window ---------- */
function piPane(k, n, y, h, name, c) {                     // a plot pane: title at the left, three grid lines, quarter-time ticks
  const x0 = 548, x1 = 756, top = y + 30, bot = y + h - 12, mid = (top + bot) / 2, amp = (bot - top) / 2;
  k.group(n, s => {
    SC.card(s, 494, y, 276, h, "");
    s.text([508, y + 15], name, { cls: "sm", c });
    for (const f of [-1, 0, 1]) s.wire([[x0, mid - f * amp], [x1, mid - f * amp]], "gridl");
    for (let i = 1; i < 4; i++) s.wire([[lerp(x0, x1, i / 4), top - 6], [lerp(x0, x1, i / 4), bot + 4]], "gridl");
  }, { side: true });
  return { X: tm => lerp(x0, x1, tm / 2), Y: f => mid - f * amp, mid, amp, top, bot, x0, x1, y, h };
}
function paneAxis(k, n, P, hi, lo) {                         // the values at the top and bottom grid lines
  return k.group(n, s => { s.text([P.x0 - 5, P.top], hi, { anchor: "end", cls: "sm" }); s.text([P.x0 - 5, P.bot], lo, { anchor: "end", cls: "sm" }); }, { side: true });
}
const trace = (P, f, upTo = 2) => upTo > .01 ? rng(0, upTo, max(2, Math.round(80 * upTo))).map(tm => [P.X(tm), P.Y(f(tm))]) : [];
const vinF = tm => sin(TWO_PI * tm), voutF = tm => -sin(TWO_PI * tm);
function piFlows(k, h) { k.flow("fin", h.f.in, { c: "t1", gap: 16 }); k.flow("fout", h.f.out, { c: "accent", gap: 16 }); }
function piSpeed(k, t, a = 1) { const v = wob(t, 30) * a; k.o.fin.speed = v; k.o.fout.speed = 1.8 * v; }

S.p2a = {
  ...BOX,
  P: { s: 0, r: 0, b: 0, c: 0, n: 0 },
  build(k) {
    const h = k.h = drawPi(k.sch, PI2); piFlows(k, h);
    SC.ring(k, "rgS", h.at.src, 26, 34); SC.ring(k, "rgR", h.at.Rin, 15, 60); SC.ring(k, "rgB", h.at.B1, 27, 29); SC.ring(k, "rgC", h.at.rc, 15, 60); SC.ring(k, "rgN", h.at.name, 60, 16);
    SC.lines(k, "c1", 494, 20, 276, "in LTspice", ["F2 opens the parts list.", "Pick signal from the Misc folder.", "Right-click it and name it Vin.", "G places a ground for its bottom."], { lh: 24 });
    SC.lines(k, "c2", 494, 20, 276, "add Rin", ["F2 → res. Don't press Ctrl+R.", "Right-click: value 1k, name Rin.", "F4 on the top wire: name it Vin.", "I(Rin) is + into the top pin."], { lh: 24 });
    SC.lines(k, "c3", 494, 20, 276, "add the dependent source", ["F2 → bi (not the current part).", "Arrow down, bottom to ground.", "Right-click and set its value to", "I={100*I(Rin)}"], { lh: 24 });
    SC.lines(k, "c4", 494, 20, 276, "add the collector load", ["F2 → res, value 1k, name rc.", "Top of B1 down to ground.", "F4 on the top wire: name it Vout."], { lh: 24 });
    SC.lines(k, "c5", 494, 20, 276, "sign it", ["T opens the text box.", "Type your name, click to place."], { lh: 24 });
    SC.lines(k, "net", 494, 20, 276, "the netlist LTspice builds", ["Vin Vin 0 SINE(...) in part b", "Rin Vin 0 1k", "B1 Vout 0 I={100*I(Rin)}", "rc Vout 0 1k"], { lh: 26, c: "good" });
    SC.lines(k, "how", 494, 166, 276, "what it does", ["vin drives a current down Rin.", "B1 makes 100 times that current.", "That current flows through rc."], { lh: 24 });
  },
  update(P, k, t) {
    const h = k.h; h.op("src", P.s); h.op("rin", P.r); h.op("iarr", P.r); h.op("b1", P.b); h.op("rc", P.c); h.op("out", P.c); h.op("name", P.n);
    h.op("sine", 0); h.op("tran", 0); piSpeed(k, t);
  },
  steps: [
    { cap: tx`Start with the input source. In LTspice it's the signal part in the Misc folder. Name it Vin and ground its bottom.`, from: { s: 0 }, set: { s: 1 }, add: "rgS c1" },
    { cap: tx`Rin runs from the top of Vin to ground. Leave it upright, because LTspice counts I(Rin) as positive when current flows into its top pin.`, drop: "rgS c1", add: "rgR c2", set: { r: 1 } },
    { cap: tx`The bi source makes a current from a formula. This one copies 100 times the current in Rin, so it plays the transistor's \(\beta i_b\). Point its arrow down.`, drop: "rgR c2", add: "rgB c3", set: { b: 1 } },
    { cap: tx`rc sits beside B1, from the same top node to ground. B1 pulls its current through rc, and that sets the voltage at Vout.`, drop: "rgB c3", add: "rgC c4", set: { c: 1 } },
    { cap: tx`Press T and place your name on the schematic.`, drop: "rgC c4", add: "rgN c5", set: { n: 1 } },
    { cap: tx`The finished model. vin drives a current through Rin, and B1 sends 100 times that current through rc.`, drop: "rgN c5", add: "net how fin fout" }
  ]
};

S.p2b = {
  ...BOX,
  P: { sn: 0, tr: 0, sw: 0, so: 0 },
  build(k) {
    const h = k.h = drawPi(k.sch, PI2); piFlows(k, h);
    SC.ring(k, "rgS", [82, 334], 66, 14); SC.ring(k, "rgT", [214, 334], 38, 15);
    SC.lines(k, "c1", 494, 20, 276, "right-click Vin → Advanced → SINE", ["DC offset[V]: 0", "Amplitude[V]: 1m", "Freq[Hz]: 1k", "m and M both mean milli."], { lh: 24 });
    SC.lines(k, "c2", 494, 20, 276, "Simulate → Edit Simulation Cmd", ["Transient tab, stop time 2ms.", "1 kHz means 1 ms per cycle.", "So 2 ms shows two full cycles."], { lh: 24 });
    const A = k.pa = piPane(k, "pA", 20, 116, "V(vin)", "t1"), B = k.pb = piPane(k, "pB", 144, 124, "V(vout)", "accent");
    paneAxis(k, "axA", A, "1mV", "-1mV"); paneAxis(k, "axB", B, "100mV", "-100mV");
    k.plot("wi", { c: "t1", side: true }); k.plot("wo", { c: "accent", side: true });
    k.group("nm", s => s.text([756, 159], "your name", { anchor: "end", c: "cursor" }), { side: true });
    SC.lines(k, "c3", 494, 276, 276, "split the plot", ["Plot Settings → Add Plot Pane", "Top pane: click the Vin wire.", "Bottom pane: click the Vout wire."], { lh: 18 });
    SC.lines(k, "c4", 494, 276, 276, "sign the plot", ["Plot Settings → Notes and", "Annotations → Place Text"], { lh: 20 });
    k.label("Lsc", [632, 316], tx`\text{vin: }\pm 1\text{ mV}\qquad \text{vout: }\pm 100\text{ mV, inverted}`, { c: "good", line: false });
  },
  update(P, k, t) {
    const h = k.h; h.op("sine", .25 + .75 * P.sn); h.op("tran", .25 + .75 * P.tr);
    piSpeed(k, t, P.sw > .99 ? 1 : 0);
    k.o.wi.set(trace(k.pa, vinF, 2 * P.sw)); k.o.wo.set(trace(k.pb, voutF, 2 * P.so));
  },
  steps: [
    { cap: tx`Right-click Vin, choose Advanced, and pick SINE. Enter offset 0, amplitude 1m and frequency 1k.`, add: "rgS c1", from: { sn: 0 }, set: { sn: 1 } },
    { cap: tx`Add a .tran 2ms command. One 1 kHz cycle lasts 1 ms, so the run shows two cycles.`, drop: "rgS c1", add: "rgT c2", set: { tr: 1 } },
    { cap: tx`Run it. Add a second plot pane, then click the Vin wire for the top pane and the Vout wire for the bottom one.`, drop: "rgT c2", add: "pA pB axA wi wo c3", set: { sw: 1 }, dur: 2.2 },
    { cap: tx`Place Text puts your name on the plot window.`, drop: "c3", add: "nm c4" },
    { cap: tx`V(vout) is the same shape as vin, flipped upside down. Its scale reads ±100 mV against vin's ±1 mV.`, drop: "c4", add: "axB Lsc", set: { so: 1 }, dur: 2.2 }
  ]
};

S.p2c = {
  ...BOX,
  P: { cu: .25 },
  build(k) {
    const h = k.h = drawPi(k.sch, PI2); piFlows(k, h);
    const A = k.pa = piPane(k, "pA", 20, 116, "V(vin)", "t1"), B = k.pb = piPane(k, "pB", 144, 124, "V(vout)", "accent");
    paneAxis(k, "axA", A, "1mV", "-1mV"); paneAxis(k, "axB", B, "100mV", "-100mV");
    k.plot("wi", { c: "t1", side: true }).set(trace(A, vinF)); k.plot("wo", { c: "accent", side: true }).set(trace(B, voutF));
    k.alias("base", "pA pB axA wi wo fin fout");
    k.plot("cur", { c: "cursor", side: true });
    const dot = (n, c) => { let e; k.group(n, s => { e = svgEl("circle", { r: 4.6 }, s.g); e.setAttribute("style", `fill:var(--${c})`); }, { side: true }); return e; };
    k.di = dot("mi", "t1"); k.dd = dot("mo", "accent");
    k.group("rd", s => SC.card(s, 494, 276, 276, 80, "cursor readout"), { side: true });
    k.label("L1", [632, 313], tx`\text{at 0.25 ms:}\ \ v_{in} = +1\text{ mV}`, { c: "t1", line: false });
    k.label("L2", [632, 339], tx`v_{out}\ \text{is at a trough}`, { c: "accent", line: false });
    k.label("L2a", [632, 339], tx`v_{out} = -100\text{ mV}`, { c: "good", line: false });
    k.label("Lr", [250, 42], tx`A_V = v_{out}/v_{in}\quad\text{check: }-\beta r_c/R_{in}`, { c: "ink", line: false });
    k.label("La", [250, 42], tx`A_V = -100\text{ mV}/1\text{ mV} = -100`, { c: "good", line: false });
  },
  update(P, k, t) {
    piSpeed(k, t);
    const A = k.pa, B = k.pb, x = A.X(P.cu);
    k.o.cur.set([[x, A.top - 8], [x, B.bot + 6]]);
    k.di.setAttribute("cx", x); k.di.setAttribute("cy", A.Y(vinF(P.cu))); k.dd.setAttribute("cx", x); k.dd.setAttribute("cy", B.Y(voutF(P.cu)));
  },
  steps: [
    { cap: tx`Put a cursor on V(vin) at 0.25 ms. That's a quarter of a cycle in, where vin is at its peak of +1 mV.`, add: "base cur mi rd L1", from: { cu: 1.1 }, set: { cu: .25 }, dur: 1.6 },
    { cap: tx`Read V(vout) at the same 0.25 ms. It's at the bottom of its swing, so it's negative right when vin is positive. Read its size off the cursor.`, add: "mo L2" },
    { cap: tx`Divide vout by vin and keep the sign. Then check it against the model's \(-\beta r_c/R_{in}\).`, add: "Lr" },
    { cap: tx`vout = −100 mV when vin = +1 mV, so \(A_V\) = −100 mV / 1 mV = −100. The model agrees: −(100)(1 kΩ)/(1 kΩ) = −100.`, drop: "Lr L2", add: "La L2a axB" }
  ]
};

S.p2d = {
  ...BOX,
  P: { g: 1 },
  build(k) {
    const h = k.h = drawPi(k.sch, PI2); piFlows(k, h);
    k.group("gc", s => SC.card(s, 494, 20, 276, 108, "the model's gain"), { side: true });
    k.label("Lg", [632, 62], tx`|A_V| = \beta\, r_c / R_{in}`, { c: "ink", line: false });
    k.label("Lfx", [632, 100], tx`\beta = 100,\ R_{in} = 1\text{ k}\Omega\ \text{are fixed}`, { c: "muted", line: false });
    k.label("Lfr", [632, 100], tx`\text{only } r_c \text{ can move}`, { c: "cursor", line: false });
    SC.ring(k, "rgR", h.at.Rin, 15, 60, "muted"); SC.ring(k, "rgB", h.at.B1, 27, 29, "muted"); SC.ring(k, "rgC", h.at.rc, 15, 60);
    const x = 512, bw = 236, y = 194;
    k.group("bc", s => {
      SC.card(s, 494, 140, 276, 118, "raise rc and watch the gain");
      s.text([x + bw / 2, y + 36], "1k: 100", { anchor: "middle", cls: "sm" }); s.text([x + bw, y + 36], "2k: 200", { anchor: "end", cls: "sm" });
    }, { side: true });
    k.bar = k.rect("bar", x, y, bw / 2, 20, { side: true, c: "good" });
    k.bt = k.group("bt", s => { k.btx = s.text([x, y - 14], "", { cls: "sm", c: "ink" }); }, { side: true });
    k.label("La", [632, 100], tx`\text{increase } r_c`, { c: "good", line: false });
  },
  update(P, k, t) {
    piSpeed(k, t);
    const g = P.g, rcT = g < 1.005 ? "1k" : g > 1.995 ? "2k" : g.toFixed(1) + "k";
    k.h.t.rc.textContent = rcT;
    k.bar.set(512, 194, 236 * g / 2, 20);
    const s = `rc = ${rcT}Ω   →   |AV| = ${Math.round(100 * g)}`; if (k.btx.textContent !== s) k.btx.textContent = s;
  },
  steps: [
    { cap: tx`In the model, B1 makes β times the input current, and that current flows through rc. That gives \(|A_V| = \beta\,r_c/R_{in}\).`, add: "gc Lg" },
    { cap: tx`β and Rin are fixed by the problem. That locks the factor \(\beta/R_{in}\).`, add: "rgR rgB Lfx" },
    { cap: tx`Only rc is left. Decide which way it has to move to make the fraction bigger.`, drop: "rgR rgB Lfx", add: "rgC Lfr" },
    { cap: tx`Increase rc. Going from 1 kΩ to 2 kΩ doubles the gain from −100 to −200, because the same B1 current now drops twice the voltage.`, drop: "Lfr", add: "bc bar bt La", set: { g: 2 }, dur: 2 }
  ]
};
