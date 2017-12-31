var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var random = require("random-js")();
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'admin'
  });

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  var transporter = nodemailer.createTransport({
	host: "smtp-mail.outlook.com", // hostname
	secureConnection: false, // TLS requires secureConnection to be false
	port: 587, // port for secure SMTP
	tls: {
	   ciphers:'SSLv3'
	},
	auth: {
		user: 'touristreservationsystem@outlook.com',
		pass: 'trs12345'
	}
});

// setup e-mail data, even with unicode symbols

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
				var code;
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
						code = random.integer(9999999, 99999999);
                        
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
						
						connection.query("update users set code = " + code + " where id = " + userid ,function(err, rows) {
						});
					
													
						// setup e-mail data, even with unicode symbols
						var mailOptions = {
							from: '"TouristResApp " <touristreservationsystem@outlook.com>', // sender address (who sends)
							to: '' + email + '', // list of receivers (who receives)
							subject: 'RouristResApp - Email Verification ', // Subject line
							text: 'Hi ' + firstname + '! Please verify your email by clicking on the following link:  http://localhost:8080/customer/verifyemail/' + code, // plaintext body
							html: 'Hi ' + firstname + '! <br><br> Please verify your email by clicking on the following link: http://localhost:8080/customer/verifyemail/' + code // html body
						};

						// send mail with defined transport object
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
								return(error);
								//return console.log(error);
							}
							//console.log('Message sent: ' + info.response);
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

//Verify email
router.get('/verifyemail/:code' , function(req, res){
	var code = req.params.code;
	connection.query("SELECT * FROM users where code = ? ", [code], function(err, rows){
		if (err){
			return (err);
		}else {
			connection.query("update users set verification = 1 where id = " + rows[0].id ,function(err, rows) {
				req.flash('success_msg', 'Email verified!'); // req.flash is the way to set flashdata using connect-flash
				res.redirect('/customer/login');
			});
		}
	});
});


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

//Packages
router.get('/package', ensureAuthenticated, function(req, res){
	connection.query("select * from packages", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('customer/viewpackages', obj);
		}
	});
});

router.get('/package/:packageid', ensureAuthenticated, function(req, res){
	connection.query("select packages.*, buses.name as busname from packages inner join buses on packages.busid = buses.id"
					+ " where packages.id = " + req.params.packageid, function (err, result){
						console.log('result: ' + JSON.stringify(result));
						var agencyid = result[0].agencyid;
		if(err){
			throw err;
		} else {
			var obj = {};
			//console.log('obj: ' + JSON.stringify(obj));
			connection.query("select agencies.name as agencyname from agencies where agencies.id = " + agencyid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					//console.log('obj: ' + JSON.stringify(obj));
					res.render('customer/viewpackage', obj);
				}
			});
		}
	});
});

router.get('/package/:packageid/reserveseat', ensureAuthenticated, function(req, res){
	connection.query("select packages.id as packageid, packages.name as packagename from packages where packages.id = " + req.params.packageid, function (err, result){
						console.log('result: ' + JSON.stringify(result));
		if(err){
			throw err;
		} else {
			var obj = {};
			//console.log('obj: ' + JSON.stringify(obj));
			connection.query("select seats.* from seats inner join packages on seats.busid = packages.busid"
			+ " where packages.id = " + req.params.packageid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					//console.log('obj: ' + JSON.stringify(obj));
					res.render('customer/reserveseat', obj);
				}
			});
		}
	});
});

router.post('/package/:packageid/reserveseat', ensureAuthenticated, function(req, res){
	//console.log('req.body: ' + JSON.stringify(req.body));
	var seatnumbers = req.body.seatnumber;
	var selectedseats = seatnumbers.filter(seat => seat != "");
	var customerid;
	var seatid;
	var busid
	var packageid = req.params.packageid;
	connection.query("select customers.id from customers inner join users on customers.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		customerid = result[0].id;
		if(err){
			throw err;
		}
	});
	connection.query("select busid from packages where packages.id = " + packageid , function (err1, result1){
						//console.log('result: ' + JSON.stringify(result));
		busid = result1[0].busid;
		if(err1){
			throw err1;
		} else {
			for (var i = 0; i < selectedseats.length; i++){
				var seat = selectedseats[i];
				connection.query("update seats set status = 1 where busid = ? && number = ?",  [busid, seat], function (err2, rows2){
					console.log('seatid: ' + seatid);
					console.log('rows2: ' + JSON.stringify(rows2));
					if(err2){
						throw err2;
					}else{
						connection.query("select seats.id as seatid from seats where seats.number = ? && seats.busid = ?", [seat, busid], function (err3, result3){
							console.log('result3: ' + JSON.stringify(result3));
							console.log('result3[0]: ' + JSON.stringify(result3[0]));
							seatid = result3[0].seatid;
							console.log('seatid: ' + seatid);
							connection.query("insert into reservations (seatid, customerid, packageid, confirm) values (?,?,?,?)", [seatid, customerid, packageid, 0], function (err4, rows4){
								if(err4){
									throw err4;
								}
							});
						});
					}
				});
			}
			//res.render('customer/reserveseat', obj);
			res.redirect('/customer/reservation')
		}
	});
});

//Reservations
router.get('/reservation', ensureAuthenticated, function(req, res){
	var customerid;
	connection.query("select customers.id as customerid from customers inner join users on customers.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		customerid = result[0].id;
		if(err){
			throw err;
		}
	});
	connection.query("select customers.id as customerid from customers inner join users on customers.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		customerid = result[0].id;
		if(err){
			throw err;
		}
	});
	connection.query("select customers.id as customerid from customers inner join users on customers.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		customerid = result[0].id;
		if(err){
			throw err;
		}
	});
	connection.query("select * from reservations where reservations.customerid = " + customerid, function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('customer/viewpackages', obj);
		}
	});
});

module.exports = router;