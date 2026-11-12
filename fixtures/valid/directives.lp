% Directives other than rules.
#const width = 2*3+1.
#const mode = fast. [override]
#defined reached/1.
#external fluent(X) : candidate(X). [false]
#project chosen/1.
#project picked(X) : candidate(X).
#heuristic chosen(X) : candidate(X). [10@2, true]
#heuristic picked(X). [1, sign]
#edge (X,Y) : arc(X,Y).
#edge (a,b; b,c).
candidate(1..3).
arc(1,2).
{ chosen(X) : candidate(X) }.
picked(X) :- chosen(X), not reached(X).
#show.
#show chosen/1.
