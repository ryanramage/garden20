
var templates = require('duality/templates');
var userTypes = require('./userType');

exports.not_found = function (doc, req) {
    return {
        code: 404,
        title: 'Not found',
        content: templates.render('404.html', req, {})
    };
};

exports.install = function(doc, req) {
    var is_auth = userTypes.isAdmin(req);
    return {
        code: 200,
        title: 'Install Application',
        content: templates.render('install.html', req, {
            app_url: req.query.app_url,
            is_auth : is_auth
        })
    };

}
