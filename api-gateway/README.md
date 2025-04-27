# Car Rental API Gateway

This is a FastAPI-based API Gateway for the Car Rental microservices architecture.

## Features

- Routes requests to appropriate microservices
- FastAPI-powered with async support
- CORS configuration
- Error handling and request forwarding
- Request logging middleware
- Authentication middleware
- Rate limiting (100 requests per minute per IP)

## Project Structure

```
api-gateway/
│
├── middleware/                # Middleware components
│   ├── __init__.py
│   ├── auth_middleware.py     # Authentication middleware
│   ├── logging_middleware.py  # Request logging middleware
│   └── rate_limit_middleware.py # Rate limiting middleware
│
├── routes/                    # API route definitions
│   ├── __init__.py
│   ├── health_routes.py       # Health check routes
│   ├── user_routes.py         # User service routes
│   ├── vehicle_routes.py      # Vehicle service routes
│   ├── rental_routes.py       # Rental service routes
│   ├── payment_routes.py      # Payment service routes
│   ├── notification_routes.py # Notification service routes
│   ├── admin_routes.py        # Admin service routes
│   └── support_routes.py      # Support service routes
│
├── utils/                     # Utility functions
│   ├── __init__.py
│   └── proxy_request.py       # HTTP proxy request handler
│
├── main.py                    # Main application entry point
├── Dockerfile                 # Docker configuration
├── requirements.txt           # Python dependencies
└── .env.example               # Example environment variables
```

## Environment Variables

The following environment variables can be set:

- `PORT`: The port on which the API gateway runs (default: 3000)
- `USER_SERVICE_URL`: URL for the user service (default: http://user-service:3001)
- `VEHICLE_SERVICE_URL`: URL for the vehicle service (default: http://vehicle-service:3002)
- `RENTAL_SERVICE_URL`: URL for the rental service (default: http://rental-service:3003)
- `PAYMENT_SERVICE_URL`: URL for the payment service (default: http://payment-service:3004)
- `NOTIFICATION_SERVICE_URL`: URL for the notification service (default: http://notification-service:3005)
- `ADMIN_SERVICE_URL`: URL for the admin service (default: http://admin-service:3006)
- `SUPPORT_SERVICE_URL`: URL for the support service (default: http://support-service:3007)
- `FRONTEND_URL`: URL for the frontend (default: http://frontend:4000)

## API Routes

- `/api/users/*`: Forwarded to User Service
- `/api/auth/*`: Forwarded to User Service
- `/api/vehicles/*`: Forwarded to Vehicle Service
- `/api/rentals/*`: Forwarded to Rental Service
- `/api/payments/*`: Forwarded to Payment Service
- `/api/notifications/*`: Forwarded to Notification Service
- `/api/admin/*`: Forwarded to Admin Service
- `/api/support/*`: Forwarded to Support Service

## Middleware

The API Gateway implements several middleware components:

1. **Request Logging**: Logs all incoming requests with timing information
2. **Authentication**: Validates authentication tokens for protected routes
3. **Rate Limiting**: Limits requests to 100 per minute per IP address

## Local Development

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the server:

```bash
uvicorn main:app --reload
```

## Docker Deployment

The service is configured to run in Docker:

```bash
docker build -t car-rental-api-gateway .
docker run -p 3000:3000 car-rental-api-gateway
```

Or use Docker Compose from the root directory:

```bash
docker-compose up
``` 