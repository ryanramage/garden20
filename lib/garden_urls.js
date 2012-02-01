
exports.app_details_json = function(app_details_url) {
    return app_details_url + '/json';
}


exports.incr_app_name = function(app_name) {
    var num = 1;
    var delim = app_name.lastIndexOf('_');
    if (delim > 0) {
        var last_num = app_name.substr(delim+1)
        if (last_num > 0) {
            num = Number(last_num) + 1;
            app_name = app_name.substr(0, delim);
        }
    }
    return app_name + "_" + num;
}


var fnd = exports.find_next_db_name = function(app_name, current_dbs) {

    if (!current_dbs) return app_name;
    if (!current_dbs.length) return app_name;

    if (current_dbs.indexOf(app_name) !== -1 ) {
        return fnd(exports.incr_app_name(app_name), current_dbs);
    }

    return app_name;
}


exports.get_launch_url = function(install_doc) {
    return '../../../../' + install_doc.installed.db + '/_design/' + install_doc.doc_id +  install_doc.open_path;
}

exports.formatSize = function(size) {
    var jump = 512;
    if (size < jump) return size + " bytes";
    var units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var i=0;
    while (size >= jump && i < units.length) {
        i += 1;
        size /= 1024;
    }
    return size.toFixed(1) + ' ' + units[i - 1];
}


exports.bestDashboardImage = function (install_doc) {
    try {
        if (install_doc.kanso.config.promo_images.small) {
            return '../../../../' + install_doc.installed.db + '/_design/' +  install_doc.doc_id +    '/' + install_doc.kanso.config.promo_images.small;
        }
    } catch(e){}

    return 'http://placehold.it/210x150';
}


exports.bestIcon96 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['96']) {
            return '../../../../' + install_doc.installed.db + '/_design/' +  install_doc.doc_id +    '/' + install_doc.kanso.config.icons['96'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}

exports.bestIcon128 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['128']) {
            return '../../../../' + install_doc.installed.db + '/_design/' +  install_doc.doc_id +    '/' + install_doc.kanso.config.icons['128'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}