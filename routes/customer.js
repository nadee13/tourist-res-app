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

// Register
router.get('/register', function(req, res){
	res.render('customer/register');
});

//passport.serializeUser(function(user, done) {
	//done(null, user.id);
//	});

//passport.deserializeUser(function(id, done) {
//	connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
//		done(err, rows[0]);
//	})
//});

// Login
passport.use(new LocalStrategy({
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
                var gender = req.body.gender;
                var phonenumber = req.body.phonenumber;
                var dateofbirth = req.body.dateofbirth;
                var userid;
                
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    active: 0
                };

                var insertUserQuery = "INSERT INTO users ( email, password, active ) values (?,?,?)";
                    console.log(insertUserQuery);
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.active],function(err, rows) {
                        newUserMysql.id = rows.insertId;
                        //return done(null, newUserMysql);
                    });

                    connection.query('SELECT id FROM users WHERE email = "nadeeshawi13@gmail.com"', function(err, rows){
                        userid = rows[0].id;
                        
                        var newCustomerMysql = {
                            firstname: firstname,
                            lastname: lastname,
                            streetnumber: streetnumber,
                            streetname: streetname,
                            city: city,
                            gender: gender,
                            phonenumber: phonenumber,
                            dateofbirth: dateofbirth,
                            userid: userid
                        };
                        //console.log('newUserMysql.id: ' + newUserMysql.id);
                        var insertCustomerQuery = "INSERT INTO customers ( firstname, lastname, streetnumber, streetname, city, gender, phonenumber, dateofbirth, userid) values (?,?,?,?,?,?,?,?,?)";
                        console.log(insertCustomerQuery);
                        connection.query(insertCustomerQuery, [newCustomerMysql.firstname, newCustomerMysql.lastname, newCustomerMysql.streetnumber, newCustomerMysql.streetname,
                                            newCustomerMysql.city, newCustomerMysql.gender, newCustomerMysql.phonenumber, newCustomerMysql.dateofbirth, newCustomerMysql.userid],function(err, rows) {
                       
                            //return done(null, newCustomerMysql);
                        });
                    });

                req.flash('success_msg', 'You are registered. Please await confirmation.');
            }
			// all is well, return successful user
			return done(null, rows[0]);
		});
	}
));

// Register User - Customer
router.post('/register',
    passport.authenticate('local', {
        successRedirect:'/login', 
        failureRedirect:'/customer/register', 
        badRequestMessage:'Invalid Registration', 
        failureFlash: true
    })
);

module.exports = router;