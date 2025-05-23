const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { logUserActivity } = require('../utils/activityLogger');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'customer', // Default to customer if role is not provided
      avatar: '/uploads/avatar/user.png' // Set default avatar
    });

    await user.save();

    // Log registration activity
    await logUserActivity(
      user._id,
      user.role,
      'REGISTER',
      {
        email: user.email,
        registrationTime: new Date()
      }
    );

    // Return success response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Find all users but exclude password field
    const users = await User.find({}, '-password');

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // Only select specified public fields
    const user = await User.findById(id).select('name email phoneNumber avatar createdAt role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform the response for public view
    const publicUserData = {
      _id: user._id,
      fullName: user.name,
      avatar: user.avatar,
      email: user.role === 'car_provider' ? user.email : undefined,
      phoneNumber: user.role === 'car_provider' ? user.phoneNumber : undefined,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: publicUserData
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // The user ID is extracted from the JWT token in the auth middleware
    const userId = req.user.userId;
    
    // Find the user by ID but exclude password field
    const user = await User.findById(userId, '-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current user profile',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Log login activity
    await logUserActivity(
      user._id,
      user.role,
      'LOGIN',
      {
        email: user.email,
        loginTime: new Date(),
        ipAddress: req.ip
      }
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create user response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Find users by role but exclude password field
    const users = await User.find({ role }, '-password');

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: `No users found with role: ${role}`
      });
    }

    res.status(200).json({
      success: true,
      message: `Users with role ${role} retrieved successfully`,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users by role',
      error: error.message
    });
  }
};

// Delete a single user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Delete multiple users
exports.deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to delete'
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Users deleted successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting users',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Nếu có file avatar upload, cập nhật đường dẫn avatar
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Remove password from updates if it exists
    delete updates.password;


    // If no avatar is provided, don't update it
    if (!updates.avatar) {
      delete updates.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Get user by ID (Complete information - Admin only)
exports.getUserByIdAll = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Find the user by ID with all fields (except password)
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complete user data retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching complete user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complete user data',
      error: error.message
    });
  }
};