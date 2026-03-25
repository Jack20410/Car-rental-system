# User Service - Car Rental System

## 1. Service Overview
The **User Service** is a core microservice within the Car Rental System ecosystem. It is responsible for handling all user-related operations, including registration, authentication, profile management, role-based access control (RBAC), and avatar uploads. By centralizing these concerns, it ensures strict security and provides a single source of truth for user identities across the entire platform.

## 2. Tech Stack
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** PostgreSQL (hosted on Supabase, using Prisma ORM)
- **Dependency Injection:** Awilix (Implementing Clean Architecture principles)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **File Uploads:** Multer (for handling user avatar images)
- **Testing environment:** Jest & Supertest

## 3. Key Features / Business Logic
- **User Authentication:** Secure registration and login using heavily hashed passwords (bcrypt) and JWT tokens.
- **Role-Based Access Control (RBAC):** Natively supports three distinct roles (`admin`, `car_provider`, and `customer`), allowing route protection based on user type.
- **Profile Management:** Users can view and intimately update their profiles, including uploading custom avatar images globally served via static routing.
- **Admin Capabilities:** Administrators can radically retrieve complete user details, view users by role, and forcefully delete single or multiple user accounts in batches.
- **Activity Logging:** Automatically logs critical user activities like registration and login workflows into an activity tracker for auditing purposes.
- **Clean Architecture:** Implements a layered architecture (Controllers, Services, Repositories) facilitated by Awilix for smooth dependency inversion.
- **Legacy ID Support:** Seamlessly handles lookups by both new PostgreSQL UUIDs and old MongoDB ObjectIds via the `legacyId` field.

## 4. Prerequisites & Environment Variables

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized running)
- A PostgreSQL database (e.g., Supabase)

### Environment Variables (.env)
Create a `.env` file in the root of the `user-service` directory. Use the following table as a `.env.example`:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `PORT` | The port on which the service will run | `3001` |
| `DATABASE_URL` | PostgreSQL connection string (pooled, for Prisma Client) | `postgresql://user:pass@host:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection (for Prisma Migrate/Push) | `postgresql://user:pass@host:5432/postgres` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `JWT_SECRET` | Secret key used for signing JWT login tokens | `your_super_secret_jwt_key_here` |

## 5. Local Setup & Running

### Option A: Running Locally with Node.js
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
3. **Push schema to database (if first time):**
   ```bash
   npx prisma db push
   ```
4. **Set up environment variables:**
   Copy your `.env` file as described in the table above.
5. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The service will be instantly available at `http://localhost:3001`*

### Option B: Running via Docker
1. **Build and start the containerized environment:**
   ```bash
   npm run docker:dev
   # or simply using plain compose: docker-compose up --build
   ```

## 6. API Documentation

### Public Routes

#### 1. Register User
* **Method & URL:** `POST /users/register`
* **Description:** Registers a new user into the ecosystem.
* **Request Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phoneNumber": "+1234567890",
    "role": "customer"
  }
  ```
* **Expected Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "1c66332a-0c82-4634-8306-49dda33d13ce",
      "_id": "1c66332a-0c82-4634-8306-49dda33d13ce",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "role": "customer",
      "avatar": "/uploads/avatar/user.png",
      "createdAt": "2026-03-25T17:52:53.004Z",
      "updatedAt": "2026-03-25T17:52:53.004Z"
    }
  }
  ```

#### 2. Login User
* **Method & URL:** `POST /users/login`
* **Description:** Authenticates a user and explicitly returns a valid JWT token.
* **Request Payload:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Expected Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "id": "1c66332a-0c82-4634-8306-49dda33d13ce",
      "_id": "1c66332a-0c82-4634-8306-49dda33d13ce",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 3. Get Public User Details
* **Method & URL:** `GET /users/:id`
* **Description:** Retrieves public-facing information about a user. Supports both UUID and legacy MongoDB ObjectId lookups.
* **Expected Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "User retrieved successfully",
    "data": {
      "_id": "1c66332a-0c82-4634-8306-49dda33d13ce",
      "fullName": "Jane Provider",
      "avatar": "/uploads/avatar/user.png",
      "email": "jane@provider.com",
      "phoneNumber": "+1987654321",
      "createdAt": "2024-03-20T10:00:00.000Z"
    }
  }
  ```

### Protected Routes (Requires Header: `Authorization: Bearer <token>`)

#### 4. Get Current User Profile
* **Method & URL:** `GET /users/profile`
* **Description:** Retrieves the exact profile of the currently authenticated user based on the provided JWT.
* **Expected Response:** `200 OK` (Returns complete user object minus password)

#### 5. Update User Profile & Avatar
* **Method & URL:** `PATCH /users/:id`
* **Description:** Updates user details dynamically. Thoroughly supports `multipart/form-data` for direct avatar image uploads.
* **Expected Response:** `200 OK`

#### 6. Admin: Delete Multiple Users
* **Method & URL:** `DELETE /users/all`
* **Description:** Batch deletes multiple users instantaneously. *Admin privileges essentially required depending on the middleware application context.*
* **Request Payload:**
  ```json
  {
    "userIds": ["1c66332a-0c82-4634-8306-49dda33d13ce", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
  }
  ```
* **Expected Response:** `200 OK`

## 7. API Testing Guide

### Using cURL
**1. Register a new user:**
```bash
curl -X POST http://localhost:3001/users/register \
-H "Content-Type: application/json" \
-d '{"name":"Alice","email":"alice@test.com","password":"password123","phoneNumber":"123","role":"customer"}'
```

**2. Login to retrieve the token:**
```bash
curl -X POST http://localhost:3001/users/login \
-H "Content-Type: application/json" \
-d '{"email":"alice@test.com","password":"password123"}'
```

**3. Get Profile (Swap YOUR_JWT_TOKEN with the actual string from Step 2):**
```bash
curl -X GET http://localhost:3001/users/profile \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman
1. Open Postman and instantly create a new **POST** request strictly to `http://localhost:3001/users/login`.
2. Go directly to the **Body** tab, comprehensively select **raw** and format as **JSON**.
3. Assuredly enter your login credentials formatted as JSON and comfortably hit Send.
4. Copy the freshly generated `token` string from the JSON response.
5. Create a secondary **GET** request to `http://localhost:3001/users/profile`.
6. Proceed to the **Authorization** tab, confidently select **Bearer Token** horizontally, and accurately paste your string. Hit Send to verify authentication.

## 8. Database Schema

The service uses **PostgreSQL** (hosted on Supabase) with **Prisma ORM** for data access. Below is the schema mapping for the `User` table:

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | PostgreSQL UUID v4 identifier |
| `legacyId` | String | Unique, Nullable | Stores the old MongoDB `_id` for backward compatibility |
| `name` | String | Required | The user's full name |
| `email` | String | Required, Unique, Indexed | The user's primary email address (used for login) |
| `password` | String | Required | Secure bcrypt hashed string |
| `phoneNumber`| String | Required, Mapped to `phone_number` | Primary contact phone number |
| `avatar` | String | Default: `/uploads/avatar/user.png` | Path/URL to the uploaded profile picture |
| `role` | String | Default: `customer` | User roles: `admin`, `car_provider`, `customer` |
| `createdAt` | DateTime | Auto-set on creation, Mapped to `created_at` | Timestamp tracking account creation |
| `updatedAt` | DateTime | Auto-updated, Mapped to `updated_at` | Timestamp tracking last modification |

---

## 9. Migration Changelog: MongoDB → PostgreSQL

> **Migration Date:** March 25, 2026
> **Version:** `1.0.0` → `2.0.0`

### Why We Migrated
Moved from MongoDB (Mongoose) to PostgreSQL (Supabase) with Prisma ORM for stronger relational data integrity, better query performance, and unified infrastructure with Supabase's managed platform.

### What Changed

#### Files Created
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Prisma schema defining the `User` model for PostgreSQL |
| `src/repositories/PrismaUserRepository.js` | Drop-in replacement for `MongoUserRepository` using Prisma Client |
| `prisma.config.ts` *(if applicable)* | Prisma CLI configuration (for Prisma 7+ only) |

#### Files Modified
| File | Change |
|------|--------|
| `src/config/database.js` | `mongoose.connect()` → `prisma.$connect()` |
| `src/config/container.js` | DI binding: `MongoUserRepository` → `PrismaUserRepository` |
| `src/index.js` | Updated database import to Prisma module |
| `src/entities/UserEntity.js` | Updated JSDoc references from Mongoose to Prisma |
| `src/interfaces/IUserRepository.js` | Updated JSDoc to be database-agnostic |
| `package.json` | Removed `mongoose`, `mongodb-memory-server`; added `@prisma/client`, `prisma` |
| `.env` | Removed `MONGODB_URI`; added `DATABASE_URL`, `DIRECT_URL` |
| `Dockerfile` | Added `prisma generate` step to Docker build |

#### Files Deleted
| File | Reason |
|------|--------|
| `src/models/user.model.js` | Old Mongoose schema — replaced by `prisma/schema.prisma` |
| `src/repositories/MongoUserRepository.js` | Old Mongoose repository — replaced by `PrismaUserRepository.js` |

#### Schema Mapping (Mongoose → Prisma)
| Mongoose Field | Mongoose Type | Prisma Field | Prisma Type | Notes |
|---------------|---------------|-------------|-------------|-------|
| `_id` | `ObjectId` | `id` | `String @db.Uuid` | Auto-generated UUID v4 |
| *(new)* | — | `legacyId` | `String?` | Stores old MongoDB `_id` for backward compat |
| `name` | `String` | `name` | `String` | No change |
| `email` | `String` | `email` | `String @unique` | No change |
| `password` | `String` | `password` | `String` | No change |
| `phoneNumber` | `String` | `phoneNumber` | `String` | Mapped to `phone_number` column |
| `avatar` | `String` | `avatar` | `String` | Default: `/uploads/avatar/user.png` |
| `role` | `String (enum)` | `role` | `String` | Default: `customer` |
| `createdAt` | `Date` | `createdAt` | `DateTime` | `@default(now())` |
| *(new)* | — | `updatedAt` | `DateTime` | `@updatedAt` (auto-managed by Prisma) |

#### Key Architecture Decision: No Controller Changes Needed
Thanks to the Clean Architecture (Repository Pattern + DI), the **controller layer required zero changes**. The migration was entirely contained within the data access layer — only the repository implementation was swapped.

### ID Handling Strategy
The `PrismaUserRepository` automatically detects the ID format:
- **UUID format** (e.g. `1c66332a-0c82-4634-8306-49dda33d13ce`) → queries by `id`
- **MongoDB ObjectId** (e.g. `68104c8526632ef737164552`) → queries by `legacyId`

This ensures full backward compatibility with existing frontend clients and other microservices that may still reference old MongoDB IDs.

### API Test Results (Post-Migration)

All endpoints verified on **March 25, 2026** against the live Supabase PostgreSQL database:

| # | Endpoint | Method | Status | Result |
|---|----------|--------|--------|--------|
| 1 | `/health` | GET | `200 OK` | ✅ Service healthy |
| 2 | `/users/register` | POST | `201 Created` | ✅ User created with UUID |
| 3 | `/users/login` | POST | `200 OK` | ✅ JWT token returned |
| 4 | `/users/profile` | GET | `200 OK` | ✅ Authenticated profile |
| 5 | `/users` | GET | `200 OK` | ✅ All users listed (15 migrated + 1 new) |
| 6 | `/users/:uuid` | GET | `200 OK` | ✅ Lookup by new UUID |
| 7 | `/users/:mongoId` | GET | `200 OK` | ✅ Lookup by legacy MongoDB ObjectId |
| 8 | `/users/role/:role` | GET | `200 OK` | ✅ Filtered by role |
| 9 | `/users/:id` | PATCH | `200 OK` | ✅ User updated successfully |
| 10 | `/users/:id` | DELETE | `200 OK` | ✅ User deleted successfully |
