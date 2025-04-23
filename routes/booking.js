const express = require('express');
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updateCarAvailability,
} = require('../controllers/bookingController');
const cron = require('node-cron');
const router = express.Router();

// GET all bookings for the currently logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await getUserBookings(req.user.id);
    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET all bookings (admin only)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST: Create a new booking
router.post('/', protect, async (req, res) => {
  try {
    const { carId, pickupDate, returnDate } = req.body;
    const booking = await createBooking(req.user.id, carId, pickupDate, returnDate);
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT: Update a booking
router.put('/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId format' });
    }

    const booking = await updateBooking(bookingId, req.user.id, updates, req.user.role === 'admin');
    res.status(200).json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Remove a booking
router.delete('/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId format' });
    }

    await deleteBooking(bookingId, req.user.id, req.user.role === 'admin');
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cron job to update car availability
cron.schedule('0 * * * *', async () => {
  try {
    await updateCarAvailability();
    console.log('✅ Car availability updated.');
  } catch (error) {
    console.error('❌ Error updating car availability:', error);
  }
});

module.exports = router;
