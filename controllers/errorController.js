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

// return all the information back in response in case of environment is dev so that it is helpful in debugging issues in future
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack,
    message: err.message
  });
};
const sendErrorProd = (err, res) => {
  // We know about the error so we trust it and send it to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // We don't know about the error so we don't send it to client instead log it for our own debugging
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong...'
    });
  }
};
module.exports = (err, req, res, next) => {
  // console.log('stack trace is', err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
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
    sendErrorProd(error, res);
  }
};
