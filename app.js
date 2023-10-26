const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require(`./routes/tourRoutes`);
const userRouter = require(`./routes/userRoutes`);
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set SECURITY HTTP HEADERS
app.use(helmet());

// DEVELOPMENTAL LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limiting request from a specific IP
const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many request from this IP, Please try again after one hour',
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NOSQL Injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

// 2) CUSTOM ROUTER
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status = 'fail';

  // WHENEVER THE NEXT() RECEIVES AN ARGUMENT, EXPRESS WILL INVOKE THE ERROR HANDLING MIDDLWARE
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
