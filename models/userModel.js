const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      }
    }
  },
  passwordChangedAt: Date,
  role: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: String,
    default: true
  }
});

// Important usecase of using pre save hook. This will run only on .create or .save. Also multiple hooks are executed in the order they are defined.
userSchema.pre('save', async function(next) {
  // call next middleware and return if the password field was not modified for example when emailid only is updated password is not.
  if (!this.isModified('password')) return next();

  // salt password using 12 cost and hash the salted password to generate the final encyrpted password. If you try to increase the salt value then it would take more time to return the response back because it will be used in salting the password.
  this.password = await bcrypt.hash(this.password, 12);

  // passwordConfirm field is only required for validation purpose only, so removing it before saving the document
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function(next) {
  // here we are checking if the password is not modified i.e when there is no such request from upstream where password field is sent for modification like in the case of email id update.
  if (!this.isModified('password') || this.isNew) return next();
  // In some cases JWT during password reset process is sent before the 'passwordChangedAt' property is updated in database. So a user cannot use that JWT to access any of the protected route because technically it is issued before the password was changed so logically it's not a valid JWT. subtracting 1 sec from current date will ensure that it's value will always be greated that the JWT issue at time during password reset process.
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, async function(next) {
  // 'this' here refers to the query about to be executed
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // The salt is appended to the hashed password during signup. When you call .compare() on it, bcrypt will extract the salt and use it to hash the plaintext password. If the results match then it passes.
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(jwtIssueAtTime) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // this means token is old so we return true so that we don't allow the user to access the route
    return jwtIssueAtTime < changedTimestamp;
  }
  // by default we return false means password was not changed and so token is valid
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  // generate a random hexadecimal string of 32 character using inbuilt crypto library of nodejs
  const resetToken = crypto.randomBytes(32).toString('hex');

  // generate a resetToken hash(encrypt it) that will be saved in database to prevent it's misuse in case database is compromised
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set expiry of 10 mins for passwordResetToken
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
