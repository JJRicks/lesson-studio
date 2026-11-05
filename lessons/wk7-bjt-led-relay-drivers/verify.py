"""Every number on the page comes from here.

Hand design (problems 1, 3, 5) uses the homework's approximations: VBE = 0.7 V, VCE(sat) = 0, beta_min = 10.
Simulations (problems 2, 4, 6) solve what LTspice's DC operating point solves: the standard.bjt Gummel-Poon models for
the 2N3904 and 2N3906 (with their RB, RC, RE), the homework's WhiteLED and GreenLED diode models (with RS),
at 27 C, by Newton iteration on Kirchhoff's current law. LTspice adds gmin = 1e-12 S across junctions, which changes
nothing at these currents, so the last printed digit may differ by one.
"""
import math
import numpy as np
from scipy.optimize import fsolve

K, Q = 1.380649e-23, 1.602176634e-19
VT = K * 300.15 / Q                      # 27 C, LTspice's default
E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]

Q2N3904 = dict(IS=1e-14, BF=300, BR=4, VAF=100, IKF=0.4, RB=20, RC=0.1, RE=0.1)
Q2N3906 = dict(IS=1e-14, BF=200, BR=4, VAF=100, IKF=0.4, RB=20, RC=0.1, RE=0.1)
WHITE = dict(IS=93.1e-12, N=6.45, RS=42e-3)
GREEN = dict(IS=93.2e-12, N=5.43, RS=42e-3)


def neighbours(r):
    """the two E24 values either side of r"""
    dec = 10 ** math.floor(math.log10(r))
    vals = sorted({round(m * d, 10) for d in (dec / 10, dec, dec * 10) for m in E24})
    lo = max(v for v in vals if v <= r + 1e-9)
    hi = min(v for v in vals if v >= r - 1e-9)
    return lo, hi


def pick(r):
    """the closer neighbour by plain difference, as the homework's 2.1k example does; None on a tie"""
    lo, hi = neighbours(r)
    if lo == hi:
        return lo
    if abs(r - lo) < abs(hi - r) - 1e-9:
        return lo
    if abs(hi - r) < abs(r - lo) - 1e-9:
        return hi
    return None


def gp(vbe, vbc, m):
    """Gummel-Poon DC currents into the intrinsic collector and base (npn sense), ISE = ISC = 0, VAR = IKR = infinity"""
    If = m["IS"] * math.expm1(vbe / VT)
    Ir = m["IS"] * math.expm1(vbc / VT)
    q1 = 1 / (1 - vbc / m["VAF"])
    qb = q1 / 2 * (1 + math.sqrt(1 + 4 * If / m["IKF"]))
    ic = (If - Ir) / qb - Ir / m["BR"]
    ib = If / m["BF"] + Ir / m["BR"]
    return ic, ib


def led_v(i, d):
    """forward voltage at current i, including the series resistance RS"""
    return d["N"] * VT * math.log1p(i / d["IS"]) + i * d["RS"]


def bisect(fn, lo, hi, n=200):
    """root of fn between lo and hi, where fn(lo) and fn(hi) differ in sign"""
    flo = fn(lo)
    assert flo * fn(hi) < 0, (lo, hi)
    for _ in range(n):
        mid = (lo + hi) / 2
        fm = fn(mid)
        if fm * flo > 0:
            lo, flo = mid, fm
        else:
            hi = mid
    return (lo + hi) / 2


def npn_driver(vin, vcc, r1, rload, m=Q2N3904, led=None):
    """vin - R1 - base, vcc - rload - (LED) - collector, emitter to ground. Returns VCE, IB, IC at the pins.
    For a trial intrinsic VBC, the base loop fixes VBE (bisection); the collector loop then fixes VBC (bisection)."""
    if vin <= 0:
        return dict(VCE=vcc, IB=0.0, IC=0.0, beta=float("nan"), VBE=0.0, Vled=0.0, vbe_int=0.0, vbc_int=-vcc)
    def pins(vbe, vbc):
        ic, ib = gp(vbe, vbc, m)
        ie = ic + ib
        return ic, ib, ic * m["RC"] + (vbe - vbc) + ie * m["RE"], ib * m["RB"] + vbe + ie * m["RE"]
    def vbe_for(vbc):
        return bisect(lambda vbe: vin - pins(vbe, vbc)[1] * r1 - pins(vbe, vbc)[3], -3.0, 1.5)
    def collector(vbc):
        ic, ib, vce, _ = pins(vbe_for(vbc), vbc)
        drop = ic * rload + ((led_v(ic, led) if ic > 0 else -1.0) if led else 0.0)
        return vcc - drop - vce
    # above this VBC the reverse-biased-collector base current alone would need more than vin across R1
    vbc_hi = VT * math.log(vin * m["BR"] / (m["IS"] * (r1 + m["RB"]))) - 1e-4
    vbc = bisect(collector, -vcc - 1, vbc_hi)
    vbe = vbe_for(vbc)
    ic, ib, vce, vbe_pin = pins(vbe, vbc)
    assert abs(collector(vbc)) < 1e-9 and abs(vin - ib * r1 - vbe_pin) < 1e-9
    return dict(VCE=vce, IB=ib, IC=ic, beta=ic / ib, VBE=vbe_pin, Vled=led_v(ic, led) if led else 0.0, vbe_int=vbe, vbc_int=vbc)


def pnp_driver(vin, vcc, r1, r2, m=Q2N3906, led=GREEN):
    """vcc on the emitter, vin - R1 - base, collector - LED - R2 - ground.
    A pnp circuit is the npn circuit turned upside down: measure every voltage down from vcc and every current flips."""
    r = npn_driver(vcc - vin, vcc, r1, r2, m, led)
    return dict(VEC=r["VCE"], VC=vcc - r["VCE"], IB=-r["IB"], IC=-r["IC"], beta=r["IC"] / r["IB"] if r["IB"] else float("nan"), VEB=r["VBE"], Vled=r["Vled"])


def show(title, rows):
    print(f"\n{title}")
    for k, v in rows.items():
        print(f"  {k:10s} {v}")


# ---------------- problem 1: npn white LED driver, hand design ----------------
R2c = (5.0 - 3.2 - 0.0) / 20e-3
R1c = (3.3 - 0.7) / (20e-3 / 10)
P1 = dict(R2_calc=R2c, R2_nbrs=neighbours(R2c), R2_pick=pick(R2c), R1_calc=R1c, R1_pick=pick(R1c))
show("Problem 1 (hand design)", P1)
assert abs(R2c - 90) < 1e-9 and P1["R2_pick"] == 91 and abs(R1c - 1300) < 1e-6 and P1["R1_pick"] == 1300

# ---------------- problem 2: LTspice .op of that circuit ----------------
s2 = npn_driver(3.3, 5.0, 1300, 91, Q2N3904, WHITE)
show("Problem 2 (simulated, R1 = 1.3k, R2 = 91)", {k: f"{v:.6g}" for k, v in s2.items()})
assert 18e-3 < s2["IC"] < 22e-3

# ---------------- problem 3: pnp green LED driver, hand design ----------------
R2c3 = (5.0 - 0.0 - 2.7) / 20e-3
R1c3 = (5.0 - 0.7 - 0.0) / (20e-3 / 10)
P3 = dict(R2_calc=R2c3, R2_nbrs=neighbours(R2c3), R2_pick=pick(R2c3), R2_logdist=[math.log10(R2c3 / 110), math.log10(120 / R2c3)],
          R1_calc=R1c3, R1_nbrs=neighbours(R1c3), R1_pick=pick(R1c3))
show("Problem 3 (hand design)", P3)
assert abs(R2c3 - 115) < 1e-9 and P3["R2_pick"] is None and P3["R1_pick"] == 2200

# ---------------- problem 4: LTspice .op of that circuit, both tie choices ----------------
for r2 in (120, 110):
    s4 = pnp_driver(0.0, 5.0, 2200, r2)
    show(f"Problem 4 (simulated, R1 = 2.2k, R2 = {r2})", {k: f"{v:.6g}" for k, v in s4.items()})
    assert 18e-3 < -s4["IC"] < 22e-3

# ---------------- problem 5: npn relay driver, hand design ----------------
ICsat = 12.0 / 800
R1c5 = (3.3 - 0.7) / (ICsat / 10)
P5 = dict(IC_sat=ICsat, IB_target=ICsat / 10, R1_calc=R1c5, R1_nbrs=neighbours(R1c5), R1_pick=pick(R1c5))
show("Problem 5 (hand design)", P5)
assert abs(ICsat - 15e-3) < 1e-12 and P5["R1_pick"] == 1800

# ---------------- problem 6: LTspice .op with an 800 ohm coil ----------------
s6 = npn_driver(3.3, 12.0, 1800, 800, Q2N3904, None)
show("Problem 6 (simulated, R1 = 1.8k, coil = 800 ohm)", {k: f"{v:.6g}" for k, v in s6.items()})
assert 12e-3 < s6["IC"] < 18e-3

# ---------------- extras the page shows ----------------
print("\nLED forward voltage from the models at 20 mA")
for name, d in (("white", WHITE), ("green", GREEN)):
    print(f"  {name}: {d['N'] * VT * math.log(20e-3 / d['IS'] + 1) + 20e-3 * d['RS']:.4f} V")
print("\nwhite LED straight across 5 V, no resistor")
i = fsolve(lambda i: [WHITE["N"] * VT * math.log(i[0] / WHITE["IS"] + 1) + i[0] * WHITE["RS"] - 5.0], [10.0])[0]
print(f"  {i:.2f} A (the model's answer; a real LED burns out long before)")
print("\ncheck the mirror trick: off states")
for vin in (3.3, 4.0, 4.2, 4.4, 5.0):
    try:
        r = pnp_driver(vin, 5.0, 2200, 120)
        print(f"  pnp, vin = {vin}: IC = {r['IC'] * 1e3:.3f} mA, VEC = {r['VEC']:.3f}")
    except AssertionError:
        print(f"  pnp, vin = {vin}: solver needs other guesses")
