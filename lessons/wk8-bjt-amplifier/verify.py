"""Week 8, BJT Amplifier HW1. Every answer on the page, computed from the homework's schematics and checked against its hints."""
from math import pi, sqrt, log, exp

def par(a, b): return a * b / (a + b)
ok = True
def check(name, cond, note=""):
    global ok
    ok &= bool(cond)
    print(f"  {'ok ' if cond else 'BAD'} {name} {note}")

# ---------- Problem 1: coupling. Ideal Vin, so C1 sees R1 || R2 (Vcc is an AC ground).
R1, R2, C1 = 13e3, 1e3, 47e-6
Req = par(R1, R2)
XCmax = 0.1 * Req
f1 = 1 / (2 * pi * C1 * XCmax)
print(f"P1  Req = {Req:.3f} ohm, XC limit = {XCmax:.3f} ohm, f > {f1:.4f} Hz")
check("hint: f < 100 Hz", f1 < 100)
check("XC equals the limit at f1", abs(1 / (2 * pi * f1 * C1) - XCmax) < 1e-9)
print(f"    wrong readings, for the record: R2 only {1/(2*pi*C1*100):.2f} Hz, R1+R2 {1/(2*pi*C1*1400):.2f} Hz")
print(f"    fraction of the signal passed at the limit: {1/sqrt(1+0.1**2):.5f}")

# ---------- Problem 2: bypass. The homework gives only R4, so Req = R4.
R4p2, fmin = 1e3, 20
Cmin = 1 / (2 * pi * fmin * 0.1 * R4p2)
E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]
vals = [m * 10 ** d * 1e-6 for d in range(-2, 4) for m in E12]        # uF decades
C3 = min(v for v in vals if v >= Cmin * (1 - 1e-12))
below = max(v for v in vals if v < Cmin)
print(f"P2  calculated C >= {Cmin*1e6:.3f} uF, standard C3 = {C3*1e6:.0f} uF, one value down = {below*1e6:.0f} uF")
check("hint: calculated > 50 uF", Cmin > 50e-6)
check("82 uF meets the rule at 20 Hz", 1 / (2 * pi * 20 * C3) < 100, f"XC = {1/(2*pi*20*C3):.2f} ohm")
check("68 uF fails the rule at 20 Hz", 1 / (2 * pi * 20 * below) > 100, f"XC = {1/(2*pi*20*below):.2f} ohm")

# ---------- Problem 3: the VDB common-emitter amplifier, simplified analysis.
Vcc, R1, R2, R3, R4, RL, beta = 15, 3.6e3, 620, 2.7e3, 680, 100e3, 300
VB = Vcc * R2 / (R1 + R2)
VE = VB - 0.7
IE = VE / R4
rc = par(R3, RL)
re = 25e-3 / IE
AV = -rc / re
VC = Vcc - IE * R3
print(f"P3  VB = {VB:.4f} V, VE = {VE:.4f} V, IE = {IE*1e3:.4f} mA, VC = {VC:.3f} V, VCE = {VC-VE:.3f} V")
print(f"    rc = {rc:.2f} ohm, re' = {re:.3f} ohm, AV = {AV:.2f}")
check("hint: -240 <= AV <= -225", -240 <= AV <= -225)
check("stiff divider: R2 <= 0.01 beta R4", R2 <= 0.01 * beta * R4, f"{R2:.0f} vs {0.01*beta*R4:.0f}")
check("transistor stays active: VCE > 1 V", VC - VE > 1)
print(f"    26 mV instead of 25 mV would give AV = {-rc/(26e-3/IE):.1f} (outside the hint, so 25 mV is the course convention)")

# The firm version, with base current: the check that 'simplified' is fair.
Vth, Rth = VB, par(R1, R2)
IBx = (Vth - 0.7) / (Rth + (beta + 1) * R4)
IEx = (beta + 1) * IBx
VBx = Vth - IBx * Rth
print(f"    with base current: VB = {VBx:.4f} V ({(VB-VBx)/VBx*100:.2f}% away), IE = {IEx*1e3:.4f} mA ({(IE-IEx)/IEx*100:.2f}% away)")
check("simplified IE within 1% of the firm IE", abs(IE - IEx) / IEx < .01)

# Numeric check of the gain with an exponential junction: nudge vin and watch vout.
VT = 25e-3
def vout(v, q=IE): return -(q * exp(v / VT) - q) * rc
dv = 1e-6
num = (vout(dv) - vout(-dv)) / (2 * dv)
print(f"    exponential junction, numeric slope: {num:.2f}")
check("numeric slope matches -rc/re'", abs(num - AV) / abs(AV) < 1e-6)

# What the ignored resistors would have cost, for the 'real circuit' note.
ro = (100 + (VC - VE)) / IE
VT27 = 0.02587
print(f"    with VT 25.87 mV and VAF 100 V (LTspice-like): re' = {VT27/IE:.2f} ohm, ro = {ro/1e3:.1f} k, AV about {-par(rc, ro)/(VT27/IE):.0f}")
print(f"    without C3: AV = {-rc/(re+R4):.2f}")
print(f"    C3 seen by a real emitter: R4 || re' = {par(R4, re):.2f} ohm; 20 Hz rule would ask {1/(2*pi*20*0.1*par(R4,re))*1e6:.0f} uF")

print("ALL ANSWERS MATCH" if ok else "SOMETHING FAILED")
raise SystemExit(0 if ok else 1)
