require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const userRoutes = require('./routes/user.routes');
const avatarRoutes = require('./routes/avatarRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const { uploadsPath } = require('./middleware/uploadMiddleware');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static avatar files
app.use('/uploads/avatars', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));

// Default avatar route
app.get('/avatar/user.png', avatarRoutes.getDefaultAvatar);

// Routes
app.use('/users', userRoutes);
app.use('/users', avatarRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'user-service' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`User service running on port http://localhost:${PORT}`);
});
