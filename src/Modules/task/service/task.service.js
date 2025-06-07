import { prioritytypes, statustypes, taskModel } from "../../../DB/models/task.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { paginate } from "../../../Utils/pages/pagination.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";


// Create Task
export const createTask = asynchandler(async (req, res, next) => {
  const { title, description, dueDate, priority, status } = req.body;
  const userId = req.user._id;

  const newTask = await taskModel.create({
    user: userId,
    title,
    description,
    dueDate,
    priority: priority || prioritytypes.medium,
    status: status || statustypes.pending,
  });

  return sucessResponse({
    res,
    message: "Task created successfully",
    data: newTask,
  });
});

// Get Tasks
export const getTasks = asynchandler(async (req, res, next) => {
  const userId = req.user._id;
  const { page, limit, skip } = paginate(req.query);

  const totalTasks = await taskModel.countDocuments({ user: userId });
  const totalPages = Math.ceil(totalTasks / limit);

  const tasks = await taskModel.find({ user: userId })
    .skip(skip)
    .limit(limit)
    .lean();

  return sucessResponse({
    res,
    data: {
      tasks,
      meta: {
        totalTasks,
        totalPages,
        currentPage: page,
      },
    },
  });
});

// Get Single Task
export const getTask = asynchandler(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await taskModel.findOne({ _id: taskId, user: userId }).lean();
  if (!task) {
    return next(new Error("Task not found", {status:404}));
  }

  return sucessResponse({
    res,
    data: task,
  });
});

// Update Task
export const updateTask = asynchandler(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  const { title, description, dueDate, priority, status } = req.body;

  const task = await taskModel.findOneAndUpdate(
    { _id: taskId, user: userId },
    { title, description, dueDate, priority, status, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!task) {
    return next(new Error("Task not found", {status:404}));
  }

  return sucessResponse({
    res,
    message: "Task updated successfully",
    data: task,
  });
});

// Delete Task
export const deleteTask = asynchandler(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await taskModel.findOneAndDelete({ _id: taskId, user: userId });
  if (!task) {
    return next(new Error("Task not found", {status:404}));
  }

  return sucessResponse({
    res,
    message: "Task deleted successfully",
  });
});
