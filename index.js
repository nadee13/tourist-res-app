// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var session  = require('express-session');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var morgan = require('morgan');
var app      = express();
var port     = process.env.PORT || 8080;

var passport = require('passport');
var flash    = require('connect-flash');

var index = require('./routes/index');
//var users = require('./routes/users');
var customer = require('./routes/customer');

// configuration ===============================================================
// connect to our database

//require('./config/passport')(passport); // pass passport for configuration


// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');
// set up our express application
//app.use(morgan('dev')); // log every request to the console
 // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ //!!!different
	extended: true
}));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));


// required for passport
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
  saveUninitialized: true,
      cookie: { maxAge: 60000 }
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
//require('./config/passport')(passport);
 // use connect-flash for flash messages stored in session

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
app.use(flash());
// Global Vars
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
  });

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// routes ======================================================================
//require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
app.use('/', index);
//app.use('/users', users);
app.use('/customer', customer);
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
