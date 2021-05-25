var express = require('express');
var {check, validationResult} = require('express-validator');
var connection  = require('../db/mysql');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QCFIRST' });
});

// GET course list page
router.get('/course-list', function(req, res, next) {
  connection.query('SELECT * FROM tbl_course', function(err, rows, fields) {
    if(err) throw err;
    res.render('CourseList', { title: 'Course List', coursesData: rows });
  });
});

// GET instructor list page
router.get('/instructor-list', function(req, res, next) {
  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }
  connection.query('SELECT * FROM tbl_course WHERE user_id = ?', [req.session.user_id], function(err, rows, fields) {
    if(err) throw err;
    res.render('instructor_list', { title: 'Course List', coursesData: rows });
  });
});

// GET roaster for each course
router.get('/roaster/:id/:course_name', function(req, res, next) {
  if (!req.session.loggedin && req.session.role !== 'instructor') {
    req.flash('success', 'You must be logged in as an instructor');
    res.redirect('/users/login');
  }
  connection.query('SELECT * FROM tbl_enroll INNER JOIN tbl_user ON tbl_enroll.user_id = tbl_user.id WHERE course_id = ?', [req.params.id], function(err, rows, fields) {
    if(err) throw err;
    res.render('roaster', { title: 'Roaster', studentsData: rows, course_name: req.params.course_name });
  });
});

// POST search from the enrollment page
router.post('/search', function(req, res, next) {
  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }

  var department = req.body.department;
  var courseName = req.body.course_name;

  // create course name for the MYSQL like statement
  courseName = '%' + courseName + '%';
  connection.query('SELECT * FROM tbl_course INNER JOIN tbl_user ON tbl_course.user_id = tbl_user.id WHERE course_name LIKE N? AND department = ? LIMIT 10', [courseName, department], function(err, rows, fields) {
    if(err) throw err;
    // if course doesn't exist
    if (rows.length <= 0) {
      req.flash('error', 'No records found');
      res.redirect('/enrollment');
    }else {
      res.render('search', { title: 'Search List', coursesData: rows });
    }
  });
});

/* GET enrollment page. */
router.get('/enrollment', function(req, res, next) {

  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }

  if(req.session.role == 'student') {
    connection.query('SELECT * FROM tbl_enroll INNER JOIN tbl_course ON tbl_enroll.course_id = tbl_course.id WHERE tbl_enroll.user_id = ?', [req.session.user_id], function(err, rows, fields) {
      if(err) throw err;
      res.render('enrollment', { title: 'Enrollment', classesData: rows });
    });
  }else {
    res.send('You don\'t have permissions to view page.');
  }

});

/* POST enrollment page. */
router.post('/enrollment', function(req, res, next) {

  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }

  var department = req.body.department;
  var courseName = req.body.course_name;

  // create course name for the MYSQL like statement
  courseName = '%' + courseName + '%';
  connection.query('SELECT * FROM tbl_course WHERE course_name LIKE N? AND department = ? LIMIT 1', [courseName, department], function(err, rows, fields) {
    if(err) throw err;
    // if course doesn't exist
    if (rows.length <= 0) {
      // flash error
      req.flash('error', 'Course doesn\'t exist');
      res.redirect('/enrollment');
    }else if(Date.parse(rows[0]['deadline'])-Date.parse(new Date())<0) { 
      // flash error
      req.flash('error', 'The deadline is past');
      res.redirect('/enrollment');
    }else { 
      var courseId = rows[0].id;
      var courseCapacity = rows[0].capacity;
      // Check the capacity
      connection.query('SELECT * FROM tbl_enroll WHERE course_id = ?', [courseId], function(err, rows, fields) {
        if(err) throw err;
        if (rows.length >= courseCapacity) {
          req.flash('error', 'The capacity is full');
          res.redirect('/enrollment');
        }else {
          // Check if student is already enrolled
          connection.query('SELECT * FROM tbl_enroll WHERE user_id = ? AND course_id = ? LIMIT 1', [req.session.user_id, courseId], function(err, rows, fields) {
            if(err) throw err;
            if (rows.length <= 0) {
              // Enroll the student
              connection.query('INSERT INTO tbl_enroll SET ?', {user_id: req.session.user_id, course_id: courseId});
              // Capacity udpate
              connection.query('UPDATE tbl_course SET capacity = ? WHERE id = ?', [courseCapacity-1, courseId]);
              //flash success
              req.flash('success', 'You are successfully enrolled!');
              res.redirect('/enrollment');
            }
            else {
              // flash error
              req.flash('error', 'You are already enrolled in this course');
              res.redirect('/enrollment');
            }
          });
        }
      });
    }            
  });
});

// GET course management page
router.get('/course-management', function(req, res, next) {

  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }
  // only instructor is allowed to access this page
  if(req.session.role == 'instructor') {
    var sql = 'SELECT * FROM tbl_course WHERE user_id='+req.session.user_id;
    connection.query(sql, function (err, data, fields) {
      if (err) throw err;
      res.render('course_management', { title: 'Course Management.pug', courseData: data});
    });
  }else {
    res.send('You don\'t have permissions to view page.');
  }
});

// POST course-management page
router.post('/course-management' ,[
  // Form validation
  check('course_name').isLength({ min: 3 }).trim().escape().withMessage('Course name must have more than 3 characters'),
  check('department').isLength({ min: 1 }).trim().escape().withMessage('Department cannot be empty'),
  check('semester').isLength({ min: 1 }).trim().escape().withMessage('Semester cannot be empty'),
  check('capacity').isLength({ min: 1 }).trim().escape().withMessage('Capacity cannot be empty'),
  check('schedule').isLength({ min: 1 }).trim().escape().withMessage('Schedule cannot be empty'),
  check('deadline').isLength({ min: 1 }).trim().escape().withMessage('Deadline cannot be empty'),
], function(req, res, next) {

  const errors = validationResult(req);

   // When form validation is successfull
   if (errors.errors.length == 0) {
    // Assign values
    var course = {
      course_name: req.body.course_name.trim(),
      department: req.body.department.trim(),
      semester: req.body.semester.trim(),
      capacity: req.body.capacity.trim(),
      schedule: req.body.schedule.trim(),
      deadline: req.body.deadline.trim(),
      description: req.body.description.trim(),
      user_id: req.session.user_id
    }
    // Insert into the database
    connection.query('INSERT INTO tbl_course SET ?', course, function(err, result) {
      //if(err) throw err
      if (err) {
          req.flash('error', err.message)
          res.redirect('/course-management');
      } else {
          // success flash message
          req.flash('success', 'Successfully created!');
          res.redirect('/course-management');
      }
    });
   }else { // Generate errors
      var error_msg = ''
      for (const error of errors.errors) {
          error_msg += '* '+error.msg + '<br />';
      }
      // set flash errors
      req.flash('error', error_msg);
    }
});

// POST course-remove page
router.post('/remove-course', function(req, res, next) {
  if (!req.session.loggedin) {
    req.flash('success', 'Please login first.');
    res.redirect('/users/login');
  }else {
    var sql = 'DELETE FROM tbl_course WHERE user_id='+req.session.user_id+' AND id='+req.body.course_id.trim();
    connection.query(sql, function (err, data, fields) {
      if (err) throw err;
      req.flash('success', 'Deleted successfully.');
      res.redirect('/course-management');
    });
  }
});

module.exports = router;
