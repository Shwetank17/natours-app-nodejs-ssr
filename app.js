const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

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

// Middleware that ensure the body is parsed and attached to the incoming request so that it can be used later as req.body.Limit has been set to 10kb so that an attacker cannot overload the server with heavy payloads
app.use(express.json({ limit: '10kb' }));

// Middleware to do data sanitization and prevent against NoSql injection like doing a login as :
// {"email": {"$gt": ""}, "password": password12345 } - this will return all the users and whatever password is sent in the body will be matched with the first one, if it matches login will happen, which is bad!
app.use(sanitize());

// Middleware to do data sanitization and prevent against XSS attacks
app.use(xss());

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
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
