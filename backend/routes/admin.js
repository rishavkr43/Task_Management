const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const adminAuth = require('../middleware/adminAuth');

// @route   GET /api/v1/admin/users
// @desc    Get all registered users
// @access  Admin only
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/admin/tasks
// @desc    Get all tasks across all users
// @access  Admin only
router.get('/tasks', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (userId) query.userId = userId;

    const tasks = await Task.find(query)
      .populate('userId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTasks: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/v1/admin/users/:id/role
// @desc    Promote/demote a user's role (user <-> admin)
// @access  Admin only
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be "user" or "admin"'
      });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to "${role}"`,
      user
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/v1/admin/users/:id
// @desc    Delete a user and all their tasks
// @access  Admin only
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account via admin panel'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cascade delete all tasks belonging to this user
    await Task.deleteMany({ userId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User and all associated tasks deleted'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
