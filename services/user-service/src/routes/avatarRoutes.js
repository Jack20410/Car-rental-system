const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { uploadAvatar, getAvatar, getDefaultAvatar } = require('../controllers/avatarController');

// Avatar routes
router.post('/:userId/avatar', upload.single('avatar'), uploadAvatar);
router.get('/:userId/avatar', getAvatar);

// Export the router for use in index.js
module.exports = router;

// Export the getDefaultAvatar handler for direct use in index.js
module.exports.getDefaultAvatar = getDefaultAvatar; 