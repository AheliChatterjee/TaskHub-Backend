const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, Email, Password and Role are required" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@kiit\.ac\.in$/;
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      message: "Only KIIT email addresses (@kiit.ac.in) are allowed",
    });
  }

  try {
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, user: { id: newUser._id, name, role } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@kiit\.ac\.in$/;
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(401).json({
      message: "Invalid email. Must belong to kiit.ac.in domain.",
    });
  }

  try {
    console.log("Looking for user with email:", normalizedEmail);
    const user = await User.findOne({ email: normalizedEmail });
    console.log("Found user:", user);
    if (!user){
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch){
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  register,
  login,
};
