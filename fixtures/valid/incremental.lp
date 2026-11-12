#include <incmode>.

#program base.
at(0, start).

#program step(t).
{ move(t, X) : place(X) } 1.
at(t, X) :- move(t, X).
at(t, X) :- at(t-1, X), not moved(t).
moved(t) :- move(t, _).

#program check(t).
#external query(t).
:- query(t), not at(t, goal).

#show move/2.
#show -bad/1.
#show T : move(T, _).
