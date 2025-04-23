const express = require('express');
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updateCarAvailability,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const cron = require('node-cron');

const router = express.Router({MergeParams: true}); // Merge params to access :id in nested routes

// Routes for bookings
router
  .route('/')
  .get(protect, getUserBookings)
  .post(protect, createBooking);

router
  .route('/:id')
  .put(protect, updateBooking)
  .delete(protect, deleteBooking);

router
  .route('/all')
  .get(protect, getAllBookings);

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
