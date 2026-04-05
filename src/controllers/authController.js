const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper — sign a token for a given user row
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
// Creates a new user and returns a JWT. Role defaults to 'viewer'.
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.validatedData;
    const user = await User.createUser(name, email, password, role);
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.message.includes('Email already exists')) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
// Verifies credentials and returns a signed JWT.
const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Fetch user including password hash
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me
// Returns the currently authenticated user's profile.
const getMe = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

module.exports = { register, login, getMe };
