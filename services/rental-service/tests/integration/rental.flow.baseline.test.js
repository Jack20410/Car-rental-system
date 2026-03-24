/**
 * BASELINE INTEGRATION TEST — Rental Flow
 *
 * This test MUST pass BEFORE and AFTER Phase 1 refactoring.
 * Uses MongoMemoryServer — no external DB needed.
 * Mocks the IVehicleServiceClient and IActivityLogger so no network calls.
 *
 * P0 Flow: Check Availability → Create Rental → Get Rental → Update Status
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { asValue } = require('awilix');

// Import app components
const rentalRoutes = require('../../src/routes/rentalRoutes');
const errorHandler = require('../../src/middleware/errorMiddleware');
const { scopePerRequest } = require('../../src/middleware/containerMiddleware');
const container = require('../../src/config/container');

let mongoServer;
let app;
let customerToken;
let providerToken;

const JWT_SECRET = 'test_rental_secret';

// Use real ObjectIds for test users (Mongoose requires ObjectId types)
const customerId = new mongoose.Types.ObjectId();
const providerId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_SECRET = JWT_SECRET;

  // Mock the VehicleServiceClient so we never hit the network
  const mockVehicleClient = {
    getVehicle: jest.fn().mockResolvedValue({
      status: 'Available',
      rentalPricePerDay: 50,
      car_providerId: providerId.toString(),
    }),
    updateVehicleStatus: jest.fn().mockResolvedValue(),
  };
  container.register({ vehicleServiceClient: asValue(mockVehicleClient) });

  // Mock the ActivityLogger so we never hit admin-service
  const mockActivityLogger = {
    logActivity: jest.fn().mockResolvedValue(null),
    logRentalActivity: jest.fn().mockResolvedValue(),
  };
  container.register({ activityLogger: asValue(mockActivityLogger) });

  // Generate test JWTs with valid ObjectId strings
  customerToken = jwt.sign(
    { userId: customerId.toString(), email: 'customer@test.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  providerToken = jwt.sign(
    { userId: providerId.toString(), email: 'provider@test.com', role: 'car_provider' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  app = express();
  app.use(express.json());
  app.use(scopePerRequest);
  app.use('/rentals', rentalRoutes);
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
const testVehicleId = new mongoose.Types.ObjectId().toString();

const validRental = {
  vehicleId: testVehicleId,
  startDate: '2026-05-01T10:00:00.000Z',
  endDate: '2026-05-05T10:00:00.000Z',
  rentalType: 'daily',
};

const validHourlyRental = {
  vehicleId: testVehicleId,
  startDate: '2026-05-01T10:00:00.000Z',
  rentalType: 'hourly',
  hourlyDuration: 6,
};

// ─── GET /rentals/availability ──────────────────────────────────────
describe('GET /rentals/availability', () => {
  it('should return available when no conflicting rentals exist', async () => {
    const vehicleId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/rentals/availability?vehicleId=${vehicleId}&startDate=2026-05-01&endDate=2026-05-05`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAvailable).toBe(true);
  });

  it('should return 400 if required params are missing', async () => {
    const res = await request(app).get('/rentals/availability');
    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /rentals ──────────────────────────────────────────────────
describe('POST /rentals', () => {
  it('should create a daily rental and return 201', async () => {
    const res = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.rentalType).toBe('daily');
    expect(res.body.data.totalPrice).toBeGreaterThan(0);
  });

  it('should create an hourly rental and return 201', async () => {
    const res = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validHourlyRental);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rentalType).toBe('hourly');
    expect(res.body.data.hourlyDuration).toBe(6);
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).post('/rentals').send(validRental);
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /rentals/:id ───────────────────────────────────────────────
describe('GET /rentals/:id', () => {
  it('should return a rental by ID for the owner', async () => {
    const createRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    const id = createRes.body.data._id;
    const res = await request(app)
      .get(`/rentals/${id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('should return 404 for non-existent rental', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/rentals/${fakeId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(404);
  });
});

// ─── PATCH /rentals/:id/status ──────────────────────────────────────
describe('PATCH /rentals/:id/status', () => {
  it('should allow customer to cancel their pending rental', async () => {
    const createRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    const id = createRes.body.data._id;
    const res = await request(app)
      .patch(`/rentals/${id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'cancelled' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('should reject invalid status transitions', async () => {
    const createRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    const id = createRes.body.data._id;
    // Customer cannot approve their own rental
    const res = await request(app)
      .patch(`/rentals/${id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(403);
  });
});

// ─── PATCH /rentals/:id/payment ─────────────────────────────────────
describe('PATCH /rentals/:id/payment', () => {
  it('should reject payment update on pending rental', async () => {
    const createRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    const id = createRes.body.data._id;
    const res = await request(app)
      .patch(`/rentals/${id}/payment`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ paymentStatus: 'paid' });

    // Rental is 'pending', not 'approved' — should be rejected
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /rentals/all ───────────────────────────────────────────────
describe('GET /rentals/all', () => {
  it('should return a paginated list of all rentals', async () => {
    // Seed some rentals
    await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validRental);

    const res = await request(app).get('/rentals/all');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rentals).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });
});
