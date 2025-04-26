require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
const path = require('path');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));

// Routes
app.use('/', vehicleRoutes);

// MongoDB connection
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Vehicle service running on http://localhost:${PORT}`);
});
