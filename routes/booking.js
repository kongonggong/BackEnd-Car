const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const { protect, admin } = require("../middleware/authMiddleware"); 
const Provider = require('../models/Provider');
const cron = require('node-cron');
const router = express.Router();

// ✅ GET all bookings for the currently logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;  // ✅ Get userId from JWT token
    console.log("🔍 Fetching bookings for logged-in user:", userId);

    // Populate the car and its createdBy (provider) field
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: 'car',
        populate: {
          path: 'createdBy', // Populate the provider (createdBy field in Car)
          select: 'name address telephone', // Select specific fields
        },
      });

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ POST: Create a new booking (Only logged-in users)
router.post('/', protect, async (req, res) => {
  try {
    const { carId, pickupDate, returnDate } = req.body;
    const userId = req.user.id;

    // Fetch the car and its provider
    const car = await Car.findById(carId).populate('createdBy'); // Use createdBy to reference Provider
    if (!car || !car.available) {
      return res.status(400).json({ message: 'Car not available or does not exist.' });
    }

    // Create booking
    const booking = new Booking({
      user: userId,
      car: car._id,
      pickupDate,
      returnDate,
    });
    await booking.save();

    // Mark car as unavailable
    car.available = false;
    await car.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
// ✅ PUT: Update a booking (Only user who made it or admin)
router.put('/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { carId, pickupDate, returnDate } = req.body; // Use carId instead of carModel
    console.log("🔍 Updating booking:", bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    let booking = await Booking.findById(bookingId).populate('car');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Ensure user owns the booking or is an admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this booking" });
    }

    // ✅ If carId is being changed, check availability
    if (carId && carId !== booking.car.toString()) {
      console.log(`🔍 Checking availability for new car: ${carId}`);

      const newCar = await Car.findById(carId);
      if (!newCar || !newCar.available) {
        return res.status(400).json({ message: "The requested car is not available." });
      }

      // ✅ Mark previous car as available
      const previousCar = await Car.findByIdAndUpdate(
        booking.car,
        { available: true },
        { new: true }
      );

      if (previousCar) {
        console.log(`✅ Previous car ${previousCar.model} is now available.`);
      } else {
        console.warn(`⚠ Previous car not found in DB.`);
      }

      // ✅ Mark new car as unavailable
      newCar.available = false;
      await newCar.save();
      console.log(`✅ New car ${newCar.model} is now booked.`);

      // ✅ Update the booking with the new car
      booking.car = carId;
    }

    // ✅ Update the other fields if provided
    if (pickupDate) booking.pickupDate = pickupDate;
    if (returnDate) booking.returnDate = returnDate;

    await booking.save();

    res.status(200).json({ message: "Booking updated successfully", booking });

  } catch (error) {
    console.error("❌ Error updating booking:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});


// ✅ DELETE: Remove a booking and update car availability
router.delete('/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("🔍 Deleting booking:", bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    let booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Ensure user owns the booking or is an admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this booking" });
    }

    // ✅ Update the car availability before deleting the booking
    const car = await Car.findOneAndUpdate(
      { model: booking.carModel },
      { available: true },
      { new: true } // ✅ Return updated document
    );

    if (car) {
      console.log(`✅ Car ${car.model} is now available.`);
    } else {
      console.warn(`⚠ Car ${booking.carModel} not found, skipping update.`);
    }

    // ✅ Delete the booking after updating the car
    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({
      message: "Booking deleted successfully, car is now available.",
      carStatus: car ? car.available : "Car not found"
    });

  } catch (error) {
    console.error("❌ Error deleting booking:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});


// 🔄 ตั้ง Cron Job ให้รันทุกชั่วโมงเพื่อตรวจสอบ returnDate
cron.schedule('0 * * * *', async () => {
    console.log('🔍 Checking for completed bookings to update car availability...');
    try {
        const now = new Date();
        
        // ค้นหาการจองที่ returnDate ผ่านไปแล้ว
        const expiredBookings = await Booking.find({ returnDate: { $lt: now } });

        for (let booking of expiredBookings) {
            // อัปเดต Car ให้ available = true
            await Car.findByIdAndUpdate(booking.car, { available: true });
            console.log(`✅ Car ${booking.car} is now available.`);
        }
    } catch (error) {
        console.error('❌ Error updating car availability:', error);
    }
});

console.log('🚀 Car availability update scheduler started!');



module.exports = router;
