function(doc) {
  if(doc._id.substr(0, 6) === 'group:') {
    emit(null, null);
  }
}
