const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Token = require('../utils/authUtils');
const AppError = require('../utils/appError');

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
    token = await Token(newUser._id);
  } else {
    next(new AppError(`Error creating account!`, 404));
  }
  res.status(201).json({
    userData: {
      data: newUser,
      jwt: token
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // extract email and password from the incoming requestTime
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
  const token = await Token(user._id);
  res.status(200).json({ status: 'success', token: token });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token = null;
  let decode = null;
  let currentUser = null;

  // Check if the authorization headers has something in it and token is sent by client. If token is present then check if it is a valid token that is not tampered
  const authHeaderVal =
    req.headers && req.headers.authorization ? req.headers.authorization : null;
  if (authHeaderVal && authHeaderVal.startsWith('Bearer')) {
    token = authHeaderVal.split(' ')[1];
    if (!token) {
      return next(new AppError('You are not logged in! Login to continue.'));
    }
    decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
  }

  // Check if the _id in the token's payload has any user associated with it. This is done for the case, say user is not present in database but JWT is still valid as it was issued recently and by the time user has deleted his account.
  if (decode && decode.id) {
    currentUser = await User.findById({ _id: decode.id });
    if (!currentUser) {
      return next(
        new AppError(
          'Sent token has no associated accounts! Login and try again.',
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

  // if all conditions above are passed we allow the user to access to the route
  req.user = currentUser;
  next();
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
