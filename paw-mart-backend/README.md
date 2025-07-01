# 🐾 PawMart Backend API

A comprehensive backend system for a dog rehoming platform with user management, background screening, transaction logging, and admin dashboard.

## Features

- **User Authentication & Security**
  - OTP-based login/registration
  - Role-based access control (Admin/Staff/Buyer)
  - Single session per account
  - JWT token authentication

- **Background Screening System**
  - Buyer application forms
  - Document upload (ID, proof of residence)
  - Admin approval/rejection workflow
  - Email notifications

- **Dog Management**
  - CRUD operations for dog listings
  - Image upload support (max 3 images)
  - Status tracking (Available/Pending/Rehomed)
  - Cost breakdown tracking

- **Transaction System**
  - Manual transaction logging
  - Receipt generation
  - Email notifications
  - Profit calculation

- **Admin Dashboard**
  - Comprehensive analytics
  - Sales monitoring
  - User management
  - Report generation

- **Contact System**
  - Contact form for buyers
  - Admin message management
  - Email notifications

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + OTP
- **File Upload**: Multer
- **Email**: Nodemailer (SendGrid/Gmail)

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd paw-mart-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/pawmart"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@pawmart.com"
ADMIN_EMAIL="admin@pawmart.com"

# Alternative Email Configuration (Gmail)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with initial data
npx prisma db seed
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP for registration
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-login` - Verify OTP for login
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Background Screening
- `POST /api/screening/submit` - Submit screening application
- `GET /api/screening/my-application` - Get user's application
- `PUT /api/screening/update` - Update rejected application
- `GET /api/screening/all` - Get all applications (admin/staff)
- `GET /api/screening/:id` - Get specific application
- `PUT /api/screening/:id/status` - Approve/reject application

### Dogs
- `GET /api/dogs` - Get all dogs (public)
- `GET /api/dogs/:id` - Get specific dog
- `POST /api/dogs` - Add new dog (admin)
- `PUT /api/dogs/:id` - Update dog (admin)
- `DELETE /api/dogs/:id` - Delete dog (admin)
- `PATCH /api/dogs/:id/status` - Update dog status

### Transactions
- `POST /api/transactions` - Log transaction (admin/staff)
- `GET /api/transactions` - Get all transactions (admin/staff)
- `GET /api/transactions/my-transactions` - Get user's transactions
- `GET /api/transactions/:id` - Get specific transaction
- `GET /api/transactions/:id/receipt` - Get transaction receipt

### Contact
- `POST /api/contact/send` - Send contact message
- `GET /api/contact/my-messages` - Get user's messages
- `GET /api/contact` - Get all messages (admin/staff)
- `GET /api/contact/:id` - Get specific message

### Dashboard
- `GET /api/dashboard/overview` - Main dashboard overview
- `GET /api/dashboard/sales-analytics` - Sales analytics
- `GET /api/dashboard/user-analytics` - User analytics
- `GET /api/dashboard/quick-actions` - Quick actions data

### Reports
- `GET /api/reports/transactions` - Generate transaction report
- `GET /api/reports/monthly` - Generate monthly report
- `GET /api/reports/annual` - Generate annual report
- `GET /api/reports/periods` - Get available report periods

### Users
- `GET /api/users` - Get all users (admin/staff)
- `GET /api/users/:id` - Get specific user
- `POST /api/users/staff` - Create staff account (admin)
- `PUT /api/users/:id` - Update user (admin)
- `PATCH /api/users/:id/password` - Change password (admin)
- `PATCH /api/users/:id/status` - Activate/deactivate user (admin)

## Database Schema

The system uses the following main entities:

- **User**: Users with roles (Admin/Staff/Buyer)
- **Session**: Active user sessions
- **OTP**: One-time passwords for authentication
- **BackgroundScreening**: Buyer screening applications
- **Dog**: Dog listings with status tracking
- **Transaction**: Sales transactions with profit tracking
- **ContactMessage**: Contact form messages

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Single session per account
- Role-based access control
- Input validation and sanitization
- File upload security

## Email Integration

The system supports both SendGrid and Gmail for email notifications:

- OTP delivery
- Screening approval/rejection notifications
- Transaction receipts
- Contact form notifications

## File Upload

- Image uploads for dog listings (max 3 images)
- Document uploads for screening applications
- Secure file storage in uploads directory
- File type validation

## Development

```bash
# Run in development mode with auto-restart
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper email settings
4. Set up proper database connection
5. Use a process manager like PM2
6. Set up reverse proxy (nginx)
7. Configure SSL certificates

## License

ISC License 