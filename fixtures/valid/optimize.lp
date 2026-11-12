% Optimisation: #minimize, #maximize and weak constraints.
item(a,3,10). item(b,4,40). item(c,2,30). item(d,5,50).
capacity(9).

{ take(I) : item(I,_,_) }.
:- #sum { W,I : take(I), item(I,W,_) } > C, capacity(C).

#maximize { V@2,I : take(I), item(I,_,V) }.
#minimise { 1@1,I : take(I) }.
:~ take(a), take(b). [5@1]
:~ take(I), item(I,W,_), W > 4. [W@0, I]
