const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/email');
const {
  generateOTP,
  hashPassword,
  comparePassword,
  generateToken,
  createSession,
  invalidateUserSessions,
  isValidEmail,
  isValidPassword
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint hit', req.body); // Debug log
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      console.log('Validation failed');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!isValidEmail(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters and include one uppercase letter, one lowercase letter, and one number.' });
    }

    const emailClean = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean }
    });
    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed');

    // Create user (only BUYER role allowed for public registration)
    const user = await prisma.user.create({
      data: {
        email: emailClean,
        password: hashedPassword,
        name,
        role: 'BUYER', // Force BUYER role for public registration
        isActive: true // Set to true so all new users are active by default
      }
    });
    console.log('User created', user.id);

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // 5 minutes

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: otpExpiry
      }
    });
    console.log('OTP created');

    // Send OTP email
    await sendOTPEmail(email, otp, 'verification');
    console.log('OTP email sent');

    res.status(201).json({
      message: 'User registered successfully. Please check your email for OTP verification.',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: emailClean } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Generate token and create session
    const token = generateToken(user.id);
    await invalidateUserSessions(user.id); // Single session per account
    await createSession(user.id, token);

    res.json({
      message: 'OTP verified successfully',
      token,
      userId: user.id
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailClean }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and send OTP for login
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // 5 minutes

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: otpExpiry
      }
    });

    // Send OTP email
    await sendOTPEmail(email, otp, 'login');

    res.json({
      message: 'Login OTP sent to your email'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify login OTP
router.post('/verify-login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: emailClean } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Generate token and create session
    const token = generateToken(user.id);
    await invalidateUserSessions(user.id); // Single session per account
    await createSession(user.id, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login verification error:', error);
    res.status(500).json({ error: 'Login verification failed' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId, purpose = 'verification' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete existing unused OTPs
    await prisma.oTP.deleteMany({
      where: {
        userId: parseInt(userId),
        used: false
      }
    });

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // 5 minutes

    await prisma.oTP.create({
      data: {
        userId: parseInt(userId),
        code: otp,
        expiresAt: otpExpiry
      }
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, purpose);

    res.json({
      message: 'OTP resent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Delete current session
    await prisma.session.delete({
      where: { id: req.session.id }
    });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        backgroundScreening: {
          select: {
            status: true
          }
        }
      }
    });

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Admin Login (only for ADMIN users)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailClean }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and send OTP for admin login
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // 5 minutes

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: otpExpiry
      }
    });

    // Send OTP email
    await sendOTPEmail(email, otp, 'admin-login');

    res.json({
      message: 'Admin login OTP sent to your email'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Verify Admin Login OTP
router.post('/admin-verify-login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: emailClean } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Generate token and create session
    const token = generateToken(user.id);
    await invalidateUserSessions(user.id); // Single session per account
    await createSession(user.id, token);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin login verification error:', error);
    res.status(500).json({ error: 'Admin login verification failed' });
  }
});

// Development endpoint: Admin login without OTP (ONLY FOR DEVELOPMENT)
router.post('/admin-login-dev', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailClean = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailClean }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token and create session (skip OTP)
    const token = generateToken(user.id);
    await invalidateUserSessions(user.id); // Single session per account
    await createSession(user.id, token);

    res.json({
      message: 'Admin login successful (OTP bypassed)',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin dev login error:', error);
    res.status(500).json({ error: 'Admin dev login failed' });
  }
});

module.exports = router; 