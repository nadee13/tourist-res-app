var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
//var config = require('./config');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'admin'
  });

connection.query('USE touristappdatabase');
// Get Homepage

router.get('/', function(req, res){
 	res.render('index');
});

//Login
router.get('/login', function(req, res){
	res.render('login');
});

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
		done(err, rows[0]);
	})
});

passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
			////console.log('rows: ' + rows);
			if (err)
				return done(err);
			if (!rows.length) {
				req.flash('error_msg', 'Invalid email!');
				return done(null, false, {message: '0'}); // req.flash is the way to set flashdata using connect-flash
			}
			// if the user is found but the password is wrong
			if (!bcrypt.compareSync(password, rows[0].password))
				req.flash('error_msg', 'Invalid password!');
				return done(null, false, {message: '1'}); // create the loginMessage and save it to session as flashdata

			// if the user is found but the password is wrong
			if (!rows[0].active)
			req.flash('error_msg', 'User not yet confirmed!');
				return done(null, false, {message: '2'});

			// all is well, return successful user
			return done(null, rows[0]);
		});
	}
));

router.post('/login',
	passport.authenticate('local-login', {
		failureRedirect:'/login', 
		badRequestMessage:'' , 
		failureFlash: true
	}), (req, res) => {
    console.log('req.user: ' + JSON.stringify(req.user));
    if (req.user.role == 'admin') {
      res.redirect('/admin/home');
    }else if (req.user.role == 'customer'){
      res.redirect('/customer/home');
    }else if (req.user.role == 'agency'){
      res.redirect('/agency/home');
    }
  }
);

router.get('/logout', function(req, res){
	req.logout();

 	req.flash('success_msg', 'You are logged out');

 	res.redirect('/');
});

module.exports = router;