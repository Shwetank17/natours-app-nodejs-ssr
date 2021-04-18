const express = require('express');
const userController = require('./../controllers/userController');
const authcontroller = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authcontroller.createUser);
router.post('/login', authcontroller.login);
router.post('/forgotPassword', authcontroller.forgotPassword);
router.patch('/resetPassword/:resetToken', authcontroller.resetPassword);
router.patch(
  '/updatePassword',
  authcontroller.protect,
  authcontroller.updatePassword
);
router.patch('/updateMe', authcontroller.protect, userController.updateMe);
router.patch('/deleteMe', authcontroller.protect, userController.deleteMe);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
