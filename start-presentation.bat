@echo off
echo ========================================
echo PawMart Presentation Startup
echo ========================================
echo.

echo Starting PawMart servers for presentation...
echo.

echo Starting Backend Server (Port 4000)...
start "PawMart Backend" cmd /k "cd paw-mart-backend && npm run dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "PawMart Frontend" cmd /k "cd paw-mart-frontend && npm run dev"

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Both servers are starting in separate windows.
echo Wait for them to fully load before opening the frontend URL.
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:3000

echo.
echo Frontend opened in browser!
echo.
echo Presentation Checklist:
echo - [ ] Backend server is running without errors
echo - [ ] Frontend server is running without errors  
echo - [ ] Database connection is working
echo - [ ] Test user login/registration
echo - [ ] Test dog browsing
echo - [ ] Test admin features
echo.
echo Good luck with your presentation! 🐕✨
echo.
pause 