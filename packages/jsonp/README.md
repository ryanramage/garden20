## JSONP Module

This provides a safer way to respond to JSONP requests from CouchDB list and show
functions. It validates the callback before returning the appropriate response
object.


### Example

```javascript
var jsonp = require('jsonp');

exports.myshow = function (doc, req) {
    return jsonp.response(req.query.callback, {
        ok: true
    });
};
```


### API


#### jsonp.validFunctionName(name)

Returns true if the function name is valid, false otherwise.


#### jsonp.response(callback, data, extensions)

Creates a CouchDB response object. Checks if the callback is valid and
returns a 400 (Bad request) if not, or the JSON encoded data wrapped in the
callback function if it is. If the callback is empty or undefined then a
plain JSON response is used. The extensions object will be used to extend
the response object before returning it.

__Examples:__

```javascript
> jsonp.response('foo', {msg: 'hello'})
{code: 200, body: 'foo({"msg": "hello"})'}

> jsonp.response(undefined, {msg: 'hello'})
{code: 200, body: '{"msg": "hello"}'}

> jsonp.response('alert("evil!");void', {msg: 'hello'})
{code: 400, body: '{"error": "bad_request", "reason": "invalid_callback"}'}
```
