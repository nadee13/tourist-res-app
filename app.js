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
      username varchar(255) not null,
      userpassword varchar(255) not null
  )`;    

  connection.query(createUser, function(err, result) {
    if (err) {
      console.log(err.message);
    }
    console.log("Table created");
});
});

app.use(express.bodyParser());

app.listen(3000,function(){
  console.log('Node server running @ http://localhost:3000')
});

  // connection.end(function(err) {
  //   if (err) {
  //     return console.log('error:' + err.message);
  //   }
  //   console.log('Close the database connection.');
  // });

  //\connect mysql://root@localhost:3306