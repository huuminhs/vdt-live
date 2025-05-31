# Docker Setup for Frontend

This directory contains Docker configuration for the React frontend application.

## Files Created

- `Dockerfile` - Multi-stage Docker build file
- `.dockerignore` - Files to exclude from Docker context
- `nginx.conf` - Nginx configuration for production
- `docker-compose.yml` - Docker Compose configuration

## Usage

### Development Mode

```bash
# Using Docker Compose (recommended)
docker-compose --profile dev up

# Or build and run manually
docker build --target development -t frontend-dev .
docker run -p 5173:5173 -v ${PWD}:/app -v /app/node_modules frontend-dev
```

### Production Mode

```bash
# Using Docker Compose (recommended)
docker-compose --profile prod up

# Or build and run manually
docker build --target production -t frontend-prod .
docker run -p 80:80 frontend-prod
```

### Build for Production Only

```bash
docker build -t frontend-prod .
```

## Port Configuration

- **Development**: Port 5173 (Vite dev server)
- **Production**: Port 80 (Nginx)

## Features

- Multi-stage build for optimized production images
- Development stage with hot reloading
- Production stage with Nginx serving static files
- Gzip compression enabled
- Client-side routing support
- Security headers configured
- Static asset caching

## Customization

- Modify `nginx.conf` to adjust server configuration
- Update `docker-compose.yml` to change port mappings or add environment variables
- Edit `.dockerignore` to include/exclude specific files
