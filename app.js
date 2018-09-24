var Twitter = require('twitter');
var config = require('./config.js');
var verifyToken = require('./verifyToken.js');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var app = express();

//database connection
var mongodb = require('mongodb');
var dbConn = mongodb.MongoClient.connect('mongodb://localhost:27017');

app.use(cors());

//configure body-parser for express
// app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());

var T = new Twitter(config.keys);

app.post('/user_authenticate', function(req, res){

    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");

            dbo.collection('users').countDocuments({ username: req.body.username,  password: req.body.password})
            .then((count) => {
                if (count > 0) {
                  var token = jwt.sign({ username: req.body.username }, config.secret_key, {
                    expiresIn: 86400
                  });
                  res.status(200).json({token: token, msg: 'authenticated'});
              } else {
                  res.status(401).json({token: null,msg: 'not authenticated'});
              }
          }).catch(function(e){console.log(e)});

    }).catch(function(e){console.log(e)})
});

/* search api end-point */
app.get('/api/:keyword', verifyToken, function(req, res) {
    console.log(req.userId);
    var keyword = req.params.keyword;

    // Set up your search parameters
    var params = {
      q: keyword,
      count: 100
    }

    T.get('search/tweets', params, function(err, data, response) {
      if(!err){
        res.json(data.statuses);
      } else {
      console.log(err);
      }
    })
})

/* server intialization */
var server = app.listen(4444, function(){
        var host = server.address().address;
        var port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
    });
