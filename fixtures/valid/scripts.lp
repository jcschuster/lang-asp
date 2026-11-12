#script (python)
import clingo

def succ(n):
    return clingo.Number(n.number + 1)
#end.

#script (lua)
function pi()
  return clingo.Number(3)
end
#end.

p(@succ(1)).
q(@pi).
