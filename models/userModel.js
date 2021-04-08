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
    minlength: 8
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
  //return if the password was not modified for example when emailid is updated
  if (!this.isModified(this.password)) return next();

  // salt password using 12 cost and hash the salted password
  this.password = await bcrypt(this.password, 12);

  // passwordConfirm field is only required for validation purpose only, so removing it before to prevent saving it in the database
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
