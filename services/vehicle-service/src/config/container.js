const { createContainer, asClass, InjectionMode } = require('awilix');

const MongoVehicleRepository = require('../repositories/MongoVehicleRepository');
const HttpUserServiceClient = require('../services/HttpUserServiceClient');
const JwtAuthService = require('../services/JwtAuthService');
const HttpActivityLogger = require('../services/HttpActivityLogger');

/**
 * Application-level Dependency Injection Container for vehicle-service.
 */
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  vehicleRepository: asClass(MongoVehicleRepository).singleton(),
  userServiceClient: asClass(HttpUserServiceClient).singleton(),
  authService: asClass(JwtAuthService).singleton(),
  activityLogger: asClass(HttpActivityLogger).singleton(),
});

module.exports = container;
