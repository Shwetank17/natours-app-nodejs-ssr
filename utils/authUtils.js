const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

exports.generateToken = payload => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { id: payload },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      },
      function(error, token) {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      }
    );
  });
};

exports.sendResponseCookie = (token, expiresInDay, req, res, next) => {
  // Send jwt as cookie back to the user so that it can be automatically saved in browser. This token generation works for create new user, login in an existing user, update password of existing user and reset password of existing user. All these operations can be done by browser application so we send the cookie with jwt value back in response to be stored in client's browser or whatever the calling application is doing these operation
  const convertDaysToMillseconds = 24 * 60 * 60 * 1000;
  let expiresIn = '';
  if (!expiresInDay) {
    expiresIn = process.env.JWT_COOKIE_EXPIRES_IN * convertDaysToMillseconds;
  } else {
    expiresIn = expiresInDay * convertDaysToMillseconds;
  }
  const cookieOptions = {
    expires: new Date(Date.now() + expiresIn),
    // this option ensures that the cookie cannot be modified by browser by an XSS attack on the browser
    httpOnly: true,
    // secure true will ensure that the cookie will be sent/recieve on only in https secure channel. 'req.secure' is provided by express if connection is secure 'x-forwarded-proto' condition is added specifically for heroku as heroku intercepts the incoming req and modifies it to add below header in case the connection is secure
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };
  if (!token) {
    next(new AppError('Token not found before sending the cookie!'));
  }
  res.cookie('jwt', token, cookieOptions);
};
