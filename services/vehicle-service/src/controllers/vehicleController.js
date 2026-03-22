/**
 * Vehicle Controller — Refactored (Phase 1: Clean Architecture)
 *
 * All database access goes through IVehicleRepository (via DI).
 * All cross-service calls go through IUserServiceClient (via DI).
 * All activity logging goes through IActivityLogger (via DI).
 *
 * This controller ONLY handles HTTP request/response concerns.
 */
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../errors/AppError');

const createVehicle = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const activityLogger = req.container.resolve('activityLogger');

    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];

    const vehicleData = {
      ...req.body,
      car_providerId: req.user.userId,
      images: imagePaths,
    };

    const requiredFields = [
      'name', 'brand', 'modelYear', 'licensePlate',
      'rentalPricePerDay', 'seats', 'transmission', 'fuelType',
    ];
    const missingFields = requiredFields.filter(field => !vehicleData[field]);
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const vehicle = await vehicleRepository.create(vehicleData);

    await activityLogger.logVehicleActivity(
      req.user._id, 'car_provider', 'ADD_CAR',
      { vehicleId: vehicle._id, make: vehicle.brand, model: vehicle.model, addedAt: new Date() }
    );

    res.status(201).json({ message: 'Vehicle created successfully', data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ConflictError('License plate already exists'));
    }
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const { id } = req.params;

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (vehicle.car_providerId.toString() !== req.user.userId) {
      throw new ForbiddenError('Not authorized to delete this vehicle');
    }

    await vehicleRepository.deleteById(id);
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const activityLogger = req.container.resolve('activityLogger');
    const { id } = req.params;

    if (req.body.licensePlate) {
      const existing = await vehicleRepository.findByLicensePlate(req.body.licensePlate, id);
      if (existing) throw new ConflictError('License plate already exists');
    }

    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];

    let finalImages = [];
    if (req.body.existingImages) {
      finalImages = [...JSON.parse(req.body.existingImages)];
    }
    if (imagePaths.length > 0) {
      finalImages = [...finalImages, ...imagePaths];
    }

    const updateData = {
      ...req.body,
      ...(finalImages.length > 0 && { images: finalImages }),
    };

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (vehicle.car_providerId.toString() !== req.user.userId) {
      throw new ForbiddenError('Not authorized to update this vehicle');
    }

    delete updateData.car_providerId;
    delete updateData.existingImages;

    const updatedVehicle = await vehicleRepository.updateById(id, updateData);

    await activityLogger.logVehicleActivity(
      req.user._id, 'car_provider', 'UPDATE_CAR',
      { vehicleId: vehicle._id, updatedAt: new Date() }
    );

    res.status(200).json({ message: 'Vehicle updated successfully', data: updatedVehicle });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ConflictError('License plate already exists'));
    }
    next(error);
  }
};

const updateVehicleStatus = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const activityLogger = req.container.resolve('activityLogger');
    const { id } = req.params;
    const { status } = req.body;

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (vehicle.car_providerId.toString() !== req.user.userId) {
      throw new ForbiddenError('Not authorized to update this vehicle');
    }

    const validStatuses = ['Available', 'Rented', 'Unavailable'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedVehicle = await vehicleRepository.updateStatus(id, status);

    await activityLogger.logVehicleActivity(
      req.user._id, 'car_provider', 'UPDATE_CAR_STATUS',
      { vehicleId: vehicle._id, newStatus: status, updatedAt: new Date() }
    );

    res.status(200).json({ message: 'Vehicle status updated successfully', data: updatedVehicle });
  } catch (error) {
    next(error);
  }
};

const getAllVehicles = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const userServiceClient = req.container.resolve('userServiceClient');

    const result = await vehicleRepository.findWithPagination(req.query);

    // Attach user details to each vehicle
    const vehiclesWithUserDetails = await Promise.all(
      result.vehicles.map(async (vehicle) => {
        if (!vehicle.car_providerId) return vehicle;
        const userDetails = await userServiceClient.getUserDetails(vehicle.car_providerId);
        if (userDetails) {
          return { ...vehicle.toObject(), car_providerId: userDetails };
        }
        return vehicle;
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles: vehiclesWithUserDetails,
        pagination: { total: result.total, page: result.page, pages: result.pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const userServiceClient = req.container.resolve('userServiceClient');
    const { id } = req.params;

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle');

    let vehicleData = vehicle;
    if (vehicle.car_providerId) {
      const userDetails = await userServiceClient.getUserDetails(vehicle.car_providerId);
      if (userDetails) {
        vehicleData = { ...vehicle.toObject(), car_providerId: userDetails };
      }
    }

    res.status(200).json({ message: 'Vehicle retrieved successfully', data: vehicleData });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid vehicle ID format'));
    }
    next(error);
  }
};

module.exports = { createVehicle, deleteVehicle, updateVehicle, updateVehicleStatus, getAllVehicles, getVehicleById };