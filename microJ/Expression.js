"use strict";
var tok     //current Token
var tokens  //Token.list()
function match(k) {
    if (tok.kind == k) 
        tok = tokens.pop();
    else expected(k);
}
function expected(s) {
    error(s+" expected -- "+tok+" found");
}
function error(s) {
    throw ("At index "+tok.index+": "+s);
}
function showError(elt) {
    elt.selectionStart = tok.index
    elt.selectionEnd = tok.index + tok.length
    elt.focus(); 
}

class Constant {
   constructor(num) { this.num = num; }
   fValue() { return this.num; }
   toTree() { return this.num+'\n'; }
   toPostfix() { return this.num+' '; }
   toString() { return this.num.toString(); }
}
class Binary {
   constructor(left, oper, right) {
      this.left = left; this.oper = oper; this.right = right;
   }
   fValue() {
      switch (this.oper) {
      case PLUS:  return this.left.fValue()+this.right.fValue();
      case MINUS: return this.left.fValue()-this.right.fValue();
      case STAR:  return this.left.fValue()*this.right.fValue();
      case SLASH: 
         let v = this.right.fValue();
         if (v == 0) 
            throw ("Division by zero");
         return this.left.fValue()/v;
      default: return NaN;
      }
   }
   toTree() {
      return this.oper+'\n'+this.left.toTree()+this.right.toTree()
   }
   toPostfix() {
      return this.left.toPostfix()+this.right.toPostfix()+this.oper+' '
   }
   toString() {
      return '('+this.left + this.oper + this.right+')'
   }
}

function binary(e) {
    let op = tok.kind; match(op);
    return new Binary(e, op, term());
}
function expression() {
    let e = (tok.kind == MINUS)?
      binary(new Constant(0)) : term();
    while (tok.kind == PLUS || tok.kind == MINUS) 
      e = binary(e);
    return e;
}
function term() {
    let e = factor();
    while (tok.kind == STAR || tok.kind == SLASH) {
        let op = tok.kind; match(op);
        e = new Binary(e, op, factor());
    }
    return e;
}
function factor() {
    switch (tok.kind)  {
    case NUMBER:
      let c = tok.val;
      match(NUMBER);
      return new Constant(c);
    case LEFT:
      match(LEFT); 
      let e = expression();
      match(RIGHT); return e;
    default: expected("Factor");
    }
    return null;
}

