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
# LOAD ENVIRONMENT VARIABLES
# ==============================================================================
if [ -f ../.env ]; then
    source ../.env
else
    log_error ".env file not found! Please create it from .env.example"
    exit 1
fi

# ==============================================================================
# SCRIPT VARIABLES
# ==============================================================================

# Kubernetes variables
K8S_NAMESPACE="mindx-app"
K8S_SECRET_NAME="monitoring-secrets"
K8S_SECRET_KEY="APPINSIGHTS_CONNECTION_STRING"

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

    log_info "Creating/Updating Kubernetes secret '${K8S_SECRET_NAME}' in namespace '${K8S_NAMESPACE}'..."

    kubectl create secret generic "${K8S_SECRET_NAME}" \
        --namespace "${K8S_NAMESPACE}" \
        --from-literal="${K8S_SECRET_KEY}=${CONNECTION_STRING}" \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "Kubernetes secret '${K8S_SECRET_NAME}' has been created/updated."

    echo ""
    log_warning "IMPORTANT: The Connection String has been stored in a Kubernetes secret."
    log_info "To use it in your deployment, reference it as an environment variable:"
    echo ""
    echo -e "  env:"
    echo -e "    - name: APPLICATIONINSIGHTS_CONNECTION_STRING"
    echo -e "      valueFrom:"
    echo -e "        secretKeyRef:"
    echo -e "          name: ${K8S_SECRET_NAME}"
    echo -e "          key: ${K8S_SECRET_KEY}"
    echo ""
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