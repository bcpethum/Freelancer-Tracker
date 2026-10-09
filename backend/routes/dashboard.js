const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard stats
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Basic counts
    const [totalClients, totalProjects, activeProjects, completedProjects] = await Promise.all([
      Client.countDocuments({ user: userId }),
      Project.countDocuments({ user: userId }),
      Project.countDocuments({ user: userId, status: 'in-progress' }),
      Project.countDocuments({ user: userId, status: 'completed' })
    ]);

    // Financial stats
    const incomeStats = await Payment.aggregate([
      { $match: { user: userId, status: 'received' } },
      { $group: { _id: null, totalIncome: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const pendingStats = await Payment.aggregate([
      { $match: { user: userId, status: 'pending' } },
      { $group: { _id: null, totalPending: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const overdueStats = await Payment.aggregate([
      { $match: { user: userId, status: 'overdue' } },
      { $group: { _id: null, totalOverdue: { $sum: '$amount' } } }
    ]);

    // Monthly income for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyIncome = await Payment.aggregate([
      {
        $match: {
          user: userId,
          status: 'received',
          receivedDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$receivedDate' },
            month: { $month: '$receivedDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Project status distribution
    const projectStatusDist = await Project.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Recent projects
    const recentProjects = await Project.find({ user: userId })
      .populate('client', 'name company')
      .sort('-createdAt')
      .limit(5);

    // Recent payments
    const recentPayments = await Payment.find({ user: userId })
      .populate('project', 'name')
      .populate('client', 'name')
      .sort('-createdAt')
      .limit(5);

    // Top clients by earnings
    const topClients = await Client.find({ user: userId })
      .sort('-totalEarned')
      .limit(5)
      .select('name company totalEarned projectCount');

    // Upcoming deadlines
    const upcomingDeadlines = await Project.find({
      user: userId,
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      status: { $in: ['pending', 'in-progress'] }
    })
      .populate('client', 'name')
      .sort('deadline')
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalClients,
          totalProjects,
          activeProjects,
          completedProjects,
          totalIncome: incomeStats[0]?.totalIncome || 0,
          pendingPayments: pendingStats[0]?.totalPending || 0,
          overduePayments: overdueStats[0]?.totalOverdue || 0,
          pendingCount: pendingStats[0]?.count || 0
        },
        monthlyIncome,
        projectStatusDist,
        recentProjects,
        recentPayments,
        topClients,
        upcomingDeadlines
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
