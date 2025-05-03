FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Set environment variables (these will be overridden by docker-compose)
ENV PORT=3004
ENV NODE_ENV=production

# Expose port
EXPOSE 3004

# Start the application
CMD ["node", "src/index.js"]
