const Payment = require('../models/paymentModel');
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');

const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL || 'http://localhost:3003';
const FRONTEND_URL = process.env.FRONTEND_URL || '/';

// Helper function to update rental payment status
const updateRentalPaymentStatus = async (rentalId, token) => {
  try {
    console.log(`Checking and updating rental ${rentalId} payment status`);
    
    // First check if the rental's payment status is already paid
    const checkUrl = `${RENTAL_SERVICE_URL}/rentals/${rentalId}`;
    console.log(`Checking rental status at URL: ${checkUrl}`);
    
    // Create auth headers with token if provided
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = token;
      console.log(`Using auth token: ${token.substring(0, 20)}...`); // Log part of token for debugging
    } else {
      console.warn('No authorization token provided for rental payment status check');
    }
    
    // First get the current rental to check its status
    try {
      const checkResponse = await axios.get(
        checkUrl,
        { headers }
      );
      
      const rental = checkResponse.data.data || checkResponse.data;
      
      // If already paid, don't update again
      if (rental && rental.paymentStatus === 'paid') {
        console.log(`Rental ${rentalId} payment status is already paid, skipping update`);
        return true;
      }
    } catch (err) {
      console.error('Error checking rental payment status:', err.message);
      // Return false to avoid continuing with the update attempt if check fails
      return false;
    }
    
    // Call the rental service to update payment status
    const updateUrl = `${RENTAL_SERVICE_URL}/rentals/${rentalId}/payment`;
    console.log(`Rental update URL: ${updateUrl}`);
    
    const response = await axios.patch(
      updateUrl,
      { paymentStatus: 'paid' },
      { headers }
    );
    
    console.log(`Rental service response:`, JSON.stringify(response.data));
    console.log('Successfully updated rental payment status');
    return true;
  } catch (err) {
    console.error('Error updating rental payment status:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data));
    }
    return false;
  }
};

// Hàm kiểm tra rentalId có tồn tại bên rental-service không
const checkRentalExists = async (rentalId, authHeader) => {
  
  try {
    console.log(`Checking rental with ID: ${rentalId}`);
    console.log(`RENTAL_SERVICE_URL: ${RENTAL_SERVICE_URL}`);
    console.log(`Auth header present: ${!!authHeader}`);
    
    // Use the API gateway URL to fetch the rental
    const url = `${RENTAL_SERVICE_URL}/rentals/${rentalId}`;
    console.log(`Full URL: ${url}`);
    
    const res = await axios.get(url, { 
      headers: { Authorization: authHeader },
      validateStatus: status => status < 500 // Don't throw on 4xx errors
    });
    
    console.log(`Response status: ${res.status}`);
    console.log(`Response data:`, JSON.stringify(res.data));
    
    // Update to match the expected response format from your rental service
    if (res.status === 200) {
      // Check if data has expected format based on your Postman response
      if (res.data.success) {
        return {
          exists: true,
          rental: res.data.data
        };
      } else if (res.data.data) { // Alternative format check
        return {
          exists: true,
          rental: res.data.data
        };
      } else {
        // Direct response format
        return {
          exists: true,
          rental: res.data
        };
      }
    } else {
      console.log(`Rental not found or error: ${res.data.message || 'Unknown error'}`);
      return {
        exists: false,
        rental: null
      };
    }
  } catch (err) {
    console.error('Error checking rental:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    } else if (err.request) {
      console.error('No response received:', err.request);
    }
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

    // Extract the total price safely from the rental object
    let totalPrice = 0;
    if (rental.totalPrice) {
      totalPrice = rental.totalPrice;
    } else if (rental.data && rental.data.totalPrice) {
      totalPrice = rental.data.totalPrice;
    } else {
      console.error('Could not find totalPrice in rental data');
      return res.status(400).json({ message: 'Rental data is missing total price information' });
    }
    
    console.log('Total price extracted:', totalPrice);

    // Extract the userId safely
    let userId;
    if (req.user && req.user._id) {
      userId = req.user._id;
    } else if (rental.userId) {
      userId = rental.userId;
    } else if (rental.data && rental.data.userId) {
      userId = rental.data.userId;
    } else {
      console.error('Could not find userId in rental data or request');
      // Use a placeholder ID for testing purposes
      userId = "000000000000000000000000";
    }

    console.log('Using userId:', userId);

    const payment = new Payment({
      rentalId,
      userId,
      amount: totalPrice,
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
    // Gọi sang rental-service để cập nhật paymentStatus cho rental
    await updateRentalPaymentStatus(payment.rentalId, req.headers.authorization);
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
    // Gọi sang rental-service để cập nhật paymentStatus cho rental
    try {
      await axios.patch(
        `${RENTAL_SERVICE_URL}/rentals/${payment.rentalId}/payment`,
        { paymentStatus: 'refunded' },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      console.error('Error updating rental payment status:', err.message);
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

// Tạo thanh toán MOMO cho rental
exports.createMomoPayment = async (req, res) => {
  try {
    const { rentalId } = req.body;
    if (!rentalId) {
      return res.status(400).json({ message: 'Missing rentalId' });
    }

    console.log('Creating MOMO payment for rental:', rentalId);
    console.log('Authorization header present:', !!req.headers.authorization);

    // Store the authentication token to use it later
    const userToken = req.headers.authorization;

    // Kiểm tra rental và lấy thông tin
    const { exists, rental } = await checkRentalExists(rentalId, userToken);
    
    console.log('Rental exists check result:', exists);
    
    if (!exists) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    console.log('Rental data:', JSON.stringify(rental));

    // Extract the total price safely from the rental object
    let totalPrice = 0;
    if (rental.totalPrice) {
      totalPrice = rental.totalPrice;
    } else if (rental.data && rental.data.totalPrice) {
      totalPrice = rental.data.totalPrice;
    } else {
      console.error('Could not find totalPrice in rental data');
      return res.status(400).json({ message: 'Rental data is missing total price information' });
    }
    
    console.log('Total price extracted:', totalPrice);

    // Extract the userId safely
    let userId;
    if (req.user && req.user._id) {
      userId = req.user._id;
    } else if (rental.userId) {
      userId = rental.userId;
    } else if (rental.data && rental.data.userId) {
      userId = rental.data.userId;
    } else {
      console.error('Could not find userId in rental data or request');
      // Use a placeholder ID for testing purposes
      userId = "000000000000000000000000";
    }

    console.log('Using userId:', userId);

    // Tạo đơn thanh toán mới with the user token
    const payment = new Payment({
      rentalId,
      userId,
      amount: totalPrice,
      currency: 'VND',
      paymentMethod: 'MOMO',
      paymentStatus: 'pending',
      userToken: userToken // Store the token
    });

    await payment.save();
    console.log('Payment created with ID:', payment._id);

    // MOMO Payment Parameters
    const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
    const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
    const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const requestId = partnerCode + new Date().getTime();
    const orderId = payment._id.toString(); // Sử dụng payment ID làm orderId
    const orderInfo = `Thanh toán đơn thuê xe #${rentalId}`;
    const amount = totalPrice.toString();
    // Use API Gateway URL for IPN (backend to backend)
    const ipnUrl = `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004'}/payments/momo/ipn`;
    
    // Use frontend URL with payment info for redirect (user facing)
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/payment/success`;
    const requestType = "captureWallet";
    const extraData = Buffer.from(JSON.stringify({
      paymentId: payment._id.toString(),
      rentalId: rentalId
    })).toString('base64');

    console.log('MOMO payment parameters prepared');
    console.log('Payment amount:', amount);
    console.log('redirectUrl:', redirectUrl);
    console.log('ipnUrl:', ipnUrl);

    // Tạo chữ ký
    const rawSignature = "accessKey=" + accessKey
                      + "&amount=" + amount
                      + "&extraData=" + extraData
                      + "&ipnUrl=" + ipnUrl
                      + "&orderId=" + orderId
                      + "&orderInfo=" + orderInfo
                      + "&partnerCode=" + partnerCode
                      + "&redirectUrl=" + redirectUrl
                      + "&requestId=" + requestId
                      + "&requestType=" + requestType;

    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // Chuẩn bị request body để gửi tới MoMo
    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi'
    });

    console.log('Sending request to MOMO API');
    // Gửi request tới MoMo API
    const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('MOMO API response received:', response.status);

    // Lưu thông tin thanh toán
    payment.paymentDetails = {
      requestId: requestId,
      orderId: orderId,
      momoRequestId: response.data.requestId,
      momoOrderId: response.data.orderId
    };
    await payment.save();
    console.log('Payment updated with MOMO details');

    // Trả về URL thanh toán của MoMo
    res.status(200).json({ 
      payUrl: response.data.payUrl,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('MoMo payment error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ message: 'Error creating MoMo payment', error: error.message });
  }
};

// Xử lý callback từ MoMo
exports.handleMomoIPN = async (req, res) => {
  try {
    // Thông tin từ MoMo
    const { 
      partnerCode, orderId, requestId, amount, orderInfo, 
      orderType, transId, resultCode, message, payType,
      responseTime, extraData, signature
    } = req.body;

    console.log('Received IPN from MOMO:', JSON.stringify(req.body));

    // Kiểm tra kết quả từ MoMo
    if (resultCode !== '0') {
      console.error(`MoMo payment failed: ${message}`);
      return res.status(200).json({ message: 'Payment failed', resultCode });
    }

    // Giải mã extraData
    let decodedData;
    try {
      decodedData = JSON.parse(Buffer.from(extraData, 'base64').toString());
      console.log('Decoded extraData:', JSON.stringify(decodedData));
    } catch (error) {
      console.error('Error decoding extraData:', error);
      return res.status(400).json({ message: 'Invalid extraData format' });
    }
    
    const { paymentId, rentalId } = decodedData;

    // Cập nhật trạng thái thanh toán
    // Include the userToken in the query to get the stored token
    const payment = await Payment.findById(paymentId).select('+userToken');
    if (!payment) {
      console.error(`Payment not found with ID: ${paymentId}`);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if payment is already marked as paid, to prevent updating multiple times
    if (payment.paymentStatus === 'paid') {
      console.log(`Payment ${paymentId} is already marked as paid, skipping update`);
      return res.status(200).json({ message: 'Payment already processed successfully' });
    }

    payment.paymentStatus = 'paid';
    payment.transactionTime = new Date(responseTime);
    payment.providerPaymentId = transId;
    payment.paymentDetails = {
      ...payment.paymentDetails,
      transId,
      payType,
      responseTime
    };
    
    await payment.save();
    console.log(`Payment ${paymentId} updated to 'paid' status`);

    // Try to update the rental payment status using our helper function with the stored token
    await updateRentalPaymentStatus(rentalId, payment.userToken);

    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('MoMo IPN error:', error);
    res.status(500).json({ message: 'Error processing MoMo payment notification', error: error.message });
  }
};

// Trang thành công sau khi thanh toán MoMo
exports.handleMomoSuccess = async (req, res) => {
  try {
    const { orderId, resultCode, extraData } = req.query;
    
    console.log('MOMO Success callback received:', JSON.stringify(req.query));
    
    // Check if this was a successful payment
    if (resultCode === '0') {
      try {
        // Giải mã extraData để lấy thông tin payment và rental
        const decodedExtraData = JSON.parse(Buffer.from(extraData, 'base64').toString());
        const { paymentId, rentalId } = decodedExtraData;
        
        console.log(`Payment ID: ${paymentId}, Rental ID: ${rentalId}`);
        
        // Lấy thông tin thanh toán with token
        const payment = await Payment.findById(paymentId).select('+userToken');
        
        // If payment exists but status isn't updated yet, update it
        if (payment && payment.paymentStatus !== 'paid') {
          console.log(`Updating payment ${paymentId} status to paid`);
          payment.paymentStatus = 'paid';
          payment.transactionTime = new Date();
          await payment.save();
          
          // Only try to update the rental service if it's a new payment update
          if (payment.userToken) {
            console.log('Using stored token to update rental payment status');
            
            // Check rental payment status first
            try {
              const checkUrl = `${RENTAL_SERVICE_URL}/rentals/${rentalId}`;
              const checkResponse = await axios.get(
                checkUrl,
                { 
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': payment.userToken
                  } 
                }
              );
              
              const rentalData = checkResponse.data.data || checkResponse.data;
              
              // If already paid, don't update again
              if (rentalData && rentalData.paymentStatus === 'paid') {
                console.log(`Rental ${rentalId} payment status is already paid, skipping update from success callback`);
              } else {
                // Only update if not already paid
                await updateRentalPaymentStatus(rentalId, payment.userToken);
              }
            } catch (err) {
              console.error('Error checking rental status:', err.message);
            }
          } else {
            console.warn('No stored token available for payment update');
          }
        } else if (payment) {
          console.log(`Payment ${paymentId} is already marked as paid, skipping update`);
        }
        
        // Payment exists, return success response
        if (payment) {
          return res.status(200).json({
            success: true,
            message: 'Payment successful',
            data: {
              rentalId,
              paymentId: payment._id,
              amount: payment.amount,
              currency: payment.currency,
              time: new Date().toISOString(),
              redirectUrl: FRONTEND_URL
            }
          });
        } else {
          // Payment not found
          return res.status(404).json({
            success: false,
            message: 'Payment not found',
            redirectUrl: FRONTEND_URL
          });
        }
      } catch (decodingErr) {
        console.error('Error processing success callback data:', decodingErr);
        return res.status(500).json({
          success: false,
          message: 'Server error processing payment data',
          redirectUrl: FRONTEND_URL
        });
      }
    } else {
      // Payment failed
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        resultCode,
        redirectUrl: FRONTEND_URL
      });
    }
  } catch (error) {
    console.error('MoMo success page error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      redirectUrl: FRONTEND_URL
    });
  }
};


