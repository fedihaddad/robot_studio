@echo off
echo ==========================================
echo   AXEL Robot - Assembly 3D Animation
echo ==========================================
echo.
echo Starting local server...
echo Open: http://localhost:3333/assembly-demo/
echo.
cd /d "%~dp0\.."
npx serve . -l 3333 -C
pause
