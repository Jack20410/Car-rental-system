const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ratingRoutes = require('./routes/ratingRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rating_service_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use rating routes
app.use('/', ratingRoutes);

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`Rating service running on port ${PORT}`);
});