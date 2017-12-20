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
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var streetnumber = req.body.streetnumber;
    var streetname = req.body.streetname;
    var city = req.body.city;
    var gender = req.body.lastname;
    var email = req.body.email;
    var phonenumber = req.body.phonenumber;
    var dob = req.body.dob;
    
    // Validation
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    req.checkBody('firstname', 'First Name is required').notEmpty();
    req.checkBody('lastname', 'Last Name is required').notEmpty();
    req.checkBody('streetnumber', 'Street Number is required').notEmpty();
    req.checkBody('streetname', 'Street Name is required').notEmpty();
    req.checkBody('city', 'City is required').notEmpty();
    req.checkBody('gender', 'Gender is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('phonenumber', 'Phone Number is required').notEmpty();
    req.checkBody('dob', 'Date of Birth is required').notEmpty();
    

    var errors = req.validationErrors();

    if(errors){
         res.render('register',{
             errors:errors
         });
    } else {
        var newUserMysql = {
            username: username,
            password: bcrypt.hashSync(password, null, null) 
        };

    var insertQuery = "INSERT INTO users ( username, password ) values (?,?)";
        console.log(insertQuery);
        connection.query(insertQuery,[newUserMysql.username, newUserMysql.password],function(err, rows) {
        newUserMysql.id = rows.insertId;

        return done(null, newUserMysql);
    });

        // var newCustomer = new Customer({
        //     firstname: firstname,
        //     lastname: lastname,
        //     streetnumber: streetnumber,
        //     streetname: streetname,
        //     city: city,
        //     gender: lastname,
        //     email: email,
        //     phonenumber: phonenumber,
        //     dob: req.body.dob
        // });


        req.flash('success_msg', 'You are registered and can now login');
		res.redirect('/users/login');
                        
                    }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
        if (err)
            return done(err);
        if (!rows.length) {
            return done(null, false, {message: 'Invalid username'}); // req.flash is the way to set flashdata using connect-flash
        }

        // if the user is found but the password is wrong
        if (!bcrypt.compareSync(password, rows[0].password))
            return done(null, false, {message: 'Invalid password'}); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return done(null, rows[0]);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    connection.query("SELECT * FROM users WHERE id = " + id, function(err, rows){
        done(err, rows[0]);
    })
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login', badRequestMessage:'Please enter username and password' , failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});
module.exports = router;