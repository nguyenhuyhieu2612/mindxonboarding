#!/bin/bash

# Debug script for cookie issues in production
# Usage: ./scripts/debug-cookies.sh

set -e

NAMESPACE="mindx-app"
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}')
DOMAIN="hieunh01.mindx.edu.vn"

echo "🔍 Cookie Debugging Script"
echo "=========================="
echo ""

# 1. Check backend environment variables
echo "1️⃣  Checking Backend Environment Variables..."
echo "---"
kubectl exec -n $NAMESPACE $BACKEND_POD -- env | grep -E "(NODE_ENV|FRONTEND_URL|OIDC_)" || echo "❌ No env vars found"
echo ""

# 2. Check backend logs for recent OAuth attempts
echo "2️⃣  Recent Backend Logs (OAuth related)..."
echo "---"
kubectl logs -n $NAMESPACE $BACKEND_POD --tail=50 | grep -E "(OAuth|cookie|Cookie|authenticated)" || echo "No OAuth logs found"
echo ""

# 3. Test simple cookie endpoint
echo "3️⃣  Testing Cookie Endpoint..."
echo "---"
echo "Making request to https://$DOMAIN/api/debug/test-cookie"
RESPONSE=$(curl -s -i "https://$DOMAIN/api/debug/test-cookie")
echo "$RESPONSE"
echo ""

# Check if Set-Cookie header exists
if echo "$RESPONSE" | grep -i "Set-Cookie" > /dev/null; then
    echo "✅ Set-Cookie header found!"
else
    echo "❌ No Set-Cookie header in response"
fi
echo ""

# 4. Test with credentials
echo "4️⃣  Testing with Credentials..."
echo "---"
curl -v -X GET "https://$DOMAIN/api/debug/test-cookie" \
  -H "Origin: https://$DOMAIN" \
  --cookie-jar /tmp/cookies.txt \
  2>&1 | grep -E "(Set-Cookie|Access-Control)"
echo ""

# 5. Verify cookie is sent back
echo "5️⃣  Checking if Cookie is Sent Back..."
echo "---"
curl -s -X GET "https://$DOMAIN/api/debug/check-cookies" \
  --cookie /tmp/cookies.txt \
  -H "Origin: https://$DOMAIN" | jq '.'
echo ""

# 6. Check ingress configuration
echo "6️⃣  Checking Ingress Configuration..."
echo "---"
kubectl get ingress -n $NAMESPACE mindx-backend-ingress -o yaml | grep -A 5 "annotations:" || echo "No annotations found"
echo ""

# 7. Check TLS
echo "7️⃣  Checking TLS Configuration..."
echo "---"
kubectl get ingress -n $NAMESPACE mindx-backend-ingress -o yaml | grep -A 5 "tls:" || echo "No TLS configured"
echo ""

echo "✅ Debug Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Check if Set-Cookie header is present in test endpoint"
echo "   2. Verify NODE_ENV=production in backend pod"
echo "   3. Verify FRONTEND_URL matches your domain"
echo "   4. Test actual OAuth flow: https://$DOMAIN/api/auth/mindx"
echo ""

# Cleanup
rm -f /tmp/cookies.txt
