const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // Send the response
  res.status(200).json({
    status: 'success',
    results: users.length,
    requestedAt: req.requestTime,
    allUsers: {
      users
    }
  });
});

const filterObj = (incomingBody, ...validFieldsUpdatable) => {
  const validUpdatableObj = {};
  Object.keys(incomingBody).forEach(incomingKey => {
    if (validFieldsUpdatable.includes(incomingKey)) {
      validUpdatableObj[incomingKey] = incomingBody[incomingKey];
    }
  });
  return validUpdatableObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create an error if user tries to send password or confirmPassword fields as we have different route to handle the same
  if (
    req.body.password ||
    req.body.passwordConfirm ||
    req.body.passwordCurrent
  ) {
    return next(
      new AppError(
        'If you wish to update password then use updatePassword or resetPassword route!'
      ),
      400
    );
  }

  // Find the user, using filterObj method, extract only the valid data that can be updated and update it. A user can send for example 'role' field also in the request. If we don't ignore it then we will save it in the database which is wrong.
  const filteredBody = filterObj(req.body, 'name', 'email');
  // new: true means that a new document will be returned. runValidators: true is sent to make sure that validators on the field that are being updated are run.
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    user: user
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

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
