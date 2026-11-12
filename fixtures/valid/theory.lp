% A difference-logic style theory with operator and atom definitions.
#theory dl {
  term { - : 1, unary; + : 2, binary, left; * : 3, binary, right };
  constant { - : 1, unary };
  &diff/0 : term, {<=, <}, constant, any;
  &show/0 : term, directive;
  &dom/1 : term, head
}.

task(a; b).
&diff { end(T) - start(T) } <= -5 :- task(T).
&diff { start(b) - end(a) } < 0.
&show { start(T) : task(T); end(T) }.
&dom(x) { 1..3 }.
:- &diff { (a, b) - [1, 2] } <= 0, not done.
