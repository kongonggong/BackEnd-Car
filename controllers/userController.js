const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  const { name, telephone, email, password, role } = req.body;

  try {
    const user = await User.create({ name, telephone, email, password, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(201).json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const logoutUser=async(req,res,next)=>{
  res.cookie('token','none',{
  expires: new Date(Date.now()+ 10*1000),
  httpOnly:true
  });
  res.status(200).json({
  success:true,
  data:{}
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};