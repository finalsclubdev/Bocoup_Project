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
    this.ace.$blockScrolling = 1;
  };

  ColabEditor.prototype.unlock = function() {
    this.locked = false;
    this.ace.setReadOnly( false );
    this.ace.$blockScrolling = 0;
  };

  ColabEditor.prototype.cmdBuffer = {
    buffer: [],
    rate: 32,
    queue: function(action) {
      this.buffer.push(action);
      this.process();
    },
    processing: false,
    process: function() {
      if (this.processing) {
        return;
      }

      var self = this;
      function execCmd() {
        var cmd = self.buffer.shift();
        colab[cmd.method].apply(colab, cmd.args);
        if (self.buffer.length) {
          setTimeout(execCmd, self.rate);
        } else {
          self.processing = false;
        }
      }
      this.processing = true;
      setTimeout(execCmd, self.rate);
    }
  };

  function onJoin( doc ) {
    console.log("onJoin", doc);
    colab.removeDocObserver( "join" );

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

  ColabEditor.prototype.destroy = function() {
    colab.removeDocObserver( "change" );
    colab.partDoc();
  };
  // Converts ACE's two dimensional text range objects (row & column)
  // to a one-dimensional string-based range
  function flattenAceRange( range ) {
    var chars,
        lines = this.ace.session.doc.$lines,
        i = 0,
        l = lines.length,
        r = { start: 0, end: 0};

    for (i=0; i<l; i++) {
      chars = lines[i].length;
      if (i < range.start.row) {
        r.start += chars + 1;
      } else if (i == range.start.row) {
        r.start += range.start.column;
      }

      if (i < range.end.row) {
        r.end += chars + 1;
      } else if (i == range.end.row) {
        r.end += range.end.column;
        break;
      }
    }

    return r;
  }

  function expandColabPos( op ) {
    var chars,
        i = 0,
        columnPos = op.pos-1,
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
        console.log("ORIGINAL RANGE", event.data.text, event.data.range, "COLAB RANGE", range);
        operation = "INSERT";
        value = event.data.text;
        break;
      case "insertLines":
        console.info("INSERTLINES", event.data);
        break;
      case "removeText":
      case "removeLines":
        operation = "DELETE";
        console.log("ORIGINAL RANGE",  event.data.range, "COLAB RANGE", range);
        value = range.end - range.start;
        break;
    }

    if (operation) {
      this.cmdBuffer.queue({
        method: "changeDoc",
        args: [operation, range.end, value]
      });
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
        console.log("GENERATED RANGE", chg.val, startPos);
        this.ace.session.insert(startPos, chg.val);
        break;
      case "DELETE":
        chg.pos += chg.val;
        endPos = expandColabPos.call(this, chg);
        range = Range.fromPoints( startPos, endPos );
        this.ace.session.remove( range );
        break;
    }

    console.log(startPos, endPos);
    this.unlock();
  };

})();
