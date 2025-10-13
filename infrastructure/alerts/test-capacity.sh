#!/bin/bash

# Capacity Alert Testing
# Tests CPU, Memory, and Pod restart alerts

set -e

# Configuration
STRESS_DURATION="${STRESS_DURATION:-300}"  # 5 minutes
CPU_CORES="${CPU_CORES:-2}"
MEMORY_MB="${MEMORY_MB:-1500}"

echo "================================================"
echo "📊 Capacity Alert Test"
echo "================================================"
echo ""
echo "Configuration:"
echo "  Stress duration: ${STRESS_DURATION}s ($(($STRESS_DURATION / 60)) minutes)"
echo "  CPU cores to stress: $CPU_CORES"
echo "  Memory to allocate: ${MEMORY_MB}MB"
echo ""
echo "Expected alerts:"
echo "  ✅ capacity-cpu-above-80pct"
echo "  ✅ capacity-memory-above-85pct"
echo "  ✅ capacity-pod-restarts-high (if pod crashes)"
echo ""
echo "⚠️  This will create temporary load on your cluster"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo "📋 Checking kubectl connection..."

if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ kubectl not connected to cluster"
    echo ""
    echo "Connect to your AKS cluster first:"
    echo "  az aks get-credentials --resource-group mindx-hieunh01-rg --name mindx-onboarding-aks"
    exit 1
fi

CLUSTER=$(kubectl config current-context)
echo "✅ Connected to: $CLUSTER"
echo ""

# Create stress test deployment
echo "🚀 Creating stress test pod..."

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: stress-test-$(date +%s)
  namespace: default
  labels:
    app: stress-test
    test: capacity-alert
spec:
  containers:
  - name: stress
    image: polinux/stress
    resources:
      requests:
        memory: "100Mi"
        cpu: "100m"
      limits:
        memory: "${MEMORY_MB}Mi"
        cpu: "${CPU_CORES}"
    command: ["stress"]
    args:
    - "--cpu"
    - "$CPU_CORES"
    - "--vm"
    - "1"
    - "--vm-bytes"
    - "${MEMORY_MB}M"
    - "--timeout"
    - "${STRESS_DURATION}s"
    - "--verbose"
  restartPolicy: Never
EOF

echo ""
echo "✅ Stress test pod created!"
echo ""

# Get pod name
STRESS_POD=$(kubectl get pods -l app=stress-test --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1].metadata.name}')

echo "Monitoring stress test: $STRESS_POD"
echo "Duration: $(($STRESS_DURATION / 60)) minutes"
echo ""

# Monitor pod status
START_TIME=$(date +%s)
while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    if [ $ELAPSED -ge $STRESS_DURATION ]; then
        echo "Stress test duration complete"
        break
    fi
    
    STATUS=$(kubectl get pod "$STRESS_POD" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
    
    if [ "$STATUS" = "Succeeded" ] || [ "$STATUS" = "Failed" ] || [ "$STATUS" = "NotFound" ]; then
        echo "Pod completed with status: $STATUS"
        break
    fi
    
    # Get resource usage
    CPU_USAGE=$(kubectl top pod "$STRESS_POD" --no-headers 2>/dev/null | awk '{print $2}' || echo "N/A")
    MEM_USAGE=$(kubectl top pod "$STRESS_POD" --no-headers 2>/dev/null | awk '{print $3}' || echo "N/A")
    
    echo "[$(($ELAPSED / 60))m $(($ELAPSED % 60))s] Status: $STATUS | CPU: $CPU_USAGE | Memory: $MEM_USAGE"
    
    sleep 10
done

echo ""
echo "📊 Checking node metrics..."
echo ""

kubectl top nodes

echo ""
echo "🧹 Cleaning up stress test pod..."

kubectl delete pods -l app=stress-test --ignore-not-found=true

echo ""
echo "✅ Test complete!"
echo ""
echo "Summary:"
echo "  Stress duration: $(($ELAPSED / 60)) minutes"
echo "  CPU stressed: $CPU_CORES cores"
echo "  Memory allocated: ${MEMORY_MB}MB"
echo ""
echo "Next steps:"
echo "  1. Wait 10-15 minutes for alerts to evaluate"
echo "  2. Check Azure Portal → Monitor → Alerts"
echo "  3. Check AKS → Insights for resource usage graphs"
echo ""
echo "Verification:"
echo "  • AKS → Insights → Nodes tab"
echo "    - Check CPU and Memory usage during test period"
echo "  • Alerts → Alert history"
echo "    - Look for capacity-cpu-above-80pct"
echo "    - Look for capacity-memory-above-85pct"
echo ""

