/**  Creates databases with a dashboard for users
  *  Setup environment variables (see datacouch readme for more info):
  *    export SRC_COUCH_ROOT="http://admin:pass@localhost:5984/dbname"
  *    export DST_COUCH_ROOT="http://admin:pass@localhost:5984/dbname"
  *  then "node provision_databases.js"
  *  Author: Ryan Ramage (@eckoit)
  *  Author: Max Ogden (@maxogden)
 **/

if(!process.env['SRC_COUCH_ROOT']) throw ("OMGZ YOU HAVE TO SET SRC_COUCH_ROOT");
if(!process.env['DST_COUCH_ROOT']) throw ("OMGZ YOU HAVE TO SET DST_COUCH_ROOT");

var follow = require('follow')
  , request = require('request').defaults({json: true})
  , async = require('async')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , _ = require('underscore')
  ;

// for nodejitsu -- they require a running server
require('http').createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('database provisioner is up\n');
}).listen(1337);

var src_db = process.env['SRC_COUCH_ROOT'] ;
var dst_db = process.env['DST_COUCH_ROOT'] ;



follow({db: src_db, include_docs: true, filter: "garden-space/newRequest"}, function(error, change) {
  if (error || !("doc" in change)) return;
  var doc = change.doc;
  console.log(doc);



//  checkExistenceOf(dbPath).then(function(status) {
//    console.log(dbPath, status)
//    if( (status === 404) && (!change.deleted) ) {
//      console.log('creating ' + dbName);
//      var start_time = new Date();
//      createDB(dbPath).then(function(response) {
//        function done() { console.log("created " + dbName + " in " + (new Date() - start_time) + "ms") }
//        if (doc.forkedFrom) {
//          // TODO prevent user from forking the same dataset twice
//          replicate(doc.forkedFrom, dbName).then(done);
//        } else {
//          pushCouchapp("recline", dbPath).then(done);
//        }
//        setAdmin(dbName, doc.user);
//      })
//    }
//  })
})


function createTargetDoc(doc, domainPrefix) {
    return {
        "_id":"Server/" + domainPrefix,
        "partner": "somepartner",
        "creation": {
            "first_name": doc.first_name,
            "last_name": doc.last_name,
            "email": doc.email,
            "subdomain": domainPrefix
         }
   };
}


function domainPrefix(doc) {
    return doc.first_name + doc.last_name;
}







function registerApp(appURL, doc, db, callback) {
  // addVhost(appURL, "/" + doc.dataset + "/_design/" + doc.ddoc + "/_rewrite").then(function() {
    request.post({url: db, body: _.extend({}, doc, {url: appURL})}, function(e,r,b) {
      if (callback) callback(b)
    })
  // });
}

function absolutePath(pathname) {
  if (pathname[0] === '/') return pathname
  return path.join(process.env.PWD, path.normalize(pathname));
}

function pushCouchapp(app, target) {
  var dfd = deferred()
    , source = couch + '/apps/_design/' + app + "?attachments=true"
    , destination = target + '/_design/' + app + "?new_edits=false"
    , headers = {'accept':"multipart/related,application/json"}
    ;
  request.get({url: source, headers: headers}).pipe(request.put(destination, function(err, resp, body) {
    dfd.resolve(body);
  }));
  return dfd.promise();
}

function replicate(source, target, ddoc) {
  var dfd = deferred();
  var reqData = {"source": source,"target": target, "create_target": true};
  if (ddoc) reqData["doc_ids"] = [ddoc];
  request({uri: couch + "/_replicate", method: "POST", body: reqData}, function (err, resp, body) {
    if (err) throw new Error('ahh!! ' + err);
    if (body.doc_write_failures > 0) throw new Error('error creating: ' + body);
    dfd.resolve(body);
  })
  return dfd.promise();
}

function checkExistenceOf(url) {
  var dfd = deferred();
  request({uri: url, method: "HEAD", json: false}, function(err, resp, body) {
    dfd.resolve(resp.statusCode);
  })
  return dfd.promise();
}

function createDB(url) {
  var dfd = deferred();
  request({uri: url, method: "PUT"}, function (err, resp, body) {
    if (err) throw new Error('ahh!! ' + err);
    var response = body;
    if (!response) response = {"ok": true};
    if (!response.ok) throw new Error(url + " - " + body);
    dfd.resolve(resp.statusCode);
  })
  return dfd.promise();
}

function addVhost(url, couchapp) {
  var dfd = deferred();
  request({uri: couch + "/_config/vhosts/" + encodeURIComponent(url), method: "PUT", body: JSON.stringify(couchapp), json: false}, function (err, resp, body) {
    console.log(body)
    if (err) throw new Error('ahh!! ' + err);
    dfd.resolve(body);
  })
  return dfd.promise();
}

function setAdmin(dbName, username) {
  var dfd = deferred();
  var data = {"admins":{"names":[username],"roles":[]},"members":{"names":[],"roles":[]}};
  request({uri: couch + "/" + dbName + "/_security", method: "PUT", body: data}, function (err, resp, body) {
    if (err) throw new Error('ahh!! ' + err);
    if (!body.ok) throw new Error('error setting admin: ' + body);
    dfd.resolve(body);
  })
  return dfd.promise();
}