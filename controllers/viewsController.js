const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  // telling express to render the pug template named 'overview' when '/overview' route is invoked. The object that we are passing as the second paramter to render is treated as 'locale' in overview template. We have used the 'tours' passed from here to iterate the tours in overview template.
  res.status(200).render('overview', {
    title: 'All Natours Tour',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res.status(200).render('tour', {
    title: `${tour.title} Tour`,
    tour
  });
});
