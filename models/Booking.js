const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carModel: { type: String, required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
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
