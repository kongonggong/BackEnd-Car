const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password'); // Attach user to request

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      next();
    } catch (error) {
      console.error("❌ Authentication error:", error.message);
      res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized: No token provided" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized: Admin access required' });
  }
};

module.exports = { protect, admin };
