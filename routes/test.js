const express = require("express");
const router = express.Router();

// GET /api/test
router.get("/", (req, res) => {
  res.json({ message: "Test route working!" });
});

module.exports = router;
