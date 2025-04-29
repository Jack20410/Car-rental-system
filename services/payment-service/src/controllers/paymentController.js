const Payment = require('../models/paymentModel');
const mongoose = require('mongoose');
const axios = require('axios');
const { mockRentals, mockUsers, mockPayments } = require('../mock/mockData');

const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL;

// Hàm kiểm tra rentalId có tồn tại bên rental-service không
const checkRentalExists = async (rentalId, authHeader) => {
  // Trong môi trường test, dùng mock data
  if (process.env.NODE_ENV === 'test') {
    const mockRental = mockRentals.find(r => r._id === rentalId);
    return {
      exists: !!mockRental,
      rental: mockRental
    };
  }

  try {
    const res = await axios.get(
      `${RENTAL_SERVICE_URL}/rentals/${rentalId}`,
      { headers: { Authorization: authHeader } }
    );
    return {
      exists: true,
      rental: res.data.data
    };
  } catch (err) {
    console.error('Error checking rental:', err.message);
    return {
      exists: false,
      rental: null
    };
  }
};

// Customer tạo đơn thanh toán mới (sau khi đặt xe)
exports.createPayment = async (req, res) => {
  try {
    const { rentalId, paymentMethod } = req.body;
    if (!rentalId || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Kiểm tra rental và lấy thông tin
    const { exists, rental } = await checkRentalExists(rentalId, req.headers.authorization);
    if (!exists) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Trong môi trường test, dùng userId mặc định
    const userId = process.env.NODE_ENV === 'test' ? 
      mockUsers[0]._id : 
      req.user._id;

    const payment = new Payment({
      rentalId,
      userId,
      amount: rental.totalPrice,
      currency: 'VND',
      paymentMethod,
      paymentStatus: 'pending'
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
};

// Xác nhận thanh toán thành công
exports.confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.paymentStatus = 'paid';
    payment.transactionTime = new Date();
    if (req.body.providerPaymentId) payment.providerPaymentId = req.body.providerPaymentId;
    if (req.body.paymentDetails) payment.paymentDetails = req.body.paymentDetails;
    await payment.save();
    // Gọi sang rental-service để cập nhật paymentStatus cho rental (bỏ qua trong môi trường test)
    if (process.env.NODE_ENV !== 'test') {
      try {
        await axios.patch(
          `${RENTAL_SERVICE_URL}/rentals/${payment.rentalId}/payment-status`,
          { paymentStatus: 'paid' },
          { headers: { Authorization: req.headers.authorization } }
        );
      } catch (err) {
        console.error('Error updating rental payment status:', err.message);
      }
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
};

// Yêu cầu hoàn tiền
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Only paid payments can be refunded' });
    }
    payment.paymentStatus = 'refunded';
    await payment.save();
    // Gọi sang rental-service để cập nhật paymentStatus cho rental (bỏ qua trong môi trường test)
    if (process.env.NODE_ENV !== 'test') {
      try {
        await axios.patch(
          `${RENTAL_SERVICE_URL}/rentals/${payment.rentalId}/payment-status`,
          { paymentStatus: 'refunded' },
          { headers: { Authorization: req.headers.authorization } }
        );
      } catch (err) {
        console.error('Error updating rental payment status:', err.message);
      }
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error refunding payment', error: error.message });
  }
};

// Lấy chi tiết thanh toán theo Payment ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error getting payment', error: error.message });
  }
};

// Lấy danh sách các payment theo Rental ID
exports.getPaymentsByRentalId = async (req, res) => {
  try {
    const { rentalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(rentalId)) {
      return res.status(400).json({ message: 'Invalid rentalId' });
    }   
    const payments = await Payment.find({ rentalId });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error getting payments by rentalId', error: error.message });
  }
};