const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Token = require('../utils/authUtils');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

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
    delete newUser.password;
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
  // Deactivate all the validators specified in our schema. If we don't set this parameter is NOT set to false the required validators during create(or save) will come up.
  await user.save({ validateBeforeSave: false });

  // send resetToken to user's email using nodemailer
  const resetUrl = `${req.protocol}://${
    req.hostname
  }/api/v1/users/resetToken/${resetToken}`;

  const message = `You recently forgot your password. Click on the link ${resetUrl} to reset your password. Ignore if you haven't initiated this request.`;

  try {
    await sendEmail({
      email,
      subject: 'Your password reset token! (Valid for 10 mins only)',
      message
    });

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
  const token = await Token(user._id);
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
  const token = await Token(user._id);

  // Send jwt as cookie back to the user so that it can be automatically saved in browser
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // this option ensures that the cookie cannot be modified by browser by an XSS attack on the browser
    httpOnly: true
  };
  // secure true will ensure that the cookie will be sent/recieve on only in https secure channel
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(200).json({
    status: 'success',
    token: token
  });
});
