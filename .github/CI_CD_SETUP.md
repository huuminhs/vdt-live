# CI/CD Setup Guide

This repository uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD).

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)
- Runs on every push and pull request
- **Frontend CI**: Type checking, linting, and build verification
- **Backend CI**: Maven tests and compilation
- **Security Scan**: Vulnerability scanning with Trivy

### 2. Frontend Deployment (`frontend-deploy.yml`)
- Deploys to **Cloudflare Pages**
- Triggers on changes to `frontend/` directory
- Builds React/Vite application and deploys

### 3. Backend Deployment (`backend-deploy.yml`)
- Deploys to **Azure App Service**
- Triggers on changes to `backend/` directory
- Builds Spring Boot JAR and deploys

## Required GitHub Secrets

To set up the CI/CD pipelines, you need to configure the following secrets in your GitHub repository:

### Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Frontend (Cloudflare Pages) Secrets:
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_STREAM_SERVER_URL=https://your-stream-server-domain.com
```

### Backend (Azure App Service) Secrets:
```
AZURE_WEBAPP_NAME=your_azure_webapp_name_here
AZURE_WEBAPP_PUBLISH_PROFILE=your_azure_publish_profile_content_here
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/vdt_live
SPRING_DATASOURCE_USERNAME=your_db_username
SPRING_DATASOURCE_PASSWORD=your_db_password
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SERVER_PORT=8080
STREAM_URL_BASE=your-stream-server-host
```

## How to Get the Required Tokens/Credentials

### Cloudflare API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. **Permissions needed:**
   - Account: `Cloudflare Pages:Edit`
   - Zone: `Zone:Read` (if using custom domain)
5. **Account Resources:** Include your account
6. **Zone Resources:** Include your domain (if applicable)
7. Copy the generated token

### Cloudflare Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain (or go to the right sidebar)
3. Scroll down to find "Account ID" in the right sidebar
4. Copy the Account ID

### Azure App Service Publish Profile
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to your App Service
3. Click "Get publish profile" (in the Overview section)
4. Download the `.publishsettings` file
5. Open the file and copy its entire content
6. Paste the entire XML content as the secret value

### Azure Web App Name
- This is simply the name of your Azure App Service (e.g., `my-app-service`)
- You can find it in the Azure Portal under your App Service's Overview

## Deployment Branches

- **Production**: Deploys from `production` branch only
- All CI/CD workflows are configured to trigger on the `production` branch

## Local Development

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

### Backend
```bash
cd backend
mvn spring-boot:run
```

## Project Structure
```
.github/
  workflows/
    ci.yml              # Continuous Integration
    frontend-deploy.yml # Frontend deployment to Cloudflare Pages
    backend-deploy.yml  # Backend deployment to Azure App Service
frontend/              # React/Vite frontend application
backend/               # Spring Boot backend application
```

## Notes

- The workflows include caching for faster builds
- Security scanning is performed on PRs and main branch
- Test reports are generated for backend tests
- Deployments only occur on `main` and `develop` branch pushes
- Frontend uses pnpm package manager
- Backend uses Maven for dependency management

## Troubleshooting

### Common Issues:

1. **Build failures**: Check the Actions tab for detailed logs
2. **Missing secrets**: Ensure all required secrets are configured
3. **Permission errors**: Verify API tokens have correct permissions
4. **Deploy failures**: Check Azure/Cloudflare service status

### Getting Help:
- Check GitHub Actions logs for detailed error messages
- Verify all secrets are correctly configured
- Ensure your Azure App Service and Cloudflare Pages are properly set up
