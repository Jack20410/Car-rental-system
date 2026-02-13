#!/bin/bash

# Script to replace all localhost URLs with API_BASE_URL in frontend files
# This ensures all API calls go through the production API Gateway

echo "Replacing localhost URLs with API_BASE_URL..."

# Define the frontend src directory
FRONTEND_SRC="/Users/jabick/Documents/Sem6_2425/SOA/Car-rental-system/frontend/src"

# Files to update (the ones with most localhost references)
FILES=(
  "$FRONTEND_SRC/pages/CarDetails.jsx"
  "$FRONTEND_SRC/pages/ManageCars.jsx"
  "$FRONTEND_SRC/pages/Rentals.jsx"
  "$FRONTEND_SRC/pages/OwnerProfile.jsx"
  "$FRONTEND_SRC/components/ChatRentalInfo.jsx"
)

# Backup files first
echo "Creating backups..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "Backed up: $file"
  fi
done

# Replace localhost:3000 with ${API_BASE_URL}
echo ""
echo "Replacing localhost:3000 URLs..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Replace fetch calls with localhost:3000
    sed -i '' 's|http://localhost:3000|${API_BASE_URL}|g' "$file"
    echo "Updated: $file"
  fi
done

# Note: localhost:3001, localhost:3002, localhost:3003 are direct service URLs
# These should also go through the API Gateway
echo ""
echo "Replacing other localhost URLs (3001, 3002, 3003)..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i '' 's|http://localhost:3001|${API_BASE_URL}|g' "$file"
    sed -i '' 's|http://localhost:3002|${API_BASE_URL}|g' "$file"
    sed -i '' 's|http://localhost:3003|${API_BASE_URL}|g' "$file"
    sed -i '' 's|ws://localhost:3003|wss://car-rental-api-gateway.onrender.com|g' "$file"
    echo "Updated service URLs in: $file"
  fi
done

echo ""
echo "Done! All localhost URLs have been replaced."
echo "Backups are saved with .backup extension"
echo ""
echo "Next steps:"
echo "1. Add 'import { API_BASE_URL } from \"../utils/api\";' to files that need it"
echo "2. Test the application"
echo "3. If everything works, remove .backup files"
