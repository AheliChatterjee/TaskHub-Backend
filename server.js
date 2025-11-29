require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// 🔗 MongoDB connection URL
const dbUrl = process.env.MONGODB_URL;

let isConnected = false;

// 🔌 Connect to MongoDB once and reuse the connection
async function connectToDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(dbUrl, {
      // these options are optional in newer Mongoose versions,
      // you can remove them if you get warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

/* ----------------------  CORS CONFIG  ---------------------- */

// Frontend origins that are allowed to call this backend
const allowedOrigins = [
  "http://localhost:5173",
  "https://task-hub-frontend-three.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // set true only if you use cookies / auth that needs credentials
};

// ✅ CORS MUST COME BEFORE body parsers & routes
app.use(cors(corsOptions));
// Handle all preflight OPTIONS requests
app.options("*", cors(corsOptions));

/* --------------------  BODY PARSERS  -------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --------------------  DB MIDDLEWARE  -------------------- */

// Ensure DB connection exists for each request
app.use(async (req, res, next) => {
  try {
    await connectToDB();
    next();
  } catch (error) {
    console.error("DB connection failed for request:", error);
    return res.status(500).json({ message: "Database connection error" });
  }
});

/* --------------------  STATIC FILES  -------------------- */

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ------------------------  ROUTES  ------------------------ */

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use("/api/auth", authRoutes);
// NOTE: prefix is /api/task (singular)
app.use("/api/task", taskRoutes);
app.use("/api/application", applicationRoutes);

/* --------------------  404 HANDLER  -------------------- */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* --------------------  SERVER START  -------------------- */

const PORT = process.env.PORT || 5000;

// If you're using a traditional Node server (not serverless), keep this:
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// If Vercel / another platform needs the app exported:
module.exports = app;
