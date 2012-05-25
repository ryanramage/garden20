var _ = require('underscore')._;
var handlebars = require('handlebars');
var garden_urls = require('lib/garden_urls');
var userType = require('lib/userType');
var couch = require('db');
var current_db = couch.use('./_db');
var session = require('session');
var sha1 = require('sha1');
var gravatar = require('gravatar');


$(function() {


  var email = amplify.store('email');
  if (email) {
      $('form.login input[name="name"]').val(email);
  }

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

  // localhost hack
  if (window.location.hostname === 'localhost' || window.location.port == 5984) {
      var random = Math.round((Math.random() * 100000));
      $('form.main input[name="space"]').val('test-garden20-' + random);
  }



  $('form.login').live('submit', function() {
        var action = $(this).attr('action');
        if (action !== 'UNSET') {
            return true;
        }
        if (action === 'UNSET') {
            try {
                var me = $(this);
                // find the user
                var details = {
                    name: $('form.login input[name="name"]').val(),
                    password: $('form.login input[name="password"]').val()
                }
                var id = gravatar.hash(details.name);
                current_db.getDoc(id, function(err, doc) {
                    if (err) return alert('invalid user/password');

                    var url = generateGardenLink();
                    var session_url = 'http://' + doc.space + '.garden20.com/_session?next=' + url;
                    me.attr('action', session_url);
                    me.submit();

                    return false;
                });
            } catch (e) {
                console.log(e);
                return false;
            }


        } 
        return false;
  });



  $('form.main input[name="space"]').live('change', function() {
      var space = $(this).val();
      

      if (space) {
          availablity.text('Checking availablity...');

          var url = 'https://hosting.iriscouch.com/hosting_public/Server%2f' + space + "?callback=?"
            $.ajax({
                url : url,
                dataType : 'jsonp',
                json : true,
                timeout: 3500,
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


  function showProgress(progress, details) {
      $('.install-info h4').text(progress.state);
      $('.install-info .bar').css('width', progress.percent + '%');

      if (progress.complete) {
        $('.install-info .bar').css('width', '100%');
        $('.install-info .progress').removeClass('active');

        $('.install-complete').show();
        $('html, body').animate({ scrollTop: $(".install-complete").offset().top }, 500);

        var url = generateGardenLink();
        var session_url = 'http://' + $('input[name="space"]').val() + '.garden20.com/_session?next=' + url;
        $('form.second').attr('action', session_url);
        $('form.second input[name="name"]').val( $('form.main input[name="email"]').val() );
        $('form.second input[name="password"]').val( $('form.main input[name="password"]').val() );


        // store the users email, for convience
        amplify.store('email', details.email);

      } 
  }

  function generateGardenLink() {
      var base = '/';
      var app_url = $('.app_info').data('app_url');
      if (app_url) {
          base += 'install?app_url=' + app_url;
      }
      return base;
      
  }



  $('form.main').live('submit', function() {
      var app_url = $('.app_info').data('app_url');
      var details = {
          space: $('form.main input[name="space"]').val(),
          first_name: $('form.main input[name="first_name"]').val(),
          last_name: $('form.main input[name="last_name"]').val(),
          email: $('form.main input[name="email"]').val(),
          password: $('form.main input[name="password"]').val(),
          confirm_password: $('form.main input[name="confirm_password"]').val()
      }
      details.type = 'request';
      details.start = new Date().getTime();
      if (app_url) {
          details.app_url = app_url;
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


                $('.start-install').hide();
                $('.install-info').show();



                current_db.changes({
                    filter : 'garden20/signupProgress',
                    include_docs : true,
                    id : resp.id
                }, function(err, resp) {

                    if (err) return console.log('error in changes: ' + err);


                    var progress = resp.results[0].doc;
                    showProgress(progress, details);


                });


            });
        });




      return false;
  })


});



