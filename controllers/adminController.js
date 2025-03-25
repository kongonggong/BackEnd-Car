const Booking = require('../models/Booking');

const getAllBookings = async (req, res) => {
  const bookings = await Booking.find({});
  res.json(bookings);
};

const updateAnyBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  booking.date = req.body.date || booking.date;
  booking.provider = req.body.provider || booking.provider;

  const updatedBooking = await booking.save();
  res.json(updatedBooking);
};

const deleteAnyBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  await booking.remove();
  res.json({ message: 'Booking removed' });
};

module.exports = {
  getAllBookings,
  updateAnyBooking,
  deleteAnyBooking,
};