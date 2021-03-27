const mongoose = require('mongoose');

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

module.exports = Tour;
