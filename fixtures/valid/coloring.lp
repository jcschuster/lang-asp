% Graph colouring with choice rules, integrity constraints and #show.
#const n = 3.

node(1..6).
edge(1,2). edge(1,3). edge(2,4). edge(3,5). edge(4,6). edge(5,6).
color(1..n).

{ assign(N,C) : color(C) } = 1 :- node(N).
:- edge(N,M), assign(N,C), assign(M,C).

#show assign/2.
