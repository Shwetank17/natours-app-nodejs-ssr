const multer = require('multer');
const sharp = require('sharp');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

// multerStorage is defined to specify the path that will be used to store the images and the name of the file before saving. 'cb' stands for callback that accepts error as it's first argument if any else null.
// Comment below block as we are using memoryStorage to compress and resize images and in there only we are setting the path and name of the file but below is one of the way also to keep in mind.
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}${Date.now()}.${ext}`);
//   }
// });

// multerFilter is defined to specify the filter i.e the type of files multer should accept from user. In our case it is only images so we added a condition for the same. If the file uploaded is not image then we create a new error and pass as the first argument to 'cb'. The second argument to 'cb' will be 'true' if our filter matches else it will be 'false'
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Only images are allowed to be uploaded! Try again', 401),
      false
    );
  }
};

// when the storage for multer is specified as memory then nothing get saved in disk. All the resizing takes place in memory and then finally the images are saved to disk in the resizing phase when sharp comes into picture.
const multerStorage = multer.memoryStorage();

//destination used by multer to save image. Multer has many different ways to specify the location of upload images and other stuff. Check out documenation for more.
// const upload = multer({ dest: './public/img/users/' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// This enables only single photo to be uploaded. 'photo' is the name of the field that will sent in the form data that would then hold the image uploaded by user
exports.uploadUserImage = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // adding 'file.filename' to request object so that our 'updateMe' handler below can access it and our filename(name of the photo) is allowed to be updated.
  req.file.filename = `user-${req.user._id}${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 70 })
    .toFile(`./public/img/users/${req.file.filename}`);
  next();
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
  // since uploaded file(images) comes in req.file(if we are using diskStorage or we manually set req.file in resizeUploadedPhoto method above in case of memoryStorage. This object will enable us to extract filename that we can assign to 'photo' field before firing the query to update the document
  if (req.file) filteredBody.photo = req.file.filename;
  // new: true means that a new document will be returned. runValidators: true is sent to make sure that validators on the field that are being updated are run.
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  if (!user) {
    return next(
      new AppError('There was some error updating the user! Try again later!')
    );
  }
  res.status(200).json({
    status: 'success',
    user: user
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // Get the user's _id that needs to be deleted and set it's 'active' property to false
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });
  if (!user) {
    return next(
      new AppError('There was some error deleting the user! Try again later!')
    );
  }
  // 204 means success in deletion. Postman doesn't show the response even if we send it from here like below
  res.status(204).json({
    status:
      'User is now inactive! Will be deleted some days later from database!'
  });
});

// faking as if user.id is coming from the params. We did this to leverage the functionality of getUser method.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// password CANNOT be updated via this route as we have signup route for that
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };
