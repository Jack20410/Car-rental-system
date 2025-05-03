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

// Tạo thanh toán MOMO cho rental
router.post('/payments/momo', paymentController.createMomoPayment);

// Xử lý callback từ MOMO (IPN - Instant Payment Notification)
router.post('/payments/momo/ipn', paymentController.handleMomoIPN);

// Xử lý redirect sau khi thanh toán MOMO
router.get('/payments/momo/success', paymentController.handleMomoSuccess);

// Lấy chi tiết thanh toán theo Payment ID
router.get('/payments/:id', paymentController.getPaymentById);

// Lấy danh sách các payment theo Rental ID
router.get('/payments/rental/:rentalId', paymentController.getPaymentsByRentalId);

module.exports = router;
