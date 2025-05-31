# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS build

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_STREAM_SERVER_URL

# Set environment variables from build args
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STREAM_SERVER_URL=$VITE_STREAM_SERVER_URL

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage (for development mode)
FROM base AS development

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_STREAM_SERVER_URL

# Set environment variables from build args
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STREAM_SERVER_URL=$VITE_STREAM_SERVER_URL

# Expose port 5173 (default Vite dev server port)
EXPOSE 5173

# Start development server
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
