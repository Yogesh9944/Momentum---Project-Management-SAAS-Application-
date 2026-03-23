const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET projects by workspace
router.get('/workspace/:workspaceId', protect, async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.params.workspaceId })
      .populate('owner', 'name email avatar').sort({ createdAt: -1 });
    // Add task count to each project
    const projectsWithStats = await Promise.all(projects.map(async (p) => {
      const tasks = await Task.find({ project: p._id });
      const completed = tasks.filter(t => t.status === 'done').length;
      return {
        ...p.toObject(),
        taskCount: tasks.length,
        completedTaskCount: completed,
        progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      };
    }));
    res.json(projectsWithStats);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create project
router.post('/', protect, async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user._id });
    await project.populate('owner', 'name email avatar');
    const io = req.app.get('io');
    io.to(`workspace:${project.workspace}`).emit('project:created', project);
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const tasks = await Task.find({ project: req.params.id });
    const completed = tasks.filter(t => t.status === 'done').length;
    res.json({
      ...project.toObject(),
      taskCount: tasks.length,
      completedTaskCount: completed,
      progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update project
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('owner', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const io = req.app.get('io');
    io.to(`workspace:${project.workspace}`).emit('project:updated', project);
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE project
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ project: req.params.id });
    const io = req.app.get('io');
    io.to(`workspace:${project.workspace}`).emit('project:deleted', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
