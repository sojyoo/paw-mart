const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireBuyer, requireAdminOrStaff } = require('../middleware/auth');
const { sendMessageEmail } = require('../utils/email');
const { saveUploadedFile, deleteFile } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
  }
});

// Helper function to get admin display name
const getAdminDisplayName = (user) => {
  if (user.role === 'ADMIN' || user.role === 'STAFF') {
    return 'PawMart';
  }
  return user.name;
};

// Get buyer's conversation (or create if not exists)
router.get('/', authenticateToken, requireBuyer, async (req, res) => {
  try {
    let conversation = await prisma.conversation.findUnique({
      where: { buyerId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { 
            sender: { select: { id: true, name: true, role: true } },
            attachments: true
          }
        }
      }
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { buyerId: req.user.id },
        include: {
          messages: {
            include: { 
              sender: { select: { id: true, name: true, role: true } },
              attachments: true
            }
          }
        }
      });
    }
    res.json({ conversation });
  } catch (error) {
    console.error('Get buyer conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get all buyer conversations (admin/staff)
router.get('/all', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const conversations = await prisma.conversation.findMany({
      where: {
        buyer: {
          name: { contains: search, mode: 'insensitive' }
        }
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { 
            sender: { select: { id: true, name: true, role: true } },
            attachments: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });
    res.json({ conversations });
  } catch (error) {
    console.error('Get all conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages in a conversation (buyer or admin/staff)
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(req.params.conversationId) },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { 
            sender: { select: { id: true, name: true, role: true } },
            attachments: true
          }
        }
      }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    // Only allow buyer or admin/staff
    if (
      req.user.role === 'BUYER' && conversation.buyerId !== req.user.id
      || (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message with optional file attachments (buyer or admin/staff)
router.post('/:conversationId/send', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(req.params.conversationId) },
      include: { buyer: true }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    // Only allow buyer or admin/staff
    if (
      req.user.role === 'BUYER' && conversation.buyerId !== req.user.id
      || (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        content
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        attachments: true
      }
    });

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      const attachments = [];
      for (const file of req.files) {
        const filePath = saveUploadedFile(file, 'uploads/messages');
        if (filePath) {
          const attachment = await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              fileName: file.originalname,
              filePath: filePath,
              fileType: file.mimetype,
              fileSize: file.size
            }
          });
          attachments.push(attachment);
        }
      }
      message.attachments = attachments;
    }

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Email notification to recipient
    let recipientEmail = null;
    let recipientName = null;
    if (req.user.role === 'BUYER') {
      // Notify admin (for now, just send to a fixed admin email or skip)
      // TODO: Implement actual admin notification logic
    } else {
      // Notify buyer
      recipientEmail = conversation.buyer.email;
      recipientName = conversation.buyer.name;
    }
    if (recipientEmail) {
      try {
        await sendMessageEmail({
          to: recipientEmail,
          toName: recipientName,
          fromName: getAdminDisplayName(req.user),
          message: content
        });
      } catch (e) {
        console.error('Failed to send message email:', e);
      }
    }
    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Archive/unarchive a conversation (buyer or admin/staff)
router.post('/:conversationId/archive', authenticateToken, async (req, res) => {
  try {
    const { archive } = req.body; // true = archive, false = unarchive
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(req.params.conversationId) }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    // Only allow buyer or admin/staff
    if (
      req.user.role === 'BUYER' && conversation.buyerId !== req.user.id
      || (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    let updateData = {};
    if (req.user.role === 'BUYER') {
      updateData.archivedByBuyer = !!archive;
    } else {
      updateData.archivedByAdmin = !!archive;
    }
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: updateData
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Get unread message count for badge
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    let count = 0;
    if (req.user.role === 'BUYER') {
      // Count unread messages in buyer's conversation not sent by them and not archived
      const conversation = await prisma.conversation.findUnique({
        where: { buyerId: req.user.id }
      });
      if (conversation && !conversation.archivedByBuyer) {
        count = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            isRead: false,
            senderId: { not: req.user.id }
          }
        });
      }
    } else if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
      // Count all unread messages from buyers across all conversations not archived by admin
      const conversations = await prisma.conversation.findMany({
        where: { archivedByAdmin: false }
      });
      const conversationIds = conversations.map(c => c.id);
      if (conversationIds.length > 0) {
        count = await prisma.message.count({
          where: {
            conversationId: { in: conversationIds },
            isRead: false,
            sender: { role: 'BUYER' }
          }
        });
      }
    }
    res.json({ unread: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark all messages in a conversation as read (admin/staff)
router.patch('/:conversationId/mark-read', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    // Only mark as read messages not sent by admin/staff and not already read
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        sender: { role: 'BUYER' }
      },
      data: { isRead: true }
    });
    res.json({ markedRead: updated.count });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router; 