const AppError = require('../utils/appError');

// example : when we find a tour by an id that is not a valid mongoose id
const handleCastErrorDb = err => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

// example : when we create a tour by a name that is already present in the mongodb
const handleDuplicateErrorDb = err => {
  const duplicateValue = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: ${duplicateValue}. Use another name of the tour.`;
  return new AppError(message, 400);
};

// example : when we try to update say 3 field 'name', 'ratingsAverage' and 'difficulty' of a tour with a given id. We pass values to these fields that doesn't confirm to the tourModel schema validations
const handleValidationErrorDb = err => {
  const message = `Input validation error(s) : ${err.message}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  const message = `Your access token is tampered. Login to generate a new one and then access this resource!`;
  return new AppError(message, 401);
};

const handleTokenExpiredError = () => {
  const message = `Your access token is expired. Login to generate a new one and then access this resource!`;
  return new AppError(message, 401);
};

// return all the information back in response in case of environment is dev so that it is helpful in debugging issues in future
const sendErrorDev = (err, req, res) => {
  // CASE WHEN REQUEST IS FOR API
  if (req.originalUrl.startsWith('/api')) {
    console.error(err);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      stack: err.stack,
      message: err.message
    });
  }
  console.error('ERROR-DEV', err);
  // CASE WHEN REQUEST CAME FROM BROWSER
  return res.status(err.statusCode).render('error', {
    title: 'Error Page',
    message: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // We know about the error so we trust it and send it to client
  // CASE WHEN REQUEST IS FOR API
  if (req.originalUrl.startsWith('/api')) {
    console.error(err);
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // We don't know about the error so we don't send it to client instead log it for our own debugging. Since this block will execute if the error is NOT operational which means that we haven't captured this error explicitly but somewhere catchAsync has caught it.
    console.error('ERROR-PROD', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong...'
    });
  }
  console.error(err);
  // CASE WHEN REQUEST CAME FROM BROWSER
  return res.status(err.statusCode).render('error', {
    title: 'Error Page',
    message: err.message
  });
};

// Error-handling middleware always takes four arguments. You must provide four arguments to identify it as an error-handling middleware function. Even if you don’t need to use the next object, you must specify it to maintain the signature. Otherwise, the next object will be interpreted as regular middleware and will fail to handle errors.
module.exports = (err, req, res, next) => {
  // console.log('stack trace is', err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    // All the errors below are handled to make them operational errors so that we send meaningful messages to client instead of sending 'something went wrong...'
    // error from mongoose
    if (err.name === 'CastError') {
      error = handleCastErrorDb(err);
    }
    // error from mongodb directly
    if (err.code === 11000) {
      error = handleDuplicateErrorDb(err);
    }
    // error from mongoose
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDb(err);
    }
    // error from jsonwebtoken package
    if (err.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }
    // error from jsonwebtoken package
    if (err.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }
    sendErrorProd(error, req, res);
  }
};
