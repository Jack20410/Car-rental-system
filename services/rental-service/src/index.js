require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const connectDB = require('./config/database');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:4000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('calculate_price', async (data) => {
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
      socket.emit('price_calculated', { totalPrice });
    } catch (error) {
      console.error('Error calculating price:', error);
      socket.emit('calculation_error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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

// Connect to MongoDB
connectDB()
  .then(() => {
    // Start server after successful DB connection
    const PORT = process.env.PORT || 3003;
    httpServer.listen(PORT, () => {
      console.log(`Rental service running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
