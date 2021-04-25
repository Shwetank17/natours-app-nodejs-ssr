const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// APPLICATION MIDDLEARES -

// Middleware to set security headers when sending response back. Example of these headers that can be checked in response are 'X-DNS-prefetch-Control', 'Strict-Transport-Security', 'X-Download-Options', 'X-XSS-Protection'. Browser understand these headers and act accordingly. Helmet is a collection of 14 small middlewares out of which only some are enabled by default. Check documentation to enable/disable as per your needs.
app.use(helmet());

// Middleware to log request in verbose manner
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware to limit the number of request to 100 per hour, coming from any ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request! Try again after an hour!'
});
app.use('/api', limiter);

// Middleware that ensure the body is parsed and attached to the incoming request so that it can be used later as req.body. Limit has been set to 10kb so that an attacker cannot overload the server with heavy payloads
app.use(express.json({ limit: '10kb' }));

// Middleware to do data sanitization and prevent against NoSql injection like doing a login as :
// {"email": {"$gt": ""}, "password": password12345 } - this will return all the users and whatever password is sent in the body will be matched with the first one, if it matches login will happen, which is bad! Notice that we have used this middleware after the above middleware because after the above middleware executes it's work then we have req.body ready to be sanitized
app.use(sanitize());

// Middleware to do data sanitization and prevent against XSS attacks like for example if the user sends html data then this package will convert that html to string so that it cannot be executed
app.use(xss());

// Middleware to prevent http parameter pollution, for example if we send the request as 127.0.0.1:3000/api/v1/tours?sort=duration&sort=price. Here we are sending multiple sort. hpp will only send the last sort i.e sort=price and the API will just work fine. This package has lot of flexibility to whitelist some paramters that we can send as multiple like for example 127.0.0.1:3000/api/v1/tours?duration=40&duration=70 which our API supports.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Middleware to serve files from a static folder. So in case if any assest is not found then Express will look for that file in the static folder also if specified like below
app.use(express.static(`${__dirname}/public`));

// Test middleware for any future test purpose
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

// Middleware to attach the requestTime custom key in the incoming request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// APPLICATION ROUTES -
// Here we are mounting a router to a specific route, for example mounting 'tourRouter' on '/api/v1/tours' route. 'tourRouter' is itself a middleware that will get invoked when this route is detected by express. 'tourRouter' inturn has subroutes and these subroutes have their own middlewares to send the appropriate response back to client and finish the request-response cycle.
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
