var express = require('express');
var jwt = require('jsonwebtoken');
const http = require('http');
const massive = require('massive');
var pg = require('pg');
var crypto = require('crypto');
var bodyParser = require('body-parser');

 
const app = express();
app.use(bodyParser.json());
massive({
  host: '127.0.0.1',
  port: 5432,
  database: 'lab2',
  user: '',
  password: ''
}).then(instance => {
  app.set('dbname', instance);


//GET request for products
app.get('/product', (req, res) => {
    req.app.get('dbname').products.find({}, {
      order: 'price asc'
    }).then(items => {
      res.json(items);
    });
  });

//GET request for user
app.get('/users/:username/:password', (req, res) => {
    var username = req.params.username;
    var password = req.params.password;
    req.app.get('dbname').users.where("username=$1 and hashed_password=crypt($2, hashed_password)",[username,password]).then(items => {
      res.json(items);
    });
});

//test
app.get('/api', function(req, res) {
  res.json({
    text: 'test'
  });
});

//LOGIN API
app.post('/api/login', function(req, res) {

  console.log(req.body)
    var username = req.body.username;
    var password = req.body.password;
    //console.log(password)
    req.app.get('dbname').users.where("username=$1 and hashed_password=crypt($2, hashed_password)",[username,password]).then(items => {
      
      if(items.length > 0)
      {
        const user = {"id":items.id,"username":items.username,"password":items.hashed_password};
        const token = jwt.sign({ user }, 'secret_key', {
          expiresIn: '24h'
        });
        res.json({
          token: token
        });
      } 
      else
        {res.sendStatus(401);}
    });
});

//test  Auth
app.get('/api/testAuth', authenticate, function(req, res) {
  jwt.verify(req.token, 'secret_key', function(err, data){
    if(err){
      res.sendStatus(401);
    }else{
      res.json({
        text: 'protected',
        data: data
      });
    }
  })
});

//View all products 
app.get('/api/products', authenticate, function(req, res) {
  //var items = req.app.get('dbname').users.find();
  jwt.verify(req.token, 'secret_key', function(err, data){
    if(err){
      res.sendStatus(401);
    }else{
    req.app.get('dbname').products.find({}, {
      order: 'price asc'
    }).then(items => {
      res.json(items);
    });
      
    }
  })
});

//Adding new Product
app.post('/api/newProduct', authenticate, function(req, res) {
  //var id = req.body.id;
  var title = req.body.title;
  var price = req.body.price;
  jwt.verify(req.token, 'secret_key', function(err, data){
    if(err){
      res.sendStatus(401);
    }else{
      req.app.get('dbname').products.insert({title: title, price: price}, function(err, res){
        
      }).then(items => {
        res.json("Product Added");
      });
      
    }
  })
});

function authenticate(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(401);
  }
}


http.createServer(app).listen(3000);
});



module.exports = app;



