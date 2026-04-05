const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');
const { userSchema, authSchema } = require('../validators/schemas');

// POST /api/auth/register — Public
router.post('/register', validateRequest(userSchema.create), authController.register);

// POST /api/auth/login — Public
router.post('/login', validateRequest(authSchema.login), authController.login);

// GET /api/auth/me — Protected
router.get('/me', authenticateUser, authController.getMe);

module.exports = router;
