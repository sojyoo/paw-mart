# Simple PawMart Transfer Guide (ZIP Method)

This is the easiest way to transfer your PawMart project to another PC!

## 📦 Step 1: Create the ZIP File

### On Your Current PC:
1. **Export your database first:**
   ```bash
   # Run this script to backup your database
   export-database.bat
   ```

2. **Create the ZIP file:**
   - Right-click on the `paw-mart` folder
   - Select "Send to" → "Compressed (zipped) folder"
   - Or use WinRAR/7-Zip to create a ZIP file
   - Name it something like `pawmart-project.zip`

3. **What gets included:**
   - ✅ All source code (frontend + backend)
   - ✅ All dependencies (`node_modules` folders)
   - ✅ All uploaded files (`uploads` folder)
   - ✅ Database backup (`pawmart_backup.sql`)
   - ✅ All configuration files
   - ✅ The transfer scripts I created

## 📤 Step 2: Transfer to Target PC

### Transfer Methods:
- **USB Drive:** Copy the ZIP file to a USB drive
- **Cloud Storage:** Upload to Google Drive, Dropbox, or OneDrive
- **Email:** If the file is small enough (under 25MB)
- **Direct Transfer:** Use a cable or network transfer

## 📥 Step 3: Setup on Target PC

### On Your Classmate's Laptop:

1. **Extract the ZIP file:**
   - Right-click the ZIP file
   - Select "Extract All..."
   - Choose a location (e.g., `C:\Projects\` or `Desktop`)

2. **Install prerequisites:**
   - **Node.js:** Download from https://nodejs.org/ (LTS version)
   - **PostgreSQL:** Download from https://www.postgresql.org/download/

3. **Setup PostgreSQL:**
   ```bash
   # Open Command Prompt as Administrator
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE pawmart;
   CREATE USER pawmart_user WITH PASSWORD 'password123';
   GRANT ALL PRIVILEGES ON DATABASE pawmart TO pawmart_user;
   \q
   
   # Import your database
   psql -U postgres -h localhost pawmart < pawmart_backup.sql
   ```

4. **Create environment files:**

   **Backend** (`paw-mart-backend/.env`):
   ```env
   DATABASE_URL="postgresql://pawmart_user:password123@localhost:5432/pawmart"
   JWT_SECRET="your-super-secret-jwt-key"
   SENDGRID_API_KEY="your-sendgrid-api-key"
   FROM_EMAIL="noreply@pawmart.com"
   ADMIN_EMAIL="admin@pawmart.com"
   PORT=4000
   NODE_ENV=development
   ```

   **Frontend** (`paw-mart-frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

5. **Run the setup script:**
   ```bash
   # Double-click or run in Command Prompt
   setup.bat
   ```

## 🚀 Step 4: Start the Application

### Quick Start:
```bash
# Double-click this file to start both servers
start-presentation.bat
```

### Manual Start:
```bash
# Terminal 1 - Backend
cd paw-mart-backend
npm run dev

# Terminal 2 - Frontend  
cd paw-mart-frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

## ✅ Advantages of ZIP Method

1. **Everything included** - No need to reinstall dependencies
2. **Faster setup** - No `npm install` needed
3. **Complete backup** - All files, including uploads
4. **One file transfer** - Easy to move around
5. **Works offline** - No internet needed for setup

## ⚠️ Important Notes

1. **File size:** The ZIP might be large due to `node_modules` folders
2. **Database:** Still need to import the backup file
3. **Environment:** Still need to create `.env` files
4. **Ports:** Make sure ports 3000 and 4000 are available

## 🔧 If Something Goes Wrong

1. **Delete `node_modules` folders and reinstall:**
   ```bash
   cd paw-mart-backend
   rmdir /s node_modules
   npm install
   
   cd ../paw-mart-frontend
   rmdir /s node_modules
   npm install
   ```

2. **Check the detailed guide:** See `TRANSFER_GUIDE.md` for troubleshooting

## 📋 Presentation Checklist

- [ ] ZIP file transferred successfully
- [ ] PostgreSQL installed and database imported
- [ ] Environment files created
- [ ] Both servers start without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Test user login/registration
- [ ] Test dog browsing
- [ ] Test admin features

This ZIP method is much simpler and should work perfectly for your presentation! 🐕✨ 