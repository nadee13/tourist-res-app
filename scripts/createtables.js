  //\connect mysql://root@localhost:3306
const express = require('express');
const app = express();
	
let mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'touristAppDatabase'
});

connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySQL server.');

    var createUser = `create table if not exists users(
      id int primary key auto_increment,
      email varchar(255) not null,
      userpassword char(60) not null,
      active tinyint(1),
      role varchar(100) 
    )`;    

    var createCustomer = `create table if not exists customers(
      id int primary key auto_increment,
      firstname varchar(255) not null,
      lastname varchar(255) not null,
      streetnumber varchar(255) not null,
      streetname varchar(255) not null,
      city varchar(255) not null,
      gender varchar(255) not null,
      phonenumber varchar(255) not null,
      dateofbirth date,
      userid INT NOT NULL,
      FOREIGN KEY (userid)
        REFERENCES users (id)
        ON DELETE CASCADE
    )`;

  connection.query(createUser, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("User table created");
  });

  connection.query(createCustomer, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Customer table created");
  });
});

  // connection.end(function(err) {
  //   if (err) {
  //     return console.log('error:' + err.message);
  //   }
  //   console.log('Close the database connection.');
  // });

