const express = require('express');
const router = express.Router();
const { register, getAllUsers, getUserById, login } = require('../controllers/user.controller');
const { validateRegistration, validateLogin } = require('../middleware/userValidation');
const { verifyToken } = require('../middleware/auth');

// Public routes
// POST /users/register - Register a new user
router.post('/register', validateRegistration, register);

// POST /users/login - Login user
router.post('/login', validateLogin, login);

// Protected routes
// GET /users - Get all users
router.get('/', verifyToken, getAllUsers);

// GET /users/:id - Get user by ID
router.get('/:id', verifyToken, getUserById);

module.exports = router; 