#!/bin/bash

# Alert Testing Suite
# Tests all alert types to verify they trigger correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="https://your-api-url.azurewebsites.net"  # Update this!
RESOURCE_GROUP="mindx-hieunh01-rg"
AKS_CLUSTER="mindx-onboarding-aks"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 Alert Testing Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Menu
show_menu() {
    echo -e "${GREEN}Select test category:${NC}"
    echo ""
    echo "  1) Test Performance Alerts (Latency)"
    echo "  2) Test Error Rate Alerts"
    echo "  3) Test Capacity Alerts (CPU/Memory)"
    echo "  4) Test System Down Alerts"
    echo "  5) Run All Tests"
    echo "  6) View Alert History"
    echo "  0) Exit"
    echo ""
}

# Test Performance Alerts
test_performance_alerts() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}🚀 Testing Performance Alerts${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    
    echo -e "${BLUE}Test 1: Simulate High Latency${NC}"
    echo "This will generate slow requests to trigger P95/P99 alerts..."
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    echo ""
    echo "Generating 100 slow requests over 2 minutes..."
    
    for i in {1..100}; do
        # Make requests that should be slow
        curl -s -w "Response time: %{time_total}s\n" \
             -H "X-Simulate-Delay: 6000" \
             "$API_URL/api/health" > /dev/null &
        
        if [ $((i % 10)) -eq 0 ]; then
            echo "Sent $i/100 requests..."
        fi
        
        sleep 1.2
    done
    
    wait
    
    echo ""
    echo -e "${GREEN}✅ Test complete!${NC}"
    echo ""
    echo "Expected results:"
    echo "  - P99 latency alert should fire (if > 10s)"
    echo "  - P95 latency alert should fire (if > 5s)"
    echo "  - Check in 10-15 minutes: Azure Portal → Alerts"
    echo ""
}

# Test Error Rate Alerts
test_error_rate_alerts() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}❌ Testing Error Rate Alerts${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    
    echo -e "${BLUE}Test 2: Generate 5xx Errors${NC}"
    echo "This will generate server errors to trigger error rate alerts..."
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    echo ""
    echo "Generating errors (mix of 500, 502, 503)..."
    
    # Generate 20 successful requests
    echo "Generating baseline (20 successful requests)..."
    for i in {1..20}; do
        curl -s "$API_URL/api/health" > /dev/null &
    done
    wait
    
    sleep 2
    
    # Generate 10 error requests (50% error rate - should trigger alerts!)
    echo "Generating errors (10 failing requests)..."
    for i in {1..10}; do
        # Try to trigger 500 errors
        curl -s -w "Status: %{http_code}\n" \
             -H "X-Simulate-Error: 500" \
             "$API_URL/api/test-error" > /dev/null &
    done
    wait
    
    sleep 2
    
    # Generate more successful to dilute error rate
    echo "Generating more traffic (20 successful)..."
    for i in {1..20}; do
        curl -s "$API_URL/api/health" > /dev/null &
    done
    wait
    
    echo ""
    echo -e "${GREEN}✅ Test complete!${NC}"
    echo ""
    echo "Expected results:"
    echo "  - Error rate: ~20% (10 errors / 50 total)"
    echo "  - Should trigger error-rate-above-5pct alert"
    echo "  - Should trigger error-rate-5xx-above-1pct alert"
    echo "  - Check in 10-15 minutes: Azure Portal → Alerts"
    echo ""
}

# Test Capacity Alerts
test_capacity_alerts() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}📊 Testing Capacity Alerts${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    
    echo -e "${BLUE}Test 3: CPU & Memory Stress Test${NC}"
    echo "This will deploy a stress pod to trigger capacity alerts..."
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    echo ""
    echo "Deploying stress test pod..."
    
    # Create stress test pod
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: stress-test
  namespace: default
spec:
  containers:
  - name: stress
    image: polinux/stress
    resources:
      requests:
        memory: "100Mi"
        cpu: "100m"
      limits:
        memory: "2Gi"
        cpu: "2"
    command: ["stress"]
    args:
    - "--cpu"
    - "2"
    - "--vm"
    - "1"
    - "--vm-bytes"
    - "1500M"
    - "--timeout"
    - "300s"
    - "--verbose"
EOF
    
    echo ""
    echo -e "${GREEN}✅ Stress test pod deployed!${NC}"
    echo ""
    echo "Monitoring stress test..."
    echo "This will run for 5 minutes and then auto-cleanup."
    echo ""
    
    # Monitor pod
    for i in {1..60}; do
        STATUS=$(kubectl get pod stress-test -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
        echo "[$i/60] Pod status: $STATUS"
        
        if [ "$STATUS" = "NotFound" ]; then
            echo "Stress test completed and cleaned up."
            break
        fi
        
        sleep 5
    done
    
    # Cleanup
    echo ""
    echo "Cleaning up stress test pod..."
    kubectl delete pod stress-test --ignore-not-found=true
    
    echo ""
    echo -e "${GREEN}✅ Test complete!${NC}"
    echo ""
    echo "Expected results:"
    echo "  - CPU alert should fire (if node CPU > 80%)"
    echo "  - Memory alert should fire (if node memory > 85%)"
    echo "  - Check in 10-15 minutes: Azure Portal → Alerts"
    echo ""
}

# Test System Down Alerts
test_system_down_alerts() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}🚨 Testing System Down Alerts${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    
    echo -e "${RED}⚠️  WARNING: This will simulate system downtime!${NC}"
    echo "This test will temporarily scale down your application."
    echo "Only do this in non-production or during maintenance!"
    echo ""
    
    read -p "Are you sure? (yes/no) " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Test cancelled."
        return
    fi
    
    echo ""
    echo "Scaling backend to 0 replicas..."
    
    kubectl scale deployment backend --replicas=0 -n default
    
    echo ""
    echo "Waiting 5 minutes for alerts to fire..."
    echo "You can check Azure Portal → Alerts in real-time."
    echo ""
    
    for i in {1..30}; do
        echo "[$i/30] Waiting... (${i}0 seconds elapsed)"
        sleep 10
    done
    
    echo ""
    echo "Restoring backend deployment..."
    kubectl scale deployment backend --replicas=2 -n default
    
    echo ""
    echo -e "${GREEN}✅ Test complete!${NC}"
    echo ""
    echo "Expected results:"
    echo "  - system-down-zero-successful-requests should fire"
    echo "  - system-down-availability-below-99 should fire"
    echo "  - Check: Azure Portal → Alerts"
    echo ""
}

# View Alert History
view_alert_history() {
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}📜 Recent Alert History${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    
    echo "Fetching alerts from last 24 hours..."
    echo ""
    
    az monitor metrics alert list \
        --resource-group "$RESOURCE_GROUP" \
        --output table
    
    echo ""
    echo "For detailed alert history:"
    echo "Visit: Azure Portal → Monitor → Alerts → Alert history"
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice: " choice
    echo ""
    
    case $choice in
        1) test_performance_alerts ;;
        2) test_error_rate_alerts ;;
        3) test_capacity_alerts ;;
        4) test_system_down_alerts ;;
        5)
            echo "Running all tests..."
            echo ""
            test_performance_alerts
            test_error_rate_alerts
            test_capacity_alerts
            echo ""
            echo -e "${GREEN}✅ All tests completed!${NC}"
            echo "Check Azure Portal → Alerts in 10-15 minutes."
            ;;
        6) view_alert_history ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice!${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done

