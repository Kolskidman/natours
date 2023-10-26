const express = require('express');

const tourController = require(`./../controllers/tourController`);
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router.route('/get-stats', tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

module.exports = router;
