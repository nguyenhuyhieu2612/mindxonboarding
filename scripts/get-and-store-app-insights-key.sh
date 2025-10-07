#!/bin/bash
set -e
set -u

# ==============================================================================
# COLOR DEFINITIONS
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==============================================================================
# SCRIPT VARIABLES
# ==============================================================================

# Kubernetes variables
PROJECT_NAME="mindx"
ENVIRONMENT="onboarding"
RESOURCE_GROUP="mindx-hieunh01-rg"
NAMESPACE="mindx-app"
SECRET_NAME="monitoring-secrets"
SECRET_KEY="APPINSIGHTS_CONNECTION_STRING"
LOG_ANALYTICS_WORKSPACE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-logs"
APP_INSIGHTS_NAME="${PROJECT_NAME}-${ENVIRONMENT}-insights"

# ==============================================================================
# MAIN LOGIC
# ==============================================================================
check_azure_login() {
    log_info "Checking Azure login status..."
    if ! az account show &> /dev/null; then
        log_warning "Not logged in to Azure. Initiating login..."
        az login --use-device-code
    fi
    log_success "Logged in to Azure"
}

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl found"
}

get_and_store_connection_string() {
    log_info "Fetching Connection String for Application Insights: ${APP_INSIGHTS_NAME}..."

    CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "connectionString" -o tsv 2>/dev/null)

    if [ -z "$CONNECTION_STRING" ]; then
        log_error "Could not retrieve Connection String."
        log_error "Please check if the Application Insights resource '${APP_INSIGHTS_NAME}' exists in resource group '${RESOURCE_GROUP}'."
        exit 1
    fi

    log_success "Successfully retrieved Connection String."

    log_info "Creating/Updating Kubernetes secret '${SECRET_NAME}' in namespace '${NAMESPACE}'..."

    kubectl create secret generic "${SECRET_NAME}" \
        --namespace "${NAMESPACE}" \
        --from-literal="${SECRET_KEY}=${CONNECTION_STRING}" \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "Kubernetes secret '${SECRET_NAME}' has been created/updated."

    echo ""
    log_warning "IMPORTANT:"
    echo "  1️⃣ The Connection String has been stored in a Kubernetes secret: ${SECRET_NAME}"
    echo "  2️⃣ To enable Application Insights in your backend deployment:"
    echo "      - Open file: k8s/backend-deployment.yaml"
    echo "      - Uncomment the following lines:"
    echo "            - secretRef:"
    echo "                name: monitoring-secrets"
    echo "      - Then reapply your deployment:"
    echo "            kubectl apply -f k8s/backend-deployment.yaml"
    echo ""
    log_success "You're all set 🎉"
}

main() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}     Retrieve Azure Application Insights Connection String               ${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    check_kubectl
    check_azure_login
    get_and_store_connection_string
    
}

main "$@"

if [ -t 0 ]; then
    echo "🎉 Script finished. Press Enter to exit..."
    read
fi