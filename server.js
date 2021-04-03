const mongoose = require('mongoose');
const dotenv = require('dotenv');

//read config file containing environment variables using dotenv
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE_REMOTE_VIA_APPLICATION_CONNECTION_STRING.replace(
  '<PASSWORD>',
  process.env.DATABASE_REMOTE_PASSWORD
);

/*The second object passed to connect method should be memorised for now. 'connect method' returns a promise which on resolve returns a connection object*/
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(conObj => {
    // Uncomment below block if you want to see the connection object
    // console.log(
    //   'Connection object returned from resolved promise of successful remote db connection is : ',
    //   conObj
    // );
    console.log(
      'Remote connection to MongoDB at Atlas cloud is established...'
    );
  })
  .catch(error => console.log('There was error connecting to DB', error));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//app.get('env') - will give the value of the environment variable set by express in app.js
