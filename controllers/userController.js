const { promisify } = require('util'); // For promisify function
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('../catchAsync');
const AppError = require('../appError');
const sendEmail = require('../email');

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    ID: req.body.ID,
    role: req.body.role === 'admin' ? req.body.role : 'user',
    isDisabled: req.body.isDisabled === 'true' ? req.body.isDisabled : 'false',
  });

  const token = jwt.sign(
    { id: newUser.ID, role: newUser.role, email: newUser.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(201).json({
    status: 'success',
    token,
    data: {
      newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (user.isDisabled) {
    return next(
      new AppError('Your user is disabled! Ask an admin to repair.', 401)
    );
  }

  const token = jwt.sign(
    { id: user.ID, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(201).json({
    status: 'success',
    token,
    message: 'Logged in successfully!',
  });
});

// User can see only his user, admin can see everyone
exports.getUser = async (req, res, next) => {
  const foundUser = await User.find({ ID: req.params.ID });
  let token = req.headers.authorization.split(' ')[1];

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  if (decoded.id != req.params.ID && decoded.role === 'user') {
    return next(
      new AppError(
        'Unauthorized to do this action! Try again as an admin.',
        401
      )
    );
  }

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        foundUser,
      },
    },
  });
  next();
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  let token = req.headers.authorization.split(' ')[1];
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  await sendEmail({
    email: decoded.email,
    subject: 'Reset your password to Users-Management',
    token: token,
  });

  res.status(200).json({
    status: 'success',
    message: 'Email sent to user.',
  });
});

// Actions authorized - admin only!!
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ isDisabled: { $ne: true } });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// Created to protect the routes, only logged in users can access
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  if (decoded.role === 'user') {
    return next(
      new AppError(
        'Unauthorized to do this action! Try again as an admin.',
        401
      )
    );
  }

  next();
});

exports.softDelete = catchAsync(async (req, res, next) => {
  const foundUser = await User.find({ ID: req.params.ID });
  foundUser.isDisabled = true;

  res.status(201).json({
    status: 'success',
    message: 'User deleted successfully!',
  });
  next();
});

exports.repairUserAfterDisabled = catchAsync(async (req, res, next) => {
  const foundUser = await User.find({ ID: req.params.ID });
  foundUser.isDisabled = false;

  res.status(201).json({
    status: 'success',
    message: 'User revovered successfully!',
    foundUser,
  });
  next();
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // For fields are not allowed
  if (req.body.email || req.body.ID) {
    return next(new AppError('Unique fields cannot be updated! Try again.'));
  }

  const fieldsToUpdate = filterObj(
    req.body,
    'firstName',
    'lastName',
    'isDisabled',
    'password',
    'photo',
    'expDate',
    'role'
  );

  const userToUpdate = await User.findOneAndUpdate(
    { ID: req.params.ID },
    { fieldsToUpdate }
  );

  // Generate new token for the updated user
  const token = jwt.sign(
    {
      id: fieldsToUpdate.ID,
      role: fieldsToUpdate.role,
      email: fieldsToUpdate.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(201).json({
    status: 'success',
    token,
    data: {
      userToUpdate,
    },
  });

  next();
});

// Helper function that return an object with the wanted fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
