const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/clients
// @desc    Get all clients for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clients' });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Get client's projects
    const projects = await Project.find({ client: client._id, user: req.user._id }).sort('-createdAt');

    res.json({ success: true, data: { ...client.toJSON(), projects } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching client' });
  }
});

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private
router.post('/', [
  body('name').trim().notEmpty().withMessage('Client name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'prospect'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, phone, company, address, notes, status } = req.body;

    const client = await Client.create({
      user: req.user._id,
      name, email, phone, company, address, notes,
      status: status || 'active'
    });

    res.status(201).json({ success: true, message: 'Client created successfully', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating client' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update a client
// @access  Private
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Client name cannot be empty'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email'),
  body('status').optional().isIn(['active', 'inactive', 'prospect'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, message: 'Client updated successfully', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating client' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete a client
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check for associated projects
    const projectCount = await Project.countDocuments({ client: client._id });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client with ${projectCount} associated project(s). Please delete or reassign the projects first.`
      });
    }

    await Client.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting client' });
  }
});

module.exports = router;
