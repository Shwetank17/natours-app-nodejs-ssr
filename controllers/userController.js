const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Token = require('../utils/authUtils');
const AppError = require('../utils/appError');

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
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
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
