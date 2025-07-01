const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireBuyer, requireAdminOrStaff } = require('../middleware/auth');
const { sendScreeningEmail, sendScreeningStatusEmail, sendNewScreeningNotification } = require('../utils/email');
const { saveUploadedFile, deleteFile } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get current user's screening status (for frontend status logic)
router.get('/my-status', authenticateToken, requireBuyer, async (req, res) => {
  console.log('DEBUG /my-status req.user:', req.user);
  console.log('DEBUG /my-status req.session:', req.session);
  try {
    // Always get the most recent non-archived screening
    const screening = await prisma.backgroundScreening.findFirst({
      where: { userId: req.user.id, archived: false },
      orderBy: { createdAt: 'desc' }
    });
    if (!screening) {
      return res.json({ status: 'NOT_SUBMITTED' });
    }
    // If status is explicitly set, return it
    if (screening.status === 'REJECTED') {
      return res.json({
        status: 'REJECTED',
        adminNote: screening.adminNote || '',
        form: {
          experience: screening.experience,
          livingConditions: screening.livingConditions,
          household: screening.household,
          timeCommitment: screening.timeCommitment,
          letter: screening.letter || '',
          interestedBreed: screening.interestedBreed || ''
        }
      });
    }
    // If status is PENDING or APPROVED, return as is
    if (screening.status === 'PENDING' || screening.status === 'APPROVED') {
      return res.json({ status: screening.status });
    }
    // If status is missing or unknown, treat as PENDING (submitted, not yet reviewed)
    return res.json({ status: 'PENDING' });
  } catch (error) {
    console.error('Get my-status error:', error);
    res.status(500).json({ error: 'Failed to get screening status' });
  }
});

// Submit background screening application
router.post('/submit', authenticateToken, requireBuyer, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      experience,
      livingConditions,
      household,
      timeCommitment,
      letter,
      interestedBreed
    } = req.body;

    // Validation
    if (!experience || !livingConditions || !household || !timeCommitment) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Check if user already has a screening application
    const existingScreening = await prisma.backgroundScreening.findUnique({
      where: { userId: req.user.id }
    });

    if (existingScreening) {
      return res.status(400).json({ error: 'You already have a screening application' });
    }

    // Handle file uploads
    let idDocumentPath = null;
    let proofOfResidencePath = null;

    if (req.files.idDocument) {
      idDocumentPath = saveUploadedFile(req.files.idDocument[0], 'uploads/documents');
    }

    if (req.files.proofOfResidence) {
      proofOfResidencePath = saveUploadedFile(req.files.proofOfResidence[0], 'uploads/documents');
    }

    if (!idDocumentPath || !proofOfResidencePath) {
      return res.status(400).json({ error: 'ID document and proof of residence are required' });
    }

    // Create screening application
    const screening = await prisma.backgroundScreening.create({
      data: {
        userId: req.user.id,
        experience,
        livingConditions,
        household,
        timeCommitment,
        idDocument: idDocumentPath,
        proofOfResidence: proofOfResidencePath,
        letter: letter || null,
        interestedBreed: interestedBreed || null,
        status: 'PENDING'
      }
    });

    // Notify admin(s) of new screening
    const adminEmail = process.env.ADMIN_EMAIL;
    const buyer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (adminEmail && buyer) {
      await sendNewScreeningNotification(adminEmail, buyer.name, buyer.email);
    }

    res.status(201).json({
      message: 'Background screening application submitted successfully',
      screening: {
        id: screening.id,
        status: screening.status,
        createdAt: screening.createdAt
      }
    });

  } catch (error) {
    console.error('Screening submission error:', error);
    res.status(500).json({ error: 'Failed to submit screening application' });
  }
});

// Get user's screening application
router.get('/my-application', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const screening = await prisma.backgroundScreening.findUnique({
      where: { userId: req.user.id }
    });

    if (!screening) {
      return res.status(404).json({ error: 'No screening application found' });
    }

    res.json({ screening });

  } catch (error) {
    console.error('Get screening error:', error);
    res.status(500).json({ error: 'Failed to get screening application' });
  }
});

// Update screening application (for rejected applications)
router.put('/update', authenticateToken, requireBuyer, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      experience,
      livingConditions,
      household,
      timeCommitment,
      letter,
      interestedBreed
    } = req.body;

    // Get existing screening
    const existingScreening = await prisma.backgroundScreening.findUnique({
      where: { userId: req.user.id }
    });

    if (!existingScreening) {
      return res.status(404).json({ error: 'No screening application found' });
    }

    if (existingScreening.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only update rejected applications' });
    }

    // Handle file uploads
    let idDocumentPath = existingScreening.idDocument;
    let proofOfResidencePath = existingScreening.proofOfResidence;

    if (req.files.idDocument) {
      // Delete old file
      deleteFile(existingScreening.idDocument);
      idDocumentPath = saveUploadedFile(req.files.idDocument[0], 'uploads/documents');
    }

    if (req.files.proofOfResidence) {
      // Delete old file
      deleteFile(existingScreening.proofOfResidence);
      proofOfResidencePath = saveUploadedFile(req.files.proofOfResidence[0], 'uploads/documents');
    }

    // Update screening
    const updatedScreening = await prisma.backgroundScreening.update({
      where: { userId: req.user.id },
      data: {
        experience,
        livingConditions,
        household,
        timeCommitment,
        idDocument: idDocumentPath,
        proofOfResidence: proofOfResidencePath,
        letter: letter || null,
        interestedBreed: interestedBreed || null,
        status: 'PENDING',
        adminNote: null
      }
    });

    res.json({
      message: 'Screening application updated successfully',
      screening: {
        id: updatedScreening.id,
        status: updatedScreening.status,
        updatedAt: updatedScreening.updatedAt
      }
    });

  } catch (error) {
    console.error('Update screening error:', error);
    res.status(500).json({ error: 'Failed to update screening application' });
  }
});

// Get all screening applications (admin/staff)
router.get('/all', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, archived } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (archived === '1') {
      where.archived = true;
    } else {
      where.archived = false;
    }

    const screenings = await prisma.backgroundScreening.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.backgroundScreening.count({ where });

    res.json({
      screenings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all screenings error:', error);
    res.status(500).json({ error: 'Failed to get screening applications' });
  }
});

// Get specific screening application (admin/staff)
router.get('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const screening = await prisma.backgroundScreening.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    if (!screening) {
      return res.status(404).json({ error: 'Screening application not found' });
    }

    res.json({ screening });

  } catch (error) {
    console.error('Get screening error:', error);
    res.status(500).json({ error: 'Failed to get screening application' });
  }
});

// Approve/reject screening application (admin only)
router.put('/:id/status', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const screening = await prisma.backgroundScreening.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true
      }
    });

    if (!screening) {
      return res.status(404).json({ error: 'Screening application not found' });
    }

    if (status === 'REJECTED') {
      // Send rejection email before deleting
      await sendScreeningStatusEmail(
        screening.user.email,
        screening.user.name,
        status,
        adminNote
      );
      // Delete the screening application
      await prisma.backgroundScreening.delete({
        where: { id: parseInt(req.params.id) }
      });
      return res.json({
        message: 'Screening application rejected and deleted successfully',
        screening: null,
        rejectionReason: adminNote || ''
      });
    }

    // Update screening status to APPROVED
    const updatedScreening = await prisma.backgroundScreening.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        adminNote: adminNote || null
      }
    });

    // Send approval email
    await sendScreeningStatusEmail(
      screening.user.email,
      screening.user.name,
      status,
      adminNote
    );

    res.json({
      message: `Screening application ${status.toLowerCase()} successfully`,
      screening: updatedScreening
    });

  } catch (error) {
    console.error('Update screening status error:', error);
    res.status(500).json({ error: 'Failed to update screening status' });
  }
});

// Get screening statistics (admin/staff)
router.get('/stats/overview', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.backgroundScreening.count({ where: { status: 'PENDING' } }),
      prisma.backgroundScreening.count({ where: { status: 'APPROVED' } }),
      prisma.backgroundScreening.count({ where: { status: 'REJECTED' } })
    ]);

    const total = pending + approved + rejected;

    res.json({
      stats: {
        total,
        pending,
        approved,
        rejected,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get screening stats error:', error);
    res.status(500).json({ error: 'Failed to get screening statistics' });
  }
});

// Archive a screening application (admin only)
router.patch('/:id/archive', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const screening = await prisma.backgroundScreening.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: true }
    });
    res.json({ message: 'Screening archived', screening });
  } catch (error) {
    console.error('Archive screening error:', error);
    res.status(500).json({ error: 'Failed to archive screening' });
  }
});

// Unarchive a screening application (admin only)
router.patch('/:id/unarchive', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const screening = await prisma.backgroundScreening.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: false }
    });
    res.json({ message: 'Screening unarchived', screening });
  } catch (error) {
    console.error('Unarchive screening error:', error);
    res.status(500).json({ error: 'Failed to unarchive screening' });
  }
});

// Reapply: Archive rejected screening so buyer can submit a new one
router.post('/reapply', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const existingScreening = await prisma.backgroundScreening.findFirst({
      where: { userId: req.user.id, status: 'REJECTED', archived: false }
    });
    if (!existingScreening) {
      return res.status(400).json({ error: 'No rejected screening to archive.' });
    }
    await prisma.backgroundScreening.update({
      where: { id: existingScreening.id },
      data: { archived: true }
    });
    res.json({ message: 'Screening archived. You may now submit a new application.', oldScreening: existingScreening, canReapply: true });
  } catch (error) {
    console.error('Reapply screening error:', error);
    res.status(500).json({ error: 'Failed to archive rejected screening.' });
  }
});

module.exports = router; 