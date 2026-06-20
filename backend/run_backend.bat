@echo off
title EduGacha FastAPI Runner
cd /d "%~dp0"

echo ==============================================
echo        EduGacha FastAPI Setup & Runner
echo ==============================================
echo.

:: 1. Cek apakah virtual environment sudah ada
if not exist "venv" (
    echo [INFO] Virtual environment tidak ditemukan. Membuat venv baru...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Gagal membuat virtual environment. Pastikan Python terinstal dan ada di PATH.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment berhasil dibuat.
    echo.
)

:: 2. Aktivasi virtual environment
echo [INFO] Mengaktifkan virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo [ERROR] Gagal mengaktifkan virtual environment.
    pause
    exit /b 1
)
echo.

:: 3. Instal dependensi jika requirements.txt ada
if exist "requirements.txt" (
    echo [INFO] Memeriksa/menginstal dependensi dari requirements.txt...
    echo [INFO] Ini mungkin memakan waktu beberapa menit saat pertama kali karena mengunduh package AI...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Gagal menginstal dependensi. Silakan periksa koneksi internet Anda.
        pause
        exit /b 1
    )
    echo [SUCCESS] Seluruh dependensi berhasil terinstal.
    echo.
) else (
    echo [WARNING] file requirements.txt tidak ditemukan!
    echo.
)

:: 4. Jalankan FastAPI server menggunakan Uvicorn
echo [INFO] Menjalankan server FastAPI di http://127.0.0.1:8000...
echo.
set PYTHONPATH=%~dp0..
uvicorn main:app --reload --host 127.0.0.1 --port 8000

pause
