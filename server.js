const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE_REMOTE_VIA_APPLICATION_CONNECTION_STRING.replace(
  '<PASSWORD>',
  process.env.DATABASE_REMOTE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('Remote DB connection established...'))
  .catch(error => console.log('There was error connecting to DB', error));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//app.get('env') - will give the value of the environment variable set by express in app.js
