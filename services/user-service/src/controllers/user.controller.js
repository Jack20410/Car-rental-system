/**
 * User Controller — Refactored (Phase 1: Clean Architecture)
 *
 * All database access goes through IUserRepository (via DI).
 * All auth infrastructure goes through IAuthService (via DI).
 * All activity logging goes through IActivityLogger (via DI).
 *
 * This controller ONLY handles HTTP request/response concerns.
 */
const { ConflictError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } = require('../errors/AppError');

exports.register = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const authService = req.container.resolve('authService');
    const activityLogger = req.container.resolve('activityLogger');

    const { name, email, password, phoneNumber, role } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create new user
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'customer',
      avatar: '/uploads/avatar/user.png',
    });

    // Log registration activity
    await activityLogger.logUserActivity(
      user._id,
      user.role,
      'REGISTER',
      {
        email: user.email,
        registrationTime: new Date(),
      }
    );

    // Return success response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');

    const users = await userRepository.findAll({}, '-password');

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (public view)
exports.getUserById = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { id } = req.params;

    const user = await userRepository.findByIdSelect(id, 'name email phoneNumber avatar createdAt role');

    if (!user) {
      throw new NotFoundError('User');
    }

    // Transform the response for public view
    const publicUserData = {
      _id: user._id,
      fullName: user.name,
      avatar: user.avatar,
      email: user.role === 'car_provider' ? user.email : undefined,
      phoneNumber: user.role === 'car_provider' ? user.phoneNumber : undefined,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: publicUserData,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const userId = req.user.userId;

    const user = await userRepository.findById(userId, '-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const authService = req.container.resolve('authService');
    const activityLogger = req.container.resolve('activityLogger');

    const { email, password } = req.body;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Log login activity
    await activityLogger.logUserActivity(
      user._id,
      user.role,
      'LOGIN',
      {
        email: user.email,
        loginTime: new Date(),
        ipAddress: req.ip,
      }
    );

    // Generate JWT token
    const token = authService.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Create user response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Get users by role
exports.getUsersByRole = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { role } = req.params;

    const users = await userRepository.findAll({ role }, '-password');

    if (!users.length) {
      throw new NotFoundError(`Users with role: ${role}`);
    }

    res.status(200).json({
      success: true,
      message: `Users with role ${role} retrieved successfully`,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a single user by ID
exports.deleteUser = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { id } = req.params;

    const deletedUser = await userRepository.deleteById(id);

    if (!deletedUser) {
      throw new NotFoundError('User');
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete multiple users
exports.deleteUsers = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('Please provide an array of user IDs to delete');
    }

    const result = await userRepository.deleteMany(userIds);

    if (result.deletedCount === 0) {
      throw new NotFoundError('Users');
    }

    res.status(200).json({
      success: true,
      message: 'Users deleted successfully',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { id } = req.params;
    const updates = req.body;

    // If avatar file uploaded, update avatar path
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Remove password from updates if it exists
    delete updates.password;

    // If no avatar is provided, don't update it
    if (!updates.avatar) {
      delete updates.avatar;
    }

    const updatedUser = await userRepository.updateById(id, updates);

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (Complete information - Admin only)
exports.getUserByIdAll = async (req, res, next) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const { id } = req.params;

    // Check if the requester is an admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied. Admin privileges required.');
    }

    // Find the user by ID with all fields (except password)
    const user = await userRepository.findById(id, '-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    res.status(200).json({
      success: true,
      message: 'Complete user data retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};