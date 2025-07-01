const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('DEBUG: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        token: token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!session) {
      console.log('DEBUG: Invalid or expired session');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = session.user;
    req.session = session;
    console.log('DEBUG: Authenticated user:', req.user);
    next();
  } catch (error) {
    console.log('DEBUG: Invalid token', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('DEBUG: No user on request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('DEBUG: Insufficient permissions. User role:', req.user.role, 'Required:', roles);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Check if user is admin or staff
const requireAdminOrStaff = requireRole(['ADMIN', 'STAFF']);

// Check if user is admin only
const requireAdmin = requireRole(['ADMIN']);

// Check if user is buyer only
const requireBuyer = requireRole(['BUYER']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdminOrStaff,
  requireAdmin,
  requireBuyer
}; 