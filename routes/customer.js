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
	res.render('customer/home');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');// //
		res.redirect('/customer/login');
	}
}

//Register
router.get('/register', function(req, res){
	res.render('customer/register');
});

passport.use('local-customer', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
			if (err){
				return done(err);
			}
			if (rows.length) {
				req.flash('error_msg', 'Email already exists!'); // //
				return done(null, false, {message: ''}); // req.flash is the way to set flashdata using connect-flash
			}else{
                var email = req.body.email;
                var password = req.body.password;
                var firstname = req.body.firstname;
                var lastname = req.body.lastname;
                var streetnumber = req.body.streetnumber;
                var streetname = req.body.streetname;
                var city = req.body.city;
                var gender = req.body.gender;
                var phonenumber = req.body.phonenumber;
				var dateofbirth = req.body.dateofbirth;
				var role;
                var userid;
                
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    streetnumber: streetnumber,
                    streetname: streetname,
                    city: city,
					phonenumber: phonenumber,
					role: 'customer'
                };

                var insertUserQuery = "INSERT INTO users ( email, password, streetnumber, streetname, city, phonenumber, role ) values (?,?,?,?,?,?,?)";
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, newUserMysql.streetname,
                        newUserMysql.city, newUserMysql.phonenumber, newUserMysql.role],function(err, rows) {
                        newUserMysql.id = rows.insertId;
                    });

                    connection.query("SELECT id FROM users WHERE email = ?",[email], function(err, rows){
                        userid = rows[0].id;
                        
                        var newCustomerMysql = {
                            firstname: firstname,
                            lastname: lastname,
                            gender: gender,
                            dateofbirth: dateofbirth,
                            userid: userid
                        };
                        var insertCustomerQuery = "INSERT INTO customers ( firstname, lastname, gender, dateofbirth, userid) values (?,?,?,?,?)";
                        connection.query(insertCustomerQuery, [newCustomerMysql.firstname, newCustomerMysql.lastname, newCustomerMysql.gender, newCustomerMysql.dateofbirth, newCustomerMysql.userid],function(err, rows) {
                        });
                    });

                req.flash('success_msg', 'Please verify your email and await confirmation.'); // //
            }
			return done(null, rows[0]);
		});
	}
));

router.post('/register',
    passport.authenticate('local-customer', {
        successRedirect:'/customer/login', 
        failureRedirect:'/customer/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

//Login
router.get('/login', function(req, res){
	res.render('customer/login');
});

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
		done(err, rows[0]);
	})
});

passport.use('local-login-customer', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		connection.query("SELECT * FROM users where email = ? && role = 'customer'",[email], function(err, rows){
			if (err)
				return done(err);
			if (rows[0]==null) 
				//req.flash('error_msg', 'Invalid email!'); //
				return done(null, false,  req.flash('Invalid email!')); // req.flash is the way to set flashdata using connect-flash
			

			// if the user is found but the password is wrong
			if (!bcrypt.compareSync(password, rows[0].password))
				//req.flash('error_msg', 'Invalid password!'); //
				return done(null, false, req.flash('error_msg', 'Invalid password!')); // create the loginMessage and save it to session as flashdata

			// if the user is found but not confirmed
			if (!rows[0].active){
				//req.flash('error_msg', 'User not yet confirmed!');
				return done(null, false, req.flash('error_msg', 'User not yet confirmed!'));
			}
			// all is well, return successful user
			req.session.user = rows[0].email;
			return done(null, rows[0]);
		});
	}
));

router.post('/login',
	passport.authenticate('local-login-customer', {
		successRedirect:'/customer/home', 
		failureRedirect:'/customer/login', 
		badRequestMessage:'Please enter email and password' , 
		failureFlash: true
	}));

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');
	req.session.destroy();
	res.redirect('/customer/login');
});

//View Customer
router.get('/myaccount/', ensureAuthenticated, function(req, res){
	connection.query("select users.id, customers.firstname, customers.lastname, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber " 
			+ "from users inner join customers on" 
			+ " users.id = customers.userid where users.email = ?", [req.session.user] , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('customer/myaccount', obj);
		}
	});
});

// Update Customer
router.get('/myaccount/save', function(req, res){
	res.render('customer/myaccount');
});

router.post('/myaccount/save',
	function(req, res) {
		connection.query("update users set phonenumber = ? , streetnumber = ? , streetname = ? , city = ? " 
						+ "where users.email = ?", [req.body.phonenumber, req.body.streetnumber,
							req.body.streetname, req.body.city, req.session.user], function(err, rows){
			if (err)
				throw err;
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/customer/myaccount');
				//res.redirect('/admin/accounts/customer');
			}
		});
	}
);

module.exports = router;