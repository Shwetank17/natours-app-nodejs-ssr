const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Get the details of the tour being currently booked
  const tour = await Tour.findById(req.params.tourId);

  // Create a checkout session using stripe package
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get(
      'host'
    )}/get-my-bookings?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, // this is a reference to this checkout session which will be used later to access the session object again to create a new booking
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/${tour.imageCover}`], // these images are to be live images i.e hosted in the internet because stripe will use those images and upload to their server to be shown in the checkout page on the left hand side
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

// this method is invoked when checkout is success from front end and stripe redirects the user to the success url which point to a route that calls this below handler. HIGHLY INSECURE METHOD
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   // if there is any one of the query params missing then we know that user is not coming from a checkout success so we call next() middlewares which are authController.isLoggedIn. viewsController.getOverview in viewRoutes.js that will take the user to the hompage.
//   if (!tour || !user || !price) return next();

//   await Booking.create({ tour, user, price });

//   // Redirecting the user to homepage and hiding the query params for anyone to see the query params and make malicious request of booking
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_SIGNING_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
