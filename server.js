'use strict';

const express     = require('express');
const session     = require('express-session');
const passport    = require('passport');
const db          = require('mongodb');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const ObjectID = db.ObjectID;
const mongo = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'pug');
process.env.SESSION_SECRET=Math.random()*10000000;
process.env.DATABASE='mongodb+srv://olena33:forGotTen33@cluster0-zfxvg.mongodb.net/test?retryWrites=true&w=majority';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE, (err, db) => {
  if (err) {
    console.log('Database err', + err);
  } else {
    console.log('Successful database connection');
    passport.serializeUser((user, done) => {
      console.log("serialized", user._id);
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
      db.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, done);
      })
    });

    passport.use(new LocalStrategy(
      function(username, password, done)
      {
       db.collection('users').findOne({'username': username}, function(err, user) {
         console.log('User' + username + 'is trying to log in');
         if (err) {return done(err); }
         if (!user) {return done(null, false); }
         if (password !== user.password) {return done(null, false); }
         return done(null,user);
       });
      })
    );

    app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + "/views/pug/index.pug", {title: 'Hello', message:'Please login'});
  });

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});

  }
});
