const bcrypt      = require('bcrypt');
const passport    = require('passport');
const LocalStrategy = require('passport-local');
const session     = require('express-session');
const db          = require('mongodb');
const ObjectID    = db.ObjectID;


const saltRounds = 12;

module.exports = function (app, client) {

    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    let database = client.db("test");

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

}
