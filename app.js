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
var ObjectId = require('mongodb').ObjectId;
app.use(cors());

//configure body-parser for express
// app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());

var T = new Twitter(config.keys);

/* user sign-up end-point */
app.post('/signup', function(req, res){
    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");
            let user_data = {
              username: req.body.username,
              password: req.body.password,
              email: req.body.email,
              firstname: req.body.fname,
              lastname: req.body.lname,
              contact:'',
              description:'',
              skills:'',
              address:'',
              hobby:'',
              organization_address:'',
              favorite_food:'',
              image_url:'',
            }
            dbo.collection('users').insertOne(user_data, function (err, records) {
              if(err) throw err;
              var token = jwt.sign({ user_id:records.ops[0]._id }, config.secret_key, {
                expiresIn: 86400
              });
              res.status(200).json({token: token, msg: 'authenticated'});
            });

    }).catch(function(e){console.log(e)})
});

/* user login end-point */
app.post('/user_authenticate', function(req, res){

    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");

            dbo.collection('users').findOne({ username: req.body.username,  password: req.body.password})
            .then((user) => {
  
                if (!user){
                  return res.status(401).json({token: null,msg: 'not authenticated'});
                }
                else {
                  var token = jwt.sign({ user_id: user._id }, config.secret_key, {
                    expiresIn: 86400
                  });
                  res.status(200).json({token: token, msg: 'authenticated'});
                }
          }).catch(function(e){console.log(e)});

    }).catch(function(e){console.log(e)})
});

/* user edit profile end-point */
app.post('/editprofile', verifyToken, function(req, res){

    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");
            let update_data = {
              firstname : req.body.fname, 
              lastname : req.body.lname, 
              description : req.body.desc,
              address : req.body.add,
              contact : req.body.contact,
              organization_address : req.body.orgAdd,
              hobby : req.body.hobby,  
              skills : req.body.skills, 
              hobby : req.body.hobby, 
              favorite_food : req.body.favFood,
              image_url: req.body.imgUrl 
            };
            dbo.collection('users').updateOne(
              { _id: ObjectId(req.userId) }, 
              { $set: update_data }, 
              function(err, results){
                if(results && results.result.n > 0) {
                  res.status(200).json({msg: 'updated', data: update_data });
                }
              });
    }).catch(function(e){console.log(e)})
});

/* user fetch profile end-point */
app.post('/fetchProfile', verifyToken, function(req, res){

    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");
            dbo.collection('users').findOne(
              { _id: ObjectId(req.userId) }, function(err, result) {
                if(err) throw err;
                res.status(200).json({msg: 'found', data:result});
              });
    }).catch(function(e){console.log(e)})
});

/* search api end-point */
app.post('/api/', verifyToken, function(req, res) {
    var keyword = req.body.keyword;
    // Set up your search parameters
    var params = {
      q: keyword,
      count: 20
    }
    if(req.body.maxID) {
      params.max_id = req.body.maxID;
      params.include_entities = 'true';
      params.result_type = 'mixed';
    }

    if(req.body.sinceID) {
      params.since_id = req.body.sinceID;
      params.include_entities = 'true';
      params.result_type = 'mixed';
    }

    T.get('search/tweets', params, function(err, data, response) {
      if(!err){
        res.json(data);
      } else {
      console.log(err);
      }
    })
});

/* add to favorite tweet */
app.post('/favTweet/', verifyToken, function(req, res) {
    let tweet_id = {id: req.body.id};
    dbConn.then( function (database) {
            var dbo = database.db("twitter_search");
            let update_data = {
              'favorite_tweets': tweet_id
            }
            dbo.collection('users').updateOne(
              { _id: ObjectId(req.userId) }, 
              { $push: update_data }, 
              function(err, results){
                if(results && results.result.n > 0) {
                  res.status(200).json({msg: 'updated', data: update_data });
                }
              });
    }).catch(function(e){console.log(e)})
});

/* fetch single tweet */
app.post('/fetchSingleTweet/', verifyToken, function(req, res) {
  var params = {
    id: req.body.tweet_id
  }
  
  T.get('statuses/show', params, function(err, data, response) {
      if(!err){
        res.json(data);
      } else {
      console.log(err);
      }
    })
});

/* fetch favorite tweets list */
app.post('/fetchFavoriteTweets/', verifyToken, function (req, res) {
  var favorites = [];
  dbConn.then(function (database) {
    var dbo = database.db("twitter_search");
    dbo.collection('users').findOne(
      { _id: ObjectId(req.userId) }, function (err, result) {
        if (err) throw err;
        if (!result.hasOwnProperty('favorite_tweets')) {
          res.status(404).json({ msg: 'record not found' });
        }
        else {
          // Counter
          let count = result.favorite_tweets.length;
          result.favorite_tweets.forEach(function (tweet) {
            T.get('statuses/show', { id: tweet.id }, function (err, data, response) {
              // Decrease count
              count -= 1;
              if (!err) {
                favorites.push(data);
                // Check if count is zero
                if (count === 0) {
                  res.status(200).json({msg:'success', data:favorites});        
                }
              } else {
                console.log(err);
              }
            });
          });
        }
      });
  }).catch(function (e) { console.log(e) })
});
/* server intialization */
var server = app.listen(4444, function(){
        var host = server.address().address;
        var port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
    });
