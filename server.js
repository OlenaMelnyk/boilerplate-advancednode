'use strict';

const express     = require('express');
const session     = require('express-session');
const passport    = require('passport');
const db          = require('mongodb');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const ObjectID    = db.ObjectID;
const mongo       = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
const bcrypt      = require('bcrypt');
const saltRounds = 12;

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');
process.env.SESSION_SECRET=Math.random()*10000000;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//const client = new mongo(process.env.DATABASE, { useNewUrlParser: true });

mongo.connect(process.env.DATABASE, (err, client) => {
  if (err) {
    console.log('Database err', + err);
  } else {
    console.log('Successful database connection');
    let database = client.db("test");

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
      database.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, doc);
      })
    });

    passport.use(new LocalStrategy(
      function(username, password, done)
      {
       database.collection('users').findOne({'username': username}, function(err, user) {
         console.log('User ' + username + ' is trying to log in');
         if (err) {return done(err); }
         if (!user) {return done(null, false); }
         if (!bcrypt.compareSync(password, user.password)) {return done(null, false); }
         //if (password !== user.password) {return done(null, false); }
         return done(null,user);
       });
      })
    );

    app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + "/views/pug/index", {title: 'Home Page', message:'Please login', showLogin: true, showRegistration: true});
    });

    app.post('/login', passport.authenticate('local', {failureRedirect: '/', session: true}), function(req, res) {
        res.redirect('/profile');
    });

    app.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });

    app.route('/register')
    .post((req, res, next) => {
      database.collection('users').findOne({'username': req.body.username}, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          let hash = bcrypt.hashSync(req.body.password, saltRounds);
          database.collection('users').insertOne({
            username: req.body.username,
            password: hash
          },
          (err, user) => {
            if (err) {
              res.redirect('/');
            } else {
              next(null, user);
            }
          })
        }
      })
    },
    passport.authenticate('local', {failureRedirect: '/', session: true}), function(req, res) {
        res.redirect('/profile');
    });

    app.route('/profile')
     .get(ensureAuthenticated, (req,res) => {
        res.render(process.cwd() + '/views/pug/profile', {username:req.user.username});
     });

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

    app.use((req, res, next) => {
      res.status(404)
      .type('text')
      .send('Not found');
    });

    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/');
    };

  }
});
