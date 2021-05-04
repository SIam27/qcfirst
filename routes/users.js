var express = require('express');
var {check, validationResult} = require('express-validator');
var connection  = require('../db/mysql');
var router = express.Router();

/* 
  GET users login form. 
*/
router.get('/login', function(req, res, next) {

  if (req.session.loggedin) {
    req.flash('error', 'You are already logged in.');
    res.redirect('/');
  }
  res.render('users/login', {
    title: 'Sign in',
    email: '',
    password: ''    
  })
});

/* 
  POST users login form. 
*/
router.post('/login', function(req, res, next) {

  // posted form data
  var email = req.body.email;
  var password = req.body.password;

  connection.query('SELECT * FROM tbl_user WHERE email = ? AND password = ?', [email, password], function(err, rows, fields) {
    if(err) throw err;
    // if user doesn't exist
    if (rows.length <= 0) {
      // flash error
      req.flash('error', 'Email and Password doesn\'t match!');
      res.redirect('/users/login');
    }
    else { 
      // if user exist
      // Redirect user to home
      req.session.loggedin = true;
      req.session.name = rows[0].first_name;
      req.session.role = rows[0].role;

      console.log(req.session.role);

      if(rows[0].role == 'instructor')
        res.redirect('/course-management');
      else
        res.redirect('/enrollment');
    }            
  });

});

/* 
  User logout
*/
router.get('/logout', function(req, res, next) {

  delete req.session.loggedin;
  delete req.session.name;
  delete req.session.role;
  req.flash('success', 'You are successfully logged out.');
  res.redirect('/users/login');
});

/* 
  GET users registration form. 
*/
router.get('/register', function(req, res, next) {

  if (req.session.loggedin) {
    req.flash('error', 'You are already logged in.');
    res.redirect('/');
  }
  res.render('users/register', {
    title: 'Signup',
    email: '',
    password: ''    
  })
});

/* 
  POST users registration form. 
*/
router.post('/register', [
    // Form validation
    check('first_name').isLength({ min: 3 }).trim().escape().withMessage('First name must have more than 3 characters'),
    check('last_name').isLength({ min: 3 }).trim().escape().withMessage('Last name must have more than 3 characters'),
    check('email', 'Your email is not valid').isEmail().trim().escape().custom(userEmail => {
    console.log(userEmail);
      // Check if the email is unique
      // https://stackoverflow.com/questions/53344332/express-validator-check-if-email-existed-with-mysql
      return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM tbl_user WHERE `email` = ?", [userEmail], (err, rows, fields) => {
          if (rows.length != 0) {
            reject(new Error('Email already exists.'))
          }else {
            resolve(true)
          }
        });
      });

  }),
    check('password').isLength({ min: 6 }).trim().escape().withMessage('Your password must be at least 6 characters'),
    check('cpassword', 'Passwords do not match').trim().escape().custom((value, {req}) => (value === req.body.password)),
  ], function(req, res, next) {

  const errors = validationResult(req);
  // When form validation is successfull
  if (errors.errors.length == 0) { 
    //When there are no errors
    // Assign values
      var user = {
          first_name: req.body.first_name.trim(),
          last_name: req.body.last_name.trim(),
          email: req.body.email.trim(),
          password: req.body.password.trim(),
          role: req.body.role.trim(),
      }
      // Insert into the database
      connection.query('INSERT INTO tbl_user SET ?', user, function(err, result) {
          //if(err) throw err
          if (err) {
              req.flash('error', err)
              // render to views/user/add.ejs
              res.render('auth/register', {
                  title: 'Registration Page',
                  name: '',
                  password: '',
                  email: ''
              })
          } else {
              // success flash message
              req.flash('success', 'You have successfully signed up!');
              res.redirect('/users/login');
          }
      })
  } else { // Generate errors
      var error_msg = ''
      for (const error of errors.errors) {
          error_msg += '* '+error.msg + '<br />';
      }
      // set flash errors
      req.flash('error', error_msg)

      res.render('users/register', {
          title: 'Signup',
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
      })
  }

});

module.exports = router;
