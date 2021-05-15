const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
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

exports.sendResponseCookie = (token, expiresInDay, res, next) => {
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
    httpOnly: true
  };
  // secure true will ensure that the cookie will be sent/recieve on only in https secure channel
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  if (!token) {
    next(new AppError('Token not found before sending the cookie!'));
  }
  res.cookie('jwt', token, cookieOptions);
};

//Important: Do not use the Google IDs returned by getId() or the user's profile information to communicate the currently signed in user to your backend server. Instead, send ID tokens, which can be securely validated on the server.

// Warning: Do not accept plain user IDs, such as those you can get with the GoogleUser.getId() method, on your backend server. A modified client application can send arbitrary user IDs to your server to impersonate users, so you must instead use verifiable ID tokens to securely get the user IDs of signed-in users on the server side.

const verify = async googleIdToken => {
  const ticket = await client.verifyIdToken({
    idToken: googleIdToken,
    audience: process.env.OAUTH_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  // payload contains all the details related to the googleIdToken. Like when it was issued, expiry, iss claims etc
  const payload = ticket.getPayload();
  console.log('Google Verified Token PAYLOAD', payload);

  // An identifier for the user, unique among all Google accounts and never reused. A Google account can have multiple emails at different points in time, but the sub value is never changed. Use sub within your application as the unique-identifier key for the user.
  // const userid = payload.sub;

  // If request specified a G Suite domain the domain value can be used to check if the user belongs to your G-Suite domain
  // const domain = payload['hd'];
};

exports.verify = verify;

exports.otherLogin = async (req, res, next, applicationToken) => {
  await verify(applicationToken)
    .then(() => {
      res.cookie('google-token', applicationToken, { secure: false });
      res
        .status(200)
        .json({ status: 'success', googleIdTokenVerified: applicationToken });
    })
    .catch(() => {
      next(new AppError('Error verifying token!'), 500);
    });
};
