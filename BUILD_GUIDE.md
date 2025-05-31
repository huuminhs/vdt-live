# Build and Deployment Guide

This guide provides multiple ways to build and deploy the VDT Live application, especially optimized for users in Asia using Aliyun's Maven repository.

## Quick Start Options

### Option 1: Full Docker Build (Recommended for Production)
Uses Aliyun Maven repository for faster builds in Asia:

```powershell
# Start all services (builds automatically)
docker-compose up --build

# Or for development
docker-compose -f docker-compose.dev.yml up --build

# Or for production
docker-compose -f docker-compose.prod.yml up --build
```

### Option 2: Pre-build Backend Locally (Fastest)
Build the backend locally first, then use Docker for deployment:

```powershell
# Step 1: Build backend locally using Aliyun repository
cd backend
.\build-local.bat

# Step 2: Use pre-built JAR in Docker
cd ..
docker-compose -f docker-compose.yml up --build
# Backend will use Dockerfile.prebuilt automatically when JAR exists
```

### Option 3: Manual Maven Build
If you prefer to build manually:

```powershell
cd backend

# Configure Maven to use Aliyun (backup existing settings first)
copy "%USERPROFILE%\.m2\settings.xml" "%USERPROFILE%\.m2\settings.xml.backup"
copy "settings-aliyun.xml" "%USERPROFILE%\.m2\settings.xml"

# Build
mvn clean package -DskipTests

# Restore original settings
move "%USERPROFILE%\.m2\settings.xml.backup" "%USERPROFILE%\.m2\settings.xml"

# Then run Docker
cd ..
docker-compose up
```

## Troubleshooting Build Issues

### Maven Network Issues
If you get network errors like "Network is unreachable":

1. **Use Option 2 above** - build locally first
2. **Check your internet connection** to maven.aliyun.com
3. **Try building without Docker** first to isolate the issue
4. **Use corporate proxy settings** if behind a firewall

### Docker Build Fails
```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker daemon is running
docker version
```

### Port Conflicts
```powershell
# Check what's using port 8080
netstat -an | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <process-id> /F
```

## Service URLs

### Development Environment
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432
- **MediaMTX API**: http://localhost:8889
- **MediaMTX RTSP**: rtsp://localhost:8554
- **MediaMTX RTMP**: rtmp://localhost:1935
- **MediaMTX HLS**: http://localhost:8888
- **MediaMTX WebRTC**: localhost:8890 (UDP), localhost:8189 (UDP)

### Production Environment
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **MediaMTX**: Same ports as development

## File Structure

```
backend/
├── Dockerfile              # Main Dockerfile with Aliyun Maven
├── Dockerfile.prebuilt     # Alternative using pre-built JAR
├── settings-aliyun.xml     # Maven settings for Aliyun repository
├── build-local.bat         # Windows build script
└── target/
    └── backend-*.jar       # Generated JAR file
```

## Environment Variables

### Backend
- `SPRING_DATASOURCE_URL`: Database connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username  
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `STREAM_URL_BASE`: MediaMTX server hostname

### Frontend
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_STREAM_SERVER_URL`: MediaMTX server URL

## Build Performance Tips

1. **Use Aliyun repository** - Much faster in Asia
2. **Pre-build backend** - Avoid network issues in Docker
3. **Use .dockerignore** - Excludes unnecessary files
4. **Multi-stage builds** - Smaller final images
5. **Build cache** - Docker layer caching speeds up rebuilds

## Deployment Strategies

### Development
```powershell
docker-compose -f docker-compose.dev.yml up
```
- Hot reload for frontend
- Debug port exposed for backend
- Development database

### Production
```powershell
# Set environment variables
$env:POSTGRES_PASSWORD="secure_password"
$env:JWT_SECRET="your_jwt_secret"

docker-compose -f docker-compose.prod.yml up -d
```
- Optimized builds
- Health checks
- Restart policies
- Production database

## Monitoring

```powershell
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check container status
docker-compose ps

# Monitor resource usage
docker stats

# Check health
docker-compose exec backend curl http://localhost:8080/actuator/health
```

## Database Management

```powershell
# Access database
docker-compose exec postgres psql -U postgres -d vdt_live

# Backup
docker-compose exec postgres pg_dump -U postgres vdt_live > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres vdt_live < backup.sql
```

## Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (loses data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

## Support

For build issues:
1. Check this guide first
2. Try the pre-build option (Option 2)
3. Check Docker Desktop is running
4. Verify internet connectivity to maven.aliyun.com
5. Review the logs for specific error messages
