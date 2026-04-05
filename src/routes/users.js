const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { authorizeRoles } = require('../middleware/auth');
const { userSchema } = require('../validators/schemas');

// Create user (admin only)
router.post('/', authorizeRoles(['admin']), validateRequest(userSchema.create), userController.createUser);

// Get user profile
router.get('/profile/:userId?', userController.getUserProfile);

// Get all users (admin only)
router.get('/', authorizeRoles(['admin']), userController.getAllUsers);

// Update user (admin only)
router.put('/:userId', authorizeRoles(['admin']), validateRequest(userSchema.update), userController.updateUser);

// Delete user (admin only)
router.delete('/:userId', authorizeRoles(['admin']), userController.deleteUser);

module.exports = router;
