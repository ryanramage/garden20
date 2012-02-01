

exports.by_active_install =  {
     map: function (doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;
        emit(doc.dashboard_title, null);
     }
}

exports.by_markets =  {
     map: function (doc) {
        if (doc.type && doc.type === 'market' ) {
            emit(doc.name, doc.url);
        }
     }
}

exports.by_roles = {
    map : function(doc) {
        if (doc.type && doc.type === 'role' ) {
            emit(doc.name, doc.url);
        }
    }
}