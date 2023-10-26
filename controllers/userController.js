const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filtered = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Prevent password from being updated
  if (req.body.password || req.body.passConfirm)
    return next(
      new AppError(
        'This route is not for updating password, Please send a update request to /updateMyPassword',
        400,
      ),
    );
  // 2) Filter out unwanted field names to beupdated
  const filteredObj = filtered(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredObj, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'This route is yet to be implemented',
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'This route is yet to be implemented',
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'This route is yet to be implemented',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'This route is yet to be implemented',
  });
};
