const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdminOrStaff, requireBuyer } = require('../middleware/auth');
const { sendReceiptEmail, generateReceipt } = require('../utils/email');
const { calculateTotalCost, calculateProfit } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Log a new transaction (admin/staff only)
router.post('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { buyerId, dogId, price, totalCost } = req.body;

    // Validation
    if (!buyerId || !dogId || !price || totalCost === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Check if buyer exists and is approved
    const buyer = await prisma.user.findFirst({
      where: { 
        id: parseInt(buyerId),
        role: 'BUYER',
        isActive: true
      },
      include: {
        backgroundScreening: true
      }
    });

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    if (!buyer.backgroundScreening || buyer.backgroundScreening.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Buyer must be approved to complete transaction' });
    }

    // Check if dog exists and is available
    const dog = await prisma.dog.findFirst({
      where: { 
        id: parseInt(dogId),
        status: { not: 'DELETED' }
      }
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    if (dog.status === 'REHOMED') {
      return res.status(400).json({ error: 'Dog has already been rehomed' });
    }

    // Calculate profit
    const profit = calculateProfit(parseFloat(price), parseFloat(totalCost));

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        buyerId: parseInt(buyerId),
        dogId: parseInt(dogId),
        processedById: req.user.id,
        price: parseFloat(price),
        totalCost: parseFloat(totalCost),
        profit: profit,
        status: 'REHOMED',
        receipt: generateReceipt(
          { id: 0, date: new Date(), price: parseFloat(price) },
          dog,
          buyer,
          req.user
        )
      },
      include: {
        buyer: true,
        dog: true,
        processedBy: true
      }
    });

    // Update dog status to REHOMED
    await prisma.dog.update({
      where: { id: parseInt(dogId) },
      data: { status: 'REHOMED' }
    });

    // Send receipt email to buyer
    await sendReceiptEmail(
      buyer.email,
      buyer.name,
      transaction,
      dog
    );

    res.status(201).json({
      message: 'Transaction logged successfully',
      transaction: {
        id: transaction.id,
        buyer: transaction.buyer.name,
        dog: transaction.dog.name,
        price: transaction.price,
        profit: transaction.profit,
        date: transaction.date
      }
    });

  } catch (error) {
    console.error('Log transaction error:', error);
    res.status(500).json({ error: 'Failed to log transaction' });
  }
});

// Get all transactions (admin/staff only)
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { 
      buyerId, 
      dogId, 
      processedById,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (page - 1) * limit;

    const where = {};

    if (buyerId) where.buyerId = parseInt(buyerId);
    if (dogId) where.dogId = parseInt(dogId);
    if (processedById) where.processedById = parseInt(processedById);

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        dog: {
          select: {
            id: true,
            name: true,
            breed: true
          }
        },
        processedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get specific transaction
router.get('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        dog: {
          select: {
            id: true,
            name: true,
            breed: true,
            type: true,
            temperament: true,
            healthStatus: true
          }
        },
        processedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Get buyer's transactions (buyer only)
router.get('/my-transactions', authenticateToken, requireBuyer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: { buyerId: req.user.id },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            breed: true,
            images: true
          }
        },
        processedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({
      where: { buyerId: req.user.id }
    });

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date,
        price: t.price,
        status: t.status,
        dog: t.dog,
        processedBy: t.processedBy.name
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction receipt
router.get('/:id/receipt', authenticateToken, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        buyer: true,
        dog: true,
        processedBy: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has permission to view this receipt
    if (req.user.role === 'BUYER' && transaction.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      receipt: transaction.receipt,
      transaction: {
        id: transaction.id,
        date: transaction.date,
        price: transaction.price,
        totalCost: transaction.totalCost,
        profit: transaction.profit
      }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

// Get transaction statistics (admin/staff only)
router.get('/stats/overview', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Get date range
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    // Get transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: start,
          lte: now
        }
      }
    });

    // Calculate statistics
    const totalSales = transactions.reduce((sum, t) => sum + t.price, 0);
    const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    const totalTransactions = transactions.length;

    // Get top selling breeds
    const breedStats = await prisma.transaction.groupBy({
      by: ['dogId'],
      where: {
        date: {
          gte: start,
          lte: now
        }
      },
      _count: {
        dogId: true
      },
      _sum: {
        price: true,
        profit: true
      }
    });

    const breedDetails = await Promise.all(
      breedStats.map(async (stat) => {
        const dog = await prisma.dog.findUnique({
          where: { id: stat.dogId },
          select: { breed: true }
        });
        return {
          breed: dog.breed,
          count: stat._count.dogId,
          totalSales: stat._sum.price,
          totalProfit: stat._sum.profit
        };
      })
    );

    const topBreeds = breedDetails
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      stats: {
        period,
        totalSales,
        totalCost,
        totalProfit,
        totalTransactions,
        averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      topBreeds
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to get transaction statistics' });
  }
});

// Get recent transactions (admin/staff only)
router.get('/recent/list', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await prisma.transaction.findMany({
      include: {
        buyer: {
          select: {
            name: true,
            email: true
          }
        },
        dog: {
          select: {
            name: true,
            breed: true
          }
        },
        processedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date,
        price: t.price,
        profit: t.profit,
        buyer: t.buyer.name,
        dog: `${t.dog.name} (${t.dog.breed})`,
        processedBy: t.processedBy.name
      }))
    });

  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to get recent transactions' });
  }
});

module.exports = router; 