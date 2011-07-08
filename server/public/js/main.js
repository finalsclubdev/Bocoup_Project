(function(window,undefined){

  $(function(){
    // Create Instance
      // ACE
    var editor = ace.edit("document");
    editor.setShowPrintMargin(false);

    // Nowpad
    nowpad.createInstance({
      element: editor,
      documentId: "doc1"
    });

  });


})(window);

