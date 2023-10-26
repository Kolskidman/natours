const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'User email must be unique'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password needs to be 8 or more characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      minlength: [8, 'Password needs to be 8 or more characters'],
      validate: {
        //  ONLY WORKS ON SAVE AND CREATE
        validator: function (value) {
          return this.password === value;
        },
        message: 'Password must match',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { toJSON: { virtuals: true } },
);

userSchema.virtual('id').get(function () {
  return this._id;
});

userSchema.pre('save', async function (next) {
  // Only run function if password has been modified
  if (!this.isModified('password')) return next();
  // Hash password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePassword = (unhashed, hash) =>
  bcrypt.compare(unhashed, hash);

userSchema.methods.checkPasswordChanged = function (JWTTimestamp) {
  return this.passwordChangedAt > JWTTimestamp;
};

userSchema.methods.createResetToken = function () {
  // Generate random hexadecimal strings
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypt the hexadecimal strings
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('USer', userSchema);

module.exports = User;
