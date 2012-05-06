/**
 * Rewrite settings to be exported from the design doc
 */

module.exports = [
    {from: '/static/*', to: 'static/*'},
    {from: '/install', to: '_show/install'},
    {from: '/', to: 'index.html'},
    {from: '/overview.html', to: 'overview.html'},
    {from: '*', to: '_show/not_found'}
];