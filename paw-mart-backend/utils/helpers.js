const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Create session
const createSession = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  return await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
};

// Invalidate all sessions for a user (single session per account)
const invalidateUserSessions = async (userId) => {
  await prisma.session.deleteMany({
    where: { userId }
  });
};

// Save uploaded file
const saveUploadedFile = (file, folder = 'uploads') => {
  if (!file) return null;
  
  const uploadDir = path.join(__dirname, '..', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, file.buffer);
  return `${folder}/${fileName}`;
};

// Delete file
const deleteFile = (filePath) => {
  if (!filePath) return;
  
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Calculate total cost for a dog
const calculateTotalCost = (dog) => {
  return (
    dog.costFood +
    dog.costVitamins +
    dog.costVet +
    dog.costVaccine +
    dog.costGrooming +
    dog.costAccessories
  );
};

// Calculate profit
const calculateProfit = (price, totalCost) => {
  return price - totalCost;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  // At least one uppercase, one lowercase, one number, and 6+ chars
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return regex.test(password);
};

// Generate receipt content
const generateReceipt = (transaction, dog, buyer, processedBy) => {
  const totalCost = calculateTotalCost(dog);
  const profit = calculateProfit(transaction.price, totalCost);
  
  return `
    🐾 PawMart - Transaction Receipt
    
    Transaction ID: #${transaction.id}
    Date: ${new Date(transaction.date).toLocaleDateString()}
    Time: ${new Date(transaction.date).toLocaleTimeString()}
    
    Dog Details:
    - Name: ${dog.name}
    - Breed: ${dog.breed}
    - Type: ${dog.type}
    
    Buyer: ${buyer.name} (${buyer.email})
    Processed By: ${processedBy.name}
    
    Financial Summary:
    - Price Paid: ${formatCurrency(transaction.price)}
    - Total Cost: ${formatCurrency(totalCost)}
    - Profit: ${formatCurrency(profit)}
    
    Cost Breakdown:
    - Food: ${formatCurrency(dog.costFood)}
    - Vitamins: ${formatCurrency(dog.costVitamins)}
    - Vet: ${formatCurrency(dog.costVet)}
    - Vaccine: ${formatCurrency(dog.costVaccine)}
    - Grooming: ${formatCurrency(dog.costGrooming)}
    - Accessories: ${formatCurrency(dog.costAccessories)}
    
    Thank you for choosing PawMart!
  `;
};

// Get date range for reports
const getDateRange = (period = 'month') => {
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
  
  return { start, end: now };
};

// Convert to CSV format
const convertToCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  generateOTP,
  hashPassword,
  comparePassword,
  generateToken,
  createSession,
  invalidateUserSessions,
  saveUploadedFile,
  deleteFile,
  calculateTotalCost,
  calculateProfit,
  formatCurrency,
  isValidEmail,
  isValidPassword,
  generateReceipt,
  getDateRange,
  convertToCSV
}; 