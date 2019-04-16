"use strict";
class Program extends Node {
   constructor(M) {
      super(); this.addAll(M); this.main = met;
      //if (m.nParams == 0) return; //main should have no params
      //m.list[0] = new Declaration(m.vars); m.nParams = 0;
   }
   run() { VM.start(this); }
   toString() { return "program "+this.main.name; }
}

class ReadStat {
   constructor(m, v) { this.msg = m; this.varx = v; }
   run() {
      let p = (this.msg? this.msg : "Input value");
      let s = prompt(p);
      if (s == null) throw "Input cancelled";
      try {
         VM.setValue(this.varx, Number(s)); 
      } catch(x) {
         console.log(x);
      }
   }
   toString() {
      const Q = '"';
      let s = (this.msg? Q+this.msg+Q : "");
      return "read "+s+this.varx;
   }
}

class WhileStat extends Node {
   constructor(c, A) { 
      super(); this.cond = c; this.addAll(A); 
   }
   run() {
      while (this.cond.isSatisfied()) VM.runBlock(this); 
   }
   toString() { return "while ("+this.cond+")"; }
}

class ForStat extends Node {
   constructor() { } //not implemented
   run() { } //not implemented
   toString() { return "not implemented"; }
}

class IfStat extends Node {
   constructor(c, A) { 
      super(); this.cond = c; this.addAll(A);
   }
   run() {
      let s = this;
      while (s.cond && !s.cond.isSatisfied()) {
         //console.log(s, false);
         if (s.elsePart) 
            s = s.elsePart;
         else return;
      }
      VM.runBlock(s); //run at most once
   }
   toString() { return "if ("+this.cond+")"; }
}

class ElseStat extends IfStat {
   constructor(c, A) { super(c, A); }
   run() { }
   toString() {
      if (this.cond == null) return "else";
      return "else if ("+this.cond+")"; 
   }
}

class Condition {
   constructor(e1, r, e2) { 
      this.left = e1; this.rel = r; this.right = e2;
   }
   isSatisfied() {
      let v1 = this.left.fValue();
      let v2 = this.right.fValue();
      switch (this.rel) {
      case REL_EQ: return (v1 == v2);
      case REL_NE: return (v1 != v2);
      case REL_LT: return (v1 <  v2);
      case REL_LE: return (v1 <= v2);
      case REL_GT: return (v1 >  v2);
      case REL_GE: return (v1 >= v2);
      }
      throw "illegal relation: "+this.rel;
   }
   toString() { 
      return this.left+" "+this.rel+" "+this.right; 
   }
}

class Invocation { //String name; Expression[] exp; 
   constructor(m, e) { 
      this.met = m; this.exp = e; 
   }
   fValue() { 
      let v = this.exp.map(e => e.fValue())
      if (typeof(this.met) == "string") //Math
         return Math[this.met].apply(null, v)
      //else mJ method
      VM.invokeMethod(this.met, v);
      //console.log(this.met+" invoked");
      return VM.returnValue;
   }
   run() { this.fValue(); }
   toString() {
     let n = this.met.name? this.met.name : this.met;
     let s = this.exp? this.exp.join(', ') : '';
     return n+"("+s+")";
   }
}

class Return { //Expression exp; 
   constructor(e) { 
      this.exp = e; 
   }
   run() { 
      let v = this.exp? this.exp.fValue() : 0;
      VM.returnValue = v;
      throw v; //default 0
   }
   toString() {
      let s = this.exp? " "+this.exp : "";
      return "return" + s;
   }
}

//microJ2 Parser
var prevIf = null;  //global
const MATH  = Object.getOwnPropertyNames(Math)
       .filter(x => typeof Math[x] == "function")
function program() {
   metST.clear();
   for (let m of MATH) metST.set(m, m)
   let L = []
   do { //at least one
     let m = method()
     console.log(m); display(m);
     L.push(m); 
   } while (tok != EOF);
   return new Program(L);
}
function statement() { //redefined
   switch (tok.kind)  {
   case IDENT:  return assignment3();
   case PRINTLN: 
   case PRINT:  return printStat(); 
   case READ:   return readStat(); 
   case WHILE:  return whileStat(); 
   case IF:     return ifStat();
   case ELSE:   return elseStat();
   case RETURN: return returnStat(); 
   default: expected("Statement");
   }
   return null;
}
function readStat() {
   match(READ); let msg = null;
   if (tok.kind == LITERAL) {
      msg = tok.val; match(LITERAL); 
   }
   if (tok == COMMA) match(COMMA);
   let v = variable();
   match(SEMICOL);
   return new ReadStat(msg, v);
}
function whileStat() {
   match(WHILE); 
   return new WhileStat(condition(), block()); 
}
function ifStat() {
   match(IF);
   let c = condition(); 
   let b = block();  
   let elseFollows = (tok.kind == ELSE);
   let s = new IfStat(c, b);
   if (elseFollows) prevIf = s;
   return s;
}
function elseStat() {
   if (!prevIf) error("invalid else");
   match(ELSE);
   let c = null;
   if (tok.kind == IF) {
      match(IF); c = condition(); 
   }
   let pp = prevIf
   prevIf = null; //for block() below
   let b = block();  
   let elseFollows = (c !=null && tok.kind == ELSE);
   let s = new ElseStat(c, b);
   pp.elsePart = s;
   if (elseFollows) prevIf = s;
   return s;
}
function condition() {
   const REL = [REL_EQ, REL_NE, REL_LT, REL_LE, REL_GT, REL_GE]
   match(LEFT); 
   let e1 = expression(), r = tok.kind;
   if (!REL.includes(r)) 
      expected("Relation");
   match(r);
   let e2 = expression(); 
   match(RIGHT);
   return new Condition(e1, r, e2);
}
function block() {
   let a = [];
   match(BEGIN);
   if (tok != END) a = statList();
   match(END);
   return a; 
}

//microJ3 Parser
function isInvocation() {
   //first check variables, then methods
   if (met.vars.indexOf(tok.val) >= 0) return false;
   return (metST.get(tok.val) != null);
}
function assignment3() {
   if (!isInvocation()) 
       return assignment();
   let s = invocation(); 
   match(SEMICOL); return s;
}
function factor() { //redefined
    switch (tok.kind)  {
    case NUMBER:
      let c = tok.val;
      match(NUMBER);
      return new Constant(c);
    case IDENT:
      if (isInvocation()) 
          return invocation();
      else return variable();
    case LEFT:
      match(LEFT); 
      let e = expression();
      match(RIGHT); return e;
    default: expected("Factor");
    }
    return null;
}
function invocation() {
   let id = tok.val;
   match(IDENT);
   match(LEFT);
   let a = [];
   if (tok != RIGHT) a = exprList();
   match(RIGHT);
   let m = metST.get(id);
   if (!m) error("Method "+id+" not found");
   return new Invocation(m, a);
}
function exprList() {
   let L = [];
   L.push(expression());
   while (tok == COMMA)  {
      match(COMMA); 
      L.push(expression());
   }
   return L;
}
function returnStat() {
   match(RETURN); 
   let e = (tok == SEMICOL)? null : expression();
   match(SEMICOL);
   return new Return(e); 
}

