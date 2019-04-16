// Author: Eyler -- Jan 2002
// 1.9.2002 redesigned
// 15.10  use TreeNode structure
// 22.12  package
// Data structure for mJ1 and mJ2
// Oct 2003 made public
// Mar 2019 JavaScript

class Node {
  constructor() {
     this.list = []
  }
  add(x) { //x is Statement
     this.list.push(x);
  }
  addAll(A) { //A is Array
     for (let x of A) this.add(x);
  }
  toTree(indent='') {
     indent += '  '
     let s = this.toString()
     for (let x of this.list) {
        let t = (x instanceof Node? 
            x.toTree(indent) : x.toString())
        s += '\n'+indent+t
     }
     return s
  }
}
class Method extends Node {
  constructor(name) {
     super(); this.name = name; 
     this.nParams = 0; 
     this.vars = [];
     //for (let v of vars) this.vars.push(v)
  }
  toString() {
     let a = [];
     for (let i=0; i<this.nParams; i++)
        a.push(this.vars[i])
     return this.name+"("+a.join(', ')+")";
  }
}

class Variable { //move to Expression
   constructor(m, i) { this.met = m; this.ind = i; }
   fValue() { 
      return VM.getValue(this); 
   }
   toString() { return this.met.vars[this.ind]; }
}

class Declaration {
   constructor(vars) { this.vars = vars; }
   run() { }
   toString() { 
      return "var "+this.vars.join(', ');
   }
}

class Assignment {
   constructor(v, e) { this.left = v; this.right = e; }
   run() { VM.setValue(this.left, this.right.fValue()); }
   toString() { return this.left+" = "+this.right; }
}

class PrintStat {
   constructor(p, nl) { this.pri = p; this.hasNL = nl; }
   run() { 
      for (let v of this.pri) 
         printer += v.value();
      if (this.hasNL) {
         console.log(printer);
         printer = '';
      }
   }
   toString() { 
      let t = this.hasNL? "println" : "print";
      return t+" "+this.pri.join(', ');
   }
}

class PrintItem {
   constructor(e1, e2=null) {
      if (typeof e1 == "string") {
         this.lit = e1; return;
      }
      this.exp = e1; this.len = e2; 
   }
   value() {
      if (this.lit) return this.lit;
      let t = String(this.exp.fValue());
      if (this.len == null) return t;
      let n = t.length;
      let m = Math.round(this.len.fValue());
      if (n >= m) return t;
      const MAX = 72;
      if (m > MAX) m = MAX;
      while (t.length < m) t = ' '+t;
      return t; 
   }
   toString() {
      if (this.lit) return '"'+this.lit+'"'; 
      return (this.len? this.exp+":"+this.len : ""+this.exp);
   }
}

//microJ1 Parser
var met  //current Method being parsed
var printer = ''  //current unfinished line
const metST = new Map() //Symbol Table: name -> Method
function method()  {
    let name = tok.val;
    if (metST.get(name)) 
       error(name+" already defined");
    met = new Method(name);
    metST.set(name, met);
    match(IDENT); match(LEFT);
    if (tok.kind == IDENT) identList();
    met.nParams = met.vars.length; 
    match(RIGHT);
    match(BEGIN);
    let d = declaration();
    if (d.vars.length > 0) met.add(d); 
    let a = statList();
    match(END); met.addAll(a);
    return met;
}
function identifier()  {
    let id = tok.val; match(IDENT);
    if (met.vars.includes(id)) 
       error(id+" declared twice");
    met.vars.push(id); return id;
}
function identList() {
    let L = [];
    L.push(identifier());
    while (tok == COMMA)  {
       match(COMMA); L.push(identifier());
    }
    return L;
}
function declaration()  {
    let a = [];
    if (tok == VAR) {
       match(VAR); a = identList(); match(SEMICOL);
    }
    return new Declaration(a);
}
function statList() {
    let L = [];
    do { //at least one
       let f = tok.index;
       let s = statement();
       //((Node)s).setPosition(f, prev);
       L.push(s);
       //debug(DBG_MED, s.toString());
    } while (tok != END);
    return L;
}
function statement() {
    switch (tok.kind)  {
    case IDENT: return assignment();
    case PRINTLN:
    case PRINT: return printStat(); 
    default: expected("Statement");
    }
    return null;
}
function assignment() {
    let v = variable();
    match(ASSIGN);
    let e = expression();
    match(SEMICOL);
    return new Assignment(v, e);
}
//expression() and term() defined in Expression.js
function factor() { //redefined
    switch (tok.kind)  {
    case NUMBER:
      let c = tok.val;
      match(NUMBER);
      return new Constant(c);
    case IDENT:
      return variable();
    case LEFT:
      match(LEFT); 
      let e = expression();
      match(RIGHT); return e;
    default: expected("Factor");
    }
    return null;
}
function variable() {
    let i = met.vars.indexOf(tok.val);
    if (i < 0) error(tok.val+" not declared");
    match(IDENT);
    return new Variable(met, i);
}
function printStat() {
    let hasNL = (tok == PRINTLN);
    match(tok);
    let a = [];
    if (tok != SEMICOL || !hasNL)
         a = itemList();
    match(SEMICOL);
    return new PrintStat(a, hasNL);
}
function itemList() {
    let L = [];
    L.push(printItem());
    while (tok == COMMA)  {
       match(COMMA); L.push(printItem());
    }
    return L; 
}
function printItem() {
    switch (tok.kind) {
    case LITERAL: 
       let s = tok.val;
       match(LITERAL); 
       return new PrintItem(s);
    default :
       let e1 = expression();
       if (tok != COLON) return new PrintItem(e1);
       match(COLON);
       return new PrintItem(e1, expression());
    }
}

