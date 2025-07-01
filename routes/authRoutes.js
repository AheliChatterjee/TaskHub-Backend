const express = require("express");
const router = express.Router();
const User = require("../models/user");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
