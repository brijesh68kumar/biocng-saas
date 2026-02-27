const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
};

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