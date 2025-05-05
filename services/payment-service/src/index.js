const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const paymentRoutes = require('./routes/paymentRoute');

// Load environment variables
dotenv.config();

// Set default environment variables if not defined
if (!process.env.RENTAL_SERVICE_URL) {
  process.env.RENTAL_SERVICE_URL = 'http://localhost:3003';
  console.log('RENTAL_SERVICE_URL not set, using default:', process.env.RENTAL_SERVICE_URL);
}

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Mount routes
app.use('/', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
  console.log(`Test mode: ${process.env.NODE_ENV === 'test' ? 'Enabled' : 'Disabled'}`);
  console.log(`RENTAL_SERVICE_URL: ${process.env.RENTAL_SERVICE_URL}`);
});
