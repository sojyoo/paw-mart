const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin, requireAdminOrStaff } = require('../middleware/auth');
const { hashPassword, comparePassword } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin/staff only)
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (status !== undefined) where.isActive = status === 'active';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        backgroundScreening: {
          select: {
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get specific user (admin/staff only)
router.get('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        backgroundScreening: true,
        transactions: {
          include: {
            dog: {
              select: {
                name: true,
                breed: true
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    res.json({ user: userData });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create staff/admin account (admin only)
router.post('/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role = 'STAFF' } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['ADMIN', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      user
    });

  } catch (error) {
    console.error('Create staff account error:', error);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        role: role || existingUser.role,
        isActive: isActive !== undefined ? isActive : existingUser.isActive
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change user password (admin only)
router.patch('/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = parseInt(req.params.id);

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Deactivate/activate user (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating the last admin
    if (!isActive && existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last admin' });
      }
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalStaff,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      approvedBuyers,
      pendingBuyers,
      rejectedBuyers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.backgroundScreening.count({ where: { status: 'APPROVED' } }),
      prisma.backgroundScreening.count({ where: { status: 'PENDING' } }),
      prisma.backgroundScreening.count({ where: { status: 'REJECTED' } })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalBuyers,
        totalStaff,
        totalAdmins,
        activeUsers,
        inactiveUsers,
        approvedBuyers,
        pendingBuyers,
        rejectedBuyers,
        approvalRate: totalBuyers > 0 ? ((approvedBuyers / totalBuyers) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Get recent user registrations (admin/staff only)
router.get('/recent/registrations', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentUsers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      include: {
        backgroundScreening: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      users: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        screeningStatus: user.backgroundScreening?.status || 'NOT_SUBMITTED'
      }))
    });

  } catch (error) {
    console.error('Get recent registrations error:', error);
    res.status(500).json({ error: 'Failed to get recent registrations' });
  }
});

// Search users (admin/staff only)
router.get('/search', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (role) where.role = role;
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        backgroundScreening: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Delete (reject) a user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    // Check if user exists and is a buyer
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'BUYER') {
      return res.status(400).json({ error: 'Only buyers can be rejected/deleted via this endpoint' });
    }
    // Delete user (cascades to OTP, sessions, etc. if set in schema)
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Buyer rejected and deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 