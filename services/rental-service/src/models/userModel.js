const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  avatar: String,
  role: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 