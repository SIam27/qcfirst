var express = require('express');
var connection  = require('../db/mysql');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (!req.session.loggedin || req.session.role !== 'superadmin') {
        req.flash('success', 'You must be logged in as an admin');
        res.redirect('back');
    }
    res.render('admin/index', { title: 'QCFIRST Admin' });
});

/* GET users list page. */
router.get('/users-list', function(req, res, next) {
    if (!req.session.loggedin || req.session.role !== 'superadmin') {
        req.flash('success', 'You must be logged in as an admin');
        res.redirect('back');
    }
    connection.query('SELECT * FROM tbl_user', function(err, rows, fields) {
        if(err) throw err;
        res.render('admin/users_list', { title: 'Users List', usersData: rows });
    });
});

/* GET users courses list page. */
router.get('/courses-list/:id/:name', function(req, res, next) {
    if (!req.session.loggedin || req.session.role !== 'superadmin') {
        req.flash('success', 'You must be logged in as an admin');
        res.redirect('back');
    }
    if(req.params.id == 0 && req.params.name == 0) {
        connection.query('SELECT * FROM tbl_course', function(err, rows, fields) {
            if(err) throw err;
            res.render('admin/courses_list', { title: 'Courses List', coursesData: rows, name: 0 });
        });
    }else {
        connection.query('SELECT * FROM tbl_course WHERE user_id = ?', [req.params.id], function(err, rows, fields) {
            if(err) throw err;
            res.render('admin/courses_list', { title: 'Courses List', coursesData: rows, name: req.params.name });
        });
    }
});


// GET roaster for each course
router.get('/roaster/:id/:course_name', function(req, res, next) {
    if (!req.session.loggedin || req.session.role !== 'superadmin') {
      req.flash('success', 'You must be logged in as an admin');
      res.redirect('back');
    }
    connection.query('SELECT * FROM tbl_enroll INNER JOIN tbl_user ON tbl_enroll.user_id = tbl_user.id WHERE course_id = ?', [req.params.id], function(err, rows, fields) {
      if(err) throw err;
      res.render('admin/roaster', { title: 'Roaster', studentsData: rows, course_name: req.params.course_name });
    });
});
  

module.exports = router;