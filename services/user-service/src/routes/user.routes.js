const express = require('express');
const router = express.Router();
const { 
register, 
getAllUsers, 
getUserById, 
login, 
getUsersByRole,
deleteUser,
deleteUsers,
updateUser,
getCurrentUser
} = require('../controllers/user.controller');
const { validateRegistration, validateLogin } = require('../middleware/userValidation');
const { verifyToken } = require('../middleware/auth');

// Public routes
// POST /users/register - Register a new user
router.post('/register', validateRegistration, register);

// POST /users/login - Login user
router.post('/login', validateLogin, login);

// GET /users/:id - Get user by ID (Public route for provider details)
router.get('/:id', getUserById);

// Protected routes
// GET /users - Get all users
router.get('/', verifyToken, getAllUsers);

// GET /users/profile - Get current user profile
router.get('/profile', verifyToken, getCurrentUser);

// GET /users/role/:role - Get users by role
router.get('/role/:role', verifyToken, getUsersByRole);

// DELETE /users/:id - Delete a single user
router.delete('/:id', verifyToken, deleteUser);

// DELETE /users - Delete multiple users
router.delete('/all', verifyToken, deleteUsers);

// PATCH /users/:id - Update user
router.patch('/:id', verifyToken, updateUser);

module.exports = router; 