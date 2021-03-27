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
    console.log(
      'Connection object returned from resolved promise of successful remote db connection is : ',
      conObj
    );
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

//Create a mongoose schema for TOURS
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true
  },
  rating: {
    type: Number,
    required: [true, 'A tour must have a rating']
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  numPersons: {
    type: Number,
    default: 5
  }
});

//Create a model out of the created schema. The name of our model is 'Tour' so when .save is run on any of our document based out of 'Tour' model, like 'firstTour' here, then that document will be stored in 'tours' collection (plural of 'Tour') in natours-primary database in atlas hosted database
const Tour = mongoose.model('Tour', tourSchema);
const toursArray = [
  {
    name: 'The Bombay Troopers',
    rating: 4.4,
    price: '200',
    numPersons: 5
  },
  {
    name: 'The Kerala Rockers',
    rating: 4.7,
    price: '150',
    numPersons: 3
  },
  {
    name: 'The Delhi Warriors',
    rating: 4.2,
    price: '180',
    numPersons: 3
  },
  {
    name: 'The Pune Champions',
    rating: 5,
    price: '300',
    numPersons: 5
  },
  {
    name: 'The Bangalore Wind Chimes',
    rating: 4,
    price: '190',
    numPersons: 4
  }
];

toursArray.map(el => {
  const documentToSave = new Tour(el);
  documentToSave
    .save()
    .then(returnedDoc =>
      console.log('Document saved successfully', returnedDoc)
    )
    .catch(error => console.log('Error saving the document', error));
});
