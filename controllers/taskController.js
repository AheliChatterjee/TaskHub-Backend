const Task = require("../models/Task");

/**
 * @desc Upload a new task
 * @route POST /api/task/upload
 * @access Private
 */
async function uploadTask(req, res) {
  try {
    const { title, description, category, deadline, budget } = req.body;
    const uploadedBy = req.user?.id;

    const parsedDeadline = new Date(deadline);

    const existingTask = await Task.findOne({
      title: title,
      uploadedBy: uploadedBy,
      deadline: parsedDeadline,
    });

    if (existingTask) {
      return res.status(409).json({
        message: "A task with this title and deadline already exists for you.",
      });
    }

    const newTask = new Task({
      title,
      description,
      category,
      deadline,
      budget,
      uploadedBy,
    });

    await newTask.validate();
    await newTask.save();

    return res.status(201).json({
      status: 201,
      message: "Task uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading task:", error);

    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    } 
    
    return res.status(500).json({
      message: "Server error while uploading task",
      error: error.message,
    });
  }
}

/**
 * @desc View tasks with pagination
 * @route GET /api/task/
 * @access Private
 * @queryParam page {Number} - The page number to retrieve (default: 1)
 * @queryParam limit {Number} - The number of tasks per page (default: 10)
 * @queryParam status {String} - Optional: Filter tasks by status (e.g., 'open', 'in progress', 'completed')
 * @queryParam category {String} - Optional: Filter tasks by category
 */
async function viewTasks(req, res) {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit; 

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "username email");

    // Get total count of tasks matching the filter for pagination metadata
    const totalTasks = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalTasks / limit);

    // Respond with the paginated tasks and metadata
    res.status(200).json({
      status: 200,
      message: "Tasks retrieved successfully",
      tasks,
      pagination: {
        totalTasks,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error("Error viewing tasks:", error);
    return res.status(500).json({
      message: "Server error while retrieving tasks",
      error: error.message,
    });
  }
}

module.exports = {
  uploadTask,
  viewTasks, 
}
