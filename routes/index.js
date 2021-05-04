var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // if (!req.session.loggedin) {
  //   req.flash('success', 'Please login first.');
  //   res.redirect('/users/login');
  // }
    
  res.render('index', { title: 'QCFIRST' });
});

router.get('/course-list', function(req, res, next) {
  res.render('CourseList', { title: 'Course List' });
});

/* GET enrollment page. */
router.get('/enrollment', function(req, res, next) {

  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }

  if(req.session.role == 'student')
    res.render('enrollment', { title: 'Enrollment' });

  res.send('You don\'t have permissions to view page.');
});

router.get('/course-management', function(req, res, next) {

  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }

  if(req.session.role == 'instructor')
    res.render('course_management', { title: 'Course Management' });

  res.send('You don\'t have permissions to view page.');
});

module.exports = router;
