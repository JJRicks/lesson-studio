"""MOSFET HW 2: every answer on the page, worked exactly with SymPy, then checked against the homework's hint ranges.

Sah's equations (n-channel; a p-channel part uses VSG, VSD, |VT| and |ID|):
  cutoff      VGS <= VT:                      ID = 0
  triode      VDS <  VGS - VT:                ID = beta [ (VGS - VT) VDS - VDS^2 / 2 ]
  saturation  VDS >= VGS - VT:                ID = (beta / 2) (VGS - VT)^2
Run:  python3 lessons/wk12-mosfet-switches/verify.py
"""
from sympy import Rational as R, nsimplify, N

ok = True
def check(name, cond):
    global ok
    ok &= bool(cond)
    print(("  ok  " if cond else "  FAIL ") + name)

def sah(beta, vov, vds):
    """drain current magnitude, with the region it came from"""
    if vov <= 0: return 0, "cutoff"
    if vds < vov: return beta * (vov * vds - vds ** 2 / 2), "triode"
    return beta / 2 * vov ** 2, "saturation"

# ---------- Problem 1: n-channel, low-side switch ----------
VT, VGS_ds, VDS_ds, ID_ds = R(2), R(5), R(10), R(1, 2)
print("Problem 1a")
check("datasheet point is in saturation: VDS = 10 V >= VGS - VT = 3 V", VDS_ds >= VGS_ds - VT)
bn = 2 * ID_ds / (VGS_ds - VT) ** 2
print(f"  beta_n = 2(0.5)/(3)^2 = {bn} = {N(bn, 6)} A/V^2")

print("Problem 1b")
VGS, VDS = R(5), R(2, 10)                 # Vin on the gate, Vout is the drain voltage
I1, reg1 = sah(bn, VGS - VT, VDS)
check("switch point is in triode: VDS = 0.2 V < 3 V", reg1 == "triode")
print(f"  ID = beta_n[(3)(0.2) - 0.2^2/2] = {I1} = {N(I1 * 1000, 6)} mA")

print("Problem 1c")
R1on = VDS / I1
print(f"  RDS(on) = 0.2 / ID = {R1on} = {N(R1on, 6)} ohm")
check("inside the hint, 2.5 to 3.5 ohm", 2.5 <= R1on <= 3.5)
print(f"  extras: R1 = (5 - 0.2)/ID = {N((5 - VDS) / I1, 5)} ohm, deep-triode estimate 1/(beta Vov) = {N(1 / (bn * 3), 5)} ohm,"
      f" switch heat {N(VDS * I1 * 1000, 4)} mW, load heat {N((5 - VDS) * I1 * 1000, 4)} mW")

# ---------- Problem 2: p-channel, high-side switch ----------
VTp, VSG_ds, VSD_ds, ID_dsp = R(-2), R(5), R(10), R(-24, 100)
print("\nProblem 2a")
check("datasheet point is in saturation: VSD = 10 V >= VSG - |VT| = 3 V", VSD_ds >= VSG_ds - abs(VTp))
bp = 2 * abs(ID_dsp) / (VSG_ds - abs(VTp)) ** 2
print(f"  beta_p = 2(0.24)/(3)^2 = {bp} = {N(bp, 6)} A/V^2")

print("Problem 2b")
Vdd, Vin, Vout = R(5), R(0), R(48, 10)
VSG, VSD = Vdd - Vin, Vdd - Vout          # the source sits on the 5 V supply
I2, reg2 = sah(bp, VSG - abs(VTp), VSD)
check("VSG = 5 V and VSD = 0.2 V", VSG == 5 and VSD == R(1, 5))
check("switch point is in triode", reg2 == "triode")
print(f"  |ID| = beta_p[(3)(0.2) - 0.2^2/2] = {I2} = {N(I2 * 1000, 6)} mA, so ID = -{N(I2 * 1000, 6)} mA (it flows out of the drain)")

print("Problem 2c")
R2on = VSD / I2
print(f"  RDS(on) = VSD/|ID| = {R2on} = {N(R2on, 6)} ohm")
check("inside the hint, 6.3 to 6.6 ohm", 6.3 <= R2on <= 6.6)
print(f"  extras: R1 = 4.8/|ID| = {N(Vout / I2, 5)} ohm, ratio RDS(on),p / RDS(on),n = {N(R2on / R1on, 5)} = beta_n/beta_p = {N(bn / bp, 5)}")

print("\nDemo values used by the interactives (never the homework's)")
bd, VTd = R(18, 100), R(3, 2)
print(f"  practice part: VT = 1.5 V, beta = 0.18 A/V^2 -> datasheet point ID = {N(sah(bd, R(3), 10)[0], 4)} A at VGS = 4.5 V, VDS = 10 V")
for vg in (R(33, 10), 5, 10):
    i, _ = sah(bd, vg - VTd, R(1, 10))
    print(f"  RDS(on) at VGS = {N(vg, 3)} V, VDS = 0.1 V: {N(R(1, 10) / i, 4)} ohm")
check("demo beta differs from both homework betas", bd not in (bn, bp))

print("\nALL CHECKS PASS" if ok else "\nSOME CHECKS FAILED")
