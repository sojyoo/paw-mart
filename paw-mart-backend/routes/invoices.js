const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();
const prisma = new PrismaClient();

// Generate invoice for an application
router.post('/generate/:applicationId', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { amount, breakdown } = req.body;

    if (!amount || !breakdown || !Array.isArray(breakdown)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if application exists and is approved
    const application = await prisma.dogApplication.findUnique({
      where: { id: parseInt(applicationId) },
      include: {
        buyer: true,
        dog: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Can only generate invoice for approved applications' });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { applicationId: parseInt(applicationId) }
    });

    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice already exists for this application' });
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        applicationId: parseInt(applicationId),
        amount: parseFloat(amount),
        breakdown: breakdown,
        status: 'PENDING'
      },
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      }
    });

    // Create audit log
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: invoice.id,
        userId: req.user.id,
        action: 'INVOICE_CREATED',
        changes: { amount, breakdown }
      }
    });

    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Get all invoices with filtering
router.get('/', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          application: {
            buyer: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          application: {
            dog: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get single invoice
router.get('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Update invoice
router.patch('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, breakdown, status } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (breakdown !== undefined) updateData.breakdown = breakdown;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'PAID') {
        updateData.paidAt = new Date();
      } else if (status === 'REHOMED') {
        updateData.rehomedAt = new Date();
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      }
    });

    // Create audit log
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: parseInt(id),
        userId: req.user.id,
        action: 'INVOICE_UPDATED',
        changes: updateData
      }
    });

    res.json({ invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Mark invoice as paid
router.patch('/:id/mark-paid', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PAID',
        paidAt: new Date()
      },
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      }
    });

    // Create audit log
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: parseInt(id),
        userId: req.user.id,
        action: 'INVOICE_MARKED_PAID',
        changes: { status: 'PAID', paidAt: new Date() }
      }
    });

    res.json({ invoice });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if invoice exists and is pending
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only delete pending invoices' });
    }

    await prisma.invoice.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Get audit log for invoice
router.get('/:id/audit-log', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await prisma.invoiceAuditLog.findMany({
      where: { invoiceId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// Generate PDF for invoice
router.get('/:id/pdf', authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        application: {
          include: {
            buyer: true,
            dog: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(24).text('PawMart - Invoice', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Invoice #: ${invoice.id}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown();

    doc.fontSize(14).text('Customer Information:');
    doc.fontSize(12).text(`Name: ${invoice.application.buyer.name}`);
    doc.text(`Email: ${invoice.application.buyer.email}`);
    doc.moveDown();

    doc.fontSize(14).text('Dog Information:');
    doc.fontSize(12).text(`Name: ${invoice.application.dog.name}`);
    doc.text(`Breed: ${invoice.application.dog.breed}`);
    doc.moveDown();

    doc.fontSize(14).text('Breakdown:');
    invoice.breakdown.forEach(item => {
      doc.fontSize(12).text(`${item.description}: ₱${item.amount.toLocaleString()}`);
    });
    doc.moveDown();

    doc.fontSize(16).text(`Total Amount: ₱${invoice.amount.toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(10).text('Thank you for choosing PawMart!', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router; 