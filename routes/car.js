const express = require('express');
const Car = require('../models/Car');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Import middleware

// Add a new car
router.post('/add', protect, authorize('admin', 'car-owner'), async (req, res) => {
    try {
        const { make, model, year, rentalPrice, available } = req.body;
        const newCar = new Car({ 
            make, 
            model, 
            year, 
            rentalPrice, 
            available, 
            createdBy: req.user._id // Set the user who created the car
        });
        await newCar.save();
        res.status(201).json({ message: 'Car added successfully', car: newCar });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 🔎 ค้นหาและกรองรถ พร้อมตรวจสอบสถานะว่าง
router.get('/search', async (req, res) => {
    try {
        const { make, model, year, minPrice, maxPrice, available } = req.query;
        let filter = {};

        if (make) filter.make = new RegExp(make, 'i');
        if (model) filter.model = new RegExp(model, 'i');
        if (year) filter.year = parseInt(year);
        if (minPrice || maxPrice) {
            filter.rentalPrice = {};
            if (minPrice) filter.rentalPrice.$gte = parseInt(minPrice);
            if (maxPrice) filter.rentalPrice.$lte = parseInt(maxPrice);
        }
        if (available !== undefined) {
            filter.available = available === 'true'; // ✅ แปลง String เป็น Boolean
        }

        const cars = await Car.find(filter);
        if (cars.length === 0) {
            return res.status(404).json({ message: 'No cars available matching the criteria' });
        }
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔎 Search cars by userId
router.get('/search-by-user', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const cars = await Car.find({ createdBy: userId });

        if (cars.length === 0) {
            return res.status(404).json({ message: 'No cars found for the given user ID' });
        }

        res.json(cars);
    } catch (error) {
        console.error("❌ Error searching cars by user ID:", error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Search cars with owner information
router.get('/search-with-owner', async (req, res) => {
    try {
        const { make, model, year, minPrice, maxPrice, available } = req.query;
        let filter = {};

        if (make) filter.make = new RegExp(make, 'i');
        if (model) filter.model = new RegExp(model, 'i');
        if (year) filter.year = parseInt(year);
        if (minPrice || maxPrice) {
            filter.rentalPrice = {};
            if (minPrice) filter.rentalPrice.$gte = parseInt(minPrice);
            if (maxPrice) filter.rentalPrice.$lte = parseInt(maxPrice);
        }
        if (available !== undefined) {
            filter.available = available === 'true';
        }

        // Populate createdBy to include provider details
        const cars = await Car.find(filter).populate('createdBy', 'name address telephone');
        if (cars.length === 0) {
            return res.status(404).json({ message: 'No cars available matching the criteria' });
        }
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get details of an individual car by ID
router.get('/:id', async (req, res) => {
    try {
        const carId = req.params.id;
        const car = await Car.findById(carId);

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json(car);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an existing car by ID
router.put('/:id', protect, authorize('admin', 'car-owner'), async (req, res) => {
    try {
        const carId = req.params.id;
        const updates = req.body;

        const updatedCar = await Car.findByIdAndUpdate(carId, updates, { new: true });

        if (!updatedCar) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json({ message: 'Car updated successfully', car: updatedCar });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a car by ID
router.delete('/:id', protect, authorize('admin', 'car-owner'), async (req, res) => {
    try {
        const carId = req.params.id;
        const car = await Car.findById(carId);

        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        // Check if the user is authorized to delete the car
        if (req.user.role !== 'admin' && car.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this car' });
        }

        await Car.findByIdAndDelete(carId); // Use findByIdAndDelete instead of car.remove()
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;