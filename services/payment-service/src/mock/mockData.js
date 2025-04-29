const mongoose = require('mongoose');

const mockRentals = [
  {
    _id: "65f2c74a9b0ae3c3e34e85c1",
    userId: "65f2c74a9b0ae3c3e34e85c2",
    totalPrice: 500000,
    status: "pending",
    paymentStatus: "unpaid"
  },
  {
    _id: "65f2c74a9b0ae3c3e34e85c3",
    userId: "65f2c74a9b0ae3c3e34e85c2",
    totalPrice: 750000,
    status: "pending",
    paymentStatus: "unpaid"
  }
];

const mockUsers = [
  {
    _id: "65f2c74a9b0ae3c3e34e85c2",
    role: "customer",
    name: "Test Customer"
  }
];

const mockPayments = [
  {
    _id: "65f2c74a9b0ae3c3e34e85c4",
    rentalId: "65f2c74a9b0ae3c3e34e85c1",
    userId: "65f2c74a9b0ae3c3e34e85c2",
    amount: 500000,
    currency: "VND",
    paymentMethod: "Credit Card",
    paymentStatus: "pending",
    transactionTime: null,
    providerPaymentId: null,
    paymentDetails: null
  },
  {
    _id: "65f2c74a9b0ae3c3e34e85c5",
    rentalId: "65f2c74a9b0ae3c3e34e85c3",
    userId: "65f2c74a9b0ae3c3e34e85c2",
    amount: 750000,
    currency: "VND",
    paymentMethod: "Bank Transfer",
    paymentStatus: "paid",
    transactionTime: new Date("2024-03-20"),
    providerPaymentId: "TRANS123",
    paymentDetails: {
      bankName: "VCB",
      accountNumber: "****4567"
    }
  }
];

module.exports = {
  mockRentals,
  mockUsers,
  mockPayments
}; 