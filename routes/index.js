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

router.get('/logout', function(req, res){
	req.logout();

 	req.flash('success_msg', 'You are logged out');

 	res.redirect('/');
});
// function ensureAuthenticated(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	} else {
// 		req.flash('error_msg','You are not logged in');
// 		res.redirect('/login');
// 	}
// }
// router.get('/login', function(req, res){
// 	res.render('login');
// });

// passport.serializeUser(function(user, done) {
// 	done(null, user.id);
// 	});

// passport.deserializeUser(function(id, done) {
// 	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
// 		done(err, rows[0]);
// 	})
// });

// Login
// passport.use('local', new LocalStrategy({
// 		usernameField: 'email',
// 		passwordField: 'password',
// 		passReqToCallback: true
// 	},
// 	function(req, email, password, done) {
// 		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
// 			if (err)
// 				return done(err);
// 			if (!rows.length) {
// 				return done(null, false, {message: 'Invalid email'}); // req.flash is the way to set flashdata using connect-flash
// 			}

// 			// if the user is found but the password is wrong
// 			if (!bcrypt.compareSync(password, rows[0].password))
// 				return done(null, false, {message: 'Invalid password'}); // create the loginMessage and save it to session as flashdata

// 			// if the user is found but the password is wrong
// 			if (!rows[0].active)
// 				return done(null, false, {message: 'User not yet confirmed'});

// 			// all is well, return successful user
// 			return done(null, rows[0]);
// 		});
// 	}
// ));

// router.post('/login',
// 	passport.authenticate('local', {successRedirect:'/', failureRedirect:'/login', badRequestMessage:'Please enter email and password' , failureFlash: true}),
// 	function(req, res) {
// 		//console.log(req);
// 	res.redirect('/');
// });



// router.get('/register', function(req, res){
// 	res.render('register');
// });

module.exports = router;