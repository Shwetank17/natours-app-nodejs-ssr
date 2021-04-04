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
    sendErrorProd(err, res);
  }
};
