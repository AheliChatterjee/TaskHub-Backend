const Application = require("../models/application");
const Task = require("../models/task");

async function applyForTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { coverLetter, bidAmount, estimatedTime } = req.body;

    // Validate required fields
    if (!bidAmount || !estimatedTime) {
      return res.status(400).json({
        message: "Bid amount and estimated time are required.",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (task.status !== "open") {
      return res.status(400).json({ message: "Applications are closed for this task." });
    }

    if (task.uploadedBy.toString() === userId) {
      return res
        .status(403)
        .json({ message: "You cannot apply for your own task." });
    }

    const existing = await Application.findOne({
      task: taskId,
      applicant: userId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already applied for this task." });
    }

    const application = new Application({
      task: taskId,
      applicant: userId,
      coverLetter,
      bidAmount,
      estimatedTime,
    });

    await application.save();

    res.status(201).json({ message: "Application submitted successfully." });
  } catch (error) {
    console.error("Error applying for task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getApplicationsForTask(req, res) {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    // Check if the task exists and belongs to this user
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (task.uploadedBy.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to view applications for this task." });
    }

    const applications = await Application.find({ task: taskId })
      .populate("applicant", "name email skills image bio")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Applications fetched successfully.",
      applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  applyForTask,
  getApplicationsForTask,
  
};
