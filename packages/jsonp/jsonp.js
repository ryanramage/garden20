var _ = require('underscore')._;


/**
 * Checks to see if a function name is valid and safe for JSONP
 */

exports.validFunctionName = function (name) {
    var re = /^[$A-Za-z_][0-9A-Za-z_]*$/;
    var reserved = [
        'instanceof',
        'typeof',
        'break',
        'do',
        'new',
        'var',
        'case',
        'else',
        'return',
        'void',
        'catch',
        'finally',
        'continue',
        'for',
        'switch',
        'while',
        'this',
        'with',
        'debugger',
        'function',
        'throw',
        'default',
        'if',
        'try',
        'delete',
        'in'
    ];
    return (re.test(name) && _.indexOf(reserved, name) === -1);
};


/**
 * Creates a CouchDB response object. Checks if the callback is valid and
 * returns a 400 (Bad request) if not, or the JSON encoded data wrapped in the
 * callback function if it is. If the callback is empty or undefined then a
 * plain JSON response is used. The extensions object will be used to extend
 * the response object before returning it.
 */

exports.response = function (callback, data, extensions) {
    var res;
    if (!callback) {
        // standard JSON request
        res = {
            code: 200,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        };
    }
    else if (!exports.validFunctionName(callback)) {
        // invalid JSONP callback name
        res = {
            code: 400,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                error:"bad_request",
                reason:"invalid_callback"
            })
        };
    }
    else {
        // JSONP request
        res = {
            code: 200,
            headers: {"Content-Type": "application/json"},
            body: callback + '(' + JSON.stringify(data) + ');'
        };
    }
    if (extensions) {
        return _.extend(res, extensions);
    }
    return res;
};
