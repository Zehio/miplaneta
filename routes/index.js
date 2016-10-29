var express = require('express');
var router = express.Router();  //para poder pasarle las rutas a app.js
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user.js');
var Article = require('../models/article.js');
var Comment = require('../models/comment.js');
var mongoose = require('mongoose');
var giveGeo = require('../lib/geodata.js');
var geolib = require('geolib');
var bodyParser = require('body-parser');
var formidable = require('formidable');



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

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

router.get('/', function(req, res, next) {
  res.render('home');
});

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

router.get('/logout', function(req, res, next) {
	req.logout();
	res.render('login');
});

router.get('/login', function(req, res, next) {
    if(!req.user){
                res.render('login')
                }
  	if(req.user){
                res.render('alreadylogged', { user : req.user.username})
                }
});

router.post('/login', function(req, res) {
  
      passport.authenticate('local')(req, res, function () {
          var username = req.user.username;
          res.render('logged', { user: username });
      });
});

router.get('/new_article', function(req, res, next) {
    if(req.user){
      var user = req.user.username;
      res.render('new_article', {user: user});
    }
    if(!req.user){
      res.redirect('/');
    }
         
});


router.post('/new_article', function(req, res, next) {

    var location = req.body.location;
    giveGeo(location).then(function(resp) {
        res.locals.address = JSON.stringify(resp[0].formattedAddress);
        res.locals.latitude = JSON.stringify(resp[0].latitude);
        res.locals.longitude = JSON.stringify(resp[0].longitude);

        var id_user = req.user._id;

        if(req.session.id_art){
          Article.findByIdAndUpdate(req.session.id_art, { $set: {
                                                   title: req.body.title,
                                                   content: req.body.content,
                                                   link: req.body.link,
                                                   //user: id_user, no hace falta, ya lo tieney
                                                   beach: req.body.beach,
                                                   bike: req.body.bike,
                                                   childFriendly: req.body.childFriendly,
                                                   mountain: req.body.mountain,
                                                   gastro: req.body.gastro,
                                                   address: res.locals.address,
                                                   loc: [res.locals.longitude, res.locals.latitude],  // [<longitude>, <latitude>]
                                                                }
                                                        }
            , function (err) {    
              if (err) return;       
              res.redirect('/show_article');
        });

        }// fin del if de hay sesión
        if(!req.session.id_art){
          var article = new Article({ 
                                   title: req.body.title,
                                   content: req.body.content,
                                   link: req.body.link,
                                   user: id_user,
                                   beach: req.body.beach,
                                   bike: req.body.bike,
                                   childFriendly: req.body.childFriendly,
                                   mountain: req.body.mountain,
                                   gastro: req.body.gastro,
                                   address: res.locals.address,
                                   loc: [res.locals.longitude, res.locals.latitude],
                                   created: Date.now()  // [<longitude>, <latitude>]                               
                                  });
          article.save(function (err, art) {
              if (err) return;
               
              req.session.id_art = art.id;

              User.findByIdAndUpdate(id_user, {$push: { "ownArticles": req.session.id_art }}, function(err, user){
                  if(err)console.log('error!!!')

                  res.redirect('/show_article');
              });
          }); //fin del save()

          }//fin del if de no hay sesión
          
        
        })//fin del geo

});// fin del post
      

router.get('/show_article', function(req, res, next) {

    Article.findById(req.session.id_art).populate('user')
    .exec(function (err, article) {
      if (err) return handleError(err);
      res.render('show_article', { article: article, longitude: article.loc[0], latitude: article.loc[1]});
    })
});

router.post('/save_article_unique',function(req,res){
  console.log(req)
  delete req.session.id_art
  res.render('show_article');
});

router.get('/all_articles', function(req, res, next) {

    Article.find().limit(50)
      .populate('user', 'username')
      .populate('comments')
      .exec(function (err, arts) {
        if (err) return handleError(err);
        res.render('all_articles', { article: arts, currentUser: req.user });
    })
});

router.post('/articles_search', function(req, res, next) {

  if(req.body.searchplace){

      var searchplace = req.body.searchplace;
      giveGeo(searchplace).then(function(resp) {
          res.locals.latitude = JSON.stringify(resp[0].latitude);
          res.locals.longitude = JSON.stringify(resp[0].longitude);

          // get coordinates [ <longitude> , <latitude> ]
          var coords = [];
          coords[0] = res.locals.longitude;
          coords[1] = res.locals.latitude;

          // find a location
          Article.find({
            loc: {
              $near: coords,
            }
          })
          .populate('user', 'username')
          .populate('comments')
          .limit(50).exec(function(err, arts) {
            if (err) {
              return res.json(500, err);
            }
            res.locals.arrayShow = [];

            if(req.body.beach == 'true')res.locals.beach = true;
            if(req.body.beach !== 'true')res.locals.beach = null;
            if(req.body.bike == 'true')res.locals.bike = true;
            if(req.body.bike !== 'true')res.locals.bike = null;
            if(req.body.childFriendly == 'true')res.locals.childFriendly = true;
            if(req.body.childFriendly !== 'true')res.locals.childFriendly = null;
            if(req.body.mountain == 'true')res.locals.mountain = true;
            if(req.body.mountain !== 'true')res.locals.mountain = null;
            if(req.body.gastro == 'true')res.locals.gastro = true;
            if(req.body.gastro !== 'true')res.locals.gastro = null;


            for( var i = 0; i < arts.length ; i++ ){

               if(
                arts[i].beach == res.locals.beach ||
                arts[i].bike == res.locals.bike ||
                arts[i].childFriendly == res.locals.childFriendly ||
                arts[i].mountain == res.locals.mountain ||
                arts[i].gastro == res.locals.gastro
                ){
                   res.locals.arrayShow.push(arts[i])
                 }

                if(i == arts.length - 1){
                  //por si no ha encontrado nada
                  if(res.locals.arrayShow.length == 0)res.locals.arrayShow = arts;

                  res.render('all_articles', { article: res.locals.arrayShow , currentUser: req.user});

                }

            }
          });

      });

  };

  if(!req.body.searchplace){


    Article.find({
            })
          .populate('user', 'username')
          .populate('comments')
          .limit(50).exec(function(err, arts) {
            if (err) {
              return res.json(500, err);
            }

            res.locals.arrayShow = [];

            if(req.body.beach == 'true')res.locals.beach = true;
            if(req.body.beach !== 'true')res.locals.beach = null;
            if(req.body.bike == 'true')res.locals.bike = true;
            if(req.body.bike !== 'true')res.locals.bike = null;
            if(req.body.childFriendly == 'true')res.locals.childFriendly = true;
            if(req.body.childFriendly !== 'true')res.locals.childFriendly = null;
            if(req.body.mountain == 'true')res.locals.mountain = true;
            if(req.body.mountain !== 'true')res.locals.mountain = null;
            if(req.body.gastro == 'true')res.locals.gastro = true;
            if(req.body.gastro !== 'true')res.locals.gastro = null;


            for( var i = 0; i < arts.length ; i++ ){

               if(
                arts[i].beach == res.locals.beach ||
                arts[i].bike == res.locals.bike ||
                arts[i].childFriendly == res.locals.childFriendly ||
                arts[i].mountain == res.locals.mountain ||
                arts[i].gastro == res.locals.gastro
                ){
                   res.locals.arrayShow.push(arts[i])
                 }

                if(i == arts.length - 1){
                  //por si no ha encontrado nada
                  if(res.locals.arrayShow.length == 0)res.locals.arrayShow = arts;

                  res.render('all_articles', { article: res.locals.arrayShow , currentUser: req.user});

                }

            }

          });

    

  };

});

router.post('/process', function(req, res){
  if(req.xhr){

      if(req.user){

          var blogAuthor = (req.body.username);
          var blogDate = (req.body.created);
          var blogComment = (req.body.comment);
          var miExpReg = new RegExp("comment=");
          var Txt = blogComment.replace(miExpReg, '');
          var nuevoTexto = decodeURIComponent(Txt).replace(/\+/g, " ");

          comment = new Comment({
                               user: req.user.id,
                               info: nuevoTexto                       
          }).save(function(err, com){
              
              Article.findOneAndUpdate({ created: blogDate }, {$push: { "comments": com.id }}, function(err, art){
            
                  res.send({ success: true , comment: com.info });
              
              });
          });
      }

      if(!req.user){
          res.render('all_articles')
      }
      
  } else {
    // if there were an error, we would redirect to an error page
    res.redirect(303, '/thank-you');
  }
});

router.get('/addToMyFavorites', function(req, res, next) {
   res.locals.id_art = req.query.article_id;

   Article.findById(res.locals.id_art).exec(function(err, art){
      if(err)console.log('meeec')

      User.findOneAndUpdate({ _id: req.user.id }, {$push: { "favoriteArticles": art.id }}, function(err, user){
        if(err)console.log('meeec')
      
        console.log(user)
        res.redirect(303, '/myFavoritesList');

      });

   });

});

router.get('/removeFromMyFavorites', function(req, res, next) {

   Article.findOne({ "created": req.query.article_date })
      .populate('user', 'username')
      .exec(function(err, art){
        if(err)console.log('meeec')
     
          User.findByIdAndUpdate(req.user._id, {$pull: { "favoriteArticles": art.id }}, {new: true}, function(err, articleFavorite) {
            if(err)console.log('faaallo')

            console.log(articleFavorite)

            res.redirect(303, '/myFavoritesList')
          
          })
        });
});

router.get('/myFavoritesList', function(req, res, next) {
      
      User.findById(req.user.id)
      .populate("favoriteArticles")
      .exec(function(err, user){
        if(err)console.log('meeec')  

        res.render('myFavoritesList', { artFav : user.favoriteArticles , user: user.username});

      });
});

router.get('/addToMyFavoritesUsers', function(req, res, next) {
   
   Article.findOne({ created: req.query.article_date})
   .populate("user", "username")
   .exec(function(err, art){
      if(err)console.log('meeec')
      console.log('art.user.username '+art.user.username)
      console.log('req.query.article_user '+req.query.article_user)
      console.log('req.user._id '+req.user.id)
      console.log('art.user._id '+art.user.id)
      if(art.user.username == req.query.article_user && req.user.id != art.user.id){

          User.findByIdAndUpdate(req.user._id, {$addToSet: { "favoriteUsers": art.user.id }}, {new: true}, function(err, user) {
            if(err)console.log('faaallo')

            res.redirect(303, '/myFavoritesListUsers')
          
          })
      }
      else{//no se puede, seguramente porq se está añadiendo a si mismo.
          res.render('home')
      }
   });

});

router.get('/removeFromMyFavoritesUsers', function(req, res, next) {

   User.findOne({ "created": req.query.user_date })
      .exec(function(err, user){
        if(err)console.log('meeec')
        console.log('user.username '+user.username)
        console.log('req.query.user_name '+req.query.user_name)
        if(user.username == req.query.user_name){

          User.findByIdAndUpdate(req.user._id, {$pull: { "favoriteUsers": user.id }}, {new: true}, function(err, user) {
            if(err)console.log('faaallo')

            res.redirect(303, '/myFavoritesListUsers')
          
          })
        }
        else{res.render('home')}
      });
});

router.get('/myFavoritesListUsers', function(req, res, next) {
      
      User.findById(req.user.id)
      //.populate("favoriteUsers", "username")
      .populate("favoriteUsers", "created username")
      .exec(function(err, user){
        if(err)console.log('meeec')  
 
        res.render('myFavoritesListUsers', { user : user });

      });
});


router.get('/uploadPhoto',function(req,res){
  var now = new Date();
  res.render('uploadPhoto',{ year: now.getFullYear(), month: now.getMonth() });
});

router.post('/uploadPhoto/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/');
    });
});



module.exports = router;
