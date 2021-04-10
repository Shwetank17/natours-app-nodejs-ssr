const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  photo: String,
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
  }
});

// Important usecase of using pre save hook. This will run only on .create or .save.
userSchema.pre('save', async function(next) {
  // call next middleware and return if the password field was not modified for example when emailid only is updated password is not.
  if (!this.isModified('password')) return next();

  // salt password using 12 cost and hash the salted password to generate the final encyrpted password. If you try to increase the salt value then it would take more time to return the response back because it will be used in salting the password.
  this.password = await bcrypt.hash(this.password, 12);

  // passwordConfirm field is only required for validation purpose only, so removing it before to prevent saving it in the database
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // The salt is appended to the hashed password during signup. When you call .compare() on it, bcrypt will extract the salt and use it to hash the plaintext password. If the results match then it passes.
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;