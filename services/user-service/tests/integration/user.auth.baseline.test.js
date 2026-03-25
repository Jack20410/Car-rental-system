/**
 * ⚠️  DEPRECATED — This test relies on MongoDB (MongoMemoryServer + Mongoose)
 * which have been removed from the project as part of the PostgreSQL migration.
 * This file is kept for reference only. It needs to be rewritten to use
 * Prisma + PostgreSQL (or a test database) for integration testing.
 *
 * BASELINE INTEGRATION TEST — User Authentication Flow
 *
 * This test MUST pass BEFORE and AFTER Phase 1 refactoring.
 * It verifies end-to-end behaviour against a real (in-memory) MongoDB.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');

// Import app components
const userRoutes = require('../../src/routes/user.routes');
const errorHandler = require('../../src/middleware/errorMiddleware');
const { scopePerRequest } = require('../../src/middleware/containerMiddleware');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);

  // Set JWT_SECRET for tests
  process.env.JWT_SECRET = 'test_secret_key_for_integration';

  app = express();
  app.use(express.json());
  app.use(scopePerRequest);
  app.use('/users', userRoutes);
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
const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phoneNumber: '1234567890',
};

// ─── POST /users/register ───────────────────────────────────
describe('POST /users/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post('/users/register')
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.role).toBe('customer');
  });

  it('should return error when email already exists', async () => {
    // Register once
    await request(app).post('/users/register').send(validUser);

    // Attempt duplicate
    const res = await request(app)
      .post('/users/register')
      .send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ email: 'incomplete@example.com' });

    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /users/login ─────────────────────────────────────
describe('POST /users/login', () => {
  beforeEach(async () => {
    // Seed a user before each login test
    await request(app).post('/users/register').send(validUser);
  });

  it('should login with valid credentials and return a token', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 401 for invalid password', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: validUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /users/profile ────────────────────────────────────
describe('GET /users/profile', () => {
  let authToken;

  beforeEach(async () => {
    await request(app).post('/users/register').send(validUser);
    const loginRes = await request(app)
      .post('/users/login')
      .send({ email: validUser.email, password: validUser.password });
    authToken = loginRes.body.token;
  });

  it('should return current user profile with valid token', async () => {
    const res = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validUser.email);
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/users/profile');

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/users/profile')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.statusCode).toBe(401);
  });
});
