const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

// GET tasks by project
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { status, priority, assignee, search } = req.query;
    let filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET tasks assigned to user (across all projects)
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignees: req.user._id, status: { $ne: 'done' } })
      .populate('project', 'name color')
      .populate('assignees', 'name email avatar')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create task
router.post('/', protect, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const comments = await Comment.find({ task: req.params.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json({ ...task.toObject(), comments });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:updated', task);
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await Comment.deleteMany({ task: req.params.id });
    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:deleted', req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update task status (for drag & drop)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, order } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status, order, updatedAt: Date.now() }, { new: true })
      .populate('assignees', 'name email avatar');
    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:moved', task);
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const comment = await Comment.create({ task: req.params.id, author: req.user._id, content: req.body.content });
    await comment.populate('author', 'name email avatar');
    const task = await Task.findById(req.params.id);
    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('comment:added', { taskId: req.params.id, comment });
    res.status(201).json(comment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE comment
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    await Comment.findOneAndDelete({ _id: req.params.commentId, author: req.user._id });
    res.json({ message: 'Comment deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update checklist item
router.patch('/:id/checklist/:itemId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const item = task.checklist.id(req.params.itemId);
    if (item) { item.completed = req.body.completed; }
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
