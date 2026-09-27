@echo off
cd /d "%~dp0"
echo Starting HoneyTrace local server...
python -m http.server 8080
