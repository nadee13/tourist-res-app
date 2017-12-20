// app/routes.js
var bodyParser = require('body-parser');

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	var urlencodedParser = bodyParser.urlencoded({ extended: false })
	app.get('/', ensureAuthenticated, function(req, res){
        res.render('index');
    });
    
    function ensureAuthenticated(req, res, next){
        if(req.isAuthenticated()){
            return next();
        } else {
            req.flash('error_msg','You are not logged in');
            res.redirect('/login');
        }
    }

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the register page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// register ==============================
	// =====================================
	// show the register form
	app.get('/register', urlencodedParser, function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('register', { message: req.flash('registerMessage') });
	});

	// process the register form
	app.post('/register', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/register', // redirect back to the register page if there is an error
		failureFlash : true // allow flash messages
	 }),
	 	function(req, res) {
	 		console.log("hello");

	 		if (req.body.remember) {
	 		req.session.cookie.maxAge = 1000 * 60 * 3;
	 		} else {
	 		req.session.cookie.expires = false;
	 		}
	 		res.redirect('/');
	 	}
	);

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
