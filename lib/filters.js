


exports.newRequest = function(doc, req) {
    if (doc.type && doc.type === 'request') {
        if (!doc.complete) return true;
    }
    return false;
}