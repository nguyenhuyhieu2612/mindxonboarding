#!/bin/bash

# Deploy Backend with OAuth Fix
# Run this script to apply all OAuth configuration and restart backend

set -e

echo "🚀 Deploying Backend OAuth Configuration"
echo "=========================================="
echo ""

NAMESPACE="mindx-app"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "❌ Namespace '$NAMESPACE' not found"
    exit 1
fi

echo "✅ kubectl available"
echo "✅ Namespace '$NAMESPACE' exists"
echo ""

# Step 1: Apply ConfigMap
echo "📝 Step 1: Applying Backend ConfigMap..."
kubectl apply -f k8s/backend-configmap.yaml
echo "✅ ConfigMap applied"
echo ""

# Step 2: Apply Secret (if changed)
echo "📝 Step 2: Applying Backend Secret..."
kubectl apply -f k8s/backend-secret.yaml
echo "✅ Secret applied"
echo ""

# Step 3: Restart backend deployment
echo "📝 Step 3: Restarting Backend Deployment..."
kubectl rollout restart deployment/backend -n $NAMESPACE
echo "✅ Deployment restart initiated"
echo ""

# Step 4: Wait for rollout
echo "📝 Step 4: Waiting for rollout to complete..."
kubectl rollout status deployment/backend -n $NAMESPACE --timeout=120s
echo "✅ Rollout completed"
echo ""

# Step 5: Verify pods
echo "📝 Step 5: Verifying Pods..."
kubectl get pods -n $NAMESPACE -l app=backend
echo ""

# Step 6: Check environment variables
echo "📝 Step 6: Verifying Environment Variables..."
echo "---"
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}')

echo "NODE_ENV:"
kubectl exec -n $NAMESPACE $POD_NAME -- env | grep NODE_ENV || echo "❌ Not found"

echo "FRONTEND_URL:"
kubectl exec -n $NAMESPACE $POD_NAME -- env | grep FRONTEND_URL || echo "❌ Not found"

echo "OIDC_REDIRECT_URI:"
kubectl exec -n $NAMESPACE $POD_NAME -- env | grep OIDC_REDIRECT_URI || echo "❌ Not found"

echo "OIDC_CLIENT_ID:"
kubectl exec -n $NAMESPACE $POD_NAME -- env | grep OIDC_CLIENT_ID || echo "❌ Not found"
echo ""

# Step 7: Check recent logs
echo "📝 Step 7: Recent Backend Logs (last 10 lines)..."
echo "---"
kubectl logs -n $NAMESPACE $POD_NAME --tail=10
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Watch logs: kubectl logs -f -n $NAMESPACE -l app=backend | grep -E '(Token|cookie|authenticated)'"
echo "   2. Test login: https://hieunh01.mindx.edu.vn"
echo "   3. Check DevTools → Network → /api/auth/callback for Set-Cookie header"
echo ""
echo "🎯 Expected Backend Logs During Login:"
echo "   [INFO] Token exchange successful"
echo "   [INFO] 🍪 Refresh token cookie SET"
echo "   [INFO] User authenticated successfully"
echo ""
echo "✅ If you see these logs → OAuth is working!"
echo "❌ If you see 'invalid_client' → Contact MindX admin again"
