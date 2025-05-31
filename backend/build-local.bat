@echo off
REM Build script for backend using Aliyun Maven repository
REM This script builds the backend locally before Docker build to avoid network issues

echo Building backend with Aliyun Maven repository...
echo.

REM Check if Maven is installed
mvn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven first: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

REM Create .m2 directory if it doesn't exist
if not exist "%USERPROFILE%\.m2" mkdir "%USERPROFILE%\.m2"

REM Backup existing settings.xml if it exists
if exist "%USERPROFILE%\.m2\settings.xml" (
    echo Backing up existing Maven settings...
    copy "%USERPROFILE%\.m2\settings.xml" "%USERPROFILE%\.m2\settings.xml.backup"
)

REM Copy Aliyun settings
echo Configuring Maven to use Aliyun repository...
copy "settings-aliyun.xml" "%USERPROFILE%\.m2\settings.xml"

REM Clean and build
echo.
echo Cleaning previous build...
mvn clean

echo.
echo Downloading dependencies...
mvn dependency:resolve -U

echo.
echo Building application...
mvn package -DskipTests

if %errorlevel% equ 0 (
    echo.
    echo ✅ Build successful! JAR file created in target/ directory
    echo.
    echo You can now use either:
    echo   1. docker-compose up --build     (uses main Dockerfile with Aliyun)
    echo   2. docker build -f Dockerfile.prebuilt -t vdt-backend .   (uses pre-built JAR)
    echo.
) else (
    echo.
    echo ❌ Build failed! Please check the error messages above.
    echo.
)

REM Restore original settings.xml if backup exists
if exist "%USERPROFILE%\.m2\settings.xml.backup" (
    echo Restoring original Maven settings...
    move "%USERPROFILE%\.m2\settings.xml.backup" "%USERPROFILE%\.m2\settings.xml"
)

pause
