# User Service - Car Rental System

## 1. Service Overview
The **User Service** is a core microservice within the Car Rental System ecosystem. It is responsible for handling all user-related operations, including registration, authentication, profile management, role-based access control (RBAC), and avatar uploads. By centralizing these concerns, it ensures strict security and provides a single source of truth for user identities across the entire platform.

## 2. Tech Stack
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Dependency Injection:** Awilix (Implementing Clean Architecture principles)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **File Uploads:** Multer (for handling user avatar images)
- **Testing environment:** Jest & Supertest (along with mongodb-memory-server for isolated tests)

## 3. Key Features / Business Logic
- **User Authentication:** Secure registration and login using heavily hashed passwords (bcrypt) and JWT tokens.
- **Role-Based Access Control (RBAC):** Natively supports three distinct roles (`admin`, `car_provider`, and `customer`), allowing route protection based on user type.
- **Profile Management:** Users can view and intimately update their profiles, including uploading custom avatar images globally served via static routing.
- **Admin Capabilities:** Administrators can radically retrieve complete user details, view users by role, and forcefully delete single or multiple user accounts in batches.
- **Activity Logging:** Automatically logs critical user activities like registration and login workflows into an activity tracker for auditing purposes.
- **Clean Architecture:** Implements a layered architecture (Controllers, Services, Repositories) facilitated by Awilix for smooth dependency inversion.

## 4. Prerequisites & Environment Variables

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized running)
- A running MongoDB instance (or MongoDB Atlas URI)

### Environment Variables (.env)
Create a `.env` file in the root of the `user-service` directory. Use the following table as a `.env.example`:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `PORT` | The port on which the service will run | `3001` |
| `MONGODB_URI` | The connection string for MongoDB | `mongodb://localhost:27017/user_service_db` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `JWT_SECRET` | Secret key used for signing JWT login tokens | `your_super_secret_jwt_key_here` |

## 5. Local Setup & Running

### Option A: Running Locally with Node.js
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   Copy your `.env` file as described in the table above.
3. **Start the development server:**
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
      "_id": "60d0fe4f5311236168a109ca",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "role": "customer",
      "avatar": "/uploads/avatar/user.png",
      "createdAt": "2024-03-24T10:00:00.000Z"
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
      "_id": "60d0fe4f5311236168a109ca",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 3. Get Public User Details
* **Method & URL:** `GET /users/:id`
* **Description:** Retrieves public-facing information about a user (highly useful for displaying car provider specific details without exposing PII).
* **Expected Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "User retrieved successfully",
    "data": {
      "_id": "60d0fe4f5311236168a109ca",
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
    "userIds": ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
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

The service faithfully relies on MongoDB to store active user data. Below is the Entity Relationship table mapping directly to the `User` Mongoose schema collection.

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `_id` | ObjectId | Primary Key | Auto-generated standard MongoDB identifier |
| `name` | String | Required, Trimmed | The verified user's full functional name |
| `email` | String | Required, Unique, Lowercase | The user's primary email address (solely used for standardized login) |
| `password` | String | Required | Secure bcrypt hashed string |
| `phoneNumber`| String | Required | Primary contact phone indicator |
| `avatar` | String | Default String Map | Exact Path/URL pointing to the uploaded profile picture (`/uploads/avatar/user.png` standard default) |
| `role` | String | Enum Set | Extracted roles: `admin`, `car_provider`, `customer`. Inherently defaults to `customer` |
| `createdAt` | Date | Initialized Default | Chronological Timestamp tracking exact account creation logic |
