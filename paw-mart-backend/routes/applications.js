const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireBuyer, requireAdminOrStaff } = require('../middleware/auth');
const { sendDogApplicationEmail, sendApplicationStatusEmail, sendNewApplicationNotification, sendMessageEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Buyer applies for a dog
router.post('/', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { dogId, message } = req.body;
    if (!dogId || !message) return res.status(400).json({ error: 'Dog and message required' });
    // Check screening
    const screening = await prisma.backgroundScreening.findUnique({ where: { userId: req.user.id } });
    if (!screening || screening.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Screening not approved' });
    }
    // Check dog
    const dog = await prisma.dog.findUnique({ where: { id: dogId } });
    if (!dog || dog.status === 'REHOMED') {
      return res.status(400).json({ error: 'Dog not available' });
    }
    // Only one pending per dog per buyer
    const existing = await prisma.dogApplication.findFirst({
      where: { buyerId: req.user.id, dogId, status: { in: ['PENDING', 'APPROVED'] } }
    });
    if (existing) return res.status(400).json({ error: 'Already applied for this dog' });
    // Create application
    const app = await prisma.dogApplication.create({
      data: {
        buyerId: req.user.id,
        dogId,
        message,
        status: 'PENDING'
      }
    });
    // Notify admin(s) of new application
    const adminEmail = process.env.ADMIN_EMAIL;
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (adminEmail && buyer && dog) {
      await sendNewApplicationNotification(adminEmail, buyer.name, buyer.email, dog.name);
      await sendDogApplicationEmail(buyer.email, buyer.name, dog.name);
    }
    res.status(201).json({ message: 'Application submitted', application: app });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Failed to apply' });
  }
});

// Buyer views their applications
router.get('/my', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const apps = await prisma.dogApplication.findMany({
      where: { buyerId: req.user.id },
      include: { dog: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ applications: apps });
  } catch (error) {
    console.error('My apps error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Buyer withdraws application
router.patch('/:id/withdraw', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason is required' });
    const app = await prisma.dogApplication.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!app || app.buyerId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    if (app.status !== 'PENDING') return res.status(400).json({ error: 'Cannot withdraw' });
    const updated = await prisma.dogApplication.update({
      where: { id: app.id },
      data: { status: 'WITHDRAWN', withdrawNote: reason }
    });
    // Fetch with relations
    const updatedWithDog = await prisma.dogApplication.findUnique({
      where: { id: app.id },
      include: { dog: true }
    });
    // Notify admin by email (optional)
    const adminEmail = process.env.ADMIN_EMAIL;
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const dog = await prisma.dog.findUnique({ where: { id: app.dogId } });
    if (adminEmail && buyer && dog) {
      await sendApplicationStatusEmail(
        adminEmail,
        buyer.name,
        dog.name,
        'WITHDRAWN',
        `Buyer withdrew application. Reason: ${reason}`
      );
    }
    res.json({ message: 'Application withdrawn', application: updatedWithDog });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
});

// Admin views all applications
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, dogId, buyerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (dogId) where.dogId = parseInt(dogId);
    if (buyerId) where.buyerId = parseInt(buyerId);
    const apps = await prisma.dogApplication.findMany({
      where,
      include: { dog: true, buyer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ applications: apps });
  } catch (error) {
    console.error('Admin apps error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin views all applications for a dog
router.get('/dog/:dogId', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const dogId = parseInt(req.params.dogId);
    const apps = await prisma.dogApplication.findMany({
      where: { dogId },
      include: { buyer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ applications: apps });
  } catch (error) {
    console.error('Dog apps error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin approves/rejects application
router.patch('/:id/status', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const app = await prisma.dogApplication.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { dog: true, buyer: true }
    });
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (app.status !== 'PENDING') return res.status(400).json({ error: 'Already processed' });
    
    // If approving, set dog to PENDING and reject others
    if (status === 'APPROVED') {
      await prisma.dog.update({ where: { id: app.dogId }, data: { status: 'PENDING' } });
      // Find all other pending applications for this dog
      const otherPending = await prisma.dogApplication.findMany({
        where: { dogId: app.dogId, status: 'PENDING', id: { not: app.id } },
        include: { buyer: true, dog: true }
      });
      // Reject all other pending applications
      await prisma.dogApplication.updateMany({
        where: { dogId: app.dogId, status: 'PENDING', id: { not: app.id } },
        data: { status: 'REJECTED', adminNote: 'Another applicant was approved.' }
      });
      // Notify all affected buyers
      for (const otherApp of otherPending) {
        await sendApplicationStatusEmail(
          otherApp.buyer.email,
          otherApp.buyer.name,
          otherApp.dog.name,
          'REJECTED',
          'Another applicant was approved.'
        );
      }
    }
    
    const updated = await prisma.dogApplication.update({
      where: { id: app.id },
      data: { status, adminNote: adminNote || null }
    });
    
    // Notify buyer via email
    await sendApplicationStatusEmail(
      app.buyer.email,
      app.buyer.name,
      app.dog.name,
      status,
      adminNote
    );

    // If approved, send automatic chat message
    if (status === 'APPROVED') {
      try {
        // Get or create conversation for the buyer
        let conversation = await prisma.conversation.findUnique({
          where: { buyerId: app.buyerId }
        });
        
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { buyerId: app.buyerId }
          });
        }

        // Create congratulatory message
        const congratulatoryMessage = `🎉 Congratulations! Your application for ${app.dog.name} has been approved!

Next Steps:
1. We'll be in touch via this chat to discuss the adoption process
2. You'll receive an invoice with the adoption fee breakdown
3. We'll provide vaccination records and health information
4. Once payment is confirmed, we'll arrange for you to meet your new furry friend

Please check this chat regularly for updates and feel free to ask any questions!`;

        // Send the message as the admin
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: req.user.id, // This will show as "PawMart" due to our display logic
            content: congratulatoryMessage
          }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        });

        // Send email notification about the new message
        await sendMessageEmail({
          to: app.buyer.email,
          toName: app.buyer.name,
          fromName: 'PawMart',
          message: 'You have a new message about your approved application!'
        });

      } catch (chatError) {
        console.error('Failed to send automatic chat message:', chatError);
        // Don't fail the approval if chat message fails
      }
    }
    
    res.json({ message: 'Application updated', application: updated });
  } catch (error) {
    console.error('App status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

module.exports = router; 