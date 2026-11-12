% Terms: arithmetic at every precedence level, pools, tuples, intervals,
% external functions, strings and special constants.
p(1..3; 5).
p(X+1) :- p(X), X < 3.
q(-2**2, 2**3**4, 7\3, 7/2, 1-2-3, ~5, 3^5?6&7).
q(0x1F, 0b101, 0o17, 0).
r((1,2), (a,), (), "a \"quoted\" string\n", #inf, #supremum, #sup, #infimum).
s(@succ(1), @pi).
t(f(X;Y), g(;)) :- p(X), p(Y).
u(X) :- X = |-3|.
v(X) :- X = #count { Y : p(Y) }.
w :- 1 < 2 <= 3 != 4, 5 <> 6, 7 >= 7, 8 > 1.
