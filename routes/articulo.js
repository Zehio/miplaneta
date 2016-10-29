var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user.js');
var mongoose = require('mongoose');



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Use facebook strategy
passport.use(new FacebookStrategy({
        clientID: '1325481584133697',
        clientSecret: '9297085b02e0bf915ca6f252b334d6fd',
        callbackURL: '/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
        //check user table for anyone with a facebook ID of profile.id
        User.findOne({
            'facebookId': profile.id 
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //Nouser was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new User({
                    username: profile.displayName,
                    provider: 'facebook',
                    created: Date.now(),
                    //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                    facebookId: profile.id
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
));

/*
router.get('/', function(req, res, next) {
  res.render('home');
});
*/

router.get('/auth/facebook',
  passport.authenticate('facebook'));
 
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    var username = req.user.username;
    res.render('logged', { user: username });
  });

router.get('/register', function(req, res, next) {
	if(!req.user){
		res.render('register')
	}
	if(req.user){
		res.render('registered', { user: req.user.username })
	}	
});

router.post('/register', function (req, res) {
    
	passport.use(new LocalStrategy(User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());

	User.register(new User({ username : req.body.username, created: Date.now()}), req.body.password, function(err, user) {
	    if (err) {
	        return res.render('register', { err : err });
	    }

	    passport.authenticate('local')(req, res, function () {
	    	var username = req.user.username;
	        res.render('logged', { user: username });
	    });
	});
});
/*
router.get('/logout', function(req, res, next) {
	req.logout();
	res.redirect('/register');
});

router.get('/login', function(req, res, next) {
    if(req.user)res.render('login')
	res.redirect('/register');
});
*/


module.exports = router;
