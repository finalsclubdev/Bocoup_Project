
/**
 * Module dependencies.
 */

var coffee = require("coffee-script"),
    express = require("express"),
    cradle = require("cradle"),
    _ = require("underscore"),
    nowpad = require("nowpad"),
    app = module.exports = express.createServer(),
    pad;

// Configuration

app.configure(function(){
  app.set("views", __dirname + "/views");
  app.set("view engine", "jade");
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + "/public"));

  pad = nowpad.createInstance({
    server: app
  });
});

app.configure("development", function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure("production", function(){
  app.use(express.errorHandler()); 
});

/*
 * Routes
*/

// Show the main index
app.get("/", function(req, res){
  res.render("index", {
    title: "Butt Nuggets",
    documents: []
  });
});

/*
// Generate some scratch documents for the sake of illustration
app.get("/generateDocs", function(req, res){
  db.save({
    name: "foo"+Math.round(Math.random()*10000),
    content: "Sample Document Content"
  }, function(sreq, sres){ 
    res.redirect("/");
  });
});

// Fetch and display a document
app.get("/document/:docid", function(req, res){
  console.log(req.params.docid);
  db.get(req.params.docid, function(dreq, doc) {
    console.log(doc);
    res.render("doc", _.extend({id: req.params.docid}, doc));
  });
});

//Handle a document update or deletion
app.post("/document/:docid", function(req, res){
  var id = req.params.docid;
  if (req.body.method == "delete") {
    db.remove(id, req.body.rev, function() { 
      res.send({success: true});
    });
  } else {
    db.merge(id, {content: req.body.content}, function() {
      db.get(id, function(req, doc) {
        res.render("doc", _.extend({id: id}, doc));
      });
    });
  }
});
*/
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Initialise documents
pad.addDocument('doc1','this is doc1');

// Fires when an unknown document is requested
pad.requestDocument(function(documentId,callback){
  console.log("docID", documentId);
  callback(false);
});

// Fires when a change is synced to the document
pad.bind('sync',function(document,value){
  console.log("SYNC?");
});

// Fires when all the clients have disconnected from a document
pad.bind('disconnected', function(document,value){

});

