@echo off
REM Windows Startup Script for PES Stack
REM Starts MongoDB Debug info, Backend, and Frontend in sequence
REM 
REM Usage: Double-click this file or run: startup.bat

setlocal enabledelayedexpansion

echo.
echo ===============================================
echo  PES Stack Startup Helper
echo ===============================================
echo.

REM Check if backend directory exists
if not exist "backend\package.json" (
    echo ❌ Error: backend/package.json not found
    echo    Run this script from project root directory
    pause
    exit /b 1
)

echo [STEP 1] Checking dependencies...
echo.

REM Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found: && node --version

REM Check for git (optional)
git --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ Git found: && git --version
)

echo.
echo [STEP 2] MongoDB Configuration
echo.
echo MongoDB Status:
mongod --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB not installed locally
    echo.
    echo Options:
    echo 1. Install MongoDB Community Edition:
    echo    https://www.mongodb.com/try/download/community
    echo.
    echo 2. Use MongoDB Atlas (Recommended - Cloud):
    echo    - Go to https://www.mongodb.com/cloud/atlas
    echo    - Create free account ^& cluster
    echo    - Get connection string
    echo    - Add to backend/.env: MONGO_URI=mongodb+srv://...
    echo.
    echo ℹ️  Cloud option requires NO local installation
    echo.
) else (
    echo ✅ MongoDB found: && mongod --version
    echo.
    echo 📍 Starting MongoDB daemon...
    start "MongoDB" mongod --dbpath "C:\data\db" 2>&1 || (
        echo.
        echo ⚠️  MongoDB start failed. Create directory first:
        echo    mkdir C:\data\db
        echo.
        echo Or use MongoDB Atlas instead (see above)
    )
    timeout /t 3 /nobreak
)

echo.
echo [STEP 3] Installing dependencies (if needed)...
echo.

if not exist "backend/node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo ✅ Backend dependencies installed
)

if not exist "@latest/node_modules" (
    echo Installing frontend dependencies...
    cd @latest
    call npm install
    cd ..
    echo ✅ Frontend dependencies installed
)

echo.
echo [STEP 4] Starting services...
echo.
echo ℹ️  Three terminal windows will open:
echo    - Backend (port 5000)
echo    - Frontend (port 5173)
echo.

REM Start Backend
echo Starting Backend (npm run dev)...
start "PES Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak

REM Start Frontend
echo Starting Frontend (npm run dev)...
start "PES Frontend" cmd /k "cd @latest && npm run dev"

echo.
echo ✅ Startup sequence complete!
echo.
echo 📍 Access application at: http://localhost:5173
echo 📍 Backend debug: http://localhost:5000/api/auth/debug/setup
echo.
echo 📊 Check backend terminal for MongoDB connection status
echo 📊 Check frontend terminal for token attachment logs
echo.

timeout /t 5 /nobreak
