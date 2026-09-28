@echo off
echo ========================================================
echo Starting Rehber FastAPI Backend Server on port 8000...
echo ========================================================
cd /d "%~dp0\..\backend"
set PYTHONPATH=%cd%;%cd%\..\shared\protocol
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
