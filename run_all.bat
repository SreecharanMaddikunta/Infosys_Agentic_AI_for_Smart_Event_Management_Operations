@echo off
echo Starting all InfosysProject1 services...

start cmd /k "cd backend && npm.cmd run dev"
start cmd /k "cd ai_service && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start cmd /k "cd student-frontend && npm.cmd run dev"
start cmd /k "cd admin-frontend && npm.cmd run dev"

echo All services launched in separate windows!
