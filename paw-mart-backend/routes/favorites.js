const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireBuyer } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Add a dog to favorites
router.post('/', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { dogId } = req.body;
    if (!dogId) return res.status(400).json({ error: 'dogId required' });
    // Prevent duplicate
    const existing = await prisma.favoriteDog.findUnique({
      where: { userId_dogId: { userId: req.user.id, dogId } }
    });
    if (existing) return res.status(400).json({ error: 'Already favorited' });
    const fav = await prisma.favoriteDog.create({
      data: { userId: req.user.id, dogId }
    });
    res.status(201).json({ message: 'Added to favorites', favorite: fav });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove a dog from favorites
router.delete('/:dogId', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const dogId = parseInt(req.params.dogId);
    await prisma.favoriteDog.deleteMany({ where: { userId: req.user.id, dogId } });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Get all favorite dogs for the logged-in buyer
router.get('/my', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const favorites = await prisma.favoriteDog.findMany({
      where: { userId: req.user.id },
      include: { dog: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

module.exports = router; 