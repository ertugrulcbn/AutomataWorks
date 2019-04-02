"use strict";
const
  //EXP  = '".*"|\\d+(\\.\\d+)?|[A-Za-z]\\w*|==|!=|>=|<=|//.*|\\S',
    EXP  = /".*"|\d+(\.\d+)?|[A-Za-z]\w*|==|!=|>=|<=|\/\/.*|\S/g,
    LEFT = '(',    RIGHT = ')',   BEGIN = '{',   END = '}',
    COMMA = ',',   COLON = ':',   SEMICOL = ';', MOD = '%', 
    PLUS = '+',    MINUS = '-',   STAR = '*',    SLASH = '/',
    REL_LT = '<',  REL_LE = '<=', REL_GT = '>',  REL_GE = '>=',  
    REL_EQ = '==', REL_NE = '!=', ASSIGN = '=',  POWER = '^',
    LITERAL = 'literal',   NUMBER = 'number',    IDENT = 'ident',
    VAR = "var",   IF = "if",     ELSE = "else", FOR = "for", 
    WHILE = "while", RETURN = "return",   READ = "read", 
    PRINT = "print", PRINTLN = "println", TO = "to", 
    UNKNOWN = '???', EOF = 'eof';
    
class Token {
  constructor(s, i) {
    //s = x[0], i = x.index
    this.index = i
    this.kind = Token.getKind(s)
    switch (this.kind)  {
      case LITERAL:  //
        this.val = Token.stripQuotes(s)
        this.index++; break
      case NUMBER:
        this.val = Number(s); break
      case IDENT: 
      case UNKNOWN: 
        this.val = s; break
      default:  //do nothing -- no value
    }
  }
  toString() {
    let s = this.kind
    if (!this.val) return s
    return s+' '+this.val 
  }
  get length() {
    let s = this.val? String(this.val) : this.kind
    return s.length
  }
  static getKind(s) {
    const
      EXP1 = /".*"/,         //literal
      EXP2 = /^\d+(\.\d+)?/, //number
      EXP3 = /^[A-Za-z]\w*/, //ident
      EXP4 = /\/.*\//,       //comment
      EXP5 = /==|!=|>=|<=|[%->{}\^]/,  //other symbol
      KEY_STR = [VAR, IF, ELSE, FOR, WHILE, RETURN,
                 READ, PRINT, PRINTLN, TO, EOF];
    if (s[0] == '"')  //(EXP1.test(s))
        return LITERAL
    else if (EXP2.test(s))
        return NUMBER
    else if (EXP3.test(s)) 
        return KEY_STR.includes(s)? s : IDENT
    else if (EXP4.test(s))
        return UNKNOWN
    else if (EXP5.test(s))
        return s
    else return UNKNOWN
  }
  static stripQuotes(s, i=1, j=1) {
    if (typeof s != "string") s = s.toString()
    return s.substring(i, s.length-j)
  }
  static list(str, ptn) {
    let exp = ptn ? new RegExp(ptn,'g') : EXP
    let y = [], n = 0
    while (n < 9999) { //avoid infinite loop
        let x = exp.exec(str)
        if (!x) break; n++
        let t = new Token(x[0], x.index)
        if (t.kind != UNKNOWN) y.push(t)
    }
    y.push(new Token(EOF, str.length)); 
    return y
  }
}

