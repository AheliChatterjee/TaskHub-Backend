const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

const applicationController = require("../controllers/applicationController");

router.post("/:id/apply", authMiddleware, applicationController.applyForTask);

router.get("/task/:taskId", authMiddleware, applicationController.getApplicationsForTask);

module.exports = router;
