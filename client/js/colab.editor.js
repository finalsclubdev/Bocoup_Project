// Function.prototype.bind polyfill
// We are using this to avoid having a hard library dependency
if ( !Function.prototype.bind ) {

  Function.prototype.bind = function( obj ) {
    if(typeof this !== 'function') // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');

    var slice = [].slice,
        args = slice.call(arguments, 1), 
        self = this, 
        nop = function () {}, 
        bound = function () {
          return self.apply( this instanceof nop ? this : ( obj || {} ), 
                              args.concat( slice.call(arguments) ) );    
        };

    bound.prototype = this.prototype;

    return bound;
  };
}

(function() {

  // The ACE Range constructor
  var Range = require("ace/range").Range;

  /*
  * The ColabEditor constuctor
  *
  * @param {Element} elem The DOM element to enhance with ACE editor

  * @param {Doc} doc A colab.js document instance provided by the API
  *
  */
  var ColabEditor = window.ColabEditor = function( elem, doc) {
    this.elem = elem;
    this.doc = doc;
    // Create an ACE editor
    this.ace = ace.edit( elem );
    // Lock our editor instance until we join the document
    this.lock();
    this.join();
  };

  ColabEditor.prototype.lock = function() {
    this.locked = true;
    this.ace.setReadOnly( true );
  };

  ColabEditor.prototype.unlock = function() {
    this.locked = false;
    this.ace.setReadOnly( false );
  };

  function onJoin( doc ) {
    colab.removeDocObserver( onJoin );

    colab.addDocObserver('cursor', function(data) {
      console.log('cursor update', data);
    });

    colab.addDocObserver('change', this.remoteChange.bind(this));

    this.ace.session.on( "change", this.aceChange.bind(this) );
    this.ace.session.selection.on( "changeCursor", this.localCursorChange.bind(this) );
    this.unlock();
  }

  ColabEditor.prototype.join = function( options ) {
    colab.addDocObserver("join", onJoin.bind(this));
    colab.joinDoc(this.doc.gid, this.doc.id);
  };

  // Converts ACE's two dimensional text range objects (row & column)
  // to a one-dimensional string-based range
  function flattenAceRange( range ) {
    var line,
        i = 0,
        l = 0,
        r = { start: 0, end: 0},
        startRow = range.start.row,
        endRow = range.end.row;

    while(i < endRow) {
      // Make sure that a blank line counts
      // But not a line that isn't in the internal $lines array
      line = this.ace.session.doc.$lines[i];
      l = !line ? 1 : ( line.length || 1 );

      if (i < startRow) {
        r.start += l + 1;
      }
      r.end += l + 1;
      i++;
    }

    // Add the column of where the edit was made
    r.start += range.start.column;
    r.end += range.end.column;

    return r;
  }

  function expandColabPos( op ) {
    var chars,
        i = 0,
        columnPos = op.pos,
        lines = this.ace.session.doc.$lines,
        l = lines.length;

    for (i=0; i < l; i++) {
      chars = lines[i].length;
      if (columnPos <= chars) {
        break;
      }
      columnPos -= chars + 1;
    }

    return {row: i, column: columnPos};
  }

  ColabEditor.prototype.aceChange = function( event ) {
    if (this.locked) {
      return;
    }
    var operation,
        value,
        action = event.data.action,
        range = flattenAceRange.call(this, event.data.range);

    switch (action) {
      case "insertText":
        operation = "INSERT";
        value = event.data.text;
        if (value == "\n") {
          range.end++;
        }
        break;
      case "insertLines":
        console.info("INSERTLINES", event.data);
        break;
      case "removeText":
      case "removeLines":
        operation = "DELETE";
        value = range.end - range.start;
        break;
    }

    if (operation) {
      console.log("Sending document change event", operation, range.end, value);
      colab.changeDoc(operation, range.end, value);
    }
  };

  /**
  * Relaying cursor changes to the socket,
  * debouncing with a timeout until the user finshes moving the cursor
  * to prevent event pileup on mouse selections or arrow keys
  */

  ColabEditor.prototype.localCursorChangeTimeout = false;

  ColabEditor.prototype.localCursorChange = function(e) {
    this.localCursorChangeTimeout  && clearTimeout(this.localCursorChangeTimeout);
    this.localCursorChangeTimeout = setTimeout( function() {
      var range = flattenAceRange.call(this, this.ace.getSelectionRange());
      colab.updateCursor( range.start );
    }.bind(this),250);
  };

  ColabEditor.prototype.remoteChange = function( chg ) {
    this.lock();

    var endPos,
        range,
        operation = chg.op,
        startPos = expandColabPos.call(this,chg);

    switch ( operation ) {
      case "INSERT":
        this.ace.session.insert(startPos, chg.val);
        break;
      case "DELETE":
        chg.pos += chg.val;
        endPos = expandColabPos.call(this, chg);
        range = Range.fromPoints( startPos, endPos );
        this.ace.session.remove( range );
        break;
    }

    this.unlock();
  };

})();
