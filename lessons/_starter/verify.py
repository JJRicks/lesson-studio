"""Check every answer on the page before writing it. Replace this with the lesson's real problems."""
from sympy import integrate, symbols

x, y = symbols("x y", real=True)
print("Example 1:", integrate(integrate(x + y, (y, 0, 1)), (x, 0, 1)))  # expect 1, as shown in the reveal and the answer key
