const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Encrypt description
    const encryptedDescription = description ? encrypt(description) : '';

    // Create task
    const task = new Task({
      title,
      description: encryptedDescription,
      status: status || 'pending',
      userId: req.userId
    });

    await task.save();

    // Decrypt description before sending response
    const taskResponse = task.toObject();
    taskResponse.description = decrypt(taskResponse.description);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: taskResponse
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks with pagination, search, and filter
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    const query = { userId: req.userId };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    // Decrypt descriptions
    const decryptedTasks = tasks.map(task => {
      const taskObj = task.toObject();
      taskObj.description = decrypt(taskObj.description);
      return taskObj;
    });

    res.status(200).json({
      success: true,
      tasks: decryptedTasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTasks: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Decrypt description
    const taskResponse = task.toObject();
    taskResponse.description = decrypt(taskResponse.description);

    res.status(200).json({
      success: true,
      task: taskResponse
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    // Find task
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    // Update fields
    if (title) task.title = title;
    if (status) task.status = status;
    if (description !== undefined) {
      task.description = description ? encrypt(description) : '';
    }

    await task.save();

    // Decrypt description before sending
    const taskResponse = task.toObject();
    taskResponse.description = decrypt(taskResponse.description);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: taskResponse
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
});

module.exports = router;