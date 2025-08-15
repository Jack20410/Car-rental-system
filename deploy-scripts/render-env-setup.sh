#!/bin/bash

# Render.com Environment Variables Setup Script
# This script helps you configure environment variables for each service

echo "Car Rental System - Render.com Environment Setup"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help you set up environment variables for Render.com deployment${NC}"
echo ""

# JWT Secret
read -p "Enter JWT Secret (or press Enter to use default): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="ihrwkjhfqkldsjflakjsdhfalkjsdhlkfsdhlkjasdhklafjdhlfkjaiuerqyiquwyt"
fi

# MongoDB URI Base
read -p "Enter MongoDB URI base (or press Enter to use default): " MONGODB_BASE
if [ -z "$MONGODB_BASE" ]; then
    MONGODB_BASE="mongodb+srv://jack10:baole1010@car-rental-users.bemrrqe.mongodb.net"
fi

# Frontend URL
read -p "Enter Frontend URL (e.g., https://your-frontend.vercel.app): " FRONTEND_URL

# Render service base URL
read -p "Enter your Render username/service prefix (e.g., if your services will be at https://username-service.onrender.com): " RENDER_PREFIX

echo ""
echo -e "${GREEN}Generating environment variables...${NC}"
echo ""

# Create env files directory
mkdir -p render-env-configs

# API Gateway Environment
cat > render-env-configs/api-gateway.env << EOF
PORT=10000
API_VERSION=1.0.0
ENVIRONMENT=production
LOG_LEVEL=INFO
JWT_SECRET_KEY=${JWT_SECRET}
RATE_LIMIT_MAX_REQUESTS=300
RATE_LIMIT_WINDOW_SECONDS=60
USER_SERVICE_URL=https://${RENDER_PREFIX}-user-service.onrender.com
VEHICLE_SERVICE_URL=https://${RENDER_PREFIX}-vehicle-service.onrender.com
RENTAL_SERVICE_URL=https://${RENDER_PREFIX}-rental-service.onrender.com
PAYMENT_SERVICE_URL=https://${RENDER_PREFIX}-payment-service.onrender.com
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
CHAT_SERVICE_URL=https://${RENDER_PREFIX}-chat-service.onrender.com
RATING_SERVICE_URL=https://${RENDER_PREFIX}-rating-service.onrender.com
FRONTEND_URL=${FRONTEND_URL}
ADDITIONAL_CORS_ORIGINS=${FRONTEND_URL}
EOF

# User Service Environment
cat > render-env-configs/user-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/user_service_db
JWT_SECRET=${JWT_SECRET}
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

# Vehicle Service Environment
cat > render-env-configs/vehicle-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/vehicle_service_db
JWT_SECRET=${JWT_SECRET}
USER_SERVICE_URL=https://${RENDER_PREFIX}-user-service.onrender.com
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

# Rental Service Environment
cat > render-env-configs/rental-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/rental_service_db
JWT_SECRET=${JWT_SECRET}
VEHICLE_SERVICE_URL=https://${RENDER_PREFIX}-vehicle-service.onrender.com
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

# Payment Service Environment
cat > render-env-configs/payment-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/payment_service_db
JWT_SECRET=${JWT_SECRET}
RENTAL_SERVICE_URL=https://${RENDER_PREFIX}-rental-service.onrender.com
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

# Admin Service Environment
cat > render-env-configs/admin-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/admin_service_db
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
FRONTEND_URL=${FRONTEND_URL}
CORS_ORIGINS=${FRONTEND_URL}
EOF

# Chat Service Environment
cat > render-env-configs/chat-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/chat_service_db
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=${FRONTEND_URL}
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

# Rating Service Environment
cat > render-env-configs/rating-service.env << EOF
PORT=10000
MONGODB_URI=${MONGODB_BASE}/rating_service_db
JWT_SECRET=${JWT_SECRET}
ADMIN_SERVICE_URL=https://${RENDER_PREFIX}-admin-service.onrender.com
EOF

echo -e "${GREEN}Environment files created in ./render-env-configs/${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy the contents of each .env file to the corresponding service in Render.com"
echo "2. Update the service URLs after deployment if they differ from the generated ones"
echo "3. Make sure to set up the services in the correct order (Admin → User → Vehicle → Others → API Gateway)"
echo ""
echo -e "${GREEN}Files created:${NC}"
ls -la render-env-configs/
echo ""
echo -e "${RED}IMPORTANT:${NC} Make sure to update the service URLs in the API Gateway env after all services are deployed!"
