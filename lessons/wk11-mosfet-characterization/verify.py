"""MOSFET HW 1: every number on the page, from LTspice's own VDMOS equations and the standard.mos model lines.

LTspice's DC VDMOS model (the same equations ngspice's VDMOS copies):
  vgst = ksubthres * ln(1 + exp((Vgs' - Vto) / ksubthres))      smooth turn-on below threshold
  saturation (vgst <= mtriode*Vds'):  Id = (Kp/2) vgst^2
  triode:                             Id = Kp * (mtriode Vds') * (vgst - mtriode Vds' / 2)
where Vgs' and Vds' are inside the series resistances: Vgs' = Vgs - Id Rs, Vds' = Vds - Id (Rs + Rd).
A p-channel part runs the same equations on Vsg, Vsd and |Vto|, and LTspice reports Id(M1) negative.

The proof that this matches LTspice: the instructor's own plots in the homework show cursor readings of
Id = 248.70405 uA (2N7002) and Id = -1.0008349 mA (BSS84). This model lands on both, to 7 digits, at a 1 mV sweep point.
Run:  python3 lessons/wk11-mosfet-characterization/verify.py
"""
from math import exp, log1p
from scipy.optimize import brentq

# .model lines from LTspice's standard.mos (lib/cmp), DC parameters only
M2N7002 = dict(Vto=1.6, Kp=.17, mtr=1.25, Rs=.75, Rd=0.0, ks=.1)   # Fairchild 2N7002, n-channel
BSS84 = dict(Vto=2.1, Kp=.2, mtr=1.0, Rs=1.8, Rd=2.4, ks=.1)       # NXP BSS84, pchan, Vto=-2.1 (magnitudes here)
BSS123 = dict(Vto=1.6, Kp=1.0, mtr=1.0, Rs=1.8, Rd=2.4, ks=.1)     # Fairchild BSS123: the page's demo part


def soft(m, v):
    a = (v - m["Vto"]) / m["ks"]
    return m["ks"] * (a + log1p(exp(-a)) if a > 30 else log1p(exp(a)))


def core(m, vgs, vds):
    vgst, vdss = soft(m, vgs), vds * m["mtr"]
    return m["Kp"] / 2 * vgst ** 2 if vgst <= vdss else m["Kp"] * vdss * (vgst - vdss / 2)


def Id(m, vgs, vds):
    """drain current magnitude for terminal voltages vgs, vds (magnitudes for a p-channel part)"""
    f = lambda i: i - core(m, vgs - i * m["Rs"], vds - i * (m["Rs"] + m["Rd"]))
    return brentq(f, 0, 10, xtol=1e-18, rtol=1e-15) if f(0) < 0 else 0.0


def knee(m, vgs):
    """the external Vds where the curve flattens: vgst = mtriode * Vds' inside the part"""
    i = Id(m, vgs, 1e3)
    return soft(m, vgs - i * m["Rs"]) / m["mtr"] + i * (m["Rs"] + m["Rd"]), i


def cursor(m, target):
    """diode-connected sweep .dc 0.5 3.0 1m: the 1 mV point whose current is closest to target, like an LTspice cursor"""
    pts = [(round(.5 + n * 1e-3, 3), Id(m, .5 + n * 1e-3, .5 + n * 1e-3)) for n in range(2501)]
    return min(pts, key=lambda p: abs(p[1] - target)), pts


ok = True
def check(name, cond):
    global ok
    ok &= bool(cond)
    print(("  ok  " if cond else "  FAIL ") + name)


print("Model check against the instructor's plots in the homework")
(v1, i1), pts1 = cursor(M2N7002, 250e-6)
(v3, i3), pts3 = cursor(BSS84, 1e-3)
print(f"  2N7002 at Vgs = {v1:.3f} V: {i1 * 1e6:.5f} uA   (instructor's cursor 248.70405 uA)")
print(f"  BSS84  at Vsg = {v3:.3f} V: {i3 * 1e3:.7f} mA (instructor's cursor 1.0008349 mA)")
check("2N7002 cursor matches to 6 digits", abs(i1 - 248.70405e-6) / 248.70405e-6 < 1e-6)
check("BSS84 cursor matches to 6 digits", abs(i3 - 1.0008349e-3) / 1.0008349e-3 < 1e-6)
check("2N7002 full-scale point: about 142 mA at 3.0 V, as the instructor's plot shows", 138e-3 < pts1[-1][1] < 146e-3)
check("BSS84 full-scale point: about -62 mA at 3.0 V, as the instructor's plot shows", 58e-3 < pts3[-1][1] < 66e-3)
nb = {v: i for v, i in pts1}
print(f"  neighbours: 1.566 V -> {nb[1.566] * 1e6:.2f} uA, 1.568 V -> {nb[1.568] * 1e6:.2f} uA")

print("\nProblem 1 · 2N7002 threshold (Vgs at Id = 250 uA)")
print(f"  VT = {v1:.3f} V  (Id = {i1 * 1e6:.2f} uA at that sweep point)")
check("inside the datasheet's 1 to 2.5 V", 1 <= v1 <= 2.5)
check("below the model's Vto = 1.6 V, because ksubthres lets current start early", v1 < 1.6)

print("\nProblem 2 · 2N7002 family, .dc Vds 0 10 0.1 Vgs 1 5 1")
fam2 = {}
for vg in range(1, 6):
    k, i = knee(M2N7002, vg)
    fam2[vg] = (Id(M2N7002, vg, 10), k)
    print(f"  Vgs = {vg} V: plateau {Id(M2N7002, vg, 10) * 1e3:9.4f} mA, flattens at Vds = {k:.2f} V, at 1 V: {Id(M2N7002, vg, 1) * 1e3:7.2f} mA")
check("plateaus match the instructor's plot: ~0, ~13, ~142, ~380, ~700 mA", fam2[1][0] < 1e-3 and 10e-3 < fam2[2][0] < 16e-3 and
      138e-3 < fam2[3][0] < 146e-3 and 370e-3 < fam2[4][0] < 390e-3 and 690e-3 < fam2[5][0] < 715e-3)
check("knees match the instructor's plot: ~1.1, ~1.9, ~2.8 V", 1.0 < fam2[3][1] < 1.25 and 1.8 < fam2[4][1] < 2.0 and 2.7 < fam2[5][1] < 2.95)
print(f"  Vgs = 1 V sits below threshold: {fam2[1][0] * 1e6:.3f} uA")
print(f"  Rds(on) slope near Vds = 0 at Vgs = 5 V: {0.01 / Id(M2N7002, 5, .01):.2f} ohm")

print("\nProblem 3 · BSS84 threshold (Vsg at Id = -1 mA)")
print(f"  |VT| = {v3:.3f} V, so VT = -{v3:.3f} V  (Id(M1) = -{i3 * 1e3:.4f} mA at that sweep point)")
check("model's Vto is -2.1 V; the measured |VT| sits close to it", abs(v3 - 2.1) < .1)

print("\nProblem 4 · BSS84 family, .dc Vsd 0 10 0.1 Vsg 2 6 1 (LTspice shows these negative)")
fam4 = {}
for vg in range(2, 7):
    k, i = knee(BSS84, vg)
    fam4[vg] = (Id(BSS84, vg, 10), k)
    print(f"  Vsg = {vg} V: plateau -{Id(BSS84, vg, 10) * 1e3:9.4f} mA, flattens at Vsd = {k:.2f} V")
check("plateaus match the instructor's plot: ~0, ~-62, ~-224, ~-445, ~-697 mA", fam4[2][0] < 1e-3 and 58e-3 < fam4[3][0] < 66e-3 and
      218e-3 < fam4[4][0] < 230e-3 and 435e-3 < fam4[5][0] < 455e-3 and 685e-3 < fam4[6][0] < 705e-3)
check("Vsg = 6 V flattens near 5.5 V, as in the instructor's plot", 5.3 < fam4[6][1] < 5.7)
print(f"  Vsg = 2 V sits below threshold: -{fam4[2][0] * 1e6:.2f} uA")

print("\nDemo part · BSS123 (used by the interactives, never the homework's parts)")
(vd, idd), _ = cursor(BSS123, 250e-6)
(vd1, idd1), _ = cursor(BSS123, 1e-3)
print(f"  VT at 250 uA: {vd:.3f} V ({idd * 1e6:.2f} uA);  at 1 mA: {vd1:.3f} V")
for vg in range(1, 6):
    k, i = knee(BSS123, vg)
    print(f"  Vgs = {vg} V: plateau {Id(BSS123, vg, 10) * 1e3:8.2f} mA, flattens at {k:.2f} V")
check("demo thresholds differ from the homework's answers", abs(vd - v1) > .05 and abs(vd1 - v3) > .05)
for v in (1.0, 1.2, 1.4, 1.5, 1.6, 1.8, 2.0, 2.5, 3.0):
    print(f"    diode-connected BSS123 at {v:.1f} V: {Id(BSS123, v, v):.4e} A")

print("\nALL CHECKS PASS" if ok else "\nSOME CHECKS FAILED")
