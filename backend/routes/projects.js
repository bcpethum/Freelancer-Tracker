const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects with search/filter/pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, status, client, priority, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (client) query.client = client;
    if (priority) query.priority = priority;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'name email company')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching projects' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client', 'name email company phone');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const payments = await Payment.find({ project: project._id }).sort('-createdAt');

    res.json({ success: true, data: { ...project.toJSON(), payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('client').notEmpty().withMessage('Client is required'),
  body('fee').isNumeric().withMessage('Fee must be a number').isFloat({ min: 0 }).withMessage('Fee cannot be negative'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    // Verify client belongs to user
    const client = await Client.findOne({ _id: req.body.client, user: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const project = await Project.create({
      ...req.body,
      user: req.user._id
    });

    // Update client stats
    await Client.findByIdAndUpdate(client._id, { $inc: { projectCount: 1 } });

    const populated = await Project.findById(project._id).populate('client', 'name email company');

    res.status(201).json({ success: true, message: 'Project created successfully', data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating project' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', [
  body('fee').optional().isNumeric().withMessage('Fee must be a number').isFloat({ min: 0 }),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Set completed date if status changes to completed
    if (req.body.status === 'completed' && !req.body.completedDate) {
      updateData.completedDate = new Date();
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('client', 'name email company');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project updated successfully', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete associated payments
    await Payment.deleteMany({ project: project._id });

    // Update client stats
    await Client.findByIdAndUpdate(project.client, {
      $inc: {
        projectCount: -1,
        totalEarned: -project.paidAmount
      }
    });

    await Project.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Project and associated payments deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting project' });
  }
});

module.exports = router;
