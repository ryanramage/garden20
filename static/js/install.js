var dashboard_core = require('lib/dashboard_core');
var datelib = require('datelib');

$(function(){
    var app_url = $('.app_info').data('app_url');
    dashboard_core.getGardenAppDetails(app_url, function(err, results) {
        if (err) return console.log('error', err);
        $('.app_icon').attr('src', results.icon_url);
        $('.app_title').text(results.kanso.config.name);
        $('.uploaded_by').text(results.user).attr('href', results.user_url)
        $('.updated .readable').text(datelib.prettify(results.kanso.push_time))
        //$('.loading').html(handlebars.templates['install_app_info.html'](remote_app_details, {}));
    })
});