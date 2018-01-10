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
      availability tinyint(1),
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
      image varchar(255) not null,
      cost decimal(19, 2),
      packagedate date,
      lon FLOAT( 10, 6 ) not null,
      lat FLOAT( 10, 6 ) not null,
      busid int not null,
      agencyid INT NOT null,
      foreign key (agencyid)
        references agencies (id)
        on delete cascade
    )`;

    var createSeat = `create table if not exists seats(
      id int primary key auto_increment,
      number int not null,
      status tinyint(1) default '0',
      busid int not null,
      packageid int not null,
      foreign key (busid)
      references buses (id)
      on delete cascade,
      foreign key (packageid)
      references packages (id)
      on delete cascade
    )`;

    var createReservation = `create table if not exists reservations(
      id int primary key auto_increment,
      confirm tinyint not null,
      ticketnumber varchar(100),
      seatid int not null,
      customerid int not null,
      packageid int not null,
      foreign key (seatid)
      references seats (id)
      on delete cascade,
      foreign key (customerid)
      references customers (id)
      on delete cascade,
      foreign key (packageid)
      references packages (id)
      on delete cascade
    )`;

    var createMarkers = `create table if not exists markers(
      id int primary key auto_increment,
      name varchar(255) not null,
      address varchar(255) not null,
      lat FLOAT( 10, 6 ) not null,
      lng FLOAT( 10, 6 ) not null,
      packageid int not null,
      foreign key (packageid)
      references packages (id)
      on delete cascade
    )`;

    var createProcedureGetCustomers = `CREATE PROCEDURE getallcustomers()
        BEGIN
        SELECT *  FROM customers;
        END
    `;

    var createProcedureEnterSeats = `create procedure enterseats (in numberofseats int, in busid int, in packageid int)
        begin
        declare a int default 1;
        simple_loop: loop
        insert into seats (number, status, busid, packageid) values (a, 0, busid, packageid);
        set a = a + 1;
        if a = (numberofseats + 1) then
        leave simple_loop;
        end if;
        end loop simple_loop;
        end
    `;

    

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
     // console.log(err.message);
    }
   // console.log("Package table created");
  });

  connection.query(createSeat, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Seat table created");
  });

  connection.query(createReservation, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Reservation table created");
  });

  connection.query(createMarkers, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Marker table created");
  });

  connection.query(createProcedureEnterSeats, function(err, result) {
    if (err) {
      console.log(err.message);
    }else{
      console.log("Enter seats procedure created");
    }
  });
});

  // connection.end(function(err) {
  //   if (err) {
  //     return //console.log('error:' + err.message);
  //   }
  //   //console.log('Close the database connection.');
  // });

