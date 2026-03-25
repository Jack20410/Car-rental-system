FROM node:18-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
