if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const dbUrl = process.env.MONGODB_URL;
const app = express();

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }
  try {
    await mongoose.connect(dbUrl);
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    isConnected = false;
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://task-hub-frontend-three.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Handle preflight requests
app.options("*", cors(corsOptions));

// DB Connection Middleware
app.use(async (req, res, next) => {
  await connectToDB();
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);

// 404 Handler
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Export for Vercel / other platforms
module.exports = app;

// Local Dev
if (require.main === module) {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
