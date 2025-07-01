const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get main dashboard overview (admin/staff only)
router.get('/overview', authenticateToken, requireAdminOrStaff, async (req, res) => {
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

    // Get all statistics
    const [
      totalUsers,
      totalDogs,
      totalTransactions,
      pendingScreenings,
      unreadMessages,
      recentTransactions,
      dogStats,
      screeningStats,
      messageStats
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { role: 'BUYER' } }),
      
      // Total dogs
      prisma.dog.count({ where: { status: { not: 'DELETED' } } }),
      
      // Total transactions in period
      prisma.transaction.count({
        where: {
          date: { gte: start, lte: now }
        }
      }),
      
      // Pending screenings
      prisma.backgroundScreening.count({ where: { status: 'PENDING' } }),
      
      // Unread messages
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      
      // Recent transactions
      prisma.transaction.findMany({
        where: {
          date: { gte: start, lte: now }
        },
        include: {
          buyer: { select: { name: true } },
          dog: { select: { name: true, breed: true } },
          processedBy: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        take: 5
      }),
      
      // Dog statistics
      prisma.dog.groupBy({
        by: ['status'],
        where: { status: { not: 'DELETED' } },
        _count: { status: true }
      }),
      
      // Screening statistics
      prisma.backgroundScreening.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Message statistics
      prisma.contactMessage.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // Calculate financial statistics
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: now }
      },
      select: {
        price: true,
        totalCost: true,
        profit: true
      }
    });

    const totalSales = transactions.reduce((sum, t) => sum + t.price, 0);
    const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);

    // Format dog stats
    const dogStatusStats = {};
    dogStats.forEach(stat => {
      dogStatusStats[stat.status] = stat._count.status;
    });

    // Format screening stats
    const screeningStatusStats = {};
    screeningStats.forEach(stat => {
      screeningStatusStats[stat.status] = stat._count.status;
    });

    // Format message stats
    const messageStatusStats = {};
    messageStats.forEach(stat => {
      messageStatusStats[stat.status] = stat._count.status;
    });

    res.json({
      period,
      overview: {
        totalUsers,
        totalDogs,
        totalTransactions,
        pendingScreenings,
        unreadMessages,
        totalSales,
        totalCost,
        totalProfit,
        averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      dogStats: dogStatusStats,
      screeningStats: screeningStatusStats,
      messageStats: messageStatusStats,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        date: t.date,
        price: t.price,
        buyer: t.buyer.name,
        dog: `${t.dog.name} (${t.dog.breed})`,
        processedBy: t.processedBy.name
      }))
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to get dashboard overview' });
  }
});

// Get sales analytics (admin/staff only)
router.get('/sales-analytics', authenticateToken, requireAdminOrStaff, async (req, res) => {
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

    // Get transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: now }
      },
      include: {
        dog: {
          select: {
            breed: true,
            type: true
          }
        },
        processedBy: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate sales by breed
    const salesByBreed = {};
    transactions.forEach(t => {
      const breed = t.dog.breed;
      if (!salesByBreed[breed]) {
        salesByBreed[breed] = {
          count: 0,
          totalSales: 0,
          totalProfit: 0
        };
      }
      salesByBreed[breed].count++;
      salesByBreed[breed].totalSales += t.price;
      salesByBreed[breed].totalProfit += t.profit;
    });

    // Calculate sales by staff
    const salesByStaff = {};
    transactions.forEach(t => {
      const staff = t.processedBy.name;
      if (!salesByStaff[staff]) {
        salesByStaff[staff] = {
          count: 0,
          totalSales: 0,
          totalProfit: 0
        };
      }
      salesByStaff[staff].count++;
      salesByStaff[staff].totalSales += t.price;
      salesByStaff[staff].totalProfit += t.profit;
    });

    // Calculate daily sales
    const dailySales = {};
    transactions.forEach(t => {
      const date = t.date.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = {
          sales: 0,
          count: 0
        };
      }
      dailySales[date].sales += t.price;
      dailySales[date].count++;
    });

    res.json({
      period,
      salesByBreed: Object.entries(salesByBreed).map(([breed, data]) => ({
        breed,
        ...data
      })),
      salesByStaff: Object.entries(salesByStaff).map(([staff, data]) => ({
        staff,
        ...data
      })),
      dailySales: Object.entries(dailySales).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => new Date(a.date) - new Date(b.date))
    });

  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Failed to get sales analytics' });
  }
});

// Get user analytics (admin/staff only)
router.get('/user-analytics', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    // Get user statistics
    const [totalBuyers, approvedBuyers, pendingBuyers, rejectedBuyers] = await Promise.all([
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.backgroundScreening.count({ where: { status: 'APPROVED' } }),
      prisma.backgroundScreening.count({ where: { status: 'PENDING' } }),
      prisma.backgroundScreening.count({ where: { status: 'REJECTED' } })
    ]);

    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      include: {
        backgroundScreening: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrations = await prisma.user.findMany({
      where: {
        role: 'BUYER',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true }
    });

    const registrationTrend = {};
    registrations.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      registrationTrend[date] = (registrationTrend[date] || 0) + 1;
    });

    res.json({
      stats: {
        totalBuyers,
        approvedBuyers,
        pendingBuyers,
        rejectedBuyers,
        approvalRate: totalBuyers > 0 ? ((approvedBuyers / totalBuyers) * 100).toFixed(1) : 0
      },
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        screeningStatus: user.backgroundScreening?.status || 'NOT_SUBMITTED'
      })),
      registrationTrend: Object.entries(registrationTrend).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => new Date(a.date) - new Date(b.date))
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// Get quick actions data (admin/staff only)
router.get('/quick-actions', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const [
      pendingScreenings,
      unreadMessages,
      availableDogs,
      recentTransactions
    ] = await Promise.all([
      // Pending screenings
      prisma.backgroundScreening.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 5
      }),
      
      // Unread messages
      prisma.contactMessage.findMany({
        where: { status: 'UNREAD' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Available dogs
      prisma.dog.findMany({
        where: { status: 'AVAILABLE' },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent transactions
      prisma.transaction.findMany({
        include: {
          buyer: { select: { name: true } },
          dog: { select: { name: true, breed: true } }
        },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    res.json({
      pendingScreenings: pendingScreenings.map(s => ({
        id: s.id,
        userName: s.user.name,
        userEmail: s.user.email,
        createdAt: s.createdAt
      })),
      unreadMessages: unreadMessages.map(m => ({
        id: m.id,
        subject: m.subject,
        userName: m.user.name,
        userEmail: m.user.email,
        createdAt: m.createdAt
      })),
      availableDogs: availableDogs.map(d => ({
        id: d.id,
        name: d.name,
        breed: d.breed,
        price: d.price
      })),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        buyer: t.buyer.name,
        dog: `${t.dog.name} (${t.dog.breed})`,
        price: t.price,
        date: t.date
      }))
    });

  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({ error: 'Failed to get quick actions data' });
  }
});

module.exports = router; 