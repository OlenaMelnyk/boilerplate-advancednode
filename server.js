'use strict';

const express     = require('express');
const db          = require('mongodb');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const mongo       = require('mongodb').MongoClient;
const auth = require('./auth.js');
const routes = require('./routes.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');
process.env.SESSION_SECRET=Math.random()*10000000;



//const client = new mongo(process.env.DATABASE, { useNewUrlParser: true });

mongo.connect(process.env.DATABASE, (err, client) => {
  if (err) {
    console.log('Database err', + err);
  } else {
    console.log('Successful database connection');
    let database = client.db("test");

    auth(app,client);
    routes(app,client);

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

  }
});
