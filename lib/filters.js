


exports.newRequest = function(doc, req) {
    if (doc.type && doc.type === 'request') {
        if (!doc.state ) return true;
        return false;
    }
    return false;
}


exports.signupProgress = function(doc, req) {
      if (req.query.id) {
         if (req.query.id == doc._id) {
             return true;
         }
      }
      return false;
}
