const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the possible uploads paths for avatars
const possiblePaths = [
  '/app/uploads/avatars',                          // For Docker container (primary)
  path.join(__dirname, '../../../../uploads/avatars'), // For local development
  '/uploads/avatars'                               // Alternative Docker path
];

// Find or create uploads directory
let uploadsPath = null;
for (const p of possiblePaths) {
  console.log(`Checking avatar path: ${p}`);
  if (fs.existsSync(p)) {
    uploadsPath = p;
    console.log(`Found avatars directory at: ${uploadsPath}`);
    break;
  }
}

if (!uploadsPath) {
  uploadsPath = possiblePaths[0];
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`Created avatars directory at: ${uploadsPath}`);
  
  // Check if default avatar exists in source and copy it
  const sourceDefaultAvatar = path.join(__dirname, '../../../assets/user.png');
  const targetDefaultAvatar = path.join(uploadsPath, 'user.png');
  
  if (fs.existsSync(sourceDefaultAvatar) && !fs.existsSync(targetDefaultAvatar)) {
    fs.copyFileSync(sourceDefaultAvatar, targetDefaultAvatar);
    console.log(`Copied default avatar to: ${targetDefaultAvatar}`);
  }
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath)
  },
  filename: function (req, file, cb) {
    const userId = req.params.userId;
    const ext = path.extname(file.originalname);
    cb(null, `user_${userId}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Ensure default avatar exists
const defaultAvatarPath = path.join(uploadsPath, 'user.png');
console.log('Default avatar path:', defaultAvatarPath);
if (!fs.existsSync(defaultAvatarPath)) {
  console.warn(`Default avatar not found at: ${defaultAvatarPath}`);
}

module.exports = {
  upload,
  uploadsPath
}; 