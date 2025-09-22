const nodemailer = require('nodemailer');

// Configure nodemailer (replace with real SMTP in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

// Helper to get the sender email (no personal fallback)
const SENDER_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com';

// Send OTP email
async function sendOTPEmail(to, otp, type = 'verification') {
  let subject = type === 'login' ? 'PawMart Login OTP' : 'PawMart Verification OTP';
  let text = `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    text,
  });
}

// Send screening approval/rejection email
const sendScreeningEmail = async (email, name, status, adminNote = '') => {
  try {
    const subject = status === 'APPROVED' ? 'PawMart - Application Approved!' : 'PawMart - Application Update';
    const statusText = status === 'APPROVED' ? 'approved' : 'requires additional review';
    const color = status === 'APPROVED' ? '#4CAF50' : '#FF9800';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">🐾 PawMart</h2>
        <h3>${subject}</h3>
        <p>Dear ${name},</p>
        <p>Your background screening application has been <strong style="color: ${color};">${statusText}</strong>.</p>
        ${adminNote ? `<p><strong>Admin Note:</strong> ${adminNote}</p>` : ''}
        ${status === 'APPROVED' ? 
          '<p>You can now browse and apply for dogs on our platform!</p>' : 
          '<p>You may resubmit your application with additional information.</p>'
        }
        <p>Thank you for your interest in PawMart!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from PawMart. Please do not reply to this email.
        </p>
      </div>
    `;

    const msg = {
      to: email,
      from: SENDER_EMAIL,
      subject,
      html,
    };

    await transporter.sendMail(msg);
    return true;
  } catch (error) {
    console.error('nodemailer error:', error);
    return false;
  }
};

// Send transaction receipt email
const sendReceiptEmail = async (email, name, transaction, dog) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">🐾 PawMart - Transaction Receipt</h2>
        <h3>Thank you for your purchase!</h3>
        <p>Dear ${name},</p>
        <p>Your transaction has been completed successfully.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4>Transaction Details:</h4>
          <p><strong>Transaction ID:</strong> #${transaction.id}</p>
          <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
          <p><strong>Dog:</strong> ${dog.name} (${dog.breed})</p>
          <p><strong>Price Paid:</strong> $${transaction.price.toFixed(2)}</p>
          <p><strong>Processed By:</strong> ${transaction.processedBy.name}</p>
        </div>
        
        <p>Thank you for choosing PawMart for your new companion!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from PawMart. Please do not reply to this email.
        </p>
      </div>
    `;

    const msg = {
      to: email,
      from: SENDER_EMAIL,
      subject: 'PawMart - Transaction Receipt',
      html,
    };

    await transporter.sendMail(msg);
    return true;
  } catch (error) {
    console.error('nodemailer error:', error);
    return false;
  }
};

// Send screening status email to buyer
async function sendScreeningStatusEmail(to, name, status, adminNote) {
  let subject = 'PawMart Screening Application Update';
  let text = `Hi ${name},\n\nYour screening application status: ${status}.`;
  if (status === 'APPROVED') {
    text += '\n\nCongratulations! You are now eligible to rehome a pet.';
  } else if (status === 'REJECTED') {
    text += '\n\nUnfortunately, your application was rejected.';
    if (adminNote) text += `\nReason: ${adminNote}`;
  }
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    text,
  });
}

// Notify admin of new screening
async function sendNewScreeningNotification(adminEmail, buyerName, buyerEmail) {
  const submittedAt = new Date().toLocaleString();
  const dashboardLink = 'https://your-admin-dashboard-url.com'; // TODO: Replace with real link if available
  const subject = 'New Screening Application Submitted';
  const text = `A new screening application has been submitted on PawMart.\n\nBuyer Name: ${buyerName}\nBuyer Email: ${buyerEmail}\nSubmitted At: ${submittedAt}\n\nPlease review the application in the admin dashboard: ${dashboardLink}\n\nThank you,\nPawMart Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">🐾 PawMart - New Screening Application</h2>
      <p>A new screening application has been submitted.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Buyer Name:</strong> ${buyerName}</p>
        <p><strong>Buyer Email:</strong> <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
        <p><strong>Submitted At:</strong> ${submittedAt}</p>
      </div>
      <p>Please review the application in the <a href="${dashboardLink}">admin dashboard</a>.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated message from PawMart. Please do not reply to this email.
      </p>
    </div>
  `;
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to: adminEmail,
    subject,
    text,
    html,
  });
}

// Send dog application status email to buyer
async function sendApplicationStatusEmail(to, name, dogName, status, adminNote) {
  let subject = 'PawMart Dog Application Update';
  let text = `Hi ${name},\n\nYour application for ${dogName} is now: ${status}.`;
  if (status === 'APPROVED') {
    text += '\n\nCongratulations! You have been approved to rehome this dog.';
  } else if (status === 'REJECTED') {
    text += '\n\nUnfortunately, your application was rejected.';
    if (adminNote) text += `\nReason: ${adminNote}`;
  }
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    text,
  });
}

// Notify admin of new dog application
async function sendNewApplicationNotification(adminEmail, buyerName, buyerEmail, dogName) {
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to: adminEmail,
    subject: 'New Dog Application Submitted',
    text: `A new dog application was submitted by ${buyerName} (${buyerEmail}) for ${dogName}.`,
  });
}

// Send adoption receipt or other contact email
async function sendContactEmail(to, subject, text) {
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    text,
  });
}

// Send confirmation email to buyer after submitting a dog application
async function sendDogApplicationEmail(to, name, dogName) {
  const subject = 'PawMart Dog Application Received';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">🐾 PawMart</h2>
      <h3>Application Received</h3>
      <p>Dear ${name},</p>
      <p>Thank you for submitting your application to rehome <strong>${dogName}</strong>!</p>
      <p>Our team will review your application and you will receive an email once a decision has been made.</p>
      <p>If you have any questions, feel free to reply to this email or contact us through the platform.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated message from PawMart. Please do not reply to this email.
      </p>
    </div>
  `;
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendOTPEmail,
  sendScreeningEmail,
  sendReceiptEmail,
  sendScreeningStatusEmail,
  sendNewScreeningNotification,
  sendApplicationStatusEmail,
  sendNewApplicationNotification,
  sendContactEmail,
  sendDogApplicationEmail,
}; 