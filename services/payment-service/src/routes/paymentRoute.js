const express = require('express');
const router = express.Router();
const { verifyToken, requireCustomer } = require('../../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Payment service is running' });
});

// Customer tạo đơn thanh toán mới (sau khi đặt xe)
router.post('/payments', paymentController.createPayment);

// Xác nhận thanh toán thành công
router.patch('/payments/:id/confirm', paymentController.confirmPayment);

// Yêu cầu hoàn tiền
router.patch('/payments/:id/refund', paymentController.refundPayment);

// Lấy chi tiết thanh toán theo Payment ID
router.get('/payments/:id', paymentController.getPaymentById);

// Lấy danh sách các payment theo Rental ID
router.get('/payments/rental/:rentalId', paymentController.getPaymentsByRentalId);

module.exports = router;
