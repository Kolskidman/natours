const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get all tours from collection
  const tours = await Tour.find();

  // 2) Create our overview with the tours
  res.render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = (req, res) => {
  res.render('tour', {
    title: 'The Forest Hiker Tour',
  });
};
