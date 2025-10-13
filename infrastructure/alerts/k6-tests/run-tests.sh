#!/bin/bash

# k6 Alert Tests - Bash Runner
# Quick script to run k6 tests on Linux/macOS

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
API_URL=""
TEST="menu"
ERROR_RATE=10

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --test)
            TEST="$2"
            shift 2
            ;;
        --error-rate)
            ERROR_RATE="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown parameter: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🚀 k6 Alert Testing Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check k6 installation
echo -e "${YELLOW}Checking k6 installation...${NC}"
if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ k6 found: $K6_VERSION${NC}"
else
    echo -e "${RED}❌ k6 not installed${NC}"
    echo ""
    echo -e "${YELLOW}Install k6:${NC}"
    echo "  macOS:  brew install k6"
    echo "  Linux:  See https://k6.io/docs/get-started/installation/"
    echo ""
    exit 1
fi
echo ""

# Get API URL
if [ -z "$API_URL" ]; then
    echo -e "${YELLOW}Enter your API URL:${NC}"
    echo -e "${NC}Example: https://your-api.azurewebsites.net${NC}"
    read -p "API URL: " API_URL
fi

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ API URL is required${NC}"
    exit 1
fi

# Set environment variable
export API_URL
echo -e "${GREEN}✅ API URL set: $API_URL${NC}"
echo ""

# Show menu if not specified
if [ "$TEST" = "menu" ]; then
    echo -e "${GREEN}Select test to run:${NC}"
    echo ""
    echo "  1) Performance Test (15 min) - P95/P99 latency"
    echo "  2) Error Rate Test (15 min) - Error rate alerts"
    echo "  3) Spike Test (22 min) - Response time spike"
    echo "  4) Run All Tests (~52 min)"
    echo "  0) Exit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1) TEST="performance" ;;
        2) TEST="error" ;;
        3) TEST="spike" ;;
        4) TEST="all" ;;
        0) 
            echo "Exiting..."
            exit 0 
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    echo ""
fi

# Function to run a test
run_test() {
    local TEST_NAME=$1
    local TEST_FILE=$2
    
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}🧪 Running: $TEST_NAME${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo ""
    
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    TEST_PATH="$SCRIPT_DIR/$TEST_FILE"
    
    if [ -f "$TEST_PATH" ]; then
        k6 run "$TEST_PATH"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ $TEST_NAME completed successfully!${NC}"
        else
            echo ""
            echo -e "${RED}❌ $TEST_NAME failed!${NC}"
        fi
    else
        echo -e "${RED}❌ Test file not found: $TEST_PATH${NC}"
    fi
    
    echo ""
}

# Run selected test(s)
case ${TEST,,} in
    performance)
        run_test "Performance Test" "performance-test.js"
        ;;
    
    error)
        export ERROR_RATE
        echo -e "${YELLOW}Error rate set to: $ERROR_RATE%${NC}"
        echo ""
        run_test "Error Rate Test" "error-rate-test.js"
        ;;
    
    spike)
        run_test "Spike Test" "spike-test.js"
        ;;
    
    all)
        echo -e "${CYAN}🚀 Running all tests...${NC}"
        echo ""
        echo -e "${YELLOW}This will take approximately 52 minutes${NC}"
        echo ""
        read -p "Continue? (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_test "Performance Test" "performance-test.js"
            sleep 5
            
            export ERROR_RATE
            run_test "Error Rate Test" "error-rate-test.js"
            sleep 5
            
            run_test "Spike Test" "spike-test.js"
            
            echo ""
            echo -e "${GREEN}✅ All tests completed!${NC}"
        else
            echo "Cancelled."
        fi
        ;;
    
    *)
        echo -e "${RED}❌ Unknown test: $TEST${NC}"
        echo ""
        echo "Available tests:"
        echo "  - performance"
        echo "  - error"
        echo "  - spike"
        echo "  - all"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Next Steps${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "1. Wait 10-15 minutes for data to process"
echo "2. Check Azure Portal → Monitor → Alerts"
echo "3. Check Application Insights → Performance/Failures"
echo "4. Verify email notifications received"
echo ""
echo -e "${YELLOW}For detailed verification, see:${NC}"
echo "  infrastructure/alerts/k6-tests/README.md"
echo ""

