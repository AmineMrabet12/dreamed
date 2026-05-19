@echo off
chcp 65001 >nul
title Dreamex - Demarrage
cd /d "%~dp0"

echo.
echo  ================================================
echo           Dreamex  -  Lancement
echo  ================================================
echo.

:: ── Verifications ───────────────────────────────────────────────────
if not exist backend\.venv (
    echo  [ERREUR] L'environnement Python n'existe pas.
    echo  Lancez d'abord : setup.bat
    echo.
    pause & exit /b 1
)

if not exist backend\.venv\Scripts\fastapi.exe (
    echo  [ERREUR] Les dependances Python sont incompletes.
    echo  Relancez : setup.bat
    echo.
    pause & exit /b 1
)

ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERREUR] Ollama n'est pas installe ou pas dans le PATH.
    echo  Telechargez-le sur : https://ollama.com/download
    echo  Puis tirez le modele  : ollama pull deepseek-r1:8b
    echo.
    pause & exit /b 1
)

:: ── Backend ─────────────────────────────────────────────────────────
echo  Demarrage du backend  (port 8000)...
start "Dreamex - Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\fastapi dev app/main.py --port 8000"

:: Laisser le backend demarrer avant le frontend
timeout /t 4 /nobreak >nul

:: ── Frontend ────────────────────────────────────────────────────────
echo  Demarrage du frontend (port 3000)...
start "Dreamex - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ================================================
echo   Backend  :  http://localhost:8000
echo   Frontend :  http://localhost:3000
echo   API docs :  http://localhost:8000/docs
echo  ================================================
echo.
echo  Deux fenetres se sont ouvertes pour les serveurs.
echo  Fermez-les pour tout arreter.
echo.
pause
