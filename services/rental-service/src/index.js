require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/database');
const rentalRoutes = require('./routes/rentalRoutes');
const { scopePerRequest } = require('./middleware/containerMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

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

// Hàm xử lý tính toán giá (WebSocket-only — uses DI container directly)
async function handlePriceCalculation(ws, data) {
  try {
    const container = require('./config/container');
    const vehicleService = container.resolve('vehicleServiceClient');

    const { startDate, endDate, pickupTime, returnTime, vehicleId, rentalType, hourlyDuration } = data;
    
    // Lấy thông tin vehicle via DI-resolved service
    const vehicle = await vehicleService.getVehicle(vehicleId);
    
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    let totalPrice = 0;

    if (rentalType === 'hourly') {
      // Tính giá cho thuê theo giờ
      switch (hourlyDuration) {
        case 6:
          totalPrice = vehicle.rentalPricePerDay * 0.5;
          break;
        case 8:
          totalPrice = vehicle.rentalPricePerDay * 0.65;
          break;
        case 12:
          totalPrice = vehicle.rentalPricePerDay * 0.75;
          break;
        default:
          throw new Error('Invalid hourly duration');
      }
    } else {
      // Tính giá cho thuê theo ngày
      if (!startDate || !endDate) {
        totalPrice = vehicle.rentalPricePerDay; // Default to 1 day if no dates selected
      } else {
        const start = pickupTime 
          ? new Date(`${startDate}T${pickupTime}`)
          : new Date(startDate);
        
        const end = returnTime
          ? new Date(`${endDate}T${returnTime}`)
          : new Date(endDate);

        // Tính số ngày thuê
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        totalPrice = days * vehicle.rentalPricePerDay;
      }
    }

    // Gửi kết quả về client
    ws.send(JSON.stringify({
      type: 'price_calculated',
      totalPrice,
      basePrice: vehicle.rentalPricePerDay,
      rentalType,
      duration: rentalType === 'hourly' ? hourlyDuration : null
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

// Dependency Injection — attach DI container to every request
app.use(scopePerRequest);

// Routes
app.use('/rentals', rentalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'rental-service' });
});

// Global error handling middleware (must be LAST)
app.use(errorHandler);

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
