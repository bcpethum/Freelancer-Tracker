const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/payments
// @desc    Get all payments with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { project, client, status, page = 1, limit = 10, sort = '-createdAt', startDate, endDate } = req.query;

    const query = { user: req.user._id };
    if (project) query.project = project;
    if (client) query.client = client;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('project', 'name fee status')
      .populate('client', 'name email company')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calculate totals
    const totals = await Payment.aggregate([
      { $match: { ...query, status: 'received' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: payments,
      totalReceived: totals[0]?.total || 0,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payments' });
  }
});

// @route   POST /api/payments
// @desc    Create a new payment
// @access  Private
router.post('/', [
  body('project').notEmpty().withMessage('Project is required'),
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('status').optional().isIn(['pending', 'received', 'overdue', 'cancelled']),
  body('paymentMethod').optional().isIn(['bank_transfer', 'paypal', 'stripe', 'cash', 'check', 'crypto', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const project = await Project.findOne({ _id: req.body.project, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const paymentData = {
      ...req.body,
      user: req.user._id,
      client: project.client
    };

    if (req.body.status === 'received' && !req.body.receivedDate) {
      paymentData.receivedDate = new Date();
    }

    const payment = await Payment.create(paymentData);

    // Update project paid amount if payment is received
    if (payment.status === 'received') {
      await Project.findByIdAndUpdate(project._id, { $inc: { paidAmount: payment.amount } });
      await Client.findByIdAndUpdate(project.client, { $inc: { totalEarned: payment.amount } });
    }

    const populated = await Payment.findById(payment._id)
      .populate('project', 'name fee status')
      .populate('client', 'name email company');

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating payment' });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update a payment
// @access  Private
router.put('/:id', [
  body('amount').optional().isNumeric().isFloat({ min: 0.01 }),
  body('status').optional().isIn(['pending', 'received', 'overdue', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const oldPayment = await Payment.findOne({ _id: req.params.id, user: req.user._id });
    if (!oldPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.status === 'received' && !req.body.receivedDate) {
      updateData.receivedDate = new Date();
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('project', 'name fee status').populate('client', 'name email company');

    // Adjust project paidAmount based on status change
    const oldAmount = oldPayment.status === 'received' ? oldPayment.amount : 0;
    const newAmount = payment.status === 'received' ? payment.amount : 0;
    const diff = newAmount - oldAmount;

    if (diff !== 0) {
      await Project.findByIdAndUpdate(payment.project._id, { $inc: { paidAmount: diff } });
      await Client.findByIdAndUpdate(payment.client._id, { $inc: { totalEarned: diff } });
    }

    res.json({ success: true, message: 'Payment updated successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payment' });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete a payment
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Reverse paid amount if was received
    if (payment.status === 'received') {
      await Project.findByIdAndUpdate(payment.project, { $inc: { paidAmount: -payment.amount } });
      await Client.findByIdAndUpdate(payment.client, { $inc: { totalEarned: -payment.amount } });
    }

    await Payment.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting payment' });
  }
});

module.exports = router;
