  //\connect mysql://root@localhost:3306
  //\use touristappdatabase
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
      return //console.error('error: ' + err.message);
    }
    //console.log('Connected to the MySQL server.');

    var createUser = `create table if not exists users(
      id int primary key auto_increment,
      email varchar(255) not null,
      password char(60) not null,
      streetnumber varchar(255) not null,
      streetname varchar(255) not null,
      city varchar(255) not null,
      phonenumber varchar(255) not null,
      active tinyint(1) default '0',
      role varchar(255) default null,
      verification tinyint(1) default '0',
      code varchar(100) default null
    )`;    

    var createCustomer = `create table if not exists customers(
      id int primary key auto_increment,
      firstname varchar(255) not null,
      lastname varchar(255) not null,
      gender varchar(255) not null,
      dateofbirth date,
      userid INT NOT null,
      foreign key (userid)
        references users (id)
        on delete cascade
    )`;

    var createAgency = `create table if not exists agencies(
      id int primary key auto_increment,
      name varchar(255) not null,
      userid INT NOT null,
      foreign key (userid)
        references users (id)
        on delete cascade
    )`;

    var createAdmin = `create table if not exists admins(
      id int primary key auto_increment,
      name varchar(255) not null,
      userid INT NOT null,
      foreign key (userid)
        references users (id)
        on delete cascade
    )`;

    var createBus = `create table if not exists buses(
      id int primary key auto_increment,
      name varchar(255) not null,
      registrationnumber varchar(255) not null,
      category varchar(255) not null,
      numberofseats int not null,
      availability tinyint(1) default '0',
      agencyid INT NOT null,
      foreign key (agencyid)
        references agencies (id)
        on delete cascade
    )`;

    var createPackage = `create table if not exists packages(
      id int primary key auto_increment,
      name varchar(255) not null,
      description varchar(255) not null,
      tourlength varchar(255) not null,
      departurelocation varchar(255) not null,
      departuretime varchar(255) not null,
      image blob,
      costadult decimal(19, 4),
      costchild decimal(19, 4),
      agencyid INT NOT null,
      foreign key (agencyid)
        references agencies (id)
        on delete cascade
    )`;

    connection.query(createUser, function(err, result) {
    if (err) {
      //console.log(err.message);
    }
    //console.log("User table created");
  });

  connection.query(createCustomer, function(err, result) {
    if (err) {
      //console.log(err.message);
    }
    //console.log("Customer table created");
  });

  connection.query(createAgency, function(err, result) {
    if (err) {
      //console.log(err.message);
    }
    //console.log("Agency table created");
  });

  connection.query(createAdmin, function(err, result) {
    if (err) {
      //console.log(err.message);
    }
    //console.log("Admin table created");
  });

  connection.query(createBus, function(err, result) {
    if (err) {
      //console.log(err.message);
    }
    //console.log("Bus table created");
  });

  connection.query(createPackage, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Package table created");
  });
});

  // connection.end(function(err) {
  //   if (err) {
  //     return //console.log('error:' + err.message);
  //   }
  //   //console.log('Close the database connection.');
  // });

