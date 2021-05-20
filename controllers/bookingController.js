const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Get the details of the tour being currently booked
  const tour = await Tour.findById(req.params.tourId);

  // Create a checkout session using stripe package
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, // this is a reference to this checkout session which will be used later to access the session object again to create a new booking
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // these images are to be live images i.e hosted in the internet because stripe will use those images and upload to their server
        amount: tour.price,
        currency: 'inr',
        quantity: 1
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    session
  });
});
