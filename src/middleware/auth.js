const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Missing or invalid authorization token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User not found or inactive');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Unauthorized');
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Forbidden: insufficient role');
  }
  next();
};

module.exports = { protect, authorize };