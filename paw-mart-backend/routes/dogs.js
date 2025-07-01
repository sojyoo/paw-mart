const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin, requireBuyer } = require('../middleware/auth');
const { saveUploadedFile, deleteFile, calculateTotalCost } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
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

// Configure multer for document uploads
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG allowed'), false);
  }
});

// Get all dogs (public - no auth required for browsing)
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'AVAILABLE', 
      breed, 
      type, 
      temperament,
      gender,
      size,
      minAge,
      maxAge,
      page = 1, 
      limit = 12 
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Support multiple statuses (comma-separated)
    const statusList = status ? status.split(',') : ['AVAILABLE'];
    const where = {
      status: { in: statusList, not: 'DELETED' }
    };

    if (breed) where.breed = breed;
    if (type) where.type = type;
    if (temperament) where.temperament = temperament;
    if (gender) where.gender = gender;
    if (size) where.size = size;
    if (minAge) where.age = { ...where.age, gte: parseInt(minAge) };
    if (maxAge) where.age = { ...where.age, lte: parseInt(maxAge) };

    const dogs = await prisma.dog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.dog.count({ where });

    res.json({
      dogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get dogs error:', error);
    res.status(500).json({ error: 'Failed to get dogs' });
  }
});

// Get specific dog
router.get('/:id', async (req, res) => {
  try {
    const dog = await prisma.dog.findFirst({
      where: { 
        id: parseInt(req.params.id),
        status: { not: 'DELETED' }
      }
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Calculate total cost
    const totalCost = calculateTotalCost(dog);

    res.json({ 
      dog: {
        ...dog,
        totalCost
      }
    });

  } catch (error) {
    console.error('Get dog error:', error);
    res.status(500).json({ error: 'Failed to get dog' });
  }
});

// Add new dog (admin only)
router.post('/', authenticateToken, requireAdmin, upload.array('images', 3), async (req, res) => {
  try {
    const {
      name,
      breed,
      type,
      birthDate,
      temperament,
      healthStatus,
      price,
      costFood,
      costVitamins,
      costVet,
      costVaccine,
      costGrooming,
      costAccessories,
      gender = 'UNKNOWN',
      size = 'UNKNOWN',
      age
    } = req.body;

    // Validation
    if (!name || !breed || !type || !temperament || !healthStatus || !price) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    if (parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }
    if (!['MALE', 'FEMALE', 'UNKNOWN'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender' });
    }
    if (!['SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN'].includes(size)) {
      return res.status(400).json({ error: 'Invalid size' });
    }
    if (age && (isNaN(parseInt(age)) || parseInt(age) < 0)) {
      return res.status(400).json({ error: 'Invalid age' });
    }

    // Handle image uploads
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 images allowed' });
      }
      for (const file of req.files) {
        const imagePath = saveUploadedFile(file, 'uploads/dogs');
        if (imagePath) {
          imagePaths.push(imagePath);
        }
      }
    }

    // Create dog
    const dog = await prisma.dog.create({
      data: {
        name,
        breed,
        type,
        birthDate: birthDate ? new Date(birthDate) : null,
        temperament,
        healthStatus,
        images: imagePaths,
        price: parseFloat(price),
        costFood: parseFloat(costFood) || 0,
        costVitamins: parseFloat(costVitamins) || 0,
        costVet: parseFloat(costVet) || 0,
        costVaccine: parseFloat(costVaccine) || 0,
        costGrooming: parseFloat(costGrooming) || 0,
        costAccessories: parseFloat(costAccessories) || 0,
        status: 'AVAILABLE',
        gender,
        size,
        age: age ? parseInt(age) : null
      }
    });

    res.status(201).json({
      message: 'Dog added successfully',
      dog
    });

  } catch (error) {
    console.error('Add dog error:', error);
    res.status(500).json({ error: 'Failed to add dog' });
  }
});

// Update dog (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.array('images', 3), async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    const {
      name,
      breed,
      type,
      birthDate,
      temperament,
      healthStatus,
      price,
      costFood,
      costVitamins,
      costVet,
      costVaccine,
      costGrooming,
      costAccessories,
      status,
      gender = 'UNKNOWN',
      size = 'UNKNOWN',
      age
    } = req.body;

    // Check if dog exists
    const existingDog = await prisma.dog.findFirst({
      where: { 
        id: dogId,
        status: { not: 'DELETED' }
      }
    });

    if (!existingDog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Validate new fields
    if (!['MALE', 'FEMALE', 'UNKNOWN'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender' });
    }
    if (!['SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN'].includes(size)) {
      return res.status(400).json({ error: 'Invalid size' });
    }
    if (age && (isNaN(parseInt(age)) || parseInt(age) < 0)) {
      return res.status(400).json({ error: 'Invalid age' });
    }

    // Handle image uploads
    let imagePaths = existingDog.images;
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 images allowed' });
      }
      // Delete old images
      existingDog.images.forEach(imagePath => {
        deleteFile(imagePath);
      });

      // Save new images
      imagePaths = [];
      for (const file of req.files) {
        const imagePath = saveUploadedFile(file, 'uploads/dogs');
        if (imagePath) {
          imagePaths.push(imagePath);
        }
      }
    }

    // Update dog
    const updatedDog = await prisma.dog.update({
      where: { id: dogId },
      data: {
        name,
        breed,
        type,
        birthDate: birthDate ? new Date(birthDate) : existingDog.birthDate,
        temperament,
        healthStatus,
        images: imagePaths,
        price: price ? parseFloat(price) : existingDog.price,
        costFood: costFood ? parseFloat(costFood) : existingDog.costFood,
        costVitamins: costVitamins ? parseFloat(costVitamins) : existingDog.costVitamins,
        costVet: costVet ? parseFloat(costVet) : existingDog.costVet,
        costVaccine: costVaccine ? parseFloat(costVaccine) : existingDog.costVaccine,
        costGrooming: costGrooming ? parseFloat(costGrooming) : existingDog.costGrooming,
        costAccessories: costAccessories ? parseFloat(costAccessories) : existingDog.costAccessories,
        status: status || existingDog.status,
        gender,
        size,
        age: age ? parseInt(age) : existingDog.age
      }
    });

    res.json({
      message: 'Dog updated successfully',
      dog: updatedDog
    });

  } catch (error) {
    console.error('Update dog error:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});

// Soft delete dog (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);

    const dog = await prisma.dog.findFirst({
      where: { 
        id: dogId,
        status: { not: 'DELETED' }
      }
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Check if dog has any transactions
    const hasTransactions = await prisma.transaction.findFirst({
      where: { dogId }
    });

    if (hasTransactions) {
      return res.status(400).json({ error: 'Cannot delete dog with existing transactions' });
    }

    // Soft delete
    await prisma.dog.update({
      where: { id: dogId },
      data: { status: 'DELETED' }
    });

    res.json({ message: 'Dog deleted successfully' });

  } catch (error) {
    console.error('Delete dog error:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// Update dog status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const dogId = parseInt(req.params.id);

    if (!['AVAILABLE', 'PENDING', 'REHOMED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const dog = await prisma.dog.findFirst({
      where: { 
        id: dogId,
        status: { not: 'DELETED' }
      }
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const updatedDog = await prisma.dog.update({
      where: { id: dogId },
      data: { status }
    });

    res.json({
      message: `Dog status updated to ${status}`,
      dog: updatedDog
    });

  } catch (error) {
    console.error('Update dog status error:', error);
    res.status(500).json({ error: 'Failed to update dog status' });
  }
});

// Get available breeds
router.get('/breeds/available', async (req, res) => {
  try {
    const breeds = await prisma.dog.findMany({
      where: {
        status: { not: 'DELETED' }
      },
      select: {
        breed: true
      },
      distinct: ['breed']
    });

    const breedList = breeds.map(b => b.breed).sort();

    res.json({ breeds: breedList });

  } catch (error) {
    console.error('Get breeds error:', error);
    res.status(500).json({ error: 'Failed to get breeds' });
  }
});

// Get available types
router.get('/types/available', async (req, res) => {
  try {
    const types = await prisma.dog.findMany({
      where: {
        status: { not: 'DELETED' }
      },
      select: {
        type: true
      },
      distinct: ['type']
    });

    const typeList = types.map(t => t.type).sort();

    res.json({ types: typeList });

  } catch (error) {
    console.error('Get types error:', error);
    res.status(500).json({ error: 'Failed to get types' });
  }
});

// Get dog statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [available, pending, rehomed] = await Promise.all([
      prisma.dog.count({ where: { status: 'AVAILABLE' } }),
      prisma.dog.count({ where: { status: 'PENDING' } }),
      prisma.dog.count({ where: { status: 'REHOMED' } })
    ]);

    const total = available + pending + rehomed;

    // Get top breeds
    const topBreeds = await prisma.dog.groupBy({
      by: ['breed'],
      where: {
        status: { not: 'DELETED' }
      },
      _count: {
        breed: true
      },
      orderBy: {
        _count: {
          breed: 'desc'
        }
      },
      take: 5
    });

    res.json({
      stats: {
        total,
        available,
        pending,
        rehomed
      },
      topBreeds: topBreeds.map(b => ({
        breed: b.breed,
        count: b._count.breed
      }))
    });

  } catch (error) {
    console.error('Get dog stats error:', error);
    res.status(500).json({ error: 'Failed to get dog statistics' });
  }
});

// Upload document for a dog (admin only)
router.post('/:id/documents', authenticateToken, requireAdmin, docUpload.single('file'), async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = saveUploadedFile(req.file, 'uploads/documents');
    if (!filePath) return res.status(500).json({ error: 'Failed to save file' });
    const doc = await prisma.dogDocument.create({
      data: {
        dogId,
        fileName: req.file.originalname,
        filePath,
        fileType: req.file.mimetype,
        uploadedById: req.user.id,
        description: req.body.description || null
      }
    });
    res.status(201).json({ document: doc });
  } catch (error) {
    console.error('Upload dog document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// List documents for a dog (admin or buyer if adopted)
router.get('/:id/documents', authenticateToken, async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    // Only allow buyer if they adopted this dog
    if (req.user.role === 'BUYER') {
      const adopted = await prisma.dogApplication.findFirst({ where: { dogId, buyerId: req.user.id, status: 'APPROVED' } });
      if (!adopted) return res.status(403).json({ error: 'Not authorized' });
    }
    const docs = await prisma.dogDocument.findMany({ where: { dogId }, orderBy: { createdAt: 'desc' } });
    res.json({ documents: docs });
  } catch (error) {
    console.error('List dog documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Download a document (admin or buyer if adopted)
router.get('/:dogId/documents/:docId/download', authenticateToken, async (req, res) => {
  try {
    const dogId = parseInt(req.params.dogId);
    const docId = parseInt(req.params.docId);
    if (req.user.role === 'BUYER') {
      const adopted = await prisma.dogApplication.findFirst({ where: { dogId, buyerId: req.user.id, status: 'APPROVED' } });
      if (!adopted) return res.status(403).json({ error: 'Not authorized' });
    }
    const doc = await prisma.dogDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.dogId !== dogId) return res.status(404).json({ error: 'Document not found' });
    const absPath = path.join(__dirname, '../..', doc.filePath);
    res.download(absPath, doc.fileName);
  } catch (error) {
    console.error('Download dog document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete a document (admin only)
router.delete('/:dogId/documents/:docId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const docId = parseInt(req.params.docId);
    const doc = await prisma.dogDocument.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await prisma.dogDocument.delete({ where: { id: docId } });
    // Delete file from disk
    const absPath = path.join(__dirname, '../..', doc.filePath);
    fs.unlink(absPath, () => {});
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete dog document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router; 