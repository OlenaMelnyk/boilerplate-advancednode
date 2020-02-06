const passport    = require('passport');
const bcrypt      = require('bcrypt');

const saltRounds = 12;



module.exports = function (app, client) {
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

    let database = client.db("test");


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


    app.use((req, res, next) => {
      res.status(404)
      .type('text')
      .send('Not found');
    });

    app.route('/auth/github')
      .post(passport.authenticate('local'),(req,res) => {
    });

    app.route('/auth/github/callback')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req,res) => {
      res.redirect('/profile');
    });

    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/');
    };
}
