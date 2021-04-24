const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
// commented as it was used for showing embedding documents
// const User = require('../models/userModel');
// commented as it's actual use not yet found
// const validator = require('validator');

// Create a mongoose schema for TOURS. The Schema method also accepts second argument that we have used to configure our virtual property 'durationWeeks' to be shown in the resultant data returned from the query to mongodb. Virtuals are when you don't want to persist the property in the database. For example, say a user has a first and last name and you want to combine them to have a "fullName" property, but you don't want to store that in the database because it's redundant. In that scenario, you can create a virtual "fullName" property so you can access their full name in your code without having to concatenate the other two fields every time.
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      // maxlength and minlength are only applicable for type String only
      maxlength: [25, 'A tour name can have max 25 characters'],
      minlength: [10, 'A tour should have min 10 characters'],
      // another way of specifying our validator. See other implementation in 'priceDiscount' schema field below
      // validate: [
      //   validator.isAlpha,
      //   'Tour must contain only alphabet characters'
      // ],
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
      required: [true, 'A tour must have a difficulty'],
      // Enums are only applicable for type String
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can either be easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // min and max are applicable for numbers as well as dates
      min: [1, 'A minimum rating of 1 is required'],
      max: [5, 'A maximum rating of 5 is only possible']
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
      type: Number,
      // this validator will only run when the document is created and a validator always return either true or false
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        // VALUE is only specific to mongoose and it has nothing to do with javascript
        message: 'Discount price ({VALUE}) should be below regular price'
      }
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
    secretTour: Boolean,
    // startLocation is a type of an embedded document i.e a document inside a document
    startLocation: {
      // This is GEOJSON in terms on mongo i.e a document containing geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // locations is a type of an embedded document i.e a document inside a document
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array -> commented as it was used to show embedding of documents
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    // Configure virtual property. 'toJSON' and 'toObject' means that if the result is JSON or object, virutal property must be returned. Also mongodb always returns an object on it's query result.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creating a virtual property that we can get on query to db. The value of this virtual property is defined inside of function
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Document Middleware(Hooks) : Allows to run pre and post hooks for example .save() and .create() mongoose methods, it will not work for insertMany, findOne, findByIdAndUpdate

// Pre Hook
tourSchema.pre('save', function(next) {
  console.log('Document about to be saved is...', this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Commented below hook as referencing of users in guides array better that embedding of users in guides array
// tourSchema.pre('save', async function(next) {
//   // This pre save hook is an example of embedding a document inside other document i.e user document inside the tour document. Since this hook only works in case of 'create' or 'save' so remember it won't work in case of updates. Remember that embedding has a drawback here for example if the user changes emailid or any of it's user specific data like 'role' then we would have to find out all the tours that has the given user as it's guide and update the embedded user document there also. This can become quite frustrating in large data set.s
//   const guidesPromises = this.guides.map(idOfUser => User.findById(idOfUser));
//   // overwriting the guides values with the user documents obtained from resolved promises.
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Post Hook
tourSchema.post('save', function(doc, next) {
  console.log('Document saved is...', doc);
  // Run your logic as in pre save above
  next();
});

// Query Middleware(Hooks) : Allows to run pre and post hooks for example .find(), deleteOne(), remove(), update() etc mongoose methods. In pre hook we have used a regular expression to include all mongoose query operator that starts with 'find'.

// Pre Hook
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});
// pre hook in any of the query(that passes the specified regex) to tour collection to ensure that we populate the response result with the referenced document(in this case we have referenced mongoose id's(pointing to User document in user's collection) in the guides field in the tours. This reference denotes the user id's(mongoose object id) of guides assigned to that tours.
tourSchema.pre(/^find/, function(next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});
// Post Hook: 'doc' refers to all the documents returned after the ^find query is executed
tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.startTime} milliseconds!`);
  next();
});

// Aggregation Middleware(Hooks) : Allows to run pre and post hooks for any aggregation pipeline query. Below we are filtering out the secret tour from any of our aggregation query result by adding a extra '$match' filter object with condition to not show secretTour.
// Pre Hook
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
// Post Hook (for aggregate): Not that important

// Model Middleware(Hooks): Not that important but TBD

// Create a model out of the created schema. The name of our model is 'Tour' so when .save is run on any of our document based out of 'Tour' model, like 'firstTour' here, then that document will be stored in 'tours' collection (plural of 'Tour') in natours-primary database in atlas hosted database
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
