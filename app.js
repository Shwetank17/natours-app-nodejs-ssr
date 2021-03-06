const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const app = express();

// APPLICATION MIDDLEARES -

// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin * : This is set and send in reponse headers when we use cors. It means allow all simple requests (GET and POST) from any domain to reach our domain
// We can specify strict origin to only access our domain
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

// 'options' is like any other http verb like 'get', 'post'. For complex request like 'put', 'patch', 'delete' etc browser sends an 'option' pre flight request to validate if the remote domain is accepting these complex request. If remote domain is accepts it then the browser send the original request. So in order to accept the pre flight requests for all these complex request we are setting CORS for options pre flight requests.
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Middleware to compression text data before sending to client. This doesn't work for images as images are supposed to be compressed already.
app.use(compression());

// Middleware to set security headers when sending response back. Example of these headers that can be checked in response are 'X-DNS-prefetch-Control', 'Strict-Transport-Security', 'X-Download-Options', 'X-XSS-Protection'. Browser understand these headers and act accordingly. Helmet is a collection of 14 small middlewares out of which only some are enabled by default. Check documentation to enable/disable as per your needs.
app.use(
  helmet()
  // helmet.contentSecurityPolicy({
  //   directives: {
  //     defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
  //     baseUri: ["'self'"],
  //     fontSrc: ["'self'", 'https:', 'http:', 'data:'],
  //     scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
  //     styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:']
  //   }
  // })
);

// Middleware to set pug as our template engine
app.set('view engine', 'pug');
// Middleware to set the path for express to look for files responsible for view, in our case pug files
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve files from a static folder. So in case if any assest is not found then Express will look for that file in the static folder also if specified like below
app.use(express.static(path.join(__dirname, 'public')));

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

// has to be kept here because stripe will post data to this route when a checkout is success at front end. Stripe sends the data in raw format like stream and doesn't accept any modified json so this route has to be put before the next middleware which will convert the body of the request object to json. express.raw is used to convert the raw data in json and still keep the raw form of the data intact
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Middleware that ensure the body is parsed and attached to the incoming request so that it can be used later as req.body. Limit has been set to 10kb so that an attacker cannot overload the server with heavy payloads
app.use(express.json({ limit: '10kb' }));

// Middleware to parse the urlencoded payload that comes when a form is submitted in front end like account update form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Middleware to parse the cookie (and add it to 'cookies' object in request object) sent from any incoming request from any origin like browser ajax request, postman request etc.
app.use(cookieParser());

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

// Test middleware for any future test purpose
app.use((req, res, next) => {
  // console.log('Hello from the middleware ????');
  next();
});

// Middleware to attach the requestTime custom key in the incoming request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log('INCOMING COOKIE(S)', req.cookies);
  next();
});

// APPLICATION ROUTES -
// Here we are mounting a router to a specific route, for example mounting 'tourRouter' on '/api/v1/tours' route. 'tourRouter' is itself a middleware that will get invoked when this route is detected by express. 'tourRouter' inturn has subroutes and these subroutes have their own middlewares to send the appropriate response back to client and finish the request-response cycle.
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

// Middleware custom Global Error Handler. All error handlers should always be in last. This middleware will be called in all cases where we pass next function with error.
app.use(globalErrorHandler);

module.exports = app;
