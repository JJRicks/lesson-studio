"""Check every number on the page before writing it.

Example 1: the angle between a = <1,2,2> and b = <2,0,1>.
The angle is computed four independent ways so a slip in one shows up as a disagreement.
Every other number the page or the 3D scene shows is computed here too.
"""
from math import acos, atan2, degrees, isclose, pi, sqrt

from sympy import Matrix, N, Rational, acos as sacos, simplify, sqrt as ssqrt

a = Matrix([1, 2, 2])
b = Matrix([2, 0, 1])

# Step 2: multiply matching components and add
parts = [a[i] * b[i] for i in range(3)]
dot = sum(parts)
assert parts == [2, 0, 2] and dot == 4 and dot == a.dot(b)
print("a.b parts:", parts, "sum:", dot)

# Steps 3 and 4: lengths, by Pythagoras twice
floor_a = ssqrt(a[0] ** 2 + a[1] ** 2)           # floor diagonal under a
len_a = ssqrt(floor_a ** 2 + a[2] ** 2)          # then rise to the tip
len_b = ssqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2)
assert floor_a == ssqrt(5) and len_a == 3 and len_a == a.norm()
assert len_b == ssqrt(5) and len_b == b.norm()
print("|a| =", len_a, " floor diagonal under a =", floor_a, " |b| =", len_b, "=", N(len_b, 6))

# Step 5: the cosine, as a formula and as shadow over hypotenuse
cos_t = Rational(dot) / (len_a * len_b)
assert simplify(cos_t - 4 / (3 * ssqrt(5))) == 0
assert simplify(cos_t - 4 * ssqrt(5) / 15) == 0
shadow = Rational(dot) / len_a                   # length of b's shadow along a
assert shadow == Rational(4, 3)
assert simplify(shadow / len_b - cos_t) == 0
print("cos t =", cos_t, "=", N(cos_t, 8))
print("shadow of b on a =", shadow, "=", N(shadow, 6))

# Step 6 and the answer
theta = sacos(cos_t)
t_deg, t_rad = float(N(theta * 180 / pi, 12)), float(N(theta, 12))
print(f"theta (arccos) = {t_deg:.6f} deg = {t_rad:.6f} rad")

# Independent route 1: the cross product gives sin, then atan2
cross = a.cross(b)
assert list(cross) == [2, 3, -4] and cross.dot(cross) == 29
t2 = degrees(atan2(sqrt(29), 4))
print(f"theta (atan2 of |a x b| and a.b) = {t2:.6f} deg, a x b = {list(cross)}")

# Independent route 2: law of cosines on the triangle with sides |a|, |b|, |a-b|
c2 = (a - b).dot(a - b)
assert c2 == 6
t3 = degrees(acos((9 + 5 - 6) / (2 * 3 * sqrt(5))))
print(f"theta (law of cosines, |a-b|^2 = {c2}) = {t3:.6f} deg")

# Independent route 3: pure floating point, no SymPy
ax, ay, az, bx, by, bz = 1.0, 2.0, 2.0, 2.0, 0.0, 1.0
t4 = degrees(acos((ax * bx + ay * by + az * bz) / (sqrt(ax * ax + ay * ay + az * az) * sqrt(bx * bx + by * by + bz * bz))))
print(f"theta (floats) = {t4:.6f} deg")
assert all(isclose(t_deg, t, abs_tol=1e-9) for t in (t2, t3, t4))
assert round(t_deg, 1) == 53.4 and round(t_rad, 2) == 0.93 and round(float(N(cos_t)), 3) == 0.596

# Geometry used by the 3D scene: foot of the perpendicular from b's tip onto a's line, and the perpendicular's length
foot = a * Rational(dot, 9)
drop = b - foot
assert foot == Matrix([Rational(4, 9), Rational(8, 9), Rational(8, 9)]) and drop.dot(a) == 0
assert simplify(drop.norm() - ssqrt(29) / 3) == 0
print("foot =", list(foot), "=", [round(float(v), 4) for v in foot], " drop length =", N(drop.norm(), 6))

# Camera that looks straight down the plane's normal, so the angle shows at true size (a uniform scale keeps it true)
nx, ny, nz = -2, -3, 4                           # -(a x b), the side of the plane facing up
p = atan2(nz, sqrt(nx * nx + ny * ny))
y = atan2(ny, nx)
print(f"face-on camera: y = {y:.4f}, p = {p:.4f}")

# The Quick check on the page, and the default vectors in the explorers (they must differ from the example)
assert Matrix([1, 2, 3]).dot(Matrix([3, 0, -1])) == 0
ea, eb = Matrix([2, -1, 2]), Matrix([1, 2, 2])
assert ea.dot(eb) == 4 and ea.norm() == 3 and eb.norm() == 3
print(f"explorer default: a.b = 4, |a| = |b| = 3, cos = 4/9, theta = {degrees(acos(4 / 9)):.1f} deg")
print("\nExample 1 answer: theta = arccos(4/(3 sqrt 5)) =", f"{t_deg:.1f} deg, {t_rad:.2f} rad")
