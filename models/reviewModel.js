const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    // 'tour' and 'user' fields below are referenced documents
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// This compound index is setup to be created when a review is created for a given tour by a given user. This index will be unique and when same user tries to post another review for the same tour then during the creating process when mongo will try to create a new compound index again it will find out that the new compound index is already present and it will error out prevent the same user to create another review on the same tour again.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
reviewSchema.pre(/^find/, function(next) {
  // Here we are populating the response of the /^find/ query with two more fields 'tour' and 'user' such that only 'name' field will be seen inside the document of 'tour' field and 'name' and 'photo' field inside the document of 'user' field.
  this.populate({
    path: 'tour',
    select: 'name '
  }).populate({ path: 'user', select: 'name photo' });
  next();
});

// This static method is created on reviewSchema so that it an be called directly on the Review model.
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // creating an aggregate query that will be called on reviews collection to get the latest aggregate data of a given tourId.
  const stats = await this.aggregate([
    { $match: { tour: tourId._id } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // If any stats is found then we update that tourId with the latest fetched data in previous step
  if (stats && stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings
    });
  }
};

// We need to call our static 'calcAverageRatings' method in post 'save' middleware hook because we want the review to be saved(when creating a new review) to collection first and then averageRating and ratingsQuantity to be updated in tours collection.
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

// We need to call our static 'calcAverageRatings' method in pre 'save' middleware hook. We want the review to be first updated or deleted(using findByIdAndUpdate or findByIdAndDelete) to collection and then averageRating and ratingsQuantity to be updated in tours collection. The problem here is that we don't have access to Review model in post query middleware which is called in the case of findByIdAndUpdate or findByIdAndDelete. So we use the pre query middleware to save a reference of the Review model to current document in 'this.r' and access the same in the post query middleware to call our static method
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne(); // this.r will will be a Review type document before any update or delete
  next();
});

reviewSchema.post(/^findOneAnd/, function(next) {
  // await this.findOne() DOESN"T here because query has already executed
  if (this.r) {
    this.r.constructor.calcAverageRatings(this.r.tour._id);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
