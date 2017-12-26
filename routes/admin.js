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
		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
			if (err)
				return done(err);
			if (rows.length) {
				req.flash('error_msg', 'Email already exists!');
				return done(null, false, {message: ''}); // req.flash is the way to set flashdata using connect-flash
			}else{
                var email = req.body.email;
				var password = req.body.password;
				var name = req.body.name;
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
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, 
                            newUserMysql.streetname, newUserMysql.city, newUserMysql.phonenumber, newUserMysql.role],function(err, rows) {
                    newUserMysql.id = rows.insertId;
				});
				
				connection.query("SELECT id FROM users WHERE email = ?",[email], function(err, rows){					
					userid = rows[0].id;
					
					var newAdminMysql = {
						name: name,
						userid: userid
					};
					var insertAdminQuery = "INSERT INTO admins ( name, userid) values (?,?)";
					connection.query(insertAdminQuery, [newAdminMysql.name, newAdminMysql.userid],function(err, rows) {
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
			////console.log('rows: ' + rows);
			if (err)
				return done(err);
			if (!rows.length) {
				//req.flash('error_msg', 'Invalid email!');
				return done(null, false, {message: '0'}); // req.flash is the way to set flashdata using connect-flash
			}
			// if the user is found but the password is wrong
			if (!bcrypt.compareSync(password, rows[0].password))
				//req.flash('error_msg', 'Invalid password!');
				return done(null, false, {message: '1'}); // create the loginMessage and save it to session as flashdata

			// if the user is found but the password is wrong
			if (!rows[0].active)
			//req.flash('error_msg', 'User not yet confirmed!');
				return done(null, false, {message: '2'});

			// all is well, return successful user
			return done(null, rows[0]);
		});
	}
));

router.post('/login',
	passport.authenticate('local-login-admin', {
		successRedirect:'/admin/home', 
		failureRedirect:'/admin/login', 
		badRequestMessage:'' , 
		failureFlash: true
	})
);

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/admin/login');
});

//Customer Account
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

router.get('/accounts/customer/:userid', ensureAuthenticated, function(req, res){
	connection.query("select users.id, customers.firstname, customers.lastname, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber, customers.gender, "
			+ "customers.dateofbirth, users.active, users.verification from users inner join customers on" 
			+ " users.id = customers.userid where users.id = " + req.params.userid , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewcustomer', obj);
		}
	});
});

// Update Customer
router.get('/accounts/customer/:userid/save', function(req, res){
	res.render('admin/viewcustomer');
});

router.post('/accounts/customer/:userid/save',
	function(req, res) {
		connection.query("update users set active = " + req.body.active + " where id = " + req.params.userid , function(err, rows){
			if (err)
				throw err;
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/admin/accounts/customer/' + req.params.userid);
			}
		});
	}
);

router.get('/accounts/customer/:userid/delete', function(req, res){
	connection.query("delete from users where id = " + req.params.userid , function(err, rows){
		if (err)
			return done(err);
		else {
			req.flash('success_msg', 'Successfully deleted.');
			res.redirect('/admin/accounts/customer');
		}
	});
});

//View Admin
router.get('/myaccount', ensureAuthenticated, function(req, res){
	connection.query("select users.id, admins.name, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber " 
			+ "from users inner join admins where" 
			+ " users.id = admins.userid && users.id = 4" , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/myaccount', obj);
		}
	});
});

// Update Admin
router.get('/myaccount/save', function(req, res){
	res.render('admin/myaccount');
});

router.post('/myaccount/save',
	function(req, res) {
		connection.query("update users set phonenumber = ? , streetnumber = ? , streetname = ? , city = ? " 
						+ "where users.id = 4", [req.body.phonenumber, req.body.streetnumber,
							req.body.streetname, req.body.city], function(err, rows){
			if (err)
				throw err;
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/admin//myaccount');
				//res.redirect('/admin/accounts/customer');
			}
		});
	}
);

//Agency Account
router.get('/accounts/agency', ensureAuthenticated, function(req, res){
	connection.query("select agencies.name, users.email, users.active, " +  
	                 "users.verification, users.id from users inner join agencies on users.id = agencies.userid where users.role = 'agency';", function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/agencyaccounts', obj);
		}
	});
});

router.get('/accounts/agency/:userid', ensureAuthenticated, function(req, res){
	connection.query("select users.id, agencies.name, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber, "
			+ "users.active, users.verification from users inner join agencies on" 
			+ " users.id = agencies.userid where users.id = " + req.params.userid , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewagency', obj);
		}
	});
});

// Update Customer
router.get('/accounts/agency/:userid/save', function(req, res){
	res.render('admin/viewagency');
});

router.post('/accounts/agency/:userid/save',
	function(req, res) {
		connection.query("update users set active = " + req.body.active + " where id = " + req.params.userid , function(err, rows){
			if (err)
				return done(err);
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/admin/accounts/agency/' + req.params.userid);
			}
		});
	}
);

router.get('/accounts/agency/:userid/delete', ensureAuthenticated, function(req, res){
	connection.query("delete from users where id = " + req.params.userid , function(err, rows){
		if (err)
			throw err;
		else {
			req.flash('success_msg', 'Successfully deleted.');
			res.redirect('/admin/accounts/agency');
		}
	});
});

module.exports = router;