@echo off
echo ========================================
echo   E-Commerce DBMS Application Launcher
echo ========================================
echo.
echo Starting Backend API (port 5000)...
start "Backend API" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul

echo Starting React Frontend (port 3000)...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 3000"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo  Backend:  http://localhost:5000/api
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Opening browser...
start http://localhost:3000
