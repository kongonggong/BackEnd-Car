const Booking = require('../models/Booking');

const createBooking = async (req, res) => {
  const { date, provider } = req.body;

  const booking = new Booking({
    user: req.user._id,
    date,
    provider,
  });

  const createdBooking = await booking.save();
  res.status(201).json(createdBooking);
};

const getBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id });
  res.json(bookings);
};

const updateBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(401).json({ message: 'User not authorized' });
    return;
  }

  booking.date = req.body.date || booking.date;
  booking.provider = req.body.provider || booking.provider;

  const updatedBooking = await booking.save();
  res.json(updatedBooking);
};

const deleteBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(401).json({ message: 'User not authorized' });
    return;
  }

  await booking.remove();
  res.json({ message: 'Booking removed' });
};


module.exports = {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
};