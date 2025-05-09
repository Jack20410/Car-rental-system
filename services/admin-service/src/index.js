require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Routes
    app.use('/api', activityLogRoutes);

    // Debug route for testing
    app.get('/debug', (req, res) => {
      res.status(200).json({ 
        message: 'Debug route is working',
        availableRoutes: [
          '/api/admin/activities/user/:userId',
          '/api/admin/activities',
          '/api/admin/activities/stats',
          '/api/admin/activities/service-log'
        ]
      });
    });

    // Health check route
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        service: 'admin-service',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
      });
    });

    const PORT = process.env.PORT || 3006;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Admin service running on http://localhost:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('CORS origins:', corsOptions.origin);
      console.log('MongoDB URI:', process.env.MONGODB_URI);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
