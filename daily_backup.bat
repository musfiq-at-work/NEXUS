@echo off
setlocal

echo ==========================================
echo       RDL NEXUS DAILY BACKUP
echo ==========================================
echo.

REM Configuration
set "SERVER=192.168.21.253"
set "SSH_PORT=60011"
set "SSH_USER=rdlerpadmin"

set "DB_USER=rdlnexusdb"
set "DB_NAME=nexus_db"
set "DB_HOST=192.168.21.253"
set "DB_PORT=5432"

set "BACKUP_ROOT=E:\backup"
set "REMOTE_BACKUP=~/backup"

set "CONTAINER=00131604c826"
set "CONTAINER_PHOTOS=/app/public/uploads/style_photos"

set "KNOWN_HOSTS=%USERPROFILE%\.ssh\known_hosts"

REM Generate date: DD_MM_YYYY
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format dd_MM_yyyy"') do set "DATE=%%I"

set "BACKUP_DIR=%BACKUP_ROOT%\%DATE%"
set "SQL_FILE=%BACKUP_DIR%\pg_backup_%DATE%.sql"

echo Date       : %DATE%
echo Backup dir : %BACKUP_DIR%
echo.

REM Create local backup directory
echo [1/6] Creating local backup directory...

mkdir "%BACKUP_DIR%" 2>nul

REM ============================================================
REM Remove old SSH host key
REM ============================================================

echo Resetting SSH host key...

ssh-keygen -R "[%SERVER%]:%SSH_PORT%" -f "%KNOWN_HOSTS%" >nul 2>&1

REM ============================================================
REM Copy photos from Docker container to server
REM ============================================================

echo [2/6] Copying style photos from Docker...

ssh -p %SSH_PORT% -o StrictHostKeyChecking=accept-new %SSH_USER%@%SERVER% "docker cp %CONTAINER%:%CONTAINER_PHOTOS% %REMOTE_BACKUP%"

if errorlevel 1 (
    echo.
    echo ERROR: Docker photo backup failed.
    pause
    exit /b 1
)

REM ============================================================
REM PostgreSQL backup
REM ============================================================

echo [3/6] Creating PostgreSQL backup...


"G:\RUN\PostgresSQL\pgAdmin 4\runtime\pg_dump.exe" --file "%SQL_FILE%" --host "%DB_HOST%" --port "%DB_PORT%" --username "%DB_USER%" --section=pre-data --section=data --section=post-data --verbose "%DB_NAME%"

if errorlevel 1 (
    echo.
    echo ERROR: PostgreSQL backup failed.
    set "PGPASSWORD="
    pause
    exit /b 1
)

REM ============================================================
REM Remove SSH host key again
REM ============================================================

echo Resetting SSH host key before SCP...

ssh-keygen -R "[%SERVER%]:%SSH_PORT%" -f "%KNOWN_HOSTS%" >nul 2>&1

REM ============================================================
REM Copy photos from server to PC
REM ============================================================

echo [4/6] Copying style photos to PC...

scp -P %SSH_PORT% -o StrictHostKeyChecking=accept-new -r %SSH_USER%@%SERVER%:%REMOTE_BACKUP%/style_photos "%BACKUP_DIR%"

if errorlevel 1 (
    echo.
    echo ERROR: Photo download failed.
    set "PGPASSWORD="
    pause
    exit /b 1
)

REM ============================================================
REM Zip style photos on PC
REM ============================================================

echo Zipping style photos on PC...

powershell -NoProfile -Command "Compress-Archive -Path '%BACKUP_DIR%\style_photos' -DestinationPath '%BACKUP_DIR%\style_photos.zip' -Force"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to zip style photos.
    pause
    exit /b 1
)

REM ============================================================
REM Delete original style_photos folder from PC
REM ============================================================

echo Deleting original style_photos folder...

rmdir /s /q "%BACKUP_DIR%\style_photos"

if errorlevel 1 (
    echo.
    echo WARNING: Failed to delete style_photos folder.
)

REM ============================================================
REM Remove SSH host key again
REM ============================================================

echo Resetting SSH host key before cleanup...

ssh-keygen -R "[%SERVER%]:%SSH_PORT%" -f "%KNOWN_HOSTS%" >nul 2>&1

REM ============================================================
REM Delete remote backup contents
REM ============================================================

echo [5/6] Cleaning remote backup directory...

ssh -p %SSH_PORT% -o StrictHostKeyChecking=accept-new %SSH_USER%@%SERVER% "rm -rf %REMOTE_BACKUP%/*"

if errorlevel 1 (
    echo.
    echo WARNING: Remote backup cleanup failed.
)

echo [6/6] Backup completed.
echo.

echo ==========================================
echo BACKUP SUCCESSFUL
echo ==========================================
echo.

echo Location:
echo %BACKUP_DIR%

echo.

pause