@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
chcp 65001 >nul 2>&1

cls
echo ======================================================
echo    Vitruvium - GitHub Settings Configuration
echo ======================================================
echo.

node deploy.cjs --config

pause
