const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const sendToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = sendToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    id: user._id,
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //1) Check if email, password exists
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  // 2) Check if user exists and password corrects
  if (!user || !(await user.comparePassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  createSendToken(user, 200, res);
});

exports.protected = catchAsync(async (req, res, next) => {
  // 1) Get token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  if (!token) {
    next(new AppError(`You're not logged in, Please login to get access`));
  }
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token no longer exists', 401),
    );
  // 4) Check if user changed password after generating token
  if (currentUser.checkPasswordChanged(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again'),
    );
  }
  // ALLOW ACCESS
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You're not authorized to perform this action`, 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user POSTed email address
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('There is no user with the provided email address', 404),
    );
  // 2) Generate random token
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send the token back to the client
  const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/${resetToken}`;
  const message = `Forgot your password? simply submit a patch request with your new password and passwordConfirm to: ${resetUrl}. \n If you didn't forgot your password, please ignore this email!`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending email, please try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Set new password only if user exists and token hasn't expired
  if (!user) return next(new AppError('Token is  invalid or has expired', 400));

  // 3) Update passwordChangedAt field
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Genrate a new token and send it back to the user
  req.user = user;
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted password is correct
  const { currentPassword, newPassword, passwordConfirm } = req.body;
  if (!(await user.comparePassword(currentPassword, user.password)))
    return next(new AppError('Current password is incorrect', 401));

  // 3) If so update password
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
