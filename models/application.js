const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: [10, "Bid must be at least 10"],
    },
    estimatedTime: {
      type: String,
      required: true,
      trim: true,
      // Example values: "3 days", "2 weeks"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
