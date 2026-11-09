"""Every answer on the page, solved here first. Lessons 25-27, Math 215."""
from sympy import *
import numpy as np
x,y,z,r,t,p,u = symbols('x y z r theta phi u', real=True)
rho = symbols('rho', positive=True)
ok = True
def show(name, e, expect=None):
    global ok
    e = simplify(e); line = f"{name}: {e}  ≈ {N(e, 9)}"
    if expect is not None:
        match = simplify(e-expect)==0; ok &= match; line += "   OK vs notes" if match else f"   *** notes say {expect}"
    print(line)

print("== Lesson 25 ==")
show("25-1 2θr over polar rectangle", integrate(integrate(2*t*r*r,(r,1,7)),(t,2*pi/3,3*pi/2)))
print("   θ part", simplify(integrate(2*t,(t,2*pi/3,3*pi/2))), " r part", integrate(r**2,(r,1,7)))
show("25-2 x+y half ring", integrate(integrate((r*cos(t)+r*sin(t))*r,(r,1,2)),(t,pi/2,3*pi/2)))
print("   cos part", integrate(cos(t),(t,pi/2,3*pi/2)), " sin part", integrate(sin(t),(t,pi/2,3*pi/2)), " r part", integrate(r**2,(r,1,2)))
show("25-3 cardioid", integrate(integrate(r**2*sin(t)*r,(r,0,1+cos(t))),(t,0,pi)))
Rv = sqrt(2)/3
show("25-4 paraboloid quarter", integrate(integrate((2-9*r**2)*r,(r,0,Rv)),(t,0,pi/2)))
print("   rim radius", Rv, "  r integral", integrate((2-9*r**2)*r,(r,0,Rv)))
A = integrate(Rational(1,2)*(-6*sin(4*t))**2,(t,0,3*pi/2)); show("25-5 rose area", A)
print("   one petal", simplify(integrate(Rational(1,2)*(-6*sin(4*t))**2,(t,0,pi/4))))
# independent check of the rose: fill a pixel grid from the actual plotted petals (negative r flips through the origin)
N_grid=1400; L=6.2; xs=(np.arange(N_grid)+.5)/N_grid*2*L-L; X,Y=np.meshgrid(xs,xs)
R=np.hypot(X,Y); TH=np.mod(np.arctan2(Y,X),2*np.pi); inside=np.zeros_like(X,bool)
for k in range(6):                         # the six θ-intervals of length π/4 inside [0,3π/2]
    a=k*np.pi/4; b=a+np.pi/4
    # at θ in (a,b) r=-6 sin4θ.  negative r plots at θ+π.
    if k%2==0: a0=(a+np.pi); ang=np.mod(TH-a0,2*np.pi); c=(ang<np.pi/4); rr=6*np.abs(np.sin(4*(a+ang)))
    else: ang=np.mod(TH-a,2*np.pi); c=(ang<np.pi/4); rr=6*np.abs(np.sin(4*(a+ang)))
    inside|=c&(R<=rr)
pix=(2*L/N_grid)**2; print(f"   pixel-count area of the traced petals = {inside.sum()*pix:.3f} vs {float(27*pi/2):.3f}")
print("   Lesson 25 practice:")
show("  P1 7y", integrate(integrate(7*r*sin(t)*r,(r,6,9)),(t,pi,2*pi)), -2394)
show("  P2 rose", integrate(integrate(r,(r,0,8*sin(2*t))),(t,0,pi/2)), 8*pi)
show("  P3 cone", integrate(integrate(r*r,(r,0,2/sqrt(3))),(t,0,2*pi)), 16*pi*sqrt(3)/27)

print("== Lesson 26 ==")
i1=integrate(x+y*z**2,(x,1,5)); i2=integrate(i1,(y,2,4)); i3=integrate(i2,(z,0,1)); print("26-1 inner",i1," middle",expand(i2)); show("26-1", i3)
ex=integrate(exp(2*x),(x,0,log(3))); ey=integrate(y**2,(y,1,2)); ez=integrate(z**3,(z,-3,-2)); print("26-2 parts",ex,ey,ez); show("26-2", ex*ey*ez)
i1=integrate(5*x-3*y,(z,0,1-x-y)); i2=integrate(i1,(y,0,1-x)); print("26-3 inner",expand(i1)," middle",factor(i2),expand(i2)); show("26-3", integrate(i2,(x,0,1)))
i1=integrate(1,(z,0,4*x**2+4*y**2+4)); i2=integrate(i1,(y,0,2)); print("26-4 inner",i1," middle",i2); show("26-4", integrate(i2,(x,0,3)))
T=x*y+8*x+20; V=integrate(1,(z,0,1-x-y),(y,0,1-x),(x,0,1)); print("26-5 V",V)
i1=integrate(T,(z,0,1-x-y)); i2=integrate(i1,(y,0,1-x)); print("26-5 inner",expand(i1)," middle",factor(i2)," ",expand(i2)); It=integrate(i2,(x,0,1)); print("26-5 integral",It); show("26-5 average", It/V)
print("   pieces: xy",integrate(x*y,(z,0,1-x-y),(y,0,1-x),(x,0,1))," x",integrate(x,(z,0,1-x-y),(y,0,1-x),(x,0,1)))
print("   Lesson 26 practice:")
show("  P1", integrate(7*y*z**2/(5*x**3),(x,1,3),(y,2,3),(z,1,2)), Rational(98,27))
show("  P2 z-top check", (252-4*x-7*y)/9-(28-4*x/9-7*y/9), 0); show("  P2 y-top", (252-4*x)/7-(36-4*x/7), 0)
print("   P2 value (not asked):", integrate(9*x+4*y,(z,0,28-4*x/9-7*y/9),(y,0,36-4*x/7),(x,0,63)))
show("  P3 avg", integrate(x**2*y*z**2,(x,0,6),(y,0,6),(z,0,6))/216, 432)

print("== Lesson 27 ==")
print("27-1 parts z",integrate(z,(z,0,4))," θ",integrate(sin(t),(t,0,pi/2))," r",integrate(r**2,(r,0,2)))
show("27-1", integrate(z*r*sin(t)*r,(r,0,2),(t,0,pi/2),(z,0,4)))
h=r*cos(t)+2; i1=integrate(r/h,(z,0,h)); print("27-2 inner",simplify(i1)); show("27-2", integrate(simplify(i1),(r,0,2),(t,0,pi/2)))
print("27-3 parts ρ",integrate(rho**2,(rho,0,1))," φ",integrate(sin(p),(p,0,pi/2))," θ",2*pi)
show("27-3", integrate(rho**2*sin(p),(rho,0,1),(p,0,pi/2),(t,0,2*pi)))
print("27-4 parts ρ",integrate(5*rho**4,(rho,0,1))," φ",integrate(sin(p),(p,0,pi/2))," θ",pi)
show("27-4", integrate(5*rho**2*rho**2*sin(p),(rho,0,1),(p,0,pi/2),(t,0,pi)))
print("   Lesson 27 practice:")
show("  P1", integrate(5*r**2*r,(z,0,2-r*cos(t)),(t,0,pi/2),(r,0,2)), 20*pi-32)
print("   P2 value (not asked):", simplify(integrate(-6*rho**2*sin(p),(rho,0,sqrt(33)),(p,0,pi/2),(t,0,2*pi))))

# Riemann sums the page shows
print("== numeric cross-checks ==")
def ball(n):   # spherical-box midpoint sum for the unit ball
    dr=1/n; dp=np.pi/(2*n); dt=2*np.pi/(4*n); s=0
    for i in range(n):
        for j in range(2*n):
            s+=((i+.5)*dr)**2*np.sin((j+.5)*dp)*dr*dp*dt*4*n
    return s
for n in (3,6,12): print("  unit ball, spherical midpoint sum n=",n, round(ball(n),5), " true",round(4*np.pi/3,5))
def tet_mc(f,n=4_000_000):  # average of f over the tetrahedron, sampled uniformly
    g=np.random.default_rng(7); a=g.random((n,3)); a=a[a.sum(1)<=1]; return f(a[:,0],a[:,1],a[:,2]).mean()
print("  26-3 sampled", round(tet_mc(lambda x,y,z:5*x-3*y)/6,5), "vs", round(1/12,5))
print("  26-5 sampled avg", round(tet_mc(lambda x,y,z:x*y+8*x+20),4), "vs", 441/20)
print("  27-2 monte carlo", end=" ")
g=np.random.default_rng(3); a=g.random((3_000_000,3))*[2,2,4]; m=(a[:,0]**2+a[:,1]**2<=4)&(a[:,2]<=a[:,0]+2); print(round((1/(a[m,0]+2)).sum()/3_000_000*16,4),"vs",round(float(pi),4))
print("ALL NOTES ANSWERS MATCH" if ok else "*** A NOTES ANSWER DISAGREES ***")
