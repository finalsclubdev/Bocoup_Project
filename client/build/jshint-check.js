var JSHINT = require("./lib/jshint/jshint.js").JSHINT,
  print = require("sys").print,
  src = require("fs").readFileSync(process.argv[2], "utf8");

JSHINT(
  src,
  {
    evil: true,
    forin: true,
    maxerr: 100,
    noempty: true,
    jquery: true,
    browser: true,
    predef: [ '_' ]
  }
);

var ok = {

  // w.reason
  "Expected an identifier and instead saw 'undefined' (a reserved word).": true,
  "Use '===' to compare with 'null'.": true,
  "Use '!==' to compare with 'null'.": true,
  "Expected an assignment or function call and instead saw an expression.": true,
  "Expected a 'break' statement before 'case'.": true,
  "'e' is already defined.": true,

  // w.raw
  "Expected an identifier and instead saw \'{a}\' (a reserved word).": true
};

var e = JSHINT.errors, 
    found = 0, 
    w;

for ( var i = 0; i < e.length; i++ ) {
  w = e[i];

  //console.log( w );
  if ( !ok[ w.reason ] && !ok[ w.raw ] ) {
    found++;
    print( "\n " + found + ". Problem at line " + w.line + " character " + w.character + ": " + w.reason );
    print( "\n" + w.evidence );
  }
}

if ( found > 0 ) {
  print( "\n\n" + found + " Error(s) found.\n" );
  process.exit(1);

} else {
  print( "JSHint check passed.\n" );
}
