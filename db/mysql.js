var mysql = require('mysql');
var config = require("../config");

// Mysql connect
//var connection = mysql.createConnection(config.mysql.options);




var connection = mysql.createPool(config.mysql.options);

connection.on('connection', function (connection) {
    console.log('DB Connection established');
  
    connection.on('error', function (err) {
      console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
      console.error(new Date(), 'MySQL close', err);
    });
  
  });





module.exports = connection; 

