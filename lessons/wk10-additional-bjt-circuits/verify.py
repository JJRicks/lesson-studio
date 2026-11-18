"""Every answer on the page, worked the course's way (V_BE = 0.7 V, r_e' = 25 mV / I_E, the large-beta shortcut
I_B = I_E / beta and Z_in(base) = beta (r_e' + r_e)), with the exact beta + 1 versions alongside.
Run: python3 lessons/wk10-additional-bjt-circuits/verify.py"""

VBE, VT = 0.7, 0.025
par = lambda *r: 1 / sum(1 / x for x in r)
bad = []


def check(name, v, lo=None, hi=None):
    ok = lo is None or lo <= abs(v) <= hi
    if not ok:
        bad.append(name)
    print(f"  {name:<44} {v:>14.6g}" + ("" if lo is None else f"   hint {lo} to {hi}: {'OK' if ok else '*** OUT OF RANGE'}"))
    return v


print("Problem 1 · emitter follower: Vin(dc) = 6.1 V, beta = 110, RE = 2.7k, RL = 360 (through C1)")
VE = 6.1 - VBE
IE = VE / 2700
re1 = check("re1 = RE || RL (ohm)", par(2700, 360))
rp1 = check("re1' = 25 mV / IE (ohm)", VT / IE)
check("VE (V)", VE); check("IE (mA)", IE * 1e3)
check("Zin = beta (re1' + re1) (kohm)", 110 * (rp1 + re1) / 1e3)
check("  exact (beta + 1)(re1' + re1) (kohm)", 111 * (rp1 + re1) / 1e3)
check("AV = re1 / (re1 + re1')", re1 / (re1 + rp1), 0.95, 0.99)

print("\nProblem 2 · cascade: VC1 = 5.9 V, AV(CE) = -144, RE2 = 1.5k, RL = 150 (through C2)")
IE2 = (5.9 - VBE) / 1500
re2 = check("re2 = RE2 || RL (ohm)", par(1500, 150))
rp2 = check("re2' = 25 mV / IE2 (ohm)", VT / IE2)
check("IE2 (mA)", IE2 * 1e3)
Acc = check("AV(CC) = re2 / (re2 + re2')", re2 / (re2 + rp2))
check("AV(total) = -144 AV(CC)", -144 * Acc, 132, 142)

print("  why the follower is there (the homework's own Q1, worked the same way):")
VB1 = 10 * 1000 / 5700
IE1 = (VB1 - VBE) / 1000
rp1q = VT / IE1
check("  VB1 (V)", VB1); check("  IE1 (mA)", IE1 * 1e3); check("  VC1 = 10 - IE1 RC (V)", 10 - IE1 * 3900)
check("  re1' of Q1 (ohm)", rp1q)
check("  CE gain, no load: -RC / re1'", -3900 / rp1q)
check("  CE gain, 150 ohm load hung on the collector", -par(3900, 150) / rp1q)
check("  beta that makes -144 (Zin of Q2 needed)", (1 / (1 / (144 * rp1q) - 1 / 3900)) / (rp2 + re2))

print("\nProblem 3 · Darlington: Vin = 8 V, beta = 120 each, Rload = 10")
Vout3 = 8 - 2 * VBE
IE23 = Vout3 / 10
check("Vout (V)", Vout3); check("IE2 = load current (A)", IE23)
check("Iin = IE2 / (beta1 beta2) (uA)", IE23 / 120 ** 2 * 1e6)
check("  exact IE2 / ((beta1 + 1)(beta2 + 1)) (uA)", IE23 / 121 ** 2 * 1e6)
check("  IB2 = IE1, shortcut (mA)", IE23 / 120 * 1e3)
check("  IB2 = IE1, exact (mA)", IE23 / 121 * 1e3)
check("  VCE1 = 12 - (8 - 0.7) (V)", 12 - (8 - VBE)); check("  VCE2 = 12 - Vout (V)", 12 - Vout3)

print("\nProblem 4 · regulator: Vref = 4.0 V, R1 = 10k (out to -), R2 = 20k (- to ground), Rload = 10, beta 80 then 110")
Vout4 = check("Vout = 4 (1 + R1/R2) (V)", 4.0 * (1 + 10e3 / 20e3))
IL = check("IRload (A)", Vout4 / 10)
Idiv = check("  divider current (mA)", Vout4 / 30e3 * 1e3)
IE24 = IL + Idiv / 1e3
check("  IE2 = IRload + Idiv (A)", IE24)
check("Iout(U1) = IE2 / (110 * 80) (uA)", IE24 / (110 * 80) * 1e6, 65, 75)
check("  exact IE2 / (111 * 81) (uA)", IE24 / (111 * 81) * 1e6, 65, 75)
check("  ignoring the divider, shortcut (uA)", IL / (110 * 80) * 1e6, 65, 75)
check("  U1 output voltage = Vout + 1.4 (V)", Vout4 + 2 * VBE)
check("  Q2 heat = (12 - Vout) IE2 (W)", (12 - Vout4) * IE24)
check("  load power (W)", Vout4 * IL)
check("  overall current gain IL / Iout", IL / (IE24 / (110 * 80)))

print("\nInteractive practice values (must not reproduce a homework answer):")
# hero: a 10k source, 100 ohm load; one follower (beta 100, IE 10 mA, RE 470) or a Darlington
Rs, RL, b = 10e3, 100, 100
re = par(470, RL)
direct = RL / (Rs + RL)
z1 = b * (VT / 10e-3 + re)
one = z1 / (Rs + z1) * re / (re + VT / 10e-3)
z2 = b * b * (VT / 10e-3 + re)
two = z2 / (Rs + z2) * re / (re + 2 * VT / 10e-3)
check("  hero direct share", direct); check("  hero one follower share", one); check("  hero Darlington share", two)

print("\n" + ("ALL HINT CHECKS PASS" if not bad else "OUT OF RANGE: " + ", ".join(bad)))
