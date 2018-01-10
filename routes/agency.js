var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var random = require("random-js")();
var multer = require('multer');
var path = require('path');
var mime = require('mime');
//var upload = multer({ dest: 'uploads/' });
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'admin'
});
connection.query('USE touristappdatabase');

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

var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/uploads');
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + '.' + mime.getExtension(file.mimetype));
	}
});

var upload = multer({ storage: storage });

//Profile
router.get('/home', ensureAuthenticated, function(req, res){
	req.session.user = req.user.email;
	res.render('agency/home');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated() && req.user.role == 'agency'){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/login');
	}
}

// Register
router.get('/register', function(req, res){
	res.render('agency/register');
});

// Register
passport.use('local-agency', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done) {
		//console.log(email);
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
					role: 'agency'
                };

                var insertUserQuery = "INSERT INTO users ( email, password, streetnumber, streetname, city, phonenumber, role) values (?,?,?,?,?,?,?)";
                    //console.log(insertUserQuery);
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, 
                                newUserMysql.streetname, newUserMysql.city, newUserMysql.phonenumber, newUserMysql.role],function(err, rows) {
                        newUserMysql.id = rows.insertId;
                    });

                    connection.query("SELECT id FROM users WHERE email = ?",[email], function(err, rows){
                        userid = rows[0].id;
						code = random.integer(9999999, 99999999);
                        
                        var newAgencyMysql = {
                            name: name,
                            userid: userid
                        };
                        var insertAgencyQuery = "INSERT INTO agencies ( name, userid) values (?,?)";
                        //console.log(insertAgencyQuery);
                        connection.query(insertAgencyQuery, [newAgencyMysql.name, newAgencyMysql.userid],function(err, rows) {
						});
						
						connection.query("update users set code = " + code + " where id = " + userid ,function(err, rows) {
						});

						// setup e-mail data, even with unicode symbols
						var mailOptions = {
							from: '"TouristResApp " <touristreservationsystem@outlook.com>', // sender address (who sends)
							to: '' + email + '', // list of receivers (who receives)
							subject: 'RouristResApp - Email Verification ', // Subject line
							text: 'Hi ' + name + '! Please verify your email by clicking on the following link:  http://localhost:8080/agency/verifyemail/' + code, // plaintext body
							html: 'Hi ' + name + '! <br><br> Please verify your email by clicking on the following link: http://localhost:8080/agency/verifyemail/' + code // html body
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

                req.flash('success_msg', 'Please verify your email and await confirmation.');
            }
			return done(null, rows[0]);
		});
	}
));

router.post('/register',
    passport.authenticate('local-agency', {
        successRedirect:'/login', 
        failureRedirect:'/agency/register', 
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
				res.redirect('/login');
			});
		}
	});
});

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');
	req.session.destroy();
	res.redirect('/login');
});

//View Agency
router.get('/mydetails/', ensureAuthenticated, function(req, res){
	connection.query("select users.id, agencies.name, users.email," 
			+ " users.streetnumber, users.streetname, users.city, users.phonenumber " 
			+ "from users inner join agencies on" 
			+ " users.id = agencies.userid where users.email = ?", [req.session.user] , function(err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			res.render('agency/mydetails', obj);
		}
	});
});

// Update Agency
router.get('/mydetails/save', function(req, res){
	res.render('agency/mydetails');
});

router.post('/mydetails/save',
	function(req, res) {
		connection.query("update users set phonenumber = ? , streetnumber = ? , streetname = ? , city = ? " 
						+ "where users.email = ?", [req.body.phonenumber, req.body.streetnumber,
							req.body.streetname, req.body.city, req.session.user], function(err, rows){
			if (err)
				throw err;
			else {
				req.flash('success_msg', 'Successfully updated.');
				res.redirect('/agency/mydetails');
				//res.redirect('/admin/accounts/customer');
			}
		});
	}
);

//Buses
router.get('/bus', ensureAuthenticated, function(req, res){
	connection.query("select agencies.id from agencies inner join users on agencies.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		var agencyid = result[0].id;
		if(err){
			throw err;
		} else {
			connection.query("select buses.id, buses.name, buses.registrationnumber , buses.category, buses.numberofseats, " +  
							"buses.availability from buses where buses.agencyid = " + agencyid, function (err, result){
				if(err){
					throw err;
				} else {
					var obj = {};
					obj = {print: result};
					res.render('agency/viewbuses', obj);
				}
			});
		}
	});
});

router.get('/bus/add', ensureAuthenticated, function(req, res) {
	res.render('agency/addbus');
});

router.post('/bus/add', ensureAuthenticated, function(req, res) {
		connection.query("select agencies.id from agencies inner join users on agencies.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
			var agencyid = result[0].id;
			if(err){
				throw err;
			} else{
				var name = req.body.name;
				var registrationnumber = req.body.registrationnumber;
				var category = req.body.category;
				var numberofseats = req.body.numberofseats;
				var availability = req.body.availability;
				var busid; 
				var insertBusQuery = "insert into buses (name, registrationnumber, category, numberofseats, availability, agencyid) values (?,?,?,?,?,?)";
				connection.query(insertBusQuery, [name, registrationnumber, category, numberofseats, availability, agencyid], function(err, rows){
					//insertBusQuery.id = rows.insertId;
					busid = rows.insertId;
					if (err)
						throw err;
					else {
						req.flash('success_msg', 'Successfully added.');
						res.redirect('/agency/bus/' + busid);
					}
				});
			}
		});
	}
);

router.get('/bus/:busid', ensureAuthenticated, function(req, res){
	connection.query("select id, name, registrationnumber, category, numberofseats, "
					+ "availability from buses where id = " + req.params.busid, function (err, result){
		if(err){
			throw err;
		} else {
			var obj = {};
			obj = {print: result};
			//console.log('obj: ' + JSON.stringify(obj));
			res.render('agency/editbus', obj);
		}
	});
});

router.get('/bus/:busid/save', ensureAuthenticated, function(req, res){
	res.render('agency/editbus');
});

router.post('/bus/:busid/save', ensureAuthenticated, function(req, res){
	connection.query("update buses set availability = ? where id = ?", 
		[req.body.availability, req.params.busid], function (err, result){
		if(err){
			throw err;
		} else {
			req.flash('success_msg', 'Successfully updated.');
			res.redirect('/agency/bus/' + req.params.busid);
		}
	});
});

router.get('/bus/:busid/delete', ensureAuthenticated, function(req, res){
	connection.query("delete from buses where id = " + req.params.busid , function(err, rows){
		if (err)
			throw err;
		else {
			req.flash('success_msg', 'Successfully deleted.');
			res.redirect('/agency/bus');
		}
	});
});

//Packages
router.get('/package', ensureAuthenticated, function(req, res){
	connection.query("select agencies.id from agencies inner join users on agencies.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		var agencyid = result[0].id;
		if(err){
			throw err;
		} else {
			connection.query("select packages.id, packages.name, packages.description , packages.tourlength, packages.tourlength, " 
							+ "packages.departurelocation, packages.departuretime, packages.image, packages.cost, packages.packagedate" 
							+ " from packages where packages.agencyid = " + agencyid, function (err, result){
				if(err){
					throw err;
				} else {
					var obj = {};
					obj = {print: result};
					res.render('agency/viewpackages', obj);
				}
			});
		}
	});
});

router.get('/package/add', ensureAuthenticated, function(req, res) {
	connection.query("select agencies.id from agencies inner join users on agencies.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
		var agencyid = result[0].id;
		if(err){
			throw err;
		} else {
			connection.query("select buses.name from buses where buses.agencyid = " + agencyid, function (err, result){
				if(err){
					throw err;
				} else {
					var obj = {};
					obj = {print: result};
					res.render('agency/addpackage', obj);
				}
			});
		}
	});
});

router.post('/package/add', upload.single('image'), ensureAuthenticated, function(req, res) {
		connection.query("select agencies.id from agencies inner join users on agencies.userid = users.id where users.email = '" + req.session.user + "'" , function (err, result){
			console.log('add package req.body' + JSON.stringify(req.body));
			var agencyid = result[0].id;
			if(err){
				throw err;
			} else{
				var name = req.body.name;
				var description = req.body.description;
				var tourlength = req.body.tourlength;
				var departurelocation = req.body.departurelocation;
				var departuretime = req.body.departuretime;
				var image = req.file.filename;
				var cost = req.body.cost;
				var packagedate = req.body.packagedate;
				var lat = req.body.lat;
				var lon = req.body.lon;
				var busname = req.body.busname;
				var busid;
				var numberofseats;
				var packageid;
				var getBusQuery = "select buses.id, buses.numberofseats from buses where buses.name = ?";
				connection.query(getBusQuery, [busname], function(err, result){
					busid = result[0].id;
					numberofseats = result[0].numberofseats;
					var insertPackageQuery = "insert into packages (name, description, tourlength, departurelocation, departuretime, image, cost, packagedate, lon, lat, busid, agencyid) values (?,?,?,?,?,?,?,?,?,?,?,?)";
					connection.query(insertPackageQuery, [name, description, tourlength, departurelocation, departuretime, image, cost, packagedate, lon, lat, busid, agencyid], function(err, rows){
						if (err)
							throw err;
						else {
							console.log('packagerows' + JSON.stringify(rows));
							//insertPackageQuery.id = rows.insertId;
							packageid = rows.insertId;
							connection.query("call enterseats(?,?,?)", [numberofseats, busid, packageid],  function(err, rows){
								if(err){
									throw err;
								}
							});
							req.flash('success_msg', 'Successfully added.');
							res.redirect('/agency/package');
						}
					});
				});
			}
		});
	}
);

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
			connection.query("select buses.name as selectbusname from buses where buses.agencyid = " + agencyid, function (err1, result1){
				if(err1){
					throw err1;
				} else {
					obj = {print: result, print1: result1};
					console.log('obj: ' + JSON.stringify(obj));
			res.render('agency/editpackage', obj);
				}
			});
		}
	});
});

router.get('/package/:packageid/save', ensureAuthenticated, function(req, res){
	res.render('agency/editpackage');
});

router.post('/package/:packageid/save',  upload.single('image'), ensureAuthenticated, function(req, res){
	console.log('saved package req.file: ' + JSON.stringify(req.file));
	var packageid = req.params.packageid;
	var name = req.body.name;
	var description = req.body.description;
	var tourlength = req.body.tourlength;
	var departurelocation = req.body.departurelocation;
	var departuretime = req.body.departuretime;
	var image = null; if (req.file != null) image = req.file.filename;
	var cost = req.body.cost;
	var packagedate = req.body.packagedate;
	var busname = req.body.busname;
	var getBusQuery = "select buses.id from buses where buses.name = ?";
	connection.query(getBusQuery, [busname], function(err, result){
		var busid = result[0].id;
		var updateQuery;
		if (image == null) {
			connection.query("update packages set name = ?, description = ?, tourlength = ?, departurelocation = ?," 
					+ " departuretime = ?, cost = ?, packagedate = ?, busid = ? where id = ?", 
					[name, description, tourlength, departurelocation, departuretime, cost, packagedate, busid, packageid], function (err, result){
				if(err){	
					throw err;
				} else {
					req.flash('success_msg', 'Successfully added.');
					res.redirect('/agency/package/' + req.params.packageid);
				}
			});
		} else {
			connection.query("update packages set name = ?, description = ?, tourlength = ?, departurelocation = ?," 
					+ " departuretime = ?, image = ?, cost = ?, packagedate = ?, busid = ? where id = ?", 
					[name, description, tourlength, departurelocation, departuretime, image, cost, packagedate, busid, packageid], function (err, result){
				if(err){	
					throw err;
				} else {
					req.flash('success_msg', 'Successfully added.');
					res.redirect('/agency/package/' + req.params.packageid);
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
			res.redirect('/agency/package');
		}
	});
});

module.exports = router;