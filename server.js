const mongoose = require('mongoose');
// Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.
const dotenv = require('dotenv');

// here we are subscribing to an event 'unhandledException' on process object. An example, console logging a variable that is not defined. This can be done in any file applicable. Here we can abrubly exit instead of doing a close on 'server' instance which is not available at this point of time. uncaughtExceptions are always synchronous uncaughtRejections always asynchronous
process.on('uncaughtException', err => {
  console.log(
    'uncaughtException occured, error details are : ',
    err,
    err.name,
    err.message
  );
  process.exit(1);
});

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
  });
// .catch(error => console.log('There was error connecting to DB', error));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// here we are subscribing to an event 'undhandledRejection' on process object. An example of this rejection would be when we say change the db password in our config file and put a wrong one there.
process.on('unhandledRejection', err => {
  console.log(
    'unhandledRejection occured, error details are : ',
    err.name,
    err.message
  );
  // doing a close on 'server' object is good idea to shutdown server gracefully after the server has done handling all the pending request and it's other tasks.
  server.close(() => {
    console.log('Server shutdown complete');
    // 1 denotes exiting process with some exception which in our case would be unhandled rejection.
    process.exit(1);
  });
});

// app.get('env') - will give the value of the environment variable set by express in app.js
