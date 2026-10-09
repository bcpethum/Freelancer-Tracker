const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');

router.use(protect);

// Helper: Build date query
function buildDateQuery(startDate, endDate) {
  const dateQuery = {};
  if (startDate) dateQuery.$gte = new Date(startDate);
  if (endDate) dateQuery.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  return Object.keys(dateQuery).length > 0 ? dateQuery : null;
}

// @route   GET /api/reports/income-summary
// @desc    Get income summary report data
// @access  Private
router.get('/income-summary', async (req, res) => {
  try {
    const { startDate, endDate, client } = req.query;
    const userId = req.user._id;

    const matchQuery = { user: userId, status: 'received' };
    const dateQuery = buildDateQuery(startDate, endDate);
    if (dateQuery) matchQuery.receivedDate = dateQuery;
    if (client) matchQuery.client = require('mongoose').Types.ObjectId.createFromHexString(client);

    const payments = await Payment.find(matchQuery)
      .populate('project', 'name fee status category')
      .populate('client', 'name company email')
      .sort('-receivedDate');

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, data: payments, total, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating income summary' });
  }
});

// @route   GET /api/reports/export-csv
// @desc    Export income report as CSV
// @access  Private
router.get('/export-csv', async (req, res) => {
  try {
    const { startDate, endDate, client, status } = req.query;
    const userId = req.user._id;

    const matchQuery = { user: userId };
    if (status) matchQuery.status = status;
    const dateQuery = buildDateQuery(startDate, endDate);
    if (dateQuery) matchQuery.createdAt = dateQuery;
    if (client) matchQuery.client = require('mongoose').Types.ObjectId.createFromHexString(client);

    const payments = await Payment.find(matchQuery)
      .populate('project', 'name fee status category')
      .populate('client', 'name company email')
      .sort('-createdAt');

    // Build CSV
    const headers = ['Invoice #', 'Date', 'Client', 'Company', 'Project', 'Category', 'Amount', 'Status', 'Payment Method', 'Notes'];
    const rows = payments.map(p => [
      p.invoiceNumber || '',
      p.receivedDate ? new Date(p.receivedDate).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
      p.client?.name || '',
      p.client?.company || '',
      p.project?.name || '',
      p.project?.category || '',
      p.amount.toFixed(2),
      p.status,
      p.paymentMethod || '',
      (p.notes || '').replace(/,/g, ';')
    ]);

    const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);

    let csv = headers.join(',') + '\n';
    csv += rows.map(r => r.join(',')).join('\n');
    csv += `\n\nTotal Received,${totalReceived.toFixed(2)}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="income-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error exporting CSV' });
  }
});

// @route   GET /api/reports/export-pdf
// @desc    Export income report as PDF
// @access  Private
router.get('/export-pdf', async (req, res) => {
  try {
    const { startDate, endDate, client } = req.query;
    const userId = req.user._id;

    const matchQuery = { user: userId, status: 'received' };
    const dateQuery = buildDateQuery(startDate, endDate);
    if (dateQuery) matchQuery.receivedDate = dateQuery;
    if (client) matchQuery.client = require('mongoose').Types.ObjectId.createFromHexString(client);

    const payments = await Payment.find(matchQuery)
      .populate('project', 'name fee category')
      .populate('client', 'name company email')
      .sort('-receivedDate');

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const userName = req.user.name;
    const userEmail = req.user.email;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="income-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#4F46E5').text('Income Report', { align: 'center' });
    doc.fontSize(12).fillColor('#6B7280').text(`Generated for: ${userName} (${userEmail})`, { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    if (startDate || endDate) {
      doc.text(`Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'All time'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`, { align: 'center' });
    }

    doc.moveDown(2);

    // Summary box
    doc.fontSize(14).fillColor('#1F2937').text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#374151');
    doc.text(`Total Payments: ${payments.length}`);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`);
    doc.moveDown(1.5);

    // Table header
    doc.fontSize(11).fillColor('#4F46E5');
    const tableTop = doc.y;
    const colWidths = [80, 130, 120, 80, 80];
    const colX = [50, 130, 260, 380, 460];
    const headers2 = ['Date', 'Client', 'Project', 'Method', 'Amount'];

    headers2.forEach((h, i) => {
      doc.text(h, colX[i], tableTop, { width: colWidths[i], align: 'left' });
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown(0.3);

    // Table rows
    payments.forEach((payment, idx) => {
      const y = doc.y;
      if (y > 700) { doc.addPage(); }

      doc.fontSize(10).fillColor(idx % 2 === 0 ? '#374151' : '#4B5563');
      const dateStr = payment.receivedDate ? new Date(payment.receivedDate).toLocaleDateString() : '-';
      const clientName = payment.client?.name || '-';
      const projectName = payment.project?.name || '-';
      const method = (payment.paymentMethod || '-').replace('_', ' ');
      const amount = `$${payment.amount.toFixed(2)}`;

      doc.text(dateStr, colX[0], doc.y, { width: colWidths[0] });
      doc.text(clientName, colX[1], doc.y - doc.currentLineHeight(), { width: colWidths[1] });
      doc.text(projectName, colX[2], doc.y - doc.currentLineHeight(), { width: colWidths[2] });
      doc.text(method, colX[3], doc.y - doc.currentLineHeight(), { width: colWidths[3] });
      doc.text(amount, colX[4], doc.y - doc.currentLineHeight(), { width: colWidths[4] });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#4F46E5').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4F46E5').text(`Total Income: $${totalIncome.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, message: 'Error exporting PDF' });
  }
});

// @route   GET /api/reports/invoice/:projectId
// @desc    Generate invoice PDF for a project
// @access  Private
router.get('/invoice/:projectId', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id })
      .populate('client', 'name company email phone address');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const payments = await Payment.find({ project: project._id, status: 'received' });
    const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const dueAmount = project.fee - paidAmount;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${project._id}.pdf"`);
    doc.pipe(res);

    const invoiceNum = `INV-${project._id.toString().slice(-6).toUpperCase()}`;

    // Header
    doc.fontSize(28).fillColor('#4F46E5').text('INVOICE', 50, 50);
    doc.fontSize(10).fillColor('#6B7280').text(invoiceNum, 50, 85);

    // From / To
    doc.fontSize(12).fillColor('#1F2937').text('From:', 50, 130);
    doc.fontSize(11).fillColor('#374151').text(req.user.name, 50, 148);
    doc.fontSize(10).fillColor('#6B7280').text(req.user.email, 50, 163);

    doc.fontSize(12).fillColor('#1F2937').text('To:', 300, 130);
    doc.fontSize(11).fillColor('#374151').text(project.client?.name || '-', 300, 148);
    if (project.client?.company) doc.fontSize(10).fillColor('#6B7280').text(project.client.company, 300, 163);
    if (project.client?.email) doc.text(project.client.email, 300, 175);

    // Invoice details
    doc.fontSize(10).fillColor('#374151');
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 220);
    if (project.deadline) doc.text(`Due Date: ${new Date(project.deadline).toLocaleDateString()}`, 50, 235);
    doc.text(`Status: ${project.status.toUpperCase()}`, 50, 250);

    // Line item
    doc.moveDown(4);
    doc.moveTo(50, 275).lineTo(545, 275).strokeColor('#4F46E5').stroke();
    doc.fontSize(11).fillColor('#4F46E5');
    doc.text('Description', 50, 285, { width: 300 });
    doc.text('Amount', 400, 285, { width: 100, align: 'right' });
    doc.moveTo(50, 305).lineTo(545, 305).strokeColor('#E5E7EB').stroke();

    doc.fontSize(11).fillColor('#374151');
    doc.text(project.name, 50, 315, { width: 300 });
    if (project.description) doc.fontSize(9).fillColor('#6B7280').text(project.description, 50, 333, { width: 300 });
    doc.fontSize(11).fillColor('#374151').text(`$${project.fee.toFixed(2)}`, 400, 315, { width: 100, align: 'right' });

    doc.moveTo(50, 360).lineTo(545, 360).strokeColor('#E5E7EB').stroke();

    // Totals
    doc.fontSize(11).fillColor('#374151');
    doc.text('Project Fee:', 350, 375);
    doc.text(`$${project.fee.toFixed(2)}`, 450, 375, { width: 95, align: 'right' });

    doc.text('Amount Paid:', 350, 393);
    doc.fillColor('#16A34A').text(`-$${paidAmount.toFixed(2)}`, 450, 393, { width: 95, align: 'right' });

    doc.moveTo(350, 413).lineTo(545, 413).strokeColor('#4F46E5').stroke();
    doc.fontSize(13).fillColor('#4F46E5').text('Balance Due:', 350, 422);
    doc.text(`$${dueAmount.toFixed(2)}`, 450, 422, { width: 95, align: 'right' });

    // Footer
    doc.fontSize(9).fillColor('#9CA3AF').text('Thank you for your business!', 50, 700, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ success: false, message: 'Error generating invoice' });
  }
});

module.exports = router;
