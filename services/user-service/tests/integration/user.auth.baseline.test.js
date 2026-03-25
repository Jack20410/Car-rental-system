/**
 * BASELINE INTEGRATION TEST — User Authentication Flow
 *
 * This test verifies end-to-end behaviour against PostgreSQL via Prisma.
 * It ensures the authentication flow works as expected.
 */
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const express = require('express');

// Import app components
const userRoutes = require('../../src/routes/user.routes');
const errorHandler = require('../../src/middleware/errorMiddleware');
const { scopePerRequest } = require('../../src/middleware/containerMiddleware');

const prisma = new PrismaClient();
let app;

beforeAll(async () => {
  await prisma.$connect();

  // Clean up any left-over test users before starting tests
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test@example.com', 'incomplete@example.com', 'ghost@example.com']
      }
    }
  });

  // Set JWT_SECRET for tests
  process.env.JWT_SECRET = 'test_secret_key_for_integration';

  app = express();
  app.use(express.json());
  app.use(scopePerRequest);
  app.use('/users', userRoutes);
  app.use(errorHandler);
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up only the test users to avoid wiping the development database
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test@example.com', 'incomplete@example.com', 'ghost@example.com']
      }
    }
  });
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
