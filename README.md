# 🚀 MindX Full-Stack Application

> **Production-ready full-stack application với React, Express, TypeScript, và OpenID Connect authentication**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000)](https://expressjs.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-AKS-326CE5)](https://kubernetes.io/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

MindX Full-Stack Application là một ứng dụng web hiện đại được xây dựng với React và Express, tích hợp OpenID Connect (OIDC) authentication với MindX Identity Provider. Ứng dụng được containerized với Docker và deployed trên Azure Kubernetes Service (AKS) với NGINX Ingress Controller.

**Live Demo:** [https://hieunh01.mindx.edu.vn](https://hieunh01.mindx.edu.vn)

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ **OpenID Connect (OIDC)** authentication với MindX IdP
- ✅ **JWT-based** access tokens và refresh tokens
- ✅ **Secure HTTP-only cookies** cho refresh tokens
- ✅ **CORS** protection với domain whitelist
- ✅ **Helmet** security headers
- ✅ **CSP** (Content Security Policy) protection

### 🎨 Frontend
- ✅ **React 18** với TypeScript
- ✅ **Redux Toolkit** cho state management
- ✅ **React Router** cho client-side routing
- ✅ **Tailwind CSS** cho modern UI/UX
- ✅ **Vite** cho fast development và optimized builds
- ✅ **Axios interceptors** cho automatic token refresh

### 🔧 Backend
- ✅ **Express.js** với TypeScript
- ✅ **Redis** cho refresh token storage
- ✅ **Winston** logger với structured logging
- ✅ **Zod** schema validation
- ✅ **Morgan** HTTP request logging
- ✅ **Compression** middleware cho response optimization

### ☁️ Infrastructure
- ✅ **Docker** multi-stage builds
- ✅ **Kubernetes** deployment với AKS
- ✅ **NGINX Ingress** controller
- ✅ **Health checks** và readiness probes
- ✅ **Horizontal Pod Autoscaling** ready
- ✅ **Automated deployment scripts**

---

## 🛠 Tech Stack

### **Frontend**
```
React 18.2          - UI library
TypeScript 5.2      - Type safety
Redux Toolkit 2.9   - State management
React Router 6.30   - Client-side routing
Tailwind CSS 3.4    - Utility-first CSS
Vite 5.0           - Build tool
Axios 1.6          - HTTP client
```

### **Backend**
```
Node.js 18+        - Runtime
Express 4.18       - Web framework
TypeScript 5.3     - Type safety
Redis 5.8          - Session storage
Winston 3.11       - Logging
JWT 9.0            - Token management
Helmet 7.2         - Security headers
Zod 4.1            - Schema validation
```

### **Infrastructure**
```
Docker             - Containerization
Kubernetes (AKS)   - Orchestration
NGINX Ingress      - Load balancing
Azure Cloud        - Cloud provider
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Azure Kubernetes Service (AKS)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           NGINX Ingress Controller                      │ │
│  │  - SSL Termination                                      │ │
│  │  - Path-based Routing                                   │ │
│  │  - Load Balancing                                       │ │
│  └───────────────┬──────────────────┬─────────────────────┘ │
│                  │                  │                        │
│     ┌────────────▼─────────┐   ┌───▼────────────────┐      │
│     │  Frontend Service    │   │  Backend Service   │      │
│     │  (port 80)           │   │  (port 3000)       │      │
│     └────────────┬─────────┘   └───┬────────────────┘      │
│                  │                  │                        │
│     ┌────────────▼─────────┐   ┌───▼────────────────┐      │
│     │  Frontend Pods       │   │  Backend Pods      │      │
│     │  - NGINX Server      │   │  - Express API     │      │
│     │  - React SPA         │   │  - OIDC Auth       │      │
│     │  - Replicas: 2       │   │  - JWT Tokens      │      │
│     └──────────────────────┘   └───┬────────────────┘      │
│                                     │                        │
└─────────────────────────────────────┼────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Redis      │  │  MindX OIDC  │  │  Azure App   │
            │   Cloud      │  │  Provider    │  │  Insights    │
            │              │  │              │  │              │
            │ - Refresh    │  │ - Auth Flow  │  │ - Monitoring │
            │   Tokens     │  │ - User Info  │  │ - Telemetry  │
            └──────────────┘  └──────────────┘  └──────────────┘
```

### **Authentication Flow**

```
1. User clicks "Login with MindX"
   └─> Frontend opens OAuth popup
   
2. Backend redirects to MindX IdP
   └─> User authenticates on id.mindx.edu.vn
   
3. MindX IdP redirects back with authorization code
   └─> Backend: /api/auth/callback?code=xxx
   
4. Backend exchanges code for tokens
   └─> POST to https://id-dev.mindx.edu.vn/token
   
5. Backend fetches user info
   └─> GET to https://id-dev.mindx.edu.vn/me
   
6. Backend generates JWT tokens
   ├─> Access Token (15 min)
   └─> Refresh Token (7 days) → stored in Redis + HTTP-only cookie
   
7. Backend redirects to frontend
   └─> /login/#oauth_result={...}
   
8. Frontend stores access token
   └─> Redux store + Axios interceptors
   
9. User authenticated! 🎉
```

---

## 📦 Prerequisites

### **Required**
- **Node.js** >= 18.0.0
- **Docker** >= 20.10.0
- **kubectl** >= 1.24.0
- **Azure CLI** >= 2.40.0

### **Optional**
- **Redis** (for local development)
- **Visual Studio Code** (recommended IDE)

---

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/mindx-test.git
cd mindx-test
```

### **2. Setup Environment Variables**

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL
```

### **3. Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### **4. Start Development Servers**

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

---

## 💻 Local Development

### **Backend Development**

```bash
cd backend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

**Key Files:**
- `src/index.ts` - Express app entry point
- `src/routes/` - API route handlers
- `src/middleware/` - Custom middleware
- `src/services/` - Business logic
- `src/config/` - Configuration

### **Frontend Development**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Key Files:**
- `src/main.tsx` - React app entry point
- `src/App.tsx` - Root component
- `src/screens/` - Page components
- `src/components/` - Reusable components
- `src/layouts/` - Layout components

---

## 🚢 Deployment

### **Prerequisites**
1. **Azure AKS Cluster** configured
2. **kubectl** connected to your cluster
3. **Docker** registry access (Azure ACR recommended)
4. **Domain** configured with DNS pointing to AKS

### **Quick Deploy**

```bash
# 1. Build and push images
./scripts/build-and-push-image.sh

# 2. Deploy to Kubernetes
./scripts/deploy-all.sh
```

### **Manual Deployment**

**Step 1: Build Docker Images**
```bash
# Build frontend
docker build -t your-registry/mindx-frontend:latest ./frontend

# Build backend
docker build -t your-registry/mindx-backend:latest ./backend

# Push to registry
docker push your-registry/mindx-frontend:latest
docker push your-registry/mindx-backend:latest
```

**Step 2: Update Kubernetes Manifests**
```bash
# Update image references in:
- k8s/frontend-deployment.yaml
- k8s/backend-deployment.yaml
```

**Step 3: Configure Secrets**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Update secrets
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-secret.yaml

# Update configmaps
kubectl apply -f k8s/backend-configmap.yaml
```

**Step 4: Deploy Application**
```bash
# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Setup ingress
kubectl apply -f k8s/ingress.yaml
```

**Step 5: Verify Deployment**
```bash
# Check pods
kubectl get pods -n mindx-app

# Check services
kubectl get svc -n mindx-app

# Check ingress
kubectl get ingress -n mindx-app

# View logs
kubectl logs -f -n mindx-app -l app=backend
kubectl logs -f -n mindx-app -l app=frontend
```

---

## 🔐 Environment Variables

### **Backend Environment Variables**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | ✅ | `development` |
| `PORT` | Server port | ✅ | `3000` |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ | - |
| `OIDC_ISSUER` | OIDC issuer URL | ✅ | - |
| `OIDC_AUTHORIZATION_ENDPOINT` | OIDC auth endpoint | ✅ | - |
| `OIDC_TOKEN_ENDPOINT` | OIDC token endpoint | ✅ | - |
| `OIDC_USERINFO_ENDPOINT` | OIDC userinfo endpoint | ✅ | - |
| `OIDC_JWKS_URI` | OIDC JWKS URI | ✅ | - |
| `OIDC_CLIENT_ID` | OIDC client ID | ✅ | - |
| `OIDC_CLIENT_SECRET` | OIDC client secret | ✅ | - |
| `OIDC_REDIRECT_URI` | OAuth callback URL | ✅ | - |
| `OIDC_SCOPE` | OIDC scopes | ✅ | `openid profile email` |
| `OIDC_RESPONSE_TYPE` | OAuth response type | ✅ | `code` |
| `JWT_SECRET` | JWT signing secret | ✅ | - |
| `ACCESS_TOKEN_SECRET` | Access token secret | ✅ | - |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | ✅ | - |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime (seconds) | ✅ | `900` (15 min) |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime (seconds) | ✅ | `604800` (7 days) |
| `REDIS_HOST` | Redis host | ✅ | - |
| `REDIS_PORT` | Redis port | ✅ | `6379` |
| `REDIS_PASSWORD` | Redis password | ❌ | - |
| `AZURE_INSTRUMENTATION_KEY` | App Insights key | ❌ | - |

### **Frontend Environment Variables**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | ✅ | `/api` |

**Note:** Frontend env vars must be prefixed with `VITE_` to be exposed to the browser.

---

## 📚 API Documentation

### **Base URL**
- **Local:** `http://localhost:3000`
- **Production:** `https://hieunh01.mindx.edu.vn`

### **Authentication Endpoints**

#### **GET /auth/mindx**
Initiate OAuth login flow

**Response:**
```
302 Redirect to MindX IdP
```

---

#### **GET /auth/callback**
OAuth callback endpoint

**Query Parameters:**
- `code` - Authorization code from IdP
- `state` - CSRF state token

**Response:**
```
302 Redirect to frontend with OAuth result
```

---

#### **POST /auth/refresh-token**
Refresh access token

**Cookies:**
- `refreshToken` - HTTP-only refresh token

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### **GET /auth/logout**
Logout user

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### **Health Check Endpoints**

#### **GET /health**
Check server health

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T03:25:34.000Z",
  "environment": "production",
  "uptime": 123456
}
```

---

### **Protected Routes**

All authenticated routes require:
```
Authorization: Bearer <access_token>
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Access token required"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Invalid or expired token"
}
```

---

## 📁 Project Structure

```
mindx-test/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   ├── config.ts     # App configuration
│   │   │   └── constants.ts  # Constants
│   │   ├── controllers/      # Route controllers
│   │   │   └── auth.controller.ts
│   │   ├── middleware/       # Custom middleware
│   │   │   └── auth.ts       # JWT authentication
│   │   ├── routes/           # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── hello.routes.ts
│   │   │   └── index.ts
│   │   ├── services/         # Business logic
│   │   │   ├── auth.services.ts
│   │   │   └── token.services.ts
│   │   ├── utils/            # Utilities
│   │   │   └── logger.ts
│   │   └── index.ts          # App entry point
│   ├── Dockerfile            # Backend Docker image
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   └── header.tsx
│   │   ├── layouts/          # Layout components
│   │   │   └── main-layout.tsx
│   │   ├── screens/          # Page components
│   │   │   └── login.tsx
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # App entry point
│   │   ├── App.css
│   │   └── index.css
│   ├── nginx/
│   │   └── default.conf      # NGINX configuration
│   ├── Dockerfile            # Frontend Docker image
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-configmap.yaml
│   ├── backend-secret.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── secrets.yaml
│
├── scripts/                  # Deployment scripts
│   ├── build-and-push-image.sh
│   ├── deploy-all.sh
│   └── setup-ingress.sh
│
├── docs/                     # Documentation
│   ├── AZURE-LOAD-BALANCER.md
│   ├── INGRESS-GUIDE.md
│   └── plans/
│
└── README.md                 # This file
```

---

## 🐛 Troubleshooting

### **Frontend Issues**

#### **Blank page / Assets not loading**
```bash
# Check NGINX logs
kubectl logs -n mindx-app -l app=frontend

# Verify environment variables
kubectl exec -n mindx-app deployment/frontend -- env | grep VITE

# Check browser console for errors
# Ensure VITE_API_URL is set correctly
```

#### **CORS errors**
```bash
# Check backend FRONTEND_URL matches your domain
kubectl get configmap backend-config -n mindx-app -o yaml

# Verify ingress routing
kubectl describe ingress -n mindx-app
```

---

### **Backend Issues**

#### **OAuth login not working**
```bash
# Check OIDC configuration
kubectl get configmap backend-config -n mindx-app -o yaml

# Verify secrets
kubectl get secret backend-secret -n mindx-app -o yaml

# Check backend logs
kubectl logs -f -n mindx-app -l app=backend

# Common issues:
# 1. OIDC_REDIRECT_URI not whitelisted at IdP
# 2. CLIENT_SECRET incorrect (check if Base64 encoded)
# 3. FRONTEND_URL mismatch
```

#### **Token refresh failing**
```bash
# Check Redis connection
kubectl exec -n mindx-app deployment/backend -- env | grep REDIS

# Test Redis connectivity
kubectl exec -n mindx-app deployment/backend -- sh
# Inside pod:
nc -zv $REDIS_HOST $REDIS_PORT
```

#### **Cookies not set in production**
```bash
# Ensure:
# 1. Frontend and backend on same domain (different paths OK)
# 2. HTTPS enabled (required for secure cookies)
# 3. SameSite=lax configured
# 4. Cookie path=/ set

# Check response headers
curl -I https://hieunh01.mindx.edu.vn/api/auth/callback?code=xxx
# Look for "Set-Cookie" header
```

---

### **Kubernetes Issues**

#### **Pods not starting**
```bash
# Check pod status
kubectl get pods -n mindx-app

# Describe pod
kubectl describe pod <pod-name> -n mindx-app

# Check logs
kubectl logs <pod-name> -n mindx-app

# Common issues:
# 1. Image pull errors (check registry credentials)
# 2. CrashLoopBackOff (check app logs)
# 3. Missing secrets/configmaps
```

#### **Ingress not routing**
```bash
# Check ingress
kubectl get ingress -n mindx-app
kubectl describe ingress -n mindx-app

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Verify backend path rewriting
# Backend should receive /auth/mindx, not /api/auth/mindx
```

---

### **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Client credentials wrong | Check OIDC_CLIENT_ID and OIDC_CLIENT_SECRET |
| `redirect_uri_mismatch` | Callback URL not whitelisted | Add OIDC_REDIRECT_URI to IdP whitelist |
| `CORS policy` | Frontend URL not allowed | Update FRONTEND_URL in backend config |
| `Cannot read properties of null` | window.opener is null | OAuth popup closed prematurely |
| `Failed to fetch user info` | UserInfo endpoint error | Check OIDC_USERINFO_ENDPOINT and token |
| `JWT malformed` | Invalid token format | Check token generation/signing |
| `Redis connection refused` | Redis not accessible | Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD |

---

## 📖 Additional Resources

### **Documentation**
- [Azure Load Balancer Setup](docs/AZURE-LOAD-BALANCER.md)
- [Ingress Configuration Guide](docs/INGRESS-GUIDE.md)
- [Week 1 Architecture](docs/plans/week-1/architecture.md)
- [Week 2 Architecture](docs/plans/week-2/architecture.md)
- [Week 3 Architecture](docs/plans/week-3/architecture.md)

### **External Links**
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OpenID Connect Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [Azure AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**MindX Engineering Team**
- Backend: Node.js + Express + TypeScript
- Frontend: React + TypeScript + Tailwind CSS
- Infrastructure: Kubernetes + Azure AKS

---

## 🙏 Acknowledgments

- MindX Education for the OIDC provider
- Azure for cloud infrastructure
- All contributors and maintainers

---

## 📞 Support

For questions or issues:
- **Email:** support@mindx.edu.vn
- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/mindx-test/issues)

---

<div align="center">

**⭐ If you find this project helpful, please give it a star! ⭐**

Made with ❤️ by MindX Engineering Team

</div>

