# VDT Live - Docker Setup

This project uses Docker and Docker Compose to orchestrate a full-stack live streaming application with GraalVM backend, React frontend, PostgreSQL database, and MediaMTX streaming server.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git

## Project Structure

```
vdt-live/
├── backend/                 # Spring Boot backend with GraalVM
│   ├── Dockerfile          # Backend Docker configuration
│   └── ...
├── frontend/               # React + Vite frontend
│   ├── Dockerfile          # Frontend Docker configuration
│   └── ...
├── docker-compose.yml      # Main composition file
├── docker-compose.dev.yml  # Development environment
├── docker-compose.prod.yml # Production environment
└── mediamtx.yml           # MediaMTX configuration
```

## Quick Start

### Development Environment

1. **Clone and start all services:**
   ```powershell
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the applications:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - MediaMTX API: http://localhost:8889
   - PostgreSQL: localhost:5432

### Production Environment

1. **Create environment file:**
   ```powershell
   # Create .env file with production variables
   echo "POSTGRES_PASSWORD=your_secure_password" > .env
   echo "JWT_SECRET=your_jwt_secret_key" >> .env
   echo "FRONTEND_API_URL=http://your-domain:8080" >> .env
   echo "FRONTEND_STREAM_URL=http://your-domain:8889" >> .env
   ```

2. **Start production services:**
   ```powershell
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Access the applications:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - MediaMTX API: http://localhost:8889

## Services Overview

### Backend (GraalVM + Spring Boot)
- **Technology:** GraalVM Community Edition 17, Spring Boot 3.2.2
- **Port:** 8080
- **Features:** JWT authentication, PostgreSQL integration, file uploads
- **Health Check:** `/actuator/health`

### Frontend (React + Vite)
- **Technology:** React 19, Vite, TypeScript, Tailwind CSS
- **Development Port:** 5173
- **Production Port:** 80
- **Features:** Live streaming interface, authentication, responsive design

### Database (PostgreSQL)
- **Technology:** PostgreSQL 15 Alpine
- **Port:** 5432
- **Credentials:** postgres/admin (configurable)
- **Volume:** Persistent data storage

### Streaming Server (MediaMTX)
- **Technology:** MediaMTX latest
- **Ports:** 8889 (API), 8554 (RTSP), 1935 (RTMP), 8888 (HLS), 8000 (WebRTC)
- **Protocols:** RTSP, RTMP, HLS, WebRTC

## Docker Commands

### Building Services
```powershell
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build with no cache
docker-compose build --no-cache
```

### Managing Services
```powershell
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific services
docker-compose up backend postgres

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Development Commands
```powershell
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose -f docker-compose.prod.yml up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in running containers
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Database Operations
```powershell
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d vdt_live

# Backup database
docker-compose exec postgres pg_dump -U postgres vdt_live > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres vdt_live < backup.sql
```

## Environment Variables

### Backend
- `SPRING_DATASOURCE_URL`: Database connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing key
- `STREAM_URL_BASE`: MediaMTX server URL

### Frontend
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_STREAM_SERVER_URL`: MediaMTX server URL

## Volume Management

### Development Volumes
- `postgres_dev_data`: Development database data
- `backend_dev_uploads`: Development file uploads
- `./frontend:/app`: Live code reloading

### Production Volumes
- `postgres_prod_data`: Production database data
- `backend_prod_uploads`: Production file uploads

## Networking

All services communicate through Docker networks:
- **Development:** `vdt-dev-network`
- **Production:** `vdt-prod-network`

## Health Checks

- **PostgreSQL:** `pg_isready` command
- **Backend:** Spring Boot Actuator health endpoint
- **Frontend:** Nginx process check

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```powershell
   # Check port usage
   netstat -an | findstr :8080
   
   # Kill process using port
   taskkill /PID <process-id> /F
   ```

2. **Permission issues:**
   ```powershell
   # Reset Docker Desktop
   # Or run as administrator
   ```

3. **Build failures:**
   ```powershell
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Database connection issues:**
   ```powershell
   # Check database logs
   docker-compose logs postgres
   
   # Verify network connectivity
   docker-compose exec backend ping postgres
   ```

### Logs and Debugging

```powershell
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Debug backend with remote debugging (port 5005)
docker-compose -f docker-compose.dev.yml up backend
```

## Performance Optimization

### GraalVM Benefits
- Faster startup times
- Lower memory usage
- Better performance for microservices

### Production Optimizations
- Multi-stage Docker builds
- Nginx for frontend serving
- Health checks for reliability
- Restart policies for availability

## Security Considerations

- Non-root user in backend container
- Environment variable secrets
- Network isolation
- Volume permissions
- JWT secret rotation

## Monitoring

```powershell
# Monitor resource usage
docker stats

# Check container health
docker-compose ps

# View system resources
docker system df
```

## Contributing

When making changes:
1. Test in development environment first
2. Update environment variables if needed
3. Rebuild containers after significant changes
4. Update this documentation

## Support

For issues related to:
- Docker setup: Check Docker Desktop status
- Backend: Review Spring Boot logs
- Frontend: Check Vite/React console
- Database: Verify PostgreSQL connectivity
- Streaming: Check MediaMTX configuration
