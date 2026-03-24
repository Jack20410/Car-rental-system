const { createContainer, asClass, InjectionMode } = require('awilix');

// --- Import Concrete Implementations ---
const MongoRentalRepository = require('../repositories/MongoRentalRepository');
const HttpVehicleServiceClient = require('../services/HttpVehicleServiceClient');
const JwtAuthService = require('../services/JwtAuthService');
const HttpActivityLogger = require('../services/HttpActivityLogger');

/**
 * Application-level Dependency Injection Container for rental-service.
 *
 * All interface-to-implementation bindings are registered here.
 * The container is created once at boot time (index.js) and made
 * available to every request via the `scopePerRequest` middleware.
 */
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // --- Data Access Layer ---
  rentalRepository: asClass(MongoRentalRepository).singleton(),

  // --- Infrastructure Services ---
  vehicleServiceClient: asClass(HttpVehicleServiceClient).singleton(),
  authService: asClass(JwtAuthService).singleton(),
  activityLogger: asClass(HttpActivityLogger).singleton(),

  // --- Future: Application Use-Cases ---
  // createRentalUseCase:   asClass(CreateRentalUseCase).scoped(),
  // updateRentalUseCase:   asClass(UpdateRentalUseCase).scoped(),
});

module.exports = container;
