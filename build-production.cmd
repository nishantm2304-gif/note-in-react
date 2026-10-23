@echo off
setlocal
cd /d "%~dp0"

npm.cmd ci
if errorlevel 1 exit /b 1

npm.cmd run build
if errorlevel 1 exit /b 1
