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

// Register User - Customer
router.post('/register', function(req, res){
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
    
    // Validation
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('firstname', 'First Name is required').notEmpty();
    req.checkBody('lastname', 'Last Name is required').notEmpty();
    req.checkBody('streetnumber', 'Street Number is required').notEmpty();
    req.checkBody('streetname', 'Street Name is required').notEmpty();
    req.checkBody('city', 'City is required').notEmpty();
    req.checkBody('gender', 'Gender is required').notEmpty();
    req.checkBody('phonenumber', 'Phone Number is required').notEmpty();
    req.checkBody('dateofbirth', 'Date of Birth is required').notEmpty();
    
    var errors = req.validationErrors();

    if(errors){
        res.render('customer/register',{
			errors:errors
		});
    } else {
        connection.query('SELECT email FROM users WHERE email = ?', [email], function(err, rows){
            if (err) 
                return done(err);
            if (rows.length) {
                return done(null, false, req.flash('success', 'That email already exists.'));
            }else {
                var newUserMysql = {
                    email: email,
                    password: bcrypt.hashSync(password, null, null),
                    active: 0
                };
        
                var insertUserQuery = "INSERT INTO users ( email, password ) values (?,?)";
                    console.log(insertUserQuery);
                    connection.query(insertUserQuery,[newUserMysql.email, newUserMysql.password, newUserMysql.active],function(err, rows) {
                        newUserMysql.id = rows.insertId;
                        return done(null, newUserMysql);
                    });
        
                var newCustomerMysql = {
                    firstname: firstname,
                    lastname: lastname,
                    streetnumber: streetnumber,
                    streetname: streetname,
                    city: city,
                    gender: gender,
                    phonenumber: phonenumber,
                    dateofbirth: dateofbirth,
                    userid: newUserMysql.id
                };
        
                var insertCustomerQuery = "INSERT INTO users ( firstname, lastname, streetnumber, streetname, city, gender, phonenumber, dateofbirth, userid: newUserMysql.id ) values (?,?,?,?,?,?,?,?,?)";
                console.log(insertCustomerQuery);
                connection.query(insertCustomerQuery, [newCustomerMysql.firstname, newCustomerMysql.lastname, newCustomerMysql.streetnumber, newCustomerMysql.streetname,
                                    newCustomerMysql.city, newCustomerMysql.gender, newCustomerMysql.phonenumber, newCustomerMysql.dateofbirth, newCustomerMysql.userid],function(err, rows) {
                    newCustomerMysql.id = rows.insertId;
                    return done(null, newCustomerMysql);
                });
        
                req.flash('success_msg', 'You are registered. Please await confirmation.');
                //res.redirect('/login');
            }
        });
    
    }    
});

module.exports = router;