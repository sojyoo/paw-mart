const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');
const { Parser } = require('json2csv');

const router = express.Router();
const prisma = new PrismaClient();

// Create a finance entry (admin/staff)
router.post('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    if (!type || !category || !amount) return res.status(400).json({ error: 'Missing required fields' });
    const entry = await prisma.financeEntry.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : undefined,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ entry });
  } catch (error) {
    console.error('Create finance entry error:', error);
    res.status(500).json({ error: 'Failed to create finance entry' });
  }
});

// List/filter finance entries (admin/staff)
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { from, to, type, category } = req.query;
    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) where.date = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const entries = await prisma.financeEntry.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ entries });
  } catch (error) {
    console.error('List finance entries error:', error);
    res.status(500).json({ error: 'Failed to list finance entries' });
  }
});

// Edit a finance entry (admin/staff)
router.patch('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    const entry = await prisma.financeEntry.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
      },
    });
    res.json({ entry });
  } catch (error) {
    console.error('Edit finance entry error:', error);
    res.status(500).json({ error: 'Failed to edit finance entry' });
  }
});

// Delete a finance entry (admin/staff)
router.delete('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    await prisma.financeEntry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete finance entry error:', error);
    res.status(500).json({ error: 'Failed to delete finance entry' });
  }
});

// Export finance entries to CSV (admin/staff)
router.get('/export/csv', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { from, to, type, category } = req.query;
    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) where.date = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const entries = await prisma.financeEntry.findMany({ where, orderBy: { date: 'desc' } });
    const parser = new Parser();
    const csv = parser.parse(entries);
    res.header('Content-Type', 'text/csv');
    res.attachment('finance-entries.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export finance entries CSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router; 