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

  var q = $.parseQuery();
  if (q.app_url) {
      $('.install-message').show();
      $('.install-message span').text(q.app_url);
  }



  $('.sign-up').click(function() {
      console.log('click');
      $('form').show(400);


  });

  var availablity = $('.availablity');
  var go_button   = $('.go-button');


  var available = function(isAvailable) {
      if (isAvailable) {
        availablity.text('Yes, available.');
        go_button.removeClass('disabled');
        go_button.removeAttr('disabled');
      } else {
        availablity.text('Sorry, not available.');

        go_button.attr('disabled', 'disabled');
        go_button.addClass('disabled');
      }
  }


  $('input[name="space"]').live('change', function() {
      var space = $(this).val();
      

      if (space) {
          availablity.text('Checking availablity...');

          var url = 'http://hosting.iriscouch.com/hosting_public/Server%2f' + space + "?callback=?"
          console.log(url);
            $.ajax({
                url : url,
                dataType : 'jsonp',
                json : true,
                timeout: 1500,
                success : function(data) {
                    //console.log(data)
                },
                error : function() {
                    //console.log('available')
                },
                complete: function(xhr, data) {
                    if (xhr.status == 0)
                        available(true)
                    else
                        available(false)
                }
            });
      }
  });


  $('form').live('submit', function() {
     
      var details = $(this).formParams();
      details.type = 'request';
      details.start = new Date().getTime();
      if (q.app_url) {
          details.app_url = q.app_url;
      }
      current_db.saveDoc(details, function(err, resp) {
            if (err) {
                return err;
            }
            


      });
      return false;
  })


});



