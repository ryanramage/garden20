var _ = require('underscore')._;
var handlebars = require('handlebars');
var garden_urls = require('lib/garden_urls');
var userType = require('lib/userType');
var couch = require('db');
var current_db = couch.current();
var session = require('session');
var sha1 = require('sha1');
var gravatar = require('gravatar');



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


  
  function showSignupErrors(errors) {
      $('form .error').show();
      var ul = $('form .error ul');
      ul.empty();

      if (_.isArray(errors)) {
          $.each(errors, function(i, error) {
              ul.append('<li>' + error + '</li>');
          });
      }
      if (_.isString(errors)) {
          ul.append('<li>' + errors + '</li>');
      }


  }

  function validate(details) {
      var errors = [];
      if (!_.isString(details.email) || details.email === "") errors.push("Please enter an email.");
      if (!_.isString(details.space) || details.space === "") errors.push("Please enter a space.");
      if (!_.isString(details.password) || details.password === "") errors.push("Please enter a password.");
      if (!_.isString(details.confirm_password) || details.confirm_password === "") errors.push("Please confirm your password.");
      if (details.password !== details.confirm_password) errors.push("Passwords dont match");
      return errors;
  }



  $('form').live('submit', function() {
     
      var details = $(this).formParams();
      details.type = 'request';
      details.start = new Date().getTime();
      if (q.app_url) {
          details.app_url = q.app_url;
      }


      // we use the gravatar hash as the id. This prevents a reuse of a email
      details._id = gravatar.hash(details.email);



      var errors = validate(details);
      if (errors.length > 0) {
          showSignupErrors(errors);
          return false;
      }





       current_db.newUUID(100, function (err, uuid) {
            if (err) {
                return showSignupErrors(err);
            }
            details.salt = uuid;
            details.password_sha = sha1.hex(details.password + details.salt);
            delete details.password;
            delete details.confirm_password;

            current_db.saveDoc(details, function(err, resp) {
                    if (err) {
                        return showSignupErrors('This email address has been used');
                    }
            });
        });




      return false;
  })


});



