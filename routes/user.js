const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');
const { logoutUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware'); // Import the protect middleware

const router = express.Router();

// ✅ User Registration (Allows Admin Role)
router.post('/register', async (req, res) => {
  try {
    const { name, telephone, email, password, role } = req.body;
    
    // ✅ Default role to "user" if not specified
    const validRole = role === "admin" ? "admin" : "user";

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // ✅ Create new user
    const user = await User.create({ name, telephone, email, password, role: validRole });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ message: 'Login successful', token, role: user.role });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get Rental Car Providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (error) {
    console.error("❌ Fetch Providers Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Logout User
router.get('/logout', logoutUser);

// ✅ Get Current User Details (Me)
router.get('/me', protect, async (req, res) => {
  try {
    // The user information is available in req.user due to the 'protect' middleware
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Get User Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
