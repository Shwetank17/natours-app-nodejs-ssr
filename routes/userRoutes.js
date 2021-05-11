const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// In this route we are returning the userinformation of the user who is currently logged in
router.post('/signup', authController.createUser);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);
router.get('/logout', authController.logout);

// This router is like a mini application and just like the regular 'app' we can use a middleware with it. So we are running the 'protect' middleware at this point to make sure that all other routes from here onwards are protected. This will save writing extra code to add 'authController.protect' to every route from here onwards.
router.use(authController.protect);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);
router.patch('/updateMe', userController.updateMe);
router.patch('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
