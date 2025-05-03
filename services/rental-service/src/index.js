require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const connectDB = require('./config/database');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();
const httpServer = createServer(app);

// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);

      // Xử lý các loại message khác nhau
      switch (data.type) {
        case 'calculate_price':
          await handlePriceCalculation(ws, data.data);
          break;
        
        case 'RENTAL_UPDATE':
          // Broadcast rental updates to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message.toString());
            }
          });
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Hàm xử lý tính toán giá
async function handlePriceCalculation(ws, data) {
  try {
    const { startDate, endDate, pickupTime, returnTime, vehicleId } = data;
    
    // Tạo đối tượng Date từ startDate và endDate
    const start = pickupTime 
      ? new Date(`${startDate}T${pickupTime}`)
      : new Date(startDate);
    
    const end = returnTime
      ? new Date(`${endDate}T${returnTime}`)
      : new Date(endDate);

    // Lấy thông tin vehicle
    const vehicleResponse = await axios.get(
      `${process.env.VEHICLE_SERVICE_URL}/vehicles/${vehicleId}`
    );
    const vehicle = vehicleResponse.data.data;

    // Tính toán giá
    const isSameDay = start.toDateString() === end.toDateString();
    let totalPrice = 0;

    if (isSameDay && pickupTime && returnTime) {
      // Tính số giờ thuê trong cùng một ngày
      const hourDiff = (end - start) / (1000 * 60 * 60);
      
      if (hourDiff <= 6) {
        totalPrice = vehicle.rentalPricePerDay * 0.5;
      } else if (hourDiff <= 12) {
        totalPrice = vehicle.rentalPricePerDay * 0.75;
      } else {
        totalPrice = vehicle.rentalPricePerDay;
      }
    } else {
      // Tính số ngày thuê
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalPrice = days * vehicle.rentalPricePerDay;
    }

    // Gửi kết quả về client
    ws.send(JSON.stringify({
      type: 'price_calculated',
      totalPrice
    }));
  } catch (error) {
    console.error('Error calculating price:', error);
    ws.send(JSON.stringify({
      type: 'calculation_error',
      message: error.message
    }));
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/rentals', rentalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'rental-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!' 
  });
});

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3003;
    httpServer.listen(PORT, () => {
      console.log(`Rental service running on http://localhost:${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
