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
	req.session.user = req.user.email;
	res.render('admin/home');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated() && req.user.role == 'admin'){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/login');
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
        successRedirect:'/login', 
        failureRedirect:'/admin/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/login');
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
router.get('/mydetails', ensureAuthenticated, function(req, res){
	connection.query("select users.id, admins.name, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber " 
			+ "from users inner join admins where" 
			+ " users.id = admins.userid && users.id = 4" , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/mydetails', obj);
		}
	});
});

// Update Admin
router.get('/mydetails/save', function(req, res){
	res.render('admin/mydetails');
});

router.post('/mydetails/save',
	function(req, res) {
		connection.query("update users set phonenumber = ? , streetnumber = ? , streetname = ? , city = ? " 
						+ "where users.id = 4", [req.body.phonenumber, req.body.streetnumber,
							req.body.streetname, req.body.city], function(err, rows){
			if (err)
				throw err;
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/admin//mydetails');
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

//Buses
router.get('/bus', ensureAuthenticated, function(req, res){
	connection.query("select buses.id, buses.name, buses.registrationnumber, buses.category, buses.numberofseats, " +  
					"buses.availability from buses", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewbuses', obj);
		}
	});
});

router.get('/bus/:busid', ensureAuthenticated, function(req, res){
	connection.query("select id, name, registrationnumber, category, numberofseats, "
					+ "availability from buses where id = " + req.params.busid, function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			//console.log('obj: ' + JSON.stringify(obj));
			res.render('admin/editbus', obj);
		}
	});
});

router.get('/bus/:busid/delete', ensureAuthenticated, function(req, res){
	connection.query("delete from buses where id = " + req.params.busid , function(err, rows){
		if (err)
			throw err;
		else {
			req.flash('success_msg', 'Successfully deleted.');
			res.redirect('/admin/bus');
		}
	});
});


//Packages
router.get('/package', ensureAuthenticated, function(req, res){
	connection.query("select packages.id, packages.name, packages.description , packages.tourlength, packages.tourlength, " 
					+ "packages.departurelocation, packages.departuretime, packages.image, packages.cost, packages.packagedate" 
					+ " from packages where packagedate >= curdate()", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewpackages', obj);
		}
	});
});

router.get('/package/:packageid/edit', ensureAuthenticated, function(req, res){
	connection.query("select packages.*, buses.name as busname from packages inner join buses on packages.busid = buses.id"
					+ " where packages.id = " + req.params.packageid, function (err, result){
						console.log('result: ' + JSON.stringify(result));
						var agencyid = result[0].agencyid;
		if(err){
			throw err;
		} else {
			var obj = {};
			//console.log('obj: ' + JSON.stringify(obj));
			connection.query("select buses.name as selectbusname from buses where buses.agencyid = " + agencyid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					console.log('obj: ' + JSON.stringify(obj));
					res.render('admin/editpackage', obj);
				}
			});
		}
	});
});

router.get('/package/:packageid/view', ensureAuthenticated, function(req, res){
	connection.query("select packages.*, buses.name as busname from packages inner join buses on packages.busid = buses.id"
					+ " where packages.id = " + req.params.packageid, function (err, result){
						var agencyid = result[0].agencyid;
		if(err){
			throw err;
		} else {
			var obj = {};
			connection.query("select agencies.name as agencyname from agencies where agencies.id = " + agencyid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					res.render('admin/viewpackage', obj);
				}
			});
		}
	});
});


router.get('/package/:packageid/reserveseat', ensureAuthenticated, function(req, res){
	connection.query("select packages.id as packageid, packages.name as packagename, buses.name as busname, buses.*, agencies.name as agencyname, agencies.* from packages inner join buses on packages.busid = buses.id inner join agencies on agencies.id = packages.agencyid where packages.id = " + req.params.packageid, function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			//console.log('obj: ' + JSON.stringify(obj));
			connection.query("select seats.* from seats where packageid = " + req.params.packageid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					console.log('seatsobj: ' + JSON.stringify(obj));
					res.render('admin/reserveseat', obj);
				}
			});
		}
	});
});

router.get('/package/:packageid/delete', ensureAuthenticated, function(req, res){
	connection.query("delete from packages where id = " + req.params.packageid , function(err, rows){
		if (err)
			throw err;
		else {
			req.flash('success_msg', 'Successfully deleted.');
			res.redirect('/admin/package');
		}
	});
});

router.post('/accounts/customer/search', ensureAuthenticated, function(req, res){
	var search = req.body.search;
	var criteria = req.body.criteria;
	connection.query("select customers.firstname, customers.lastname, users.email, users.active, " +  
					 "users.verification, users.id from users inner join customers on users.id = customers.userid"+
					 " where users.role = 'customer' && "+ criteria +" = '" +  search + "';", function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/customeraccounts', obj);
		}
	});
});

router.post('/bus/search', ensureAuthenticated, function(req, res){
	var search = req.body.search;
	var criteria = req.body.criteria;
	if(criteria == 'availability'){
		if(search == 'available'){
			search = 1;
		}
		if(search == 'not available'){
			search = 0;
		}
	}
	connection.query("select buses.id, buses.name, buses.registrationnumber, buses.category, buses.numberofseats, " +  
					"buses.availability from buses where "+ criteria +" = '" +  search + "';", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewbuses', obj);
		}
	});
});

router.post('/reservation/search', ensureAuthenticated, function(req, res){
	var search = req.body.search;
	var criteria = req.body.criteria;
	if(criteria == 'confirm'){
		if(search == 'confirmed'){
			search = 1;
		}
		if(search == 'not confirmed'){
			search = 0;
		}
	}
	connection.query("select customers.firstname, reservations.id as reservationid, reservations.packageid, reservations.confirm, reservations.ticketnumber, seats.number as seatnumber, packages.*, users.email as customeremail from reservations " 
		+ "inner join users on users.id = (select customers.userid from customers where customers.id = reservations.customerid) "
		+ "inner join seats on seats.id = reservations.seatid "
		+ "inner join packages on packages.id = reservations.packageid " 
		+ "inner join customers on customers.id = reservations.customerid " 
		+ "where packages.packagedate >= curdate() && "+ criteria +" = '" +  search + "';", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			console.log('res obj: ' + JSON.stringify(obj));
			res.render('admin/viewreservations', obj);
		}
	});
});

router.post('/accounts/agency/search', ensureAuthenticated, function(req, res){
	var search = req.body.search;
	var criteria = req.body.criteria;
	connection.query("select agencies.name, users.email, users.active, " +  
					 "users.verification, users.id from users inner join agencies on users.id = agencies.userid" +
					 " where users.role = 'agency' && agencies.name = '" +  search + "';", function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/agencyaccounts', obj);
		}
	});
});

router.post('/package/search', ensureAuthenticated, function(req, res){
	var search = req.body.search;
	var criteria = req.body.criteria;
	connection.query("select packages.id, packages.name, packages.description , packages.tourlength, packages.tourlength, " 
					+ "packages.departurelocation, packages.departuretime, packages.image, packages.cost, packages.packagedate" 
					+ " from packages where packagedate >= curdate() && packages.name = '" +  search + "';", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('admin/viewpackages', obj);
		}
	});
});

//Reservations
router.get('/reservation', ensureAuthenticated, function(req, res){
	connection.query("select customers.firstname, reservations.id as reservationid, reservations.packageid, reservations.confirm, reservations.ticketnumber, seats.number as seatnumber, packages.*, users.email as customeremail from reservations " 
		+ "inner join users on users.id = (select customers.userid from customers where customers.id = reservations.customerid) "
		+ "inner join seats on seats.id = reservations.seatid "
		+ "inner join packages on packages.id = reservations.packageid " 
		+ "inner join customers on customers.id = reservations.customerid " 
		+ "where packages.packagedate >= curdate() ", function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			console.log('res obj: ' + JSON.stringify(obj));
			res.render('admin/viewreservations', obj);
		}
	});
});

router.get('/reservation/:reservationid/cancel', ensureAuthenticated, function(req, res){
	var reservationid = req.params.reservationid;
	var seatid;
	connection.query("select seatid from reservations where reservations.id = " + req.params.reservationid, function (err, result){
		seatid = result[0].seatid;
		if (err)
			throw err;
		else {
			connection.query("update seats set status = 0 where seats.id = " + seatid, function (err, result){
				if (err)
					throw err;
				else {
					connection.query("delete from reservations where id = " + req.params.reservationid, function (err, result){
						if (err)
							throw err;
						else {
							req.flash('success_msg', 'Successfully cancelled.');
							res.redirect('/admin/reservation');
						}
					});
				}
			});
		}
	});
	
});

module.exports = router;