const Booking = require('../models/Booking');
const Car = require('../models/Car');

// Create a new booking
const createBooking = async (userId, carId, pickupDate, returnDate) => {
  const car = await Car.findById(carId).populate('createdBy');
  if (!car || !car.available) {
    throw new Error('Car not available or does not exist.');
  }

  const booking = new Booking({
    user: userId,
    car: car._id,
    pickupDate,
    returnDate,
  });

  await booking.save();
  car.available = false;
  await car.save();

  return booking;
};

// Get all bookings for a specific user
const getUserBookings = async (userId) => {
  return await Booking.find({ user: userId }).populate({
    path: 'car',
    populate: {
      path: 'createdBy',
      select: 'name address telephone',
    },
  });
};

// Get all bookings (admin functionality)
const getAllBookings = async () => {
  return await Booking.find().populate('user car');
};

// Update a booking
const updateBooking = async (bookingId, userId, updates, isAdmin) => {
  const booking = await Booking.findById(bookingId).populate('car');
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.user.toString() !== userId && !isAdmin) {
    throw new Error('Unauthorized to update this booking');
  }

  if (updates.carId && updates.carId !== booking.car.toString()) {
    const newCar = await Car.findById(updates.carId);
    if (!newCar || !newCar.available) {
      throw new Error('The requested car is not available.');
    }

    await Car.findByIdAndUpdate(booking.car, { available: true });
    newCar.available = false;
    await newCar.save();
    booking.car = updates.carId;
  }

  if (updates.pickupDate) booking.pickupDate = updates.pickupDate;
  if (updates.returnDate) booking.returnDate = updates.returnDate;
  if (updates.status) booking.status = updates.status;

  return await booking.save();
};

// Delete a booking
const deleteBooking = async (bookingId, userId, isAdmin) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.user.toString() !== userId && !isAdmin) {
    throw new Error('Unauthorized to delete this booking');
  }

  await Car.findByIdAndUpdate(booking.car, { available: true });
  await booking.remove();
};

// Cron job to update car availability
const updateCarAvailability = async () => {
  const now = new Date();
  const expiredBookings = await Booking.find({ returnDate: { $lt: now } });

  for (let booking of expiredBookings) {
    await Car.findByIdAndUpdate(booking.car, { available: true });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updateCarAvailability,
};