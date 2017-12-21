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
                var userid;
                
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    streetnumber: streetnumber,
                    streetname: streetname,
                    city: city,
                    phonenumber: phonenumber
                };

                var insertUserQuery = "INSERT INTO users ( email, password, streetnumber, streetname, city, phonenumber) values (?,?,?,?,?,?)";
                    console.log(insertUserQuery);
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.streetnumber, 
                                newUserMysql.streetname, newUserMysql.city, newUserMysql.phonenumber],function(err, rows) {
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
        successRedirect:'/login', 
        failureRedirect:'/agency/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

module.exports = router;