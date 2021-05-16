const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const authFactory = require('../utils/authUtils');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

exports.createUser = catchAsync(async (req, res, next) => {
  let token = null;
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  if (newUser && newUser._id) {
    token = await authFactory.generateToken(newUser._id);
    authFactory.sendResponseCookie(token, null, res, next);
    delete newUser.password;
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
  } else {
    next(new AppError(`Error creating account!`, 404));
  }

  res.status(201).json({
    userData: {
      data: newUser,
      token: token
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // extract email and password from the incoming request
  const { email, password } = req.body;
  // check if email and password exists else return error
  if (!email || !password) {
    // 400 for bad request
    return next(new AppError('EmailId or Password is missing'), 400);
  }
  // check if user exists and password is correct. We are adding 'password' key so that we can see it in the response. In findAll or findOne cases, by default the password is not shown as we have set its select value as false in usermodel
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 for forbidden access
    return next(new AppError('EmailId or Password is incorrect!', 401));
  }
  // return a new jwt back to client
  const token = await authFactory.generateToken(user._id);
  authFactory.sendResponseCookie(token, null, res, next);
  res.status(200).json({ status: 'success', token: token });
});

exports.logout = (req, res, next) => {
  // send loggedout cookie to user which expires in 10 seconds so subsequent requests from the browser will after 10 seconds will have no cookie sent so we will treat those subsequent request as not logged in!
  authFactory.sendResponseCookie(
    'loggedout',
    process.env.JWT_LOGOUT_COOKIE_EXPIRES_IN,
    res,
    next
  );
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token = null;
  let decode = null;
  let currentUser = null;

  // Check if the authorization headers has something in it and token is sent by client. If token is present then check if it is a valid token that is not tampered
  const authHeaderVal =
    req.headers && req.headers.authorization ? req.headers.authorization : null;
  if (authHeaderVal && authHeaderVal.startsWith('Bearer')) {
    token = authHeaderVal.split(' ')[1];
  }
  // cookie can be sent from the browser in each request automatically. Our cookie-parser will parse that and attach to request object.
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Login to continue.'));
  }

  decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
  if (decode && decode.id) {
    // Check if the _id in the token's payload has any user associated with it. This is done for the case, say user is not present in database but JWT is still valid as it was issued recently and by the time user has deleted his account.
    currentUser = await User.findById({ _id: decode.id });
    if (!currentUser) {
      return next(
        new AppError(
          'Sent token has no associated accounts! Create account and try again.',
          401
        )
      );
    }
  }

  // Check if the token sent is not old i.e the case where token was sent earlier but after sometime user has changed his password and now user is not sending the new token that was issued to him at the time of password change instead sending the old token(although the old token's integrity is intact and has not yet expired but still the token will be considered as old and invalid)
  if (currentUser && currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('User recently changed password! Login again to continue'),
      401
    );
  }

  // if all conditions above are passed we allow the user to access to the route and the route handler will then have access to user object
  req.user = currentUser;
  // locals is set so that any our template can access this user object
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let token = null;
  let decode = null;
  let currentUser = null;
  // cookie can be sent from the browser in each request automatically. Our cookie-parser will parse that and attach to request object.
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
    // NOTICE THAT WE ARE NOT GENERATING OUR new AppError object in case of errors in any of the steps below in this function. It is because 'isLoggedIn' middleware will be called when we are rendering our pug templates say for example /tour/:slug route in viewsRoutes.js. If we create new AppError (say if 'currentUser' is not found below) here then our error will cause the req-resp cycle to complete and further next() middleware won't be called and hence the template to be rendered at /tour/:slug won't render.
    if (!token) {
      return next();
    }

    if (token === 'loggedout') return next();

    decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    if (decode && decode.id) {
      // Check if the _id in the token's payload has any user associated with it. This is done for the case, say user is not present in database but JWT is still valid as it was issued recently and by the time user has deleted his account.
      currentUser = await User.findById({ _id: decode.id });
      if (!currentUser) {
        return next();
      }
    }

    // Check if the token sent is not old i.e the case where token was sent earlier but after sometime user has changed his password and now user is not sending the new token that was issued to him at the time of password change instead sending the old token(although the old token's integrity is intact and has not yet expired but still the token will be considered as old and invalid)
    if (currentUser && currentUser.changedPasswordAfter(decode.iat)) {
      return next();
    }

    // if all conditions above are passed we allow the user to access to the route and we set 'locals' variable so that it can be used in any of the pug template if required. For example 'locals.user' is used in header template to determine and display the UI as per the user is logged in or not.
    res.locals.user = currentUser;
    return next();
  }

  return next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        // 403 for forbidden access
        new AppError('You are not authorized to perform this operation!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Find the user corresponding to the emailid sent by the client. If there is no user then throw error
  const { email } = req.body;
  if (!email) {
    return next(new AppError('No email id is sent! Send your email id'));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError('No user with given emailid found! Try with correct emailid')
    );
  }
  // Generate a random password reset token
  const resetToken = user.createPasswordResetToken();
  // Deactivate all the validators specified in our schema. If we don't set this parameter to false the required validators during create(or save) will come up like 'emalid', 'password', 'confirmPassword' etc.
  await user.save({ validateBeforeSave: false });

  try {
    // send resetToken to user's email using nodemailer
    const resetUrl = `${req.protocol}://${
      req.hostname
    }/api/v1/users/resetToken/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Reset token sent successfully to your email id!'
    });
  } catch (err) {
    // undoing the changes done when we set these two properties while creating the resetToken
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // 500 error code because this is the error happened on the server so it has to be an error code that starts with 5 and 500 is general so we used it.
    return next(
      new AppError(
        'There was some problem sending the reset token. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  if (!resetToken) {
    return next(new AppError('No token sent from client!'), 400);
  }
  // hash the reset token so that it can be used to find the user with that reset token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired!'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // We have to ensure that below two values are removed from database so that it can't be misused later
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // here we haven't passed { validator : false } because we want our schema validators to run before saving this data
  await user.save();
  // return a new jwt back to client
  const token = await authFactory.generateToken(user._id);
  authFactory.sendResponseCookie(token, null, res, next);
  res.status(200).json({ status: 'success', token: token });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from the collection and select it's password as true so that it can be used later
  const user = await User.findById(req.user._id).select('password');

  // Verify if the current password sent by client matches the one stored in the databse for the same users
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    // 400 for unauthorized access
    return next(new AppError('Your current password is wrong', 400));
  }

  // If verification is success update the password password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log the user in and send a fresh JWT back
  const token = await authFactory.generateToken(user._id);
  authFactory.sendResponseCookie(token, null, res, next);

  res.status(200).json({
    status: 'success',
    token: token
  });
});
