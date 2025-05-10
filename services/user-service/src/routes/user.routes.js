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
const { upload } = require('../middleware/uploadMiddleware');

// Public routes
// POST /users/register - Register a new user
router.post('/register', validateRegistration, register);

// POST /users/login - Login user
router.post('/login', validateLogin, login);

// Protected routes
// GET /users - Get all users
router.get('/', verifyToken, getAllUsers);

// GET /users/profile - Get current user profile
router.get('/profile', verifyToken, getCurrentUser);

// GET /users/role/:role - Get users by role
router.get('/role/:role', verifyToken, getUsersByRole);

// DELETE /users/all - Delete multiple users
router.delete('/all', verifyToken, deleteUsers);

// GET /users/:id - Get user by ID (Public route for provider details)
router.get('/:id', getUserById);

// DELETE /users/:id - Delete a single user
router.delete('/:id', verifyToken, deleteUser);

// PATCH /users/:id - Update user (with avatar upload)
router.patch('/:id', verifyToken, upload.single('avatar'), updateUser);

module.exports = router; 