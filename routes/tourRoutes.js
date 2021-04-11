const express = require('express');
const tourController = require('./../controllers/tourController');
const { protect } = require('./../controllers/authController');

const router = express.Router();

// checkid middleware will run before invoking any of the tour related routes
// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.route('/tour-stat').get(tourController.getTourStat);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(protect, tourController.getAllTours)
  .post(tourController.createTour);
// .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
