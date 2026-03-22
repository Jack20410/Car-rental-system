const { createContainer, asClass, InjectionMode } = require('awilix');

// --- Import Concrete Implementations ---
const MongoUserRepository = require('../repositories/MongoUserRepository');
const BcryptJwtAuthService = require('../services/BcryptJwtAuthService');
const HttpActivityLogger = require('../services/HttpActivityLogger');

/**
 * Application-level Dependency Injection Container.
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
  userRepository: asClass(MongoUserRepository).singleton(),

  // --- Infrastructure Services ---
  authService: asClass(BcryptJwtAuthService).singleton(),
  activityLogger: asClass(HttpActivityLogger).singleton(),

  // --- Future: Application Use-Cases ---
  // registerUserUseCase: asClass(RegisterUserUseCase).scoped(),
  // loginUserUseCase:    asClass(LoginUserUseCase).scoped(),
});

module.exports = container;
