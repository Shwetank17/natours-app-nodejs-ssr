const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Token = require('../utils/authUtils');
const AppError = require('../utils/appError');

exports.createUser = catchAsync(async (req, res, next) => {
  let jwt = null;
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  if (newUser && newUser._id) {
    jwt = await Token(newUser._id);
  } else {
    next(new AppError(`Error creating account!`, 404));
  }
  res.status(201).json({
    userData: {
      data: newUser,
      jwt: jwt
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
  console.log('1111', user, password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 for forbidden access
    return next(new AppError('EmailId or Password is incorrect!', 401));
  }
  // return a new jwt back to client
  const jwt = await Token(user._id);
  res.status(200).json({ status: 'success', token: jwt });
});
