/**
 * BASELINE INTEGRATION TEST — Vehicle CRUD Flow
 *
 * This test MUST pass BEFORE and AFTER Phase 1 refactoring.
 * Uses MongoMemoryServer — no external DB needed.
 * Mocks the IUserServiceClient so no network calls to user-service.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { asValue } = require('awilix');

// Import app components
const vehicleRoutes = require('../../src/routes/vehicleRoutes');
const errorHandler = require('../../src/middleware/errorMiddleware');
const { scopePerRequest } = require('../../src/middleware/containerMiddleware');
const container = require('../../src/config/container');

let mongoServer;
let app;
let providerToken;

const JWT_SECRET = 'test_vehicle_secret';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_SECRET = JWT_SECRET;

  // Mock the UserServiceClient so we never hit the network
  const mockUserServiceClient = {
    getUserDetails: jest.fn().mockResolvedValue({
      _id: 'provider-123',
      fullName: 'Test Provider',
      avatar: '/uploads/avatar/user.png',
      email: 'provider@test.com',
    }),
  };
  container.register({ userServiceClient: asValue(mockUserServiceClient) });

  // Mock the ActivityLogger so we never hit admin-service
  const mockActivityLogger = {
    logActivity: jest.fn().mockResolvedValue(null),
    logVehicleActivity: jest.fn().mockResolvedValue(),
  };
  container.register({ activityLogger: asValue(mockActivityLogger) });

  // Generate a test JWT for a car_provider
  providerToken = jwt.sign(
    { userId: 'provider-123', email: 'provider@test.com', role: 'car_provider' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  app = express();
  app.use(express.json());
  app.use(scopePerRequest);
  app.use('/', vehicleRoutes);
  app.use(errorHandler);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// --- Test Data ---
const validVehicle = {
  name: 'Toyota Camry 2024',
  brand: 'Toyota',
  modelYear: 2024,
  licensePlate: 'ABC-1234',
  rentalPricePerDay: 50,
  seats: 5,
  carType: 'Sedan',
  transmission: 'Automatic',
  fuelType: 'Gasoline',
  description: 'A great sedan',
};

// ─── GET /vehicles ──────────────────────────────────────────
describe('GET /vehicles', () => {
  it('should return an empty list when no vehicles exist', async () => {
    const res = await request(app).get('/vehicles');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicles).toHaveLength(0);
  });

  it('should return vehicles after one is created', async () => {
    // Seed a vehicle directly
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(validVehicle);

    const res = await request(app).get('/vehicles');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.vehicles.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter vehicles by brand', async () => {
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(validVehicle);
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ ...validVehicle, brand: 'Honda', licensePlate: 'HON-001' });

    const res = await request(app).get('/vehicles?brand=Toyota');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.vehicles.every(v => /toyota/i.test(v.brand))).toBe(true);
  });
});

// ─── POST /vehicles ─────────────────────────────────────────
describe('POST /vehicles', () => {
  it('should create a vehicle with valid data and return 201', async () => {
    const res = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(validVehicle);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.brand).toBe('Toyota');
    expect(res.body.data.status).toBe('Available');
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).post('/vehicles').send(validVehicle);
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /vehicles/:id ──────────────────────────────────────
describe('GET /vehicles/:id', () => {
  it('should return a vehicle by ID', async () => {
    const createRes = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(validVehicle);

    const id = createRes.body.data._id;
    const res = await request(app).get(`/vehicles/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('should return 404 for non-existent vehicle', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/vehicles/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});
