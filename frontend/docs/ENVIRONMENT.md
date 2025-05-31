# Environment Configuration

This project uses environment variables to configure API and streaming server URLs. This allows you to easily change the URLs for different environments (development, staging, production) without modifying the code.

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your desired URLs:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8080/api

   # Stream Server Configuration  
   VITE_STREAM_SERVER_URL=http://localhost:8888
   ```

## Environment Variables

- **VITE_API_BASE_URL**: Base URL for the backend API (default: `http://localhost:8080/api`)
- **VITE_STREAM_SERVER_URL**: URL for the streaming server where users watch streams (default: `http://localhost:8888`)

## Usage Examples

### Development
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_STREAM_SERVER_URL=http://localhost:8888
```

### Production
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_STREAM_SERVER_URL=https://stream.yourdomain.com
```

### Staging
```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
VITE_STREAM_SERVER_URL=https://staging-stream.yourdomain.com
```

## Important Notes

- The `.env` file is gitignored and should not be committed to version control
- Always use the `.env.example` file as a template for new environments
- Environment variables must be prefixed with `VITE_` to be accessible in the frontend
- After changing environment variables, the development server will automatically restart
