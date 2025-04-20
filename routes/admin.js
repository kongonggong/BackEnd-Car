const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Provider = require('../models/Provider');

const router = express.Router();

// ✅ Middleware: Check if user is an admin using JWT token
const checkAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);

    // ✅ Check if user exists and is an admin
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    req.user = adminUser; // Attach admin user to request
    next();
  } catch (error) {
    console.error("❌ Admin authentication error:", error.message);
    res.status(401).json({ error: "Unauthorized", details: error.message });
  }
};

// ✅ GET all bookings (Admin Only)
router.get('/bookings', checkAdmin, async (req, res) => {
  try {
    // Populate the car and its createdBy (provider) field
    const bookings = await Booking.find()
      .populate({
        path: 'car',
        populate: {
          path: 'createdBy', // Populate the provider (createdBy field in Car)
          select: 'name address telephone', // Select specific fields
        },
      })
      .populate('user', 'name email'); // Populate the user who made the booking

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ GET a single booking by ID (Admin Only)
router.get('/bookings/:bookingId', checkAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    // Populate the car and its createdBy (provider) field
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'car',
        populate: {
          path: 'createdBy', // Populate the provider (createdBy field in Car)
          select: 'name address telephone', // Select specific fields
        },
      })
      .populate('user', 'name email'); // Populate the user who made the booking

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error("❌ Error fetching booking:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ PUT: Update any booking (Admin Only)
router.put('/bookings/:bookingId', checkAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("🔍 Updating booking:", bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      req.body,
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking updated successfully", updatedBooking });
  } catch (error) {
    console.error("❌ Error updating booking:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ DELETE: Remove any booking (Admin Only)
router.delete('/bookings/:bookingId', checkAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("🔍 Deleting booking:", bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting booking:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
