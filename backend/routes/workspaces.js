const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const User = require('../models/User');

// GET all workspaces for user
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');
    res.json(workspaces);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create workspace
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const workspace = await Workspace.create({
      name, description, icon, color, owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await workspace.populate('owner', 'name email avatar');
    const io = req.app.get('io');
    io.to(`user:${req.user._id}`).emit('workspace:created', workspace);
    res.status(201).json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single workspace
router.get('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update workspace
router.put('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body, { new: true }
    ).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');
    if (!workspace) return res.status(404).json({ message: 'Not found or unauthorized' });
    const io = req.app.get('io');
    io.to(`workspace:${req.params.id}`).emit('workspace:updated', workspace);
    res.json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE workspace
router.delete('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!workspace) return res.status(404).json({ message: 'Not found or unauthorized' });
    await Project.deleteMany({ workspace: req.params.id });
    res.json({ message: 'Workspace deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST invite member
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    const alreadyMember = workspace.members.find(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User already a member' });
    workspace.members.push({ user: user._id, role: role || 'member' });
    await workspace.save();
    await workspace.populate('members.user', 'name email avatar');
    const io = req.app.get('io');
    io.to(`workspace:${req.params.id}`).emit('workspace:member_added', { workspace });
    res.json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET workspace stats
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.params.id });
    const Task = require('../models/Task');
    const tasks = await Task.find({ workspace: req.params.id });
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    };
    res.json(stats);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
