var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'admin'
  });

connection.query('USE touristappdatabase');

//Profile
router.get('/home', ensureAuthenticated, function(req, res){
	res.render('agency/home');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/agency/login');
	}
}

// Register
router.get('/register', function(req, res){
	res.render('agency/register');
});

// Login
passport.use('local-agency', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		console.log(email);
		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
			if (err)
				return done(err);
			if (rows.length) {
				return done(null, false, {message: 'Email already exists'}); // req.flash is the way to set flashdata using connect-flash
			}else{
                var email = req.body.email;
                var password = req.body.password;
                var name = req.body.name;
                var streetnumber = req.body.streetnumber;
                var streetname = req.body.streetname;
                var city = req.body.city;
				var phonenumber = req.body.phonenumber;
				var role;
                var userid;
                
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    streetnumber: streetnumber,
                    streetname: streetname,
                    city: city,
					phonenumber: phonenumber,
					role: 'agency'
                };

                var insertUserQuery = "INSERT INTO users ( email, password, streetnumber, streetname, city, phonenumber, role) values (?,?,?,?,?,?,?)";
                    console.log(insertUserQuery);
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, 
                                newUserMysql.streetname, newUserMysql.city, newUserMysql.phonenumber, newUserMysql.role],function(err, rows) {
                        newUserMysql.id = rows.insertId;
                    });

                    connection.query("SELECT id FROM users WHERE email = ?",[email], function(err, rows){
                        userid = rows[0].id;
                        
                        var newAgencyMysql = {
                            name: name,
                            userid: userid
                        };
                        var insertAgencyQuery = "INSERT INTO agencies ( name, userid) values (?,?)";
                        console.log(insertAgencyQuery);
                        connection.query(insertAgencyQuery, [newAgencyMysql.name, newAgencyMysql.userid],function(err, rows) {
                        });
                    });

                req.flash('success_msg', 'Please verify your email and await confirmation.');
            }
			return done(null, rows[0]);
		});
	}
));

router.post('/register',
    passport.authenticate('local-agency', {
        successRedirect:'/agency/login', 
        failureRedirect:'/agency/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

//Login
router.get('/login', function(req, res){
	res.render('agency/login');
});

passport.serializeUser(function(user, done) {
	done(null, user.id);
	});

passport.deserializeUser(function(id, done) {
	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
		done(err, rows[0]);
	})
});

passport.use('local-login-agency', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
			if (err)
				return done(err);
			if (!rows.length) {
				return done(null, false, {message: 'Invalid email'}); // req.flash is the way to set flashdata using connect-flash
			}

			// if the user is found but the password is wrong
			if (!bcrypt.compareSync(password, rows[0].password))
				return done(null, false, {message: 'Invalid password'}); // create the loginMessage and save it to session as flashdata

			// if the user is found but the password is wrong
			if (!rows[0].active)
				return done(null, false, {message: 'User not yet confirmed'});

			// all is well, return successful user
			return done(null, rows[0]);
		});
	}
));

router.post('/login',
	passport.authenticate('local-login-agency', {successRedirect:'/agency/home', failureRedirect:'/agency/login', badRequestMessage:'Please enter email and password' , failureFlash: true}),
	function(req, res) {
		console.log(req);
	res.redirect('/agency/home');
});

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/agency/login');
});

module.exports = router;