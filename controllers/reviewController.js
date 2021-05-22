const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');

// middleware to find tourId and userId and attach to body before creating a review. This is done to keep our createOne function in factory clean.
exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user._id;
  next();
};

exports.checkTourId = (req, res, next) => {
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
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
