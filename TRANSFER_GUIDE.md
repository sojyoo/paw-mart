# PawMart Project Transfer Guide

This guide will help you transfer the entire PawMart project (frontend + backend + database) to another PC for presentation.

## 📋 Prerequisites on Target PC

Before starting, ensure the target PC has:

1. **Node.js** (v16 or higher) - Download from https://nodejs.org/
2. **PostgreSQL** (v12 or higher) - Download from https://www.postgresql.org/download/
3. **Git** (optional, for version control) - Download from https://git-scm.com/

## 📦 Step 1: Transfer the Codebase

### Option A: Using USB Drive/Cloud Storage
1. Copy the entire `paw-mart` folder to a USB drive or cloud storage
2. Transfer to the target PC
3. Extract/place in a convenient location (e.g., `C:\Projects\paw-mart` or `~/Desktop/paw-mart`)

### Option B: Using Git (Recommended)
```bash
# On your current PC, if not already a git repo:
cd paw-mart
git init
git add .
git commit -m "Initial commit for transfer"

# Push to GitHub/GitLab (create a private repo)
git remote add origin <your-repo-url>
git push -u origin main

# On target PC:
git clone <your-repo-url>
cd paw-mart
```

## 🗄️ Step 2: Database Setup

### 2.1 Install PostgreSQL
1. Download and install PostgreSQL from https://www.postgresql.org/download/
2. During installation:
   - Remember the password you set for the `postgres` user
   - Keep default port (5432)
   - Install pgAdmin if you want a GUI

### 2.2 Create Database
```bash
# Open Command Prompt/Terminal and connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE pawmart;
CREATE USER pawmart_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pawmart TO pawmart_user;
\q
```

### 2.3 Export Current Database (on your PC)
```bash
# Navigate to your current project
cd paw-mart-backend

# Export the database (replace with your actual database name)
pg_dump -U postgres -h localhost pawmart > pawmart_backup.sql
```

### 2.4 Import Database (on target PC)
```bash
# Copy the backup file to target PC
# Navigate to the backend folder
cd paw-mart-backend

# Import the database
psql -U postgres -h localhost pawmart < pawmart_backup.sql
```

## ⚙️ Step 3: Environment Configuration

### 3.1 Backend Environment
Create `.env` file in `paw-mart-backend/`:

```env
# Database Configuration
DATABASE_URL="postgresql://pawmart_user:your_password@localhost:5432/pawmart"

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

### 3.2 Frontend Environment
Create `.env.local` file in `paw-mart-frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 📦 Step 4: Install Dependencies

### 4.1 Backend Dependencies
```bash
cd paw-mart-backend
npm install
```

### 4.2 Frontend Dependencies
```bash
cd paw-mart-frontend
npm install
```

## 🔧 Step 5: Database Setup

### 5.1 Generate Prisma Client
```bash
cd paw-mart-backend
npx prisma generate
```

### 5.2 Run Migrations (if needed)
```bash
npx prisma migrate deploy
```

## 🚀 Step 6: Start the Application

### 6.1 Start Backend Server
```bash
cd paw-mart-backend
npm run dev
```
The backend will start on `http://localhost:4000`

### 6.2 Start Frontend Server (in a new terminal)
```bash
cd paw-mart-frontend
npm run dev
```
The frontend will start on `http://localhost:3000`

## 🧪 Step 7: Testing

1. Open `http://localhost:3000` in your browser
2. Test the main functionality:
   - User registration/login
   - Dog browsing
   - Admin features (if you have admin credentials)

## 📁 Important Files to Transfer

Make sure these are included in your transfer:

### Backend Files
- ✅ All source code (`routes/`, `middleware/`, `utils/`)
- ✅ `package.json` and `package-lock.json`
- ✅ `prisma/schema.prisma`
- ✅ `uploads/` folder (contains images and documents)
- ✅ `.env` file (create on target PC)

### Frontend Files
- ✅ All source code (`src/`, `public/`)
- ✅ `package.json` and `package-lock.json`
- ✅ `next.config.ts`, `tsconfig.json`
- ✅ `.env.local` file (create on target PC)

### Database
- ✅ Database backup file (`pawmart_backup.sql`)

## 🔧 Troubleshooting

### Common Issues:

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :4000
   # Kill the process or change PORT in .env
   ```

2. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

3. **Prisma errors**
   ```bash
   npx prisma generate
   npx prisma migrate reset
   ```

4. **Node modules issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 Presentation Checklist

Before presenting, ensure:

- [ ] Backend server is running (`http://localhost:4000`)
- [ ] Frontend server is running (`http://localhost:3000`)
- [ ] Database is connected and has data
- [ ] All images and documents are accessible
- [ ] Admin account is working
- [ ] Test user registration/login
- [ ] Test dog browsing and applications
- [ ] Have backup plan (screenshots, demo videos)

## 🆘 Emergency Backup Plan

If something goes wrong during presentation:

1. **Have screenshots ready** of key features
2. **Prepare a demo video** showing the app in action
3. **Have the code ready** to show on screen
4. **Know the architecture** to explain the system design

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure all environment variables are set correctly
4. Check that both servers are running without errors

Good luck with your presentation! 🐕✨ 