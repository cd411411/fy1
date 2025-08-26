@echo off
call .venv\Scripts\activate.bat

echo Running database migrations...
alembic upgrade head

echo Starting Uvicorn server...
uvicorn app.main:app --reload