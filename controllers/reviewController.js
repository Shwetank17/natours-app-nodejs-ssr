const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  // show reviews only related to a given tourId
  if (req.params.tourId) filter = { tour: req.params.tourId };
  // This is a perfect way to check for the empty object
  if (
    filter &&
    Object.keys(filter).length === 0 &&
    filter.constructor === Object // This is an additional check added for the cases when the object is created using the instances of other constructor and NOT the 'Object' constructor. Some examples of such objects created from other constructor are : new String(),new Number(), new Boolean(),new Array(), new RegExp(), new Function() and new Date(). If these are passed in this if condition as a value of 'filter' variable then the if condition will return true in the absence of 'filter.constructor === Object' check.
  ) {
    throw new AppError(
      'A review can be returned only for a requested tour! Check if you are sending tourId in your request params.'
    );
  }
  const review = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    count: review.length,
    allReviews: review
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user._id;
  // here we are not sanitizing req.body because our 'Tour' model is strong enough to discard any unwanted values
  const review = await Review.create(req.body);
  if (!review) {
    // didn't know the error code for this case so setting 500
    throw new AppError('Error creating review in db!', 500);
  }
  res.status(201).json({
    status: 'success',
    createdReview: review
  });
});
