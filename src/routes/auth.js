const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');
const config = require('../config/env');

const router = express.Router();

// Creates JWT token used by frontend/clients to call protected routes.
const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

// Register user for a tenant (basic bootstrap endpoint for now).
router.post('/register', asyncHandler(async (req, res) => {
  const { tenantId, name, email, password, role } = req.body;

  if (!tenantId || !name || !email || !password) {
    res.status(400);
    throw new Error('tenantId, name, email and password are required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    tenantId,
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    role: role || 'admin',
  });

  res.status(201).json({
    id: user._id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}));

// Login endpoint: validates credentials and returns token + user info.
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({
    token: signToken(user._id),
    user: {
      id: user._id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}));

// Returns profile of currently authenticated user.
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    id: req.user._id,
    tenantId: req.user.tenantId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
}));

module.exports = router;
