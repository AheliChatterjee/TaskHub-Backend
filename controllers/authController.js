const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

const emailRegex = /^[0-9]{7,8}@kiit\.ac\.in$/;

async function register(req, res) {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: "Email must be a valid KIIT email" });
  }

  if (!["poster", "freelancer", "both"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (!existingUser.isVerified) {
        const now = new Date();
        if (existingUser.verificationExpires && existingUser.verificationExpires < now) {
          await User.deleteOne({ _id: existingUser._id }); // Grace period expired → delete
        } else {
          const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
          await sendVerificationEmail(normalizedEmail, token);
          return res.status(200).json({
            message: "Email already registered but not verified. A new verification email has been sent.",
          });
        }
      } else {
        return res.status(409).json({ message: "User already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationExpires,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(normalizedEmail, token);

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid KIIT email format" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: "Verification token is required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({
        message: "Email already verified",
        token: newToken,
        user: { id: user._id, name: user.name, role: user.role },
      });
    }

    user.isVerified = true;
    await user.save();
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Email verified successfully",
      token: authToken,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
}

async function resendVerificationEmail(req, res) {
  const { email } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: "Please provide a valid KIIT email" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    if (user.isVerified) return res.status(200).json({ message: "Email is already verified" });

    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(user.email, token);

    res.status(200).json({ message: "A new verification email has been sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
};
