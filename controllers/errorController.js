const AppError = require('../utils/appError');

const handleCastErrorDb = err => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDb = err => {
  const duplicateValue = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: ${duplicateValue}. Use another name of the tour.`;
  return new AppError(message, 400);
};

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
    if (err.name === 'CastError') {
      err = handleCastErrorDb(err);
    }
    if (err.code === 11000) {
      err = handleDuplicateErrorDb(err);
    }
    sendErrorProd(err, res);
  }
};
