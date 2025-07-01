// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dogRoutes = require('./routes/dogs');
const transactionRoutes = require('./routes/transactions');
const screeningRoutes = require('./routes/screening');
const contactRoutes = require('./routes/contact');
const dashboardRoutes = require('./routes/dashboard');
const applicationsRoutes = require('./routes/applications');
const favoritesRoutes = require('./routes/favorites');
const messagesRoutes = require('./routes/messages');
const financeRoutes = require('./routes/finance');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/invoices', invoiceRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'PawMart backend is running!', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - use a proper catch-all pattern
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 PawMart backend running on http://localhost:${PORT}`);
  console.log(`📊 Database connected successfully`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;