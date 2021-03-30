const express = require('express');
const tourController = require('./../controllers/tourController');

const router = express.Router();

// checkid middleware will run before invoking any of the tour related routes
// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router
  .route('/tour-stat')
  .get(tourController.aliasTopTour, tourController.getTourStat);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
// .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
