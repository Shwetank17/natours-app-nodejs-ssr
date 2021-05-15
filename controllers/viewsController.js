const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  if (!tours) {
    return next(new AppError(`Error finding all tours!`, 500));
  }
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

  if (!tour) {
    return next(new AppError(`No Tour found. Try again!`, 401));
  }

  res
    .status(200)
    // mapbox js was rejected by our response headers(don't know why) so have to override the response headers with below headers
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.title} Tour`,
      tour
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res
    .status(200)
    // axios js were rejected by chrome so need to set this headers in order for chrome to accepts axios js from cdn
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com http://127.0.0.1:3000/api/v1/users/login"
    )
    .render('login', {
      title: 'Natours Log In'
    });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
});

// this route handler will get activated when user click on button 'Save Setting' in profile page. On clicking of this button /submit-user-data route POST request with 'name' and 'email' data sent from browser to express. This way of updating data is not good because if there is any error user will see a big error screen which is a bad user experience, route will be changed, also the submission of forms triggers a reload. Overall the difference is that we are not calling any of our api's to update the data for us instead we created a separate route to handle this update.
exports.updateUserData = catchAsync(async (req, res, next) => {
  // The body can have any number of data if it's hacked. So we are only taking 'name' and 'email' fields from the body and only updating those
  const updatedUserData = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'My Account',
    user: updatedUserData
  });
});
