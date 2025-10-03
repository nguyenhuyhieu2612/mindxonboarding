# Simple CI/CD Pipeline Guide

## 🎯 Overview

**Super simple, production-ready CI/CD pipeline** for deploying full-stack application to AKS.

**ONE workflow. ONE file. Easy to understand and maintain.**

---

## 📁 Structure

```
.github/
└── workflows/
    └── deploy.yml          # The ONLY workflow you need
```

---

## 🚀 What It Does

### On Every Push to `main`:

1. **Build Backend Image**

   - Builds Docker image from `backend/`
   - Tags: `latest` + `git-sha`
   - Pushes to Azure Container Registry

2. **Build Frontend Image**

   - Builds Docker image from `frontend/`
   - Tags: `latest` + `git-sha`
   - Pushes to Azure Container Registry

3. **Deploy to AKS**

   - Applies all Kubernetes manifests
   - Restarts deployments to pull new images
   - Waits for rollout to complete

4. **Health Check**
   - Tests backend API endpoint
   - Tests frontend endpoint
   - Reports success/failure

**Total Time: ~10-15 minutes**

---

## 🔧 Setup (5 Minutes)

### 1. Add GitHub Secrets

Go to: **Repository Settings** → **Secrets and variables** → **Actions**

Add these 6 secrets:

| Secret Name          | Value                  | How to Get                            |
| -------------------- | ---------------------- | ------------------------------------- |
| `ACR_NAME`           | Your ACR name          | From Azure Portal or `az acr list`    |
| `ACR_USERNAME`       | ACR admin username     | `az acr credential show --name <acr>` |
| `ACR_PASSWORD`       | ACR admin password     | `az acr credential show --name <acr>` |
| `AKS_CLUSTER_NAME`   | Your AKS cluster name  | From Azure Portal                     |
| `AKS_RESOURCE_GROUP` | Your resource group    | From Azure Portal                     |
| `AZURE_CREDENTIALS`  | Service principal JSON | See below                             |

### 2. Create Azure Service Principal

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-deploy" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID \
  --sdk-auth

# Copy the entire JSON output to AZURE_CREDENTIALS secret
```

### 3. Enable ACR Admin User

```bash
az acr update --name <your-acr-name> --admin-enabled true
```

### 4. Test Deployment

```bash
# Make a change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: trigger deployment"
git push origin main

# Watch deployment in GitHub Actions tab
```

---

## 📊 Workflow Details

### Triggers

- **Push to `main`** - Automatic deployment
- **Manual dispatch** - Via GitHub Actions UI

### Environment Variables

```yaml
ACR_NAME: Your ACR name
AKS_CLUSTER: Your AKS cluster name
AKS_RG: Your resource group
NAMESPACE: mindx-app
```

### Steps Summary

```
1. Checkout code
2. Login to ACR
3. Build & push backend image
4. Build & push frontend image
5. Login to Azure
6. Set AKS context
7. Deploy manifests to AKS
8. Restart deployments
9. Wait for rollout
10. Health check
11. Success summary
```

---

## 🐛 Troubleshooting

### Deployment Fails at Build Step

**Check:**

- Dockerfile exists in `backend/` and `frontend/`
- No syntax errors in Dockerfiles
- All required files are in the directories

**Solution:**

```bash
# Test build locally
cd backend && docker build -t test .
cd frontend && docker build -t test .
```

### Deployment Fails at Push Step

**Check:**

- ACR credentials are correct
- ACR admin user is enabled
- ACR name matches your actual ACR

**Solution:**

```bash
# Test ACR login
az acr login --name <your-acr-name>

# Check admin credentials
az acr credential show --name <your-acr-name>
```

### Deployment Fails at Deploy Step

**Check:**

- AKS cluster is running
- Service principal has correct permissions
- Kubernetes manifests are valid

**Solution:**

```bash
# Test AKS access
az aks get-credentials --name <cluster> --resource-group <rg>
kubectl get nodes

# Test manifests
kubectl apply -f k8s/ --dry-run=client
```

### Health Check Fails

**Check:**

- Ingress controller is installed
- External IP is assigned
- Pods are running

**Solution:**

```bash
# Check pods
kubectl get pods -n mindx-app

# Check ingress
kubectl get ingress -n mindx-app

# Test manually
EXTERNAL_IP=$(kubectl get ingress mindx-fullstack-ingress -n mindx-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/api/health
curl http://$EXTERNAL_IP/
```

---

## 🔄 Manual Rollback

If deployment fails and you need to rollback:

```bash
# Rollback backend
kubectl rollout undo deployment/mindx-backend -n mindx-app

# Rollback frontend
kubectl rollout undo deployment/mindx-frontend -n mindx-app

# Check status
kubectl rollout status deployment/mindx-backend -n mindx-app
kubectl rollout status deployment/mindx-frontend -n mindx-app
```

---

## 📈 Monitoring

### View Deployment Status

```bash
# Check deployments
kubectl get deployments -n mindx-app

# Check pods
kubectl get pods -n mindx-app

# View logs
kubectl logs -f -n mindx-app -l app=mindx-backend
kubectl logs -f -n mindx-app -l app=mindx-frontend
```

### View Deployment History

```bash
# Backend history
kubectl rollout history deployment/mindx-backend -n mindx-app

# Frontend history
kubectl rollout history deployment/mindx-frontend -n mindx-app
```

---

## 🎯 Best Practices

### Before Pushing to Main

1. Test build locally
2. Test code locally
3. Commit with clear message
4. Watch deployment in Actions tab
5. Verify health checks pass

### Commit Message Format

```bash
# Good
git commit -m "feat: add new API endpoint"
git commit -m "fix: resolve login issue"
git commit -m "docs: update README"

# Avoid
git commit -m "update"
git commit -m "wip"
```

### Deployment Safety

- ✅ Always test locally first
- ✅ Push during work hours
- ✅ Watch deployment logs
- ✅ Have rollback plan ready
- ✅ Keep git history clean

---

## 📝 Workflow File

Location: `.github/workflows/deploy.yml`

**Key sections:**

```yaml
# Trigger on push to main
on:
  push:
    branches: [main]

# Build images
- docker build -t $IMAGE_TAG .
- docker push $IMAGE_TAG

# Deploy to AKS
- kubectl apply -f k8s/
- kubectl rollout restart deployment/...

# Health check
- curl http://$EXTERNAL_IP/api/health
```

---

## 🚀 Quick Commands

### Trigger Deployment

```bash
git push origin main
```

### Watch Deployment

```bash
# Via GitHub
# Go to: Actions tab → Latest workflow run

# Via kubectl
kubectl get events -n mindx-app --watch
```

### Check Application

```bash
# Get external IP
EXTERNAL_IP=$(kubectl get ingress mindx-fullstack-ingress -n mindx-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test endpoints
curl http://$EXTERNAL_IP/
curl http://$EXTERNAL_IP/api/health
curl http://$EXTERNAL_IP/api/info
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Workflow completed successfully (green checkmark)
- [ ] Backend pods are running
- [ ] Frontend pods are running
- [ ] Ingress has external IP
- [ ] Backend API responds
- [ ] Frontend loads
- [ ] No errors in pod logs

---

## 🎉 That's It!

**ONE workflow file.**  
**Simple, fast, reliable.**  
**Easy to understand and maintain.**

No complexity. No overhead. Just pure deployment.

---

**Questions?**

1. Check this guide
2. Check workflow logs
3. Check pod logs
4. Test manually with kubectl

---

**Last Updated:** 2025-10-03  
**Status:** Production-Ready  
**Simplicity Level:** Maximum 🚀
