const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const review = await Review.find();
  res.status(200).json({
    status: 'success',
    count: review.length,
    allReviews: review
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const tour = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    createdTour: tour
  });
});
