var _ = require('underscore')._;
var handlebars = require('handlebars');
var garden_urls = require('lib/garden_urls');
var userType = require('lib/userType');
var couch = require('db');
var current_db = couch.current();
var session = require('session');



var show = function(what, context) {
    if (!context) context = {};
    $('.nav li').removeClass('active');
    $('.nav li.' + what).addClass('active');
    $('.main').html(handlebars.templates[what + '.html'](context, {}));
} 




$(function() {


  $('.sign-up').click(function() {
      console.log('click');
      $('form').show(400);


  });

  $('form').live('submit', function() {
     
      var details = $(this).formParams();
      details.type = 'request';
      details.start = new Date().getTime();
      
      current_db.saveDoc(details, function(err, resp) {
            if (err) {
                return err;
            }
            


      });
      return false;
  })


});



