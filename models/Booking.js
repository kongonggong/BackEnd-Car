const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true }, // Reference to Car
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid',
  },
  paymentId: {
    type: String,
    required: false,
  },
  paymentAmount: {
    type: Number,
    required: false,
  },
  paymentDate: {
    type: Date,
    required: false,
  },
}, { collection: 'bookings' });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
