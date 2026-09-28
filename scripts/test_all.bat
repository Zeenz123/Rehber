@echo off
echo ========================================================
echo Running Rehber Full Backend Test Suite (Pytest)...
echo ========================================================
cd /d "%~dp0\..\backend"
set PYTHONPATH=%cd%;%cd%\..\shared\protocol
python -m pytest tests -v
pause
