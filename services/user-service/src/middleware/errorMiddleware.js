const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
};

module.exports = errorHandler; 