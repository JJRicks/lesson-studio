from sympy import *
x,y,z,l,m = symbols('x y z lambda mu', real=True)
def show(name, e):
    e = simplify(e); print(f"{name}: {e}  ≈ {N(e, 8)}")

print("== Lesson 22: Lagrange ==")
# Ex1
f = x**2+4*y**2-2*x+8*y; g = x+2*y-7
sol = solve([diff(f,x)-l*diff(g,x), diff(f,y)-l*diff(g,y), g],[x,y,l],dict=True); print("ex1", sol, [f.subs(s) for s in sol])
# Ex2
f = 7*x+4*y; g = x**2+y**2-32
sol = solve([diff(f,x)-l*diff(g,x), diff(f,y)-l*diff(g,y), g],[x,y,l],dict=True)
for s in sol: print("ex2", {k:(nsimplify(v), N(v,6)) for k,v in s.items()}, "f=", simplify(f.subs(s)), N(f.subs(s),8))
# Ex3
f = x**2+y**2+z**2; g = x+y+z-1
sol = solve([diff(f,v)-l*diff(g,v) for v in (x,y,z)]+[g],[x,y,z,l],dict=True); print("ex3", sol, [f.subs(s) for s in sol])
# Box
V = x*y*z; g = x*y+2*x*z+2*y*z-24
sol = solve([diff(V,v)-l*diff(g,v) for v in (x,y,z)]+[g],[x,y,z,l],dict=True)
print("box", [s for s in sol if all(s[v].is_positive for v in (x,y,z))], [simplify(V.subs(s)) for s in sol if all(s[v].is_positive for v in (x,y,z))])
# Bonus two constraints
f = x+2*y+3*z; g = x-y+z-1; h = x**2+y**2-1
sol = solve([diff(f,v)-l*diff(g,v)-m*diff(h,v) for v in (x,y,z)]+[g,h],[x,y,z,l,m],dict=True)
for s in sol: print("bonus", {k:simplify(v) for k,v in s.items()}, "f=", simplify(f.subs(s)), N(f.subs(s),6))
# Practice: max on disk
f = -9*x**2-4*x+3*y**2+5
print("practice interior", solve([diff(f,x),diff(f,y)],[x,y]), "boundary max", maximum((-12*x**2-4*x+80), x, Interval(-5,5)))
print("f(-1/6, sqrt(899)/6) =", simplify(f.subs({x:Rational(-1,6), y:sqrt(899)/6})))

print("== Lesson 23: rectangles ==")
show("prop1", -9*5+5*5)
show("prop2", integrate(integrate(3*x**2*y**2*cos(6*y**3),(y,-pi/6,pi/6)),(x,-4,3)))
show("fub1", integrate(integrate(2*x**2-7*x**2*y+2*y,(y,3,4)),(x,0,2)))
show("fub2", integrate(integrate(3*x**2*cos(6*y),(y,pi/4,1)),(x,0,pi/2)))
show("area", integrate(integrate(1,(y,0,2)),(x,0,3)))
show("avg", integrate(integrate(4*x+2*x**2*y**2-9*y**3,(y,1,2)),(x,-4,0))/4)
show("pr1", integrate(integrate(y**2*exp(x-7),(y,1,4)),(x,0,1)))
show("pr2", integrate(integrate(y*sqrt(6*x+7),(y,0,4)),(x,0,1)))
show("pr3", integrate(integrate(4*cos(x)+7*cos(y),(y,0,pi)),(x,0,pi/2))/(pi**2/2))

print("== Lesson 24: general regions ==")
show("prism typeI", integrate(integrate(3-x-y,(y,0,x)),(x,0,1)))
show("prism typeII", integrate(integrate(3-x-y,(x,y,1)),(y,0,1)))
inner = integrate(3*x**2+y**2,(x,y**2-3,y+3)); print("ex2 inner:", expand(inner))
show("ex2", integrate(inner,(y,-2,3)))
show("vol", integrate(integrate(16-4*x-y,(y,0,16-4*x)),(x,0,4)))
show("area", integrate(integrate(1,(y,1/(2*x),2*exp(x))),(x,1,7)))
A = integrate(integrate(1,(x,y-7,7-y)),(y,0,7)); I = integrate(integrate(9*x+5*y,(x,y-7,7-y)),(y,0,7)); show("avg area", A); show("avg integral", I); show("avg", I/A)
show("p1", integrate(integrate((6-3*x-y)/2,(y,0,6-3*x)),(x,0,2)))
show("p2", integrate(exp(x)-1/(6*x),(x,2,3)))
A = integrate(integrate(1,(x,y-14,14-y)),(y,0,14)); I = integrate(integrate(7*x+4*y,(x,y-14,14-y)),(y,0,14)); show("p3", I/A)
