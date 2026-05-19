@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Dreamex - Setup
cd /d "%~dp0"

echo.
echo  ================================================
echo       Dreamex  -  Installation du projet
echo  ================================================
echo.

:: ── Python ──────────────────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERREUR] Python n'est pas installe ou pas dans le PATH.
    echo.
    echo  Installer Python 3.10+ depuis : https://www.python.org/downloads/
    echo  Cocher "Add Python to PATH" lors de l'installation.
    echo.
    pause & exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo  [OK] Python %PYVER% detecte

:: ── Node.js ─────────────────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERREUR] Node.js n'est pas installe.
    echo.
    echo  Installer Node.js 18+ depuis : https://nodejs.org/
    echo.
    pause & exit /b 1
)
for /f %%v in ('node --version') do echo  [OK] Node.js %%v detecte

echo.
echo  ------------------------------------------------
echo  [1/3] Creation de l'environnement virtuel Python
echo  ------------------------------------------------
cd backend
if exist .venv (
    echo  Venv existant detecte, on passe.
) else (
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo  [ERREUR] Impossible de creer le venv.
        pause & exit /b 1
    )
    echo  Venv cree avec succes.
)

echo.
echo  ------------------------------------------------
echo  [2/3] Installation des dependances Python
echo  ------------------------------------------------
.venv\Scripts\python -m pip install --upgrade pip -q
.venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo  [ERREUR] pip install a echoue. Verifiez requirements.txt
    pause & exit /b 1
)
echo  Dependances Python installees.
cd ..

echo.
echo  ------------------------------------------------
echo  [3/3] Installation des dependances Node.js
echo  ------------------------------------------------
call npm install
if %errorlevel% neq 0 (
    echo  [ERREUR] npm install a echoue (packages racine).
    pause & exit /b 1
)
cd frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  [ERREUR] npm install a echoue (frontend).
    pause & exit /b 1
)
cd ..
echo  Dependances Node.js installees.

echo.
echo  ================================================
echo              Installation terminee !
echo  ================================================
echo.
echo  ETAPES SUIVANTES :
echo.
echo  1. Installez Ollama (si pas encore fait) :
echo       https://ollama.com/download
echo.
echo  2. Telechargez le modele IA dans un terminal :
echo       ollama pull deepseek-r1:8b
echo     (peut prendre plusieurs minutes selon la connexion)
echo.
echo  3. Lancez le projet avec :
echo       dev.bat
echo.
pause
