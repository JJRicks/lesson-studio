"""Week 9, BJT Amplifier HW2. Every answer on the page, computed from the homework's schematic and checked against its hint."""
from math import pi, sin, log

def par(*rs): return 1 / sum(1 / r for r in rs)
ok = True
def check(name, cond, note=""):
    global ok
    ok &= bool(cond)
    print(f"  {'ok ' if cond else 'BAD'} {name} {note}")

# ---------- Problem 1: VDB amplifier with ac emitter feedback (swamping), simplified analysis.
# re (120 ohm) is unbypassed; C3 bypasses R4 (560 ohm) only.
Vcc, R1, R2, R3, re, R4, RL, beta = 16, 3.3e3, 560, 2.7e3, 120, 560, 100e3, 300
VB = Vcc * R2 / (R1 + R2)
VE = VB - 0.7
IE = VE / (re + R4)                 # DC: C3 is open, so both emitter resistors carry IE
rp = 25e-3 / IE                     # re' (r-e-prime)
rc = par(R3, RL)
AV = -rc / (rp + re)                # C3 shorts R4 only; re stays in the emitter's AC path
Zbase = beta * (rp + re)
Zin = par(R1, R2, Zbase)
print(f"P1  VB = {VB:.4f} V, VE = {VE:.4f} V, IE = {IE*1e3:.4f} mA")
print(f"    a. re' = {rp:.4f} ohm")
print(f"    b. rc  = {rc:.2f} ohm")
print(f"    c. AV  = {AV:.3f}")
print(f"    d. Zin(base) = {Zbase:.1f} ohm, R1||R2 = {par(R1, R2):.2f} ohm, Zin = {Zin:.2f} ohm")
check("hint: 460 <= Zin <= 480", 460 <= Zin <= 480)
check("stiff divider: R2 <= 0.01 beta (re + R4)", R2 <= 0.01 * beta * (re + R4), f"{R2:.0f} vs {0.01*beta*(re+R4):.0f}")
VC = Vcc - IE * R3
check("transistor active: VCE > 1 V", VC - VE > 1, f"VC = {VC:.3f} V, VCE = {VC-VE:.3f} V")

# Firm check with base current: how much does 'simplified' move things?
Rth = par(R1, R2)
IBx = (VB - 0.7) / (Rth + (beta + 1) * (re + R4))
IEx = (beta + 1) * IBx
print(f"    with base current: IE = {IEx*1e3:.4f} mA ({(IE-IEx)/IEx*100:.2f}% away), re' = {25e-3/IEx:.3f} ohm")
check("simplified IE within 1% of firm IE", abs(IE - IEx) / IEx < .01)

# 26 mV convention, for the note on the page
rp26 = 26e-3 / IE
print(f"    with 26 mV: re' = {rp26:.3f}, AV = {-rc/(rp26+re):.3f}, Zin = {par(R1, R2, beta*(rp26+re)):.2f}")
check("26 mV also lands inside the hint", 460 <= par(R1, R2, beta * (rp26 + re)) <= 480)
print(f"    without swamping (re bypassed too): AV = {-rc/rp:.1f}; fully unbypassed: AV = {-rc/(rp+re+R4):.2f}")

# Numeric gain with an exponential junction and re in the emitter: solve VT ln(i/IE) + (i - IE) re = v.
VT = 25e-3
def ie_of(v):
    lo, hi = IE * .2, IE * 5
    for _ in range(200):
        m = (lo + hi) / 2
        if VT * log(m / IE) + (m - IE) * re < v: lo = m
        else: hi = m
    return (lo + hi) / 2
dv = 1e-7
num = -(ie_of(dv) - ie_of(-dv)) * rc / (2 * dv)
print(f"    exponential junction, numeric slope: {num:.3f}")
check("numeric slope matches -rc/(re'+re)", abs(num - AV) / abs(AV) < 1e-5)

# Swamping: how much does AV move when re' doubles? (for the page's claim)
print(f"    re' x2: AV = {-rc/(2*rp+re):.2f} ({(rc/(2*rp+re))/(rc/(rp+re))*100-100:.1f}%); unswamped would change by -50%")

# ---------- Problem 2: the small-signal pi model in LTspice.
# Vin = SINE(0 1mV 1kHz) across Rin = 1k; B1 = 100*I(Rin) from Vout to ground; rc = 1k from Vout to ground.
b2, Rin, rc2 = 100, 1e3, 1e3
AV2 = -b2 * rc2 / Rin
print(f"P2  AV = -beta rc / Rin = {AV2:.1f}")
# a few points the way LTspice computes them: I(Rin) enters pin 1 (the Vin node); B1 sinks it from Vout.
for t in (0.25e-3, 0.75e-3, 1.25e-3):
    vin = 1e-3 * sin(2 * pi * 1e3 * t)
    iR = vin / Rin
    vout = -b2 * iR * rc2
    print(f"    t = {t*1e3:.2f} ms: vin = {vin*1e3:+.3f} mV, I(Rin) = {iR*1e6:+.3f} uA, vout = {vout*1e3:+.1f} mV")
check("peak vout is 100 mV, inverted", abs(-b2 * 1e-3 / Rin * rc2 + 0.1) < 1e-12)
check("Rin plays beta re': re' = Rin/beta = 10 ohm, and -rc/re' gives the same gain", abs(-rc2 / (Rin / b2) - AV2) < 1e-9)
print(f"    2d: doubling rc to 2k gives {-b2*2e3/Rin:.0f}; halving it gives {-b2*500/Rin:.0f}")

print("ALL ANSWERS MATCH" if ok else "SOMETHING FAILED")
raise SystemExit(0 if ok else 1)
