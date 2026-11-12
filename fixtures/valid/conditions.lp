% Conditional literals, disjunctions and negation.
a | b ; c :- d.
e : f, g ; h :- i.
j :- k : l, m ; n.
o :- not p, not not q, -r.
-s(1).
#true :- t.
u :- #false.
:- not #sum+ { 1 : v } >= 2.
w :- 1 #min { X : x(X) }, #max { X : x(X) } 3.
y :- z, #true.
