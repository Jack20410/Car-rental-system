const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  car_providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Phải là User, vì car-provider chỉ là một role, không phải là field trong User
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  modelYear: {
    type: Number,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  rentalPricePerDay: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  features: {
    type: [String]
  },
  images: [{
    type: String,  // Will store the file path or URL
    required: true
  }],
  seats: {
    type: Number,
    required: true
  },
  carType: {
    type: String,
    enum: ['Sedan', 'SUV', 'Convertible', 'Coupe', 'Hatchback', 'Other'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Available', 'Rented', 'Unavailable'],
    default: 'Pending'
  },
  location: {
    address: String,
    city: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
