const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

module.exports = router;
