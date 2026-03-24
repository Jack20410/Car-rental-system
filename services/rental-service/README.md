# Rental Service - Car Rental System

## 1. Service Overview
The **Rental Service** is the central transactional engine of the Car Rental System ecosystem. It effectively handles the entire lifecycle of a rental agreement—from determining real-time availability and dynamic price calculation (via WebSockets) to order creation, status tracking, and payment recording. By enforcing role-based transitions and strict ownership guards, it comfortably connects customers, car providers, and administrators.

## 2. Tech Stack
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Real-Time Communication:** WebSockets (`ws`) for live price calculations and rental updates.
- **Database:** MongoDB (via Mongoose ODM)
- **Dependency Injection:** Awilix (Implementing Clean Architecture principles)
- **Inter-service Communication:** Axios (Fetches provider & vehicle data from `vehicle-service` and `user-service`)
- **Authentication/Authorization:** JSON Web Tokens (JWT) & Role-based middleware
- **Testing environment:** Jest & Supertest (with mongodb-memory-server)

## 3. Key Features / Business Logic
- **Flexible Rental Types:** Supports both daily and granular hourly rentals (e.g., 6, 8, 12-hour presets) with dynamic pricing multipliers.
- **WebSocket Price Engine:** A dedicated WebSocket server handles complex, real-time price estimations without HTTP overhead before a rental is even confirmed.
- **Strict Role Transitions:** Different entities have precise permissions. Customers can cancel pending orders; Car Providers can approve/reject; Admins can broadly manage transactions.
- **Payment & Status Tracking:** Fully tracks historical state changes for both `status` (pending -> approved -> started -> completed) and `paymentStatus` (unpaid -> paid).
- **Conflict Prevention:** Native endpoints instantly calculate date alignments to prevent double-booking of a single vehicle.
- **Clean Architecture Integration:** Uses a robust repository pattern with Awilix, isolating business logic from external triggers.

## 4. Prerequisites & Environment Variables

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker & Docker Compose](https://www.docker.com/) (Optional)
- MongoDB running locally or on Atlas.

### Environment Variables (.env)
Create a `.env` file in the root directory. Example configuration:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `PORT` | HTTP & WebSocket server port | `3003` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb://localhost:27017/rental_service_db` |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` |
| `JWT_SECRET` | Secret key used to validate user tokens | `your_super_secret_key` |
| `VEHICLE_SERVICE_URL`| Internal URL to the Vehicle Service | `http://localhost:3002` |
| `USER_SERVICE_URL`| Internal URL to the User Service | `http://localhost:3001` |
| `FRONTEND_URL` | Cross-Origin resource sharing URL | `http://localhost:4000` |

## 5. Local Setup & Running

### Option A: Running Locally with Node.js
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup environment:**
   Verify your `.env` aligns with other running microservices.
3. **Start the development server:**
   ```bash
   npm run start
   ```
   *HTTP available at `http://localhost:3003` | WebSocket directly at `ws://localhost:3003`*

### Option B: Running via Docker
1. **Build and start via Compose:**
   ```bash
   docker-compose up rental-service --build
   ```

## 6. API Documentation

### Public / General Endpoints

#### 1. Check Availability
* **Method & URL:** `GET /rentals/availability`
* **Description:** Verifies if a specific vehicle is actively available between two dates.
* **Request Params:** `?vehicleId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
* **Expected Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "isAvailable": true,
      "conflictingRentals": []
    }
  }
  ```

### Protected Routes (Requires Header: `Authorization: Bearer <token>`)

#### 2. Create a Rental (For Customers & Providers)
* **Method & URL:** `POST /rentals`
* **Description:** Generates a new pending rental order. Automatically cross-validates with `vehicle-service`.
* **Request Payload:**
  ```json
  {
    "vehicleId": "60d0fe4f5311236168a109ca",
    "startDate": "2024-05-01",
    "endDate": "2024-05-03",
    "rentalType": "daily" 
  }
  ```
  *(Note: For `hourly` rentals, pass `"hourlyDuration": 8` and a singular start/end date)*
* **Expected Response:** `201 Created`

#### 3. Update Rental Status
* **Method & URL:** `PATCH /rentals/:id/status`
* **Description:** Moves the rental through its lifecycle (`pending`, `approved`, `rejected`, `started`, `completed`, `cancelled`). Validation rules depend on user role.
* **Request Payload:**
  ```json
  {
    "status": "approved"
  }
  ```
* **Expected Response:** `200 OK`

#### 4. Update Payment Status
* **Method & URL:** `PATCH /rentals/:id/payment`
* **Description:** Marks a rental as financially settled. Must be invoked before a rental can be strictly transitioned to `started`.
* **Request Payload:**
  ```json
  {
    "paymentStatus": "paid"
  }
  ```
* **Expected Response:** `200 OK`

#### 5. User Specific Retrieval Routes
* `GET /rentals` - Gets paginated rentals for the authenticated customer.
* `GET /rentals/provider` - Gets paginated rentals strictly tied to the authenticated car provider.
* `GET /rentals/:id` - Gets an isolated rental (Requires ownership or admin).

### WebSocket Engine (ws://localhost:3003)
The WebSocket directly accepts connections and strictly calculates dynamic prices safely without committing database transactions.
* **Send (Client -> Server):**
  ```json
  {
    "type": "calculate_price",
    "data": {
       "vehicleId": "60d0fe4f5311...",
       "rentalType": "hourly",
       "hourlyDuration": 6
    }
  }
  ```
* **Receive (Server -> Client):**
  ```json
  {
    "type": "price_calculated",
    "totalPrice": 25.5,
    "basePrice": 51,
    "rentalType": "hourly",
    "duration": 6
  }
  ```

## 7. API Testing Guide

### Using cURL

**1. Create a Rental Order (Daily):**
```bash
curl -X POST http://localhost:3003/rentals \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
        "vehicleId": "60d0fe...",
        "startDate": "2024-10-01",
        "endDate": "2024-10-05",
        "rentalType": "daily"
      }'
```

**2. Approve a Rental (As a Provider):**
```bash
curl -X PATCH http://localhost:3003/rentals/YOUR_RENTAL_ID/status \
  -H "Authorization: Bearer YOUR_PROVIDER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

**3. Test WebSocket using `wscat` (CLI Tool):**
```bash
npm install -g wscat
wscat -c ws://localhost:3003
> {"type": "calculate_price", "data": {"vehicleId": "YOUR_VEHICLE_ID", "rentalType": "daily", "startDate": "2024-10-01", "endDate": "2024-10-03"}}
```

## 8. Database Schema

Entity Relationship table mapping directly to the `Rental` Mongoose schema collection.

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `_id` | ObjectId | Primary Key | Auto-generated standard MongoDB identifier |
| `userId` | ObjectId | Required | Ref: Customer making the rental |
| `vehicleId` | ObjectId | Required | Ref: The physical vehicle |
| `car_providerId`| ObjectId | Required | Ref: The owner of the vehicle |
| `rentalType` | String | Enum | `daily`, `hourly`, `monthly` |
| `hourlyDuration`| Number | Conditional Requirement| e.g. 6, 8, 12 |
| `startDate` | Date | Required | Target pickup timeframe |
| `endDate` | Date | Required | Target dropoff timeframe |
| `totalPrice` | Number | Required | Calculated final cost footprint |
| `status` | String | Enum List | Tracks state: `pending`, `approved`, `started`, etc. |
| `paymentStatus`| String | Enum | Standard tracker: `unpaid` -> `paid` |
| `statusHistory`| Array of Objects| Auto-generated | Cryptographically tracks date implementations on state changes |
| `paymentHistory`| Array of Objects| Auto-generated | Cryptographically tracks payment implementations |

---
