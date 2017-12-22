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
	res.render('admin/home');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/admin/login');
	}
}

// Register
router.get('/register', function(req, res){
	res.render('admin/register');
});

// Login
passport.use('local-admin', new LocalStrategy({
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
				var firstname = req.body.firstname;
                var lastname = req.body.lastname;
                var streetnumber = req.body.streetnumber;
                var streetname = req.body.streetname;
                var city = req.body.city;
				var phonenumber = req.body.phonenumber;
				var userid;
				var role;
                
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    streetnumber: streetnumber,
                    streetname: streetname,
                    city: city,
					phonenumber: phonenumber,
					role: 'admin'
                };

                var insertUserQuery = "INSERT INTO users ( email, password, streetnumber, streetname, city, phonenumber, role) values (?,?,?,?,?,?,?)";
                console.log(insertUserQuery);
                connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, 
                            newUserMysql.streetname, newUserMysql.city, newUserMysql.phonenumber, newUserMysql.role],function(err, rows) {
                    newUserMysql.id = rows.insertId;
				});
				
				connection.query("SELECT id FROM users WHERE email = ?",[email], function(err, rows){
					console.log('rows[0].id' + rows);
					userid = rows[0].id;
					
					var newAdminMysql = {
						firstname: firstname,
						lastname: lastname,
						userid: userid
					};
					var insertAdminQuery = "INSERT INTO admins ( firstname, lastname, userid) values (?,?,?)";
					console.log(insertAdminQuery);
					connection.query(insertAdminQuery, [newAdminMysql.firstname, newAdminMysql.lastname, newAdminMysql.userid],function(err, rows) {
					});
				});

                req.flash('success_msg', 'Please verify your email and await confirmation.');
            }
			return done(null, rows[0]);
		});
	}
));

router.post('/register',
    passport.authenticate('local-admin', {
        successRedirect:'/admin/login', 
        failureRedirect:'/admin/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

//Login
router.get('/login', function(req, res){
	res.render('admin/login');
});

passport.serializeUser(function(user, done) {
	done(null, user.id);
	});

passport.deserializeUser(function(id, done) {
	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
		done(err, rows[0]);
	})
});

passport.use('local-login-admin', new LocalStrategy({
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
	passport.authenticate('local-login-admin', {successRedirect:'/admin/home', failureRedirect:'/admin/login', badRequestMessage:'Please enter email and password' , failureFlash: true}),
	function(req, res) {
		console.log(req);
	res.redirect('/admin/home');
});

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/admin/login');
});


router.get('/accounts/customer', ensureAuthenticated, function(req, res){
	connection.query("select customers.firstname, customers.lastname, users.email, users.active, " +  
	                 "users.verification, users.id from users inner join customers on users.id = customers.userid where users.role = 'customer';", function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/customeraccounts', obj);
		}
	});
});

router.get('/accounts/customer/:userid', function(req, res){
	console.log(req.params.userid);
	connection.query("select customers.firstname, customers.lastname, users.email, users.active, " +  
					 "users.verification, users.id " +
					 " from users inner join customers on users.id" + 
					 " = customers.userid where users.role = 'customer';", function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/customeraccounts', obj);
		}
	});
	res.render('admin/viewcustomer', obj);
});

module.exports = router;