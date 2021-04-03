const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

// Create a mongoose schema for TOURS. The Schema method also accepts second argument that we have used to configure our virtual property 'durationWeeks' to be shown in the resultant data returned from the query to mongodb. Virtuals are when you don't want to persist the property in the database. For example, say a user has a first and last name and you want to combine them to have a "fullName" property, but you don't want to store that in the database because it's redundant. In that scenario, you can create a virtual "fullName" property so you can access their full name in your code without having to concatenate the other two fields every time.
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    slug: [String],
    secretTour: Boolean
  },
  {
    // Configure virtual property. 'toJSON' and 'toObject' means that if the result is JSON or object, virutal property must be returned. Also mongodb always returns an object on it's query result.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//Creating a virtual property that we can get on query to db. The value of this virtual property is defined inside of function
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Document Middleware(Hooks) : Allows to run pre and post hooks before for example .save() and .create() mongoose methods, it will not work for insertMany, findOne, findByIdAndUpdate

//Pre Hook
tourSchema.pre('save', function(next) {
  console.log('Document about to be saved is...', this);
  this.slug = slugify(this.name, { lower: true });
  next();
});
//Post Hook
tourSchema.post('save', function(doc, next) {
  console.log('Document saved is...', this);
  //Run your logic as in pre save above
  next();
});

//Query Middleware(Hooks) : Allows to run pre and post hooks before for example .find(), deleteOne(), remove(), update() etc mongoose methods. In pre hook we have used a regular expression to include all mongoose query operator that starts with 'find'.

//Pre Hook
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});
//Post Hook: 'doc' refers to all the documents returned after the ^find query is executed
tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.startTime} milliseconds!`);
  next();
});

//Create a model out of the created schema. The name of our model is 'Tour' so when .save is run on any of our document based out of 'Tour' model, like 'firstTour' here, then that document will be stored in 'tours' collection (plural of 'Tour') in natours-primary database in atlas hosted database
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
