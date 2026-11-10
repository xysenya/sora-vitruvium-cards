@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
chcp 65001 >nul 2>&1

cls
echo ======================================================
echo    Vitruvium - 1-Click GitHub and Pages Update
echo ======================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git command-line tool was not found in PATH.
    echo If update fails, please install Git from https://git-scm.com/
    echo.
)

node deploy.cjs

if %errorlevel% neq 0 (
    echo.
    echo ======================================================
    echo [ERROR] Update failed with exit code %errorlevel%.
    echo ======================================================
    pause
    exit /b %errorlevel%
)

pause
