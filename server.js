require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const userRoutes = require('./routes/user');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const carRoutes = require('./routes/car');
const app = express();

// Middleware
app.use(express.json()); // JSON Parsing
app.use(cors()); // CORS for frontend requests
app.use(helmet()); // Security Headers


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define routes
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/cars', carRoutes);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});