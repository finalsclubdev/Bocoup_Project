function(doc) {
  if(doc._id.substr(0, 4) === 'doc:') {
    emit(doc.gid, null);
  }  
}
