%* N queens. Block comments %* nest *% in clingo. *%
#const n = 8.

1 { queen(I,1..n) } 1 :- I = 1..n.
:- queen(I,J), queen(I',J), I < I'.
:- queen(I,J), queen(I',J'), I < I', |I-I'| == |J-J'|.
:- not 1 #count { I : queen(I,J) } 1, J = 1..n.

#show queen/2.
