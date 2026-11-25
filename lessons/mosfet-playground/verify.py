"""Checks the playground's model against the numbers it shares with the other MOSFET pages.

1. The practice parts: the presets build beta from mu, Cox, W and L, and must land on the Switches page's demo values
   (n: 0.18 A/V^2, p: 0.08 A/V^2).
2. Sah's equations with lambda = 0 must give the Switches page's demo numbers exactly.
3. The smoothed overdrive (subthreshold on) must match the LTspice VDMOS form, and its slope must be n*kT/q*ln10 per decade.
4. gm = 2*ID/Vov in saturation, ro = (1/lambda + VDS)/ID, fT = 3*mu*Vov/(4*pi*L^2).
"""
import math

q, kB, eps0, kox = 1.602176634e-19, 1.380649e-23, 8.8541878128e-12, 3.9

def cox(tox_nm): return eps0 * kox / (tox_nm * 1e-9)

def width_for(beta, mu, tox, L): return beta * L / (mu * 1e-4 * cox(tox))      # W in the same unit as L

def vov_eff(x, ks, sub):
    if not sub: return max(0.0, x)
    return x if x / ks > 40 else ks * math.log1p(math.exp(x / ks))

def idd(beta, vt, lam, vgs, vds, ks=0.05, sub=False):
    v = vov_eff(vgs - vt, ks, sub)
    if v <= 0: return 0.0
    c = 1 + lam * vds
    return beta * (v * vds - vds * vds / 2) * c if vds < v else beta / 2 * v * v * c

ok = lambda c, m: print(("ok   " if c else "FAIL ") + m)

# 1. practice presets
for name, beta, mu in (("n", .18, 500), ("p", .08, 200)):
    W = width_for(beta, mu, 50, 2)
    b = mu * 1e-4 * cox(50) * W / 2
    ok(abs(b - beta) < 1e-12, f"practice {name}: W = {W:.1f} um gives beta = {b:.6f}")

# 2. Switches page demo numbers (VT 1.5 V, beta 0.18): triode at VGS 5, VDS 0.1 and saturation at 4.5 V
i = idd(.18, 1.5, 0, 5, .1); ok(abs(i - .18 * (3.5 * .1 - .005)) < 1e-15, f"triode demo: {i*1e3:.4f} mA")
i = idd(.18, 1.5, 0, 4.5, 10); ok(abs(i - .81) < 1e-12, f"saturation demo: {i:.4f} A (the Switches page's 0.81 A point)")

# 3. subthreshold slope
T, n = 300, 1.5
phit = kB * T / q; ks = 2 * n * phit
a, b = idd(1e-3, .7, 0, .0, 1, ks, True), idd(1e-3, .7, 0, .1, 1, ks, True)   # well below VT, where the exponential is clean
S = .1 / math.log10(b / a)
ok(abs(S - n * phit * math.log(10)) < 2e-4, f"subthreshold swing {S*1e3:.2f} mV/dec, n*kT/q*ln10 = {n*phit*math.log(10)*1e3:.2f}")
ok(abs(vov_eff(2, ks, True) - 2) < 1e-9, "far above threshold the smoothing changes nothing")

# 4. small-signal and speed formulas
beta, vt, lam, vgs, vds = 1e-3, .7, .02, 1.2, 2.5
h = 1e-5
gm = (idd(beta, vt, lam, vgs + h, vds) - idd(beta, vt, lam, vgs - h, vds)) / (2 * h)
gds = (idd(beta, vt, lam, vgs, vds + h) - idd(beta, vt, lam, vgs, vds - h)) / (2 * h)
I = idd(beta, vt, lam, vgs, vds)
ok(abs(gm - 2 * I / .5) < 1e-9, f"gm = 2 ID / Vov = {gm*1e3:.4f} mS")
ok(abs(1 / gds - (1 / lam + vds) / I) < 1e-3, f"ro = (1/lambda + VDS)/ID = {1/gds/1e3:.3f} kOhm")
mu, L = .05, 1e-6
fT = 3 * mu * .5 / (4 * math.pi * L * L)
print(f"     fT for mu = 500 cm^2/Vs, L = 1 um, Vov = 0.5 V: {fT/1e9:.2f} GHz")
# Cox sanity: 2 nm of SiO2 is about 17 fF/um^2
ok(abs(cox(2) * 1e3 - 17.27) < .02, f"Cox(2 nm) = {cox(2)*1e3:.2f} fF/um^2")
# chip preset: 180 nm with tox 4 nm, mu 350 -> k' about 300 uA/V^2
print(f"     180 nm preset k'n = {350e-4 * cox(4) * 1e6:.0f} uA/V^2")
# textbook preset: tox chosen so k'n = 100 uA/V^2 with mu = 500
tox = eps0 * kox / (100e-6 / .05) * 1e9
print(f"     textbook tox = {tox:.3f} nm gives k'n = {500e-4 * cox(tox) * 1e6:.2f} uA/V^2")
