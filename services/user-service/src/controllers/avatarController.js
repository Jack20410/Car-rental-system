const path = require('path');
const fs = require('fs');
const { uploadsPath } = require('../middleware/uploadMiddleware');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ 
      message: 'Avatar uploaded successfully',
      file: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvatar = async (req, res) => {
  const userId = req.params.userId;
  const avatarPath = path.join(uploadsPath, `user_${userId}`);
  
  // Try both .png and .jpg extensions
  if (fs.existsSync(`${avatarPath}.png`)) {
    res.sendFile(`${avatarPath}.png`);
  } else if (fs.existsSync(`${avatarPath}.jpg`)) {
    res.sendFile(`${avatarPath}.jpg`);
  } else {
    // If no custom avatar is found, redirect to default avatar
    res.redirect('/avatar/user.png');
  }
};

const getDefaultAvatar = async (req, res) => {
  const defaultAvatarPath = path.join(uploadsPath, 'user.png');
  console.log('Looking for default avatar at:', defaultAvatarPath);
  
  if (fs.existsSync(defaultAvatarPath)) {
    console.log('Default avatar found, sending file');
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.sendFile(defaultAvatarPath);
  } else {
    console.error(`Default avatar not found at: ${defaultAvatarPath}`);
    res.status(404).json({ message: 'Default avatar not found' });
  }
};

module.exports = {
  uploadAvatar,
  getAvatar,
  getDefaultAvatar
}; 