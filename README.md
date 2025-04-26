# Car Rental System

A modern, microservices-based car rental system that provides a scalable and robust platform for managing vehicle rentals, bookings, payments, and user interactions.

## Overview

This system is built using a microservices architecture, with each service handling specific business domains. The system provides features such as user authentication, vehicle management, rental bookings, payments processing, and administrative functions.

## Architecture

The system consists of the following microservices:

car-rental-system/
├── services/
│   ├── user-service/     # Combined Auth + User
│   ├── vehicle-service/
│   ├── rental-service/       # Includes booking + reviews
│   ├── payment-service/      # Includes promotions
│   ├── notification-service/
│   ├── support-service/
│   ├── admin-service/        # Admin + reporting
│   └── api-gateway/
├── libs/
│   ├── common/               # Shared utilities
│   ├── models/               # Shared data models
│   └── events/               # Event definitions
├── docker-compose.yml
├── package.json
└── .gitignore
```

## Key Features

- **User Management & Authentication**
  - User registration and authentication
  - Profile management
  - Role-based access control

- **Vehicle Management**
  - Comprehensive vehicle catalog
  - Real-time availability tracking
  - Vehicle categorization and search

- **Rental & Booking**
  - Seamless booking process
  - Review and rating system
  - Booking history and management

- **Payment Processing**
  - Secure payment handling
  - Multiple payment methods
  - Promotion and discount management

- **Additional Services**
  - Real-time notifications
  - Customer support system
  - Administrative dashboard
  - Comprehensive reporting

## Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- npm or yarn package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd car-rental-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the services:
   ```bash
   docker-compose  (chưa xài được chạy bằng npm run dev)
   ```

## Development

Each service can be developed and run independently. Navigate to the specific service directory and follow the service-specific README for detailed instructions.

## API Documentation

API documentation for each service can be found in their respective directories under the `services` folder.

