const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// mergeParams: true will ensure that if there is any router redirecting to this reviewRouter then it's params are merged with req.params of reviewRouter.
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(
    authController.protect,
    reviewController.checkTourId,
    reviewController.getAllReviews
  )
  .post(
    authController.protect,
    authController.restrictTo('user'), // only users should be able to write review
    reviewController.setTourUserId,
    reviewController.createReview
  );

router.get('/:id', authController.protect, reviewController.getReview);

router.patch(
  '/:id',
  authController.protect,
  authController.restrictTo('user', 'admin'), // guides cannot update review
  reviewController.updateReview
);

router.delete(
  '/:id',
  authController.restrictTo('user', 'admin'), // guides cannot delete review
  reviewController.deleteReview
);

module.exports = router;
