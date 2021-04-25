const mongoose = require('mongoose');

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

reviewSchema.pre(/^find/, function(next) {
  // Here we are populating the response of the /^find/ query with two more fields 'tour' and 'user' such that only 'name' field will be seen inside the document of 'tour' field and 'name' and 'photo' field inside the document of 'user' field.
  this.populate({
    path: 'tour',
    select: 'name '
  }).populate({ path: 'user', select: 'name photo' });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
