const express = require('express');
const userController = require('./../controllers/userController');
const authcontroller = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authcontroller.createUser);
router.post('/login', authcontroller.login);
router.post('/forgotPassword', authcontroller.forgotPassword);
router.patch('/resetPassword/:id', authcontroller.resetPassword);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
