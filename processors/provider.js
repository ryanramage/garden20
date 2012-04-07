/**  Creates databases with a dashboard for users
  *  Setup environment variables (see datacouch readme for more info):
  *    export SRC_COUCH_ROOT="http://admin:admin@localhost:5984"
  *    export DST_COUCH_ROOT="http://garden.apps:pass@hosting.iriscouch.com"
  *    export HOSTING_ROOT="garden20.com"
  *    export HOSTING_ROOT="iriscouch.com"
  *  then "node provision_databases.js"
  *  Author: Ryan Ramage (@eckoit)
  *  Author: Max Ogden (@maxogden)
 **/

if(!process.env['SRC_COUCH_ROOT']) throw ("OMGZ YOU HAVE TO SET SRC_COUCH_ROOT");
if(!process.env['DST_COUCH_ROOT']) throw ("OMGZ YOU HAVE TO SET DST_COUCH_ROOT");
if(!process.env['HOSTING_ROOT'])   throw ("OMGZ YOU HAVE TO SET HOSTING_ROOT");

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

var src_db_root = process.env['SRC_COUCH_ROOT'];
var src_db = src_db_root + '/garden20';
var dst_db = process.env['DST_COUCH_ROOT'] + '/hosting_public';
var hosting_root = process.env['HOSTING_ROOT'];

console.log('starting...');

follow({db: src_db, include_docs: true, filter: "garden20/newRequest", since : "now"}, function(error, change) {
    if (error || !("doc" in change)) return;
    var doc = change.doc;

    console.log('got a doc change');

    if (doc.state || doc.in_progress) return;

    var domain = domainPrefix(doc);
    var fullDomain = domain + '.' + hosting_root;
    var targetDoc = createTargetDoc(doc, domain);
    var start_time = new Date().getTime();

    doc.start_time = start_time;


    async.waterfall([
        function(callback){
            createCouchPost(dst_db, targetDoc, function(err){
                updateProgress(src_db, doc, 'Creating space...', 15, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            });
        },
        function(callback){
            waitForCouch(fullDomain, function(err){
                updateProgress(src_db, doc, 'Installing dashboard...', 40, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            });
        },
        function(callback){
            installDashboard(src_db_root, fullDomain, function(err){
                updateProgress(src_db, doc, 'Creating User...', 70, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            });
        },

        function(callback) {
            createUser(fullDomain, doc.email, doc.password_sha, doc.salt, function(err){
                updateProgress(src_db, doc, 'Admin config...', 80, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            })
        },

        function(callback) {
            setAdmin(fullDomain, 'dashboard', doc.email, function(err){
                updateProgress(src_db, doc, 'Adjust routing', 85, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            });
        },
        function(callback) {
            turnOffSecureRewrites(fullDomain, function(err) {
                addVhosts(fullDomain, function(err) {
                    updateProgress(src_db, doc, 'Admin config (cont)...', 90, false, function(err2, doc2) {
                        doc = doc2;
                        callback(err);
                    });
                });
            })


        },
        function(callback) {
            createAdmin(fullDomain, doc.email, doc.password_sha, doc.salt, function(err){
                updateProgress(src_db, doc, 'Finishing', 95, false, function(err2, doc2) {
                    doc = doc2;
                    callback(err);
                });
            });
        },
        function(callback) {
            updateProgress(src_db, doc, 'Complete!', 100, true, callback);
        }


    ], function(err) {
        if (err) return console.log('workflow problem:  ' + JSON.stringify(err));
    });
})



function updateProgress(src_db, doc, state, percent, finished, callback) {
    doc.state = state;
    doc.percent = percent;
    if (finished) {
        delete doc.in_progress
        doc.complete = true;
        doc.finish_time = new Date().getTime();
    } else {
        doc.in_progress = true;

    }
    request({
      uri: src_db + '/' + doc._id,
      method: "PUT",
      json : doc
    },
    function (err, resp, body) {
        if (err) callback('ahh!! ' + err);
        var response = body;
        if (!response) response = {"ok": true};
        if (!response.ok) callback(url + " - " + body);

        doc._rev = response.rev;
        callback(null, doc);
    })
}


function createCouchPost(url, targetDoc, callback) {
  console.log('create couch', url);
  request({
      uri: url,
      method: "POST",
      json : targetDoc
  },
  function (err, resp, body) {
    if (err) callback('ahh!! ' + err);
    var response = body;
    console.log(response);
    if (!response) response = {"ok": true};
    if (!response.ok) callback(url + " - " + body);
    callback();
  })
  
}


function waitForCouch(fullDomain, callback) {
  console.log('wait for couch');
  var couchNotUp = true;
  var start = new Date().getTime();
  async.whilst(
        function () {return couchNotUp;},
        function (callback) {
            checkExistenceOf('http://' + fullDomain, function(status){
                var now = new Date().getTime();
                var elapsed = now - start;
                if (elapsed > 20000) callback('Timeout, waiting for couch');
                console.log(status);
                if (status && status !== 404 ) couchNotUp = false;
                // prob should be kind and do a settimeout
                callback();
            });
        },
        function (err) {
            callback(err);
        }
   );
}


function installDashboard(src_db_root, fullDomain, callback) {
   console.log('install dashboard');
   replicate(src_db_root, 'garden20', 'http://' + fullDomain + '/dashboard', '_design/dashboard', function(err){
       console.log('replicate cmmd fin');
       console.log(err);
       callback(err)
   });
}



function createTargetDoc(doc, domainPrefix) {
    var targetDoc = {
        "_id":"Server/" + domainPrefix,
        "partner": "garden.apps",   // prob should make customizable
        "creation": {
            "first_name": doc.first_name,
            "last_name": doc.last_name,
            "email": doc.email,
            "subdomain": domainPrefix
         }
   };
   // optional stuff
   if (doc.first_name) targetDoc.creation.first_name = doc.first_name;
   if (doc.last_name)  targetDoc.creation.last_name = doc.last_name;

   return targetDoc;
}



function createUser(fullDomain, username, password_sha, password_salt, callback) {
    var doc = {};
    doc._id = 'org.couchdb.user:' + username;
    doc.name = username;
    doc.type = 'user';

    doc.roles = [];


    doc.salt = password_salt;
    doc.password_sha = password_sha;


    var url = 'https://' + fullDomain + '/_users/'  + doc._id;
    request({uri: url, method: "PUT", body: doc}, function (err, resp, body) {
        if (err) callback('ahh!! ' + err);        
        if (!body.ok) callback('error creating user: ' + body);
        callback();
    })


}

function setAdmin(fullDomain, dbName, username, callback) {
  var url = 'https://' + fullDomain + '/' + dbName + "/_security";
  var data = {"admins":{"names":[username],"roles":[]},"members":{"names":[],"roles":[]}};

  request({uri: url, method: "PUT", body: data}, function (err, resp, body) {
    if (err) callback('ahh!! ' + err);
    if (!body.ok) callback('error setting admin: ' + body);
    callback();
  })
}

function createAdmin(fullDomain, username, password_sha, password_salt, callback) {
    var url = 'https://' + fullDomain + '/_couch/_config/admins/' + username;
    var pwd = JSON.stringify('-hashed-' + password_sha + ',' + password_salt);
    request({uri: url, method: "PUT", body: pwd}, function (err, resp, body) {
        if (err) callback('ahh!! ' + err);
        callback();
    })
}

function turnOffSecureRewrites(fullDomain, callback) {
    var url  = 'https://' + fullDomain + '/_config/httpd/secure_rewrites';
    var path = JSON.stringify("false");
    request({uri: url, method: "PUT", body: path}, function (err, resp, body) {
        if (err) callback('ahh!! ' + err);
        callback();
    })
}


function addVhosts(fullDomain, callback) {
    var url  = 'https://' + fullDomain + '/_config/vhosts/' + fullDomain;
    var path = JSON.stringify("/dashboard/_design/dashboard/_rewrite/");
    request({uri: url, method: "PUT", body: path}, function (err, resp, body) {
        if (err) callback('ahh!! ' + err);

        // make sure the dashboard can be reached directly
        url = url + '%2Fdashboard';
        path = '/dashboard';
        console.log(url);
        console.log(path);
        request({uri: url, method: "PUT", body: path}, function (err, resp, body) {
           if (err) callback('ahh!! ' + err);
           callback();
       });
    })    
}




function domainPrefix(doc) {
    return doc.space;
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



function replicate(couch, source, target, ddoc, callback) {
  var reqData = {"source": source,"target": target, "create_target": true};
  if (ddoc) reqData["doc_ids"] = [ddoc];
  request({uri: couch + "/_replicate", method: "POST", body: reqData}, function (err, resp, body) {
    if (err) callback(err)
    if (body.doc_write_failures > 0) callback('error creating: ' + body);
    callback();
  })

}

function checkExistenceOf(url, callback) {
  console.log('check existance', url);
  request({uri: url, method: "HEAD", json: false}, function(err, resp, body) {
     callback(resp.statusCode);
  })
}





