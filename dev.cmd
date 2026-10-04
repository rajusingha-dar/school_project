@echo off
rem Wrapper so dev.ps1 runs without changing PowerShell's execution policy:  dev up
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1" %*
