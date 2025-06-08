@echo off
chcp 65001>nul
echo ===== Starting Production Environment (Frontend+Backend on same port) =====

REM Check and install pnpm if not installed
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing pnpm...
    call npm install -g pnpm
)

REM Create .env file for port configuration
echo Creating .env file with PORT=5000...
echo PORT=5000> .env
if exist .env.example (
    type .env.example >> .env
)

REM Install dependencies
echo Installing dependencies...
call pnpm install

REM Generate Prisma Client
echo Generating Prisma Client...
cd packages\core
call npx prisma generate
cd ..\..

REM Build common package
echo Building common package...
call pnpm common build

REM Build frontend (production mode)
echo Building frontend...
call pnpm client build

REM Create backend static files directory
echo Copying frontend files to backend static directory...
if not exist packages\core\public\client mkdir packages\core\public\client
xcopy /E /Y /I packages\client\dist\* packages\core\public\client\

REM Copy all frontend build files to root public directory for direct access
echo Copying all frontend files to root public directory...
if not exist packages\core\public\assets mkdir packages\core\public\assets
xcopy /E /Y /I packages\client\dist\assets\* packages\core\public\assets\
copy packages\client\dist\index.html packages\core\public\index.html

REM Build backend
echo Building backend...
call pnpm core build

REM Start backend service (production mode)
echo Starting service...
echo Service will run on http://localhost:5000
echo Frontend files accessible at:
echo   - http://localhost:5000 (主页)
echo   - http://localhost:5000/client/ (备用路径)
cd packages\core
call node lib\index.js

echo ===== Service has been stopped =====