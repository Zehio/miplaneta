var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');  //para poder acceder al contenido de los POST via req.body
var mongoose = require('mongoose');
var credentials = require('./credentials.js');
var exphbs  = require('express-handlebars');
var session = require('express-session');
var passport = require('passport');
var User = require('./models/user.js');
var FacebookStrategy = require('passport-facebook').Strategy;

var routes = require('./routes/index');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // this is used for parsing the JSON object from POST

app.set('views', path.join(__dirname, 'views'));
// view engine setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//contraseñas//////////
var opts = {
  server: {
    socketOptions: { keepAlive: 1 }
  }
};

switch(app.get('env')){
  case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, opts);
  break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, opts);
  break;
  default:
    throw new Error('Unknown execution environment: ' + app.get('env'));
}
///////////////////////

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));  //para ver lo que queremos que el terminal muestre cuando hay un error. en este caso le decimos que estamos en dev mode. sera distinto en produccion.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()); //para tener acceso a las cookies
app.use(express.static(path.join(__dirname, 'public'))); //para que las referencias sean a la carpeta public

//For seasons
app.use(session({
  secret: 'eskorbuto',
  resave: true,
  saveUninitialized: true
}))

// this must come after we link in cookie-parser and connect-session
// esto es para los tokens de la conexion (para el AJAX, creo)
app.use(require('csurf')());
app.use(function(req, res, next){
  res.locals._csrfToken = req.csrfToken();
  next();
});

// inicializamos passport
app.use(passport.initialize());
app.use(passport.session());


app.use('/', routes); //para que podamos usar las rutas desde index.js (establecido mas arriba) 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
