const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');
const config = require('../config/env');

// Middleware: validates Bearer token and loads current user into req.user
const protect = asyncHandler(async (req, res, next) => {
  // Expected format: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Missing or invalid authorization token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, config.jwtSecret);

  // Load user (without password hash) and ensure account is active
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User not found or inactive');
  }

  req.user = user;
  next();
});

// Middleware factory: allows only selected roles to access a route
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
