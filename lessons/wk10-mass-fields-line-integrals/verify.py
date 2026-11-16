"""Every answer on the page, solved here first. Lessons 28-30, Math 215."""
from sympy import *
x, y, z, t = symbols('x y z t', real=True)
tp = symbols('tp', positive=True)
ok = True


def show(name, e, expect=None):
    global ok
    e = simplify(e)
    line = f"{name}: {e}  ≈ {N(e, 8)}"
    if expect is not None:
        match = simplify(e - expect) == 0
        ok &= match
        line += "   OK vs notes" if match else f"   *** notes say {expect}"
    print(line)


def I2(f, X, Y):
    return integrate(integrate(f, (y, *Y)), (x, *X))


def I3(f, X, Y, Z):
    return integrate(integrate(integrate(f, (z, *Z)), (y, *Y)), (x, *X))


print("== Lesson 28 ==")
rho = 3 * y * sqrt(x)
show("28-1 mass, rho=3y sqrt x on [0,2]x[0,3]", I2(rho, (0, 2), (0, 3)))
print("   x part", integrate(sqrt(x), (x, 0, 2)), "  y part", integrate(3 * y, (y, 0, 3)))
show("28-2 My, rho=y on [3,4]x[4,5]", I2(x * y, (3, 4), (4, 5)))
print("   x part", integrate(x, (x, 3, 4)), "  y part", integrate(y, (y, 4, 5)))
rho = x * y**3
m, My, Mx = I2(rho, (0, 3), (0, 4)), I2(x * rho, (0, 3), (0, 4)), I2(y * rho, (0, 3), (0, 4))
print("28-3 rho=xy^3 on [0,3]x[0,4]:  m =", m, " My =", My, " Mx =", Mx)
show("   xbar = My/m", My / m); show("   ybar = Mx/m", Mx / m)
show("28-4 Ix, rho=x^2y^2 on [0,2]^2", I2(y**2 * x**2 * y**2, (0, 2), (0, 2)))
print("   x part", integrate(x**2, (x, 0, 2)), "  y part", integrate(y**4, (y, 0, 2)))
rho = 4 * x + 6 * y + 5 * z; B = ((0, 3), (0, 6), (0, 6))
m, Myz, Mxz, Mxy = I3(rho, *B), I3(x * rho, *B), I3(y * rho, *B), I3(z * rho, *B)
print("28-5 rho=4x+6y+5z on [0,3]x[0,6]x[0,6]:  m =", m, " Myz =", Myz, " Mxz =", Mxz, " Mxy =", Mxy)
show("   xbar", Myz / m); show("   ybar", Mxz / m); show("   zbar", Mxy / m)
print("   check: the plain box center is (1.5, 3, 3); heavier toward big x, y, z, so every coordinate should land past it")
print("   Lesson 28 practice:")
show("  P1 Iy (notes say 'about the x-axis'; Iy is about the y-axis)", I2(x**2 * 3 * y * sqrt(x), (0, 6), (0, 2)), 2592 * sqrt(6) / 7)
print("     (Ix would be", simplify(I2(y**2 * 3 * y * sqrt(x), (0, 6), (0, 2))), ")")
rho = x + 6 * y + 4 * z; B = ((0, 5), (0, 3), (0, 4)); m = I3(rho, *B)
show("  P2 xbar", I3(x * rho, *B) / m, Rational(305, 117))
show("  P2 ybar", I3(y * rho, *B) / m, Rational(45, 26))
show("  P2 zbar", I3(z * rho, *B) / m, Rational(266, 117))
print("     mass", m)

print("== Lesson 29 ==")
F = Matrix([4 * x / y, (-5 * x - 4 * y) / (x - 2 * y)])
print("29-1 F(1,-2) =", list(F.subs({x: 1, y: -2})))
print("29-2 F=<x/2,y/2> sample points:", [((a, b), (Rational(a, 2), Rational(b, 2))) for a, b in [(1, 0), (2, 0), (0, 2), (-2, -2), (2, 2)]])
print("29-3 classify: 2y i - 2x j fits a y i - a x j with a = 2 (rotational, clockwise); 2xy i - 5x j neither; 5x i + 5y j radial a = 5")
for name, G in [("2y,-2x", Matrix([2 * y, -2 * x])), ("2xy,-5x", Matrix([2 * x * y, -5 * x])), ("5x,5y", Matrix([5 * x, 5 * y]))]:
    print(f"   {name}: F·(x,y) = {simplify(G.dot(Matrix([x, y])))}   (x F2 - y F1) = {simplify(x * G[1] - y * G[0])}")
G = Matrix([y, -4 * x]); print("29-4a |<y,-4x>|^2 =", expand(G.dot(G)), " at (1,0):", sqrt(G.dot(G)).subs({x: 1, y: 0}), " at (0,1):", sqrt(G.dot(G)).subs({x: 0, y: 1}))
G = Matrix([y, -x]) / sqrt(x**2 + y**2); print("29-4b |F|^2 =", simplify(G.dot(G)))
f = 5 * x**4 * y**3 + x * y**4; print("29-5a grad =", [diff(f, v) for v in (x, y)])
f = 3 * cos(x) * sin(y); print("29-5b grad =", [diff(f, v) for v in (x, y)])
f = x**2 * y * z - sin(x * y); F = [2 * x * y * z - y * cos(x * y), x**2 * z - x * cos(x * y), x**2 * y]
d = [simplify(diff(f, v) - Fi) for v, Fi in zip((x, y, z), F)]; print("29-6 grad f - F =", d, " ->", "potential" if d == [0, 0, 0] else "NOT")
for name, P, Q in [("<3x^4y^5, 3x^5y^4>", 3 * x**4 * y**5, 3 * x**5 * y**4), ("<x^3 cos y, 3y cos x>", x**3 * cos(y), 3 * y * cos(x))]:
    print(f"29-7 {name}: Py = {diff(P, y)}, Qx = {diff(Q, x)}, equal: {simplify(diff(P, y) - diff(Q, x)) == 0}")
print("   <3x^4y^5,3x^5y^4> = grad(3/5 x^5 y^5)?", simplify(Matrix([diff(Rational(3, 5) * x**5 * y**5, v) for v in (x, y)]) - Matrix([3 * x**4 * y**5, 3 * x**5 * y**4])) == zeros(2, 1))
print("   Lesson 29 practice:")
f = -8 * y**3 * exp(-5 * x * z); g = [diff(f, v) for v in (x, y, z)]
want = [40 * y**3 * z * exp(-5 * x * z), -24 * y**2 * exp(-5 * x * z), 40 * x * y**3 * exp(-5 * x * z)]
match = all(simplify(a - b) == 0 for a, b in zip(g, want)); ok &= match; print("  P1 grad =", g, "  OK vs notes" if match else "  *** mismatch")


def cross3(P, Q, R):
    return [simplify(diff(P, y) - diff(Q, x)), simplify(diff(Q, z) - diff(R, y)), simplify(diff(R, x) - diff(P, z))]


c = cross3(4 * x * y, 4, 4 * y**2); print("  P2 <4xy,4,4y^2>: Py-Qx, Qz-Ry, Rx-Pz =", c, "-> not conservative (notes agree)" if any(c) else "-> could be")
c = cross3(3 * z, 3 * y**2, 3 * x); print("  P3 <3z,3y^2,3x>:  Py-Qx, Qz-Ry, Rx-Pz =", c, "-> could be conservative (notes agree); f = 3xz + y^3 works" if not any(c) else "-> not")

print("== Lesson 30 ==")


def scalar(f, r, a, b):
    sp = sqrt(sum(diff(c, t)**2 for c in r))
    return integrate(simplify(f.subs({x: r[0], y: r[1]}) * sp), (t, a, b))


def vec(F, r, a, b, vs=(x, y)):
    sub = dict(zip(vs, r))
    return integrate(simplify(sum(Fi.subs(sub) * diff(c, t) for Fi, c in zip(F, r))), (t, a, b))


show("30-1 scalar f=-3x-10 on (t,-3t-10), t in [2,4]", scalar(-3 * x - 10, (t, -3 * t - 10), 2, 4))
print("   speed", sqrt(1 + 9), "  integral of -3t-10:", integrate(-3 * t - 10, (t, 2, 4)))
e = scalar(4 * x * cos(y), (sin(t), t), pi / 6, pi / 3); show("30-2 scalar f=4x cos y on (sin t, t), t in [pi/6, pi/3]", e)
print("   by hand: (7 sqrt7 - 5 sqrt5)/6 =", N((7 * sqrt(7) - 5 * sqrt(5)) / 6, 10), "  numeric:", N(Integral(4 * sin(t) * cos(t) * sqrt(1 + cos(t)**2), (t, pi / 6, pi / 3)), 10))
r = (Rational(5, 2) * t**2 - 4, 2 * t**2 - 10, 5 + 0 * t)
show("30-3 arc length of <5t^2/2-4, 2t^2-10, 5>, t in [0,6]", integrate(sqrt(sum(diff(c, t)**2 for c in r)), (t, 0, 6)))
print("   speed", simplify(sqrt(sum(diff(c, t)**2 for c in r))), "  start", [c.subs(t, 0) for c in r], " end", [c.subs(t, 6) for c in r])
show("30-4 F=<-3x^2, y> on (t, t^2), t in [0,1]", vec((-3 * x**2, y), (t, t**2), 0, 1))
F = (x / (x**2 + y**2)**Rational(3, 2), y / (x**2 + y**2)**Rational(3, 2))
dot = simplify(sum(Fi.subs({x: 2 * tp**2, y: -5 * tp**2}) * diff(c, tp) for Fi, c in zip(F, (2 * tp**2, -5 * tp**2))))
show("30-5 F=<x,y>/(x^2+y^2)^(3/2) on (2t^2,-5t^2), t in [1,2]", integrate(dot, (tp, 1, 2)))
print("   integrand", dot, "  potential check (1/|r(1)| - 1/|r(2)|):", simplify(1 / sqrt(29) - 1 / (4 * sqrt(29))))
show("30-6 z dx + x dy + y dz on (t^2, sqrt t, t), t in [1,4]", vec((z, x, y), (t**2, sqrt(t), t), 1, 4, (x, y, z)))
print("   pieces z dx, x dy, y dz:", [integrate(a, (t, 1, 4)) for a in (t * 2 * t, t**2 / (2 * sqrt(t)), sqrt(t))])
r = (-3 * cos(t), -3 * sin(t)); n = (diff(r[1], t), -diff(r[0], t)); Fv = (-r[0], -r[1])
print("30-7 flux: n(t) =", n, " F(r(t)) =", Fv, " F·n =", simplify(Fv[0] * n[0] + Fv[1] * n[1]))
show("   flux of <-x,-y> across the radius-3 circle", integrate(Fv[0] * n[0] + Fv[1] * n[1], (t, 0, 2 * pi)))
print("   direction: r(0) =", [c.subs(t, 0) for c in r], " r(pi/2) =", [c.subs(t, pi / 2) for c in r], "-> counterclockwise, so n points outward")
show("30-8 circulation of <2y,-2x> around the unit circle ccw", vec((2 * y, -2 * x), (cos(t), sin(t)), 0, 2 * pi))
print("   Lesson 30 practice:")
e = vec((-24 * x**2 * y * z, -5 * z, -8 * x * y), (t, t**2, t**3), 0, 1, (x, y, z))
show("  P1 -24x^2yz dx - 5z dy - 8xy dz on (t,t^2,t^3)", e, 9)
print("     pieces:", [integrate(a, (t, 0, 1)) for a in (-24 * t**7, -10 * t**4, -24 * t**5)], " (running the curve backward would give +9)")
r = (t, t**2); n = (diff(r[1], t), -diff(r[0], t)); Fv = (-5 * r[1], 2 * r[0])
show("  P2 flux of <-5y,2x> across (t,t^2), right of travel", integrate(Fv[0] * n[0] + Fv[1] * n[1], (t, 0, 2)), -44)
show("  P3 circulation of <-y,x> unit circle ccw", vec((-y, x), (cos(t), sin(t)), 0, 2 * pi), 2 * pi)

print()
print("ALL PRINTED ANSWERS MATCH" if ok else "SOME PRINTED ANSWERS DISAGREE (see *** lines; each is explained on the page)")
