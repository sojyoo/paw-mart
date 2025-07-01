const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireBuyer, requireAdminOrStaff } = require('../middleware/auth');
const { sendContactEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Send contact message (buyer only)
router.post('/send', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { subject, message, dogName } = req.body;

    // Validation
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (subject.length > 100) {
      return res.status(400).json({ error: 'Subject must be less than 100 characters' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message must be less than 1000 characters' });
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        dogName: dogName || null,
        status: 'UNREAD'
      }
    });

    // Send email to admin
    await sendContactEmail({
      name: req.user.name,
      email: req.user.email,
      subject,
      message,
      dogName
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactMessage: {
        id: contactMessage.id,
        subject: contactMessage.subject,
        createdAt: contactMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Send contact message error:', error);
    res.status(500).json({ error: 'Failed to send contact message' });
  }
});

// Get user's contact messages (buyer only)
router.get('/my-messages', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await prisma.contactMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.contactMessage.count({
      where: { userId: req.user.id }
    });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Get all contact messages (admin/staff only)
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.contactMessage.count({ where });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Get specific contact message (admin/staff only)
router.get('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read if unread
    if (message.status === 'UNREAD') {
      await prisma.contactMessage.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'READ' }
      });
      message.status = 'READ';
    }

    res.json({ message });

  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to get message' });
  }
});

// Mark message as read (admin/staff only)
router.patch('/:id/read', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'READ' }
    });

    res.json({
      message: 'Message marked as read',
      contactMessage: updatedMessage
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Mark message as replied (admin/staff only)
router.patch('/:id/replied', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'REPLIED' }
    });

    res.json({
      message: 'Message marked as replied',
      contactMessage: updatedMessage
    });

  } catch (error) {
    console.error('Mark message as replied error:', error);
    res.status(500).json({ error: 'Failed to mark message as replied' });
  }
});

// Get contact message statistics (admin/staff only)
router.get('/stats/overview', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const [unread, read, replied] = await Promise.all([
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      prisma.contactMessage.count({ where: { status: 'READ' } }),
      prisma.contactMessage.count({ where: { status: 'REPLIED' } })
    ]);

    const total = unread + read + replied;

    res.json({
      stats: {
        total,
        unread,
        read,
        replied,
        responseRate: total > 0 ? ((replied / total) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ error: 'Failed to get contact statistics' });
  }
});

module.exports = router; 