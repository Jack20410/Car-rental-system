require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins for static files
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Define the possible uploads paths (for different container setups)
const possiblePaths = [
  path.join(__dirname, '../../../uploads/vehicles'), // For local development relative to src
  '/app/uploads/vehicles',                          // For Docker container based on Dockerfile WORKDIR
  '/uploads/vehicles'                               // For Docker volume mounted directly
];

// Find the first path that exists
let uploadsPath = null;
for (const p of possiblePaths) {
  console.log(`Checking path: ${p}`);
  if (fs.existsSync(p)) {
    uploadsPath = p;
    console.log(`Found uploads directory at: ${uploadsPath}`);
    console.log(`Contents: ${fs.readdirSync(uploadsPath)}`);
    break;
  }
}

if (!uploadsPath) {
  console.error('Could not find uploads directory in any of the expected locations!');
  // Create the directory if it doesn't exist
  uploadsPath = possiblePaths[0];
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`Created uploads directory at: ${uploadsPath}`);
}

// Serve static files from uploads directory (if found)
app.use('/uploads/vehicles', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set appropriate content type for images
    if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    }
    
    console.log(`Serving static file: ${filePath}`);
  }
}));

// Debug endpoint for file info
app.get('/debug/file/:path(*)', (req, res) => {
  if (!uploadsPath) {
    return res.status(500).json({ error: 'Uploads directory not found' });
  }
  
  const filePath = path.join(uploadsPath, req.params.path);
  console.log(`Debug request for file: ${filePath}`);
  
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        exists: true,
        path: filePath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        contents: stats.isDirectory() ? fs.readdirSync(filePath) : null
      });
    } else {
      res.json({
        exists: false,
        path: filePath
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log all requests 
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
