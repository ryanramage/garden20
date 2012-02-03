


exports.newRequest = function(doc, req) {
    if (doc.type && doc.type === 'request') {
        if (!doc.complete && !doc.error) return true;
    }
    return false;
}