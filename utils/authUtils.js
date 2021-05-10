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

exports.sendResponseCookie = (token, res, next) => {
  // Send jwt as cookie back to the user so that it can be automatically saved in browser. This token generation works for create new user, login in an existing user, update password of existing user and reset password of existing user. All these operations can be done by browser application so we send the cookie with jwt value back in response to be stored in client's browser or whatever the calling application is doing these operation
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // this option ensures that the cookie cannot be modified by browser by an XSS attack on the browser
    httpOnly: true
  };
  // secure true will ensure that the cookie will be sent/recieve on only in https secure channel
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  if (!token) {
    next(new AppError('Token not found before sending the cookie!'));
  }
  res.cookie('jwt', token, cookieOptions);
};
