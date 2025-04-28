require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/rentals', rentalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'rental-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Rental service running on http://localhost:${PORT}`);
});
