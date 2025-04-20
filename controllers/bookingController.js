const Booking = require('../models/Booking');
const Car = require('../models/Car');

const createBooking = async (req, res) => {
  try {
    const { carId, pickupDate, returnDate } = req.body;

    const car = await Car.findById(carId).populate('createdBy'); // Use createdBy to reference Provider
    if (!car || !car.available) {
      return res.status(400).json({ message: 'Car not available or does not exist.' });
    }

    const booking = new Booking({
      user: req.user._id,
      car: car._id,
      pickupDate,
      returnDate,
    });

    await booking.save();

    car.available = false;
    await car.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
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