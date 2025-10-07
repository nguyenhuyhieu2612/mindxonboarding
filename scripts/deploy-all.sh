#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# COLOR DEFINITIONS
# ==============================================================================
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NAMESPACE="mindx-app"
BACKEND_SECRET_NAME="backend-secret"
CONFIGMAP_BACKEND="backend-config"
CONFIGMAP_FRONTEND="frontend-config"

# ==============================================================================
# LOAD ENVIRONMENT VARIABLES
# ==============================================================================
if [ -f ../.env ]; then
    log_info "Loading environment variables from .env..."
    export $(grep -v '^#' ../.env | xargs)
else
    log_error ".env file not found!"
    log_warning "Please create it and define all required secrets."
    exit 1
fi

# ==============================================================================
# VALIDATE REQUIRED VARIABLES
# ==============================================================================
REQUIRED_VARS=(
    OIDC_CLIENT_ID
    OIDC_CLIENT_SECRET
    JWT_SECRET
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET
    REDIS_PASSWORD
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ] || [ "${!var}" == "PLEASE_FILL_ME" ]; then
        log_error "Missing or placeholder value for $var in .env!"
        log_warning "Please update your .env file with valid values."
        exit 1
    fi
done

log_success "✅ All required secrets found in .env"

# ==============================================================================
# CHECK KUBECTL
# ==============================================================================
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed!"
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/ to install it."
        exit 1
    fi
    log_success "kubectl found"
}

# ==============================================================================
# CREATE NAMESPACE
# ==============================================================================
create_namespace() {
    log_info "Creating Kubernetes namespace '${NAMESPACE}'..."
    if kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log_warning "Namespace '${NAMESPACE}' already exists. Skipping creation."
        return
    fi

    if [ ! -f namespace.yaml ]; then
        log_error "namespace.yaml not found!"
        exit 1
    fi

    kubectl apply -f namespace.yaml
    log_success "Namespace '${NAMESPACE}' created successfully"
}

# ==============================================================================
# CREATE OR UPDATE BACKEND SECRET
# ==============================================================================
create_backend_secret() {
    log_info "Creating or updating backend secret..."

    kubectl create secret generic "${BACKEND_SECRET_NAME}" \
        --namespace "${NAMESPACE}" \
        --from-literal=OIDC_CLIENT_ID="$OIDC_CLIENT_ID" \
        --from-literal=OIDC_CLIENT_SECRET="$OIDC_CLIENT_SECRET" \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
        --from-literal=REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
        --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "Backend secret created or updated successfully"
}

# ==============================================================================
# CONFIGMAPS
# ==============================================================================
create_backend_configmap() {
    log_info "Creating backend ConfigMap..."
    if kubectl get configmap "${CONFIGMAP_BACKEND}" -n "${NAMESPACE}" &> /dev/null; then
        log_warning "ConfigMap '${CONFIGMAP_BACKEND}' already exists. Skipping creation."
        return
    fi

    kubectl apply -f backend-configmap.yaml -n "${NAMESPACE}"
    log_success "Backend ConfigMap created"
}

create_frontend_configmap() {
    log_info "Creating frontend ConfigMap..."
    if kubectl get configmap "${CONFIGMAP_FRONTEND}" -n "${NAMESPACE}" &> /dev/null; then
        log_warning "ConfigMap '${CONFIGMAP_FRONTEND}' already exists. Skipping creation."
        return
    fi

    kubectl apply -f frontend-configmap.yaml -n "${NAMESPACE}"
    log_success "Frontend ConfigMap created"
}

# ==============================================================================
# DEPLOYMENTS
# ==============================================================================
deploy_backend() {
    log_info "Deploying backend..."
    kubectl apply -f backend-deployment.yaml -n "${NAMESPACE}"
    log_success "Backend deployed"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    kubectl apply -f frontend-deployment.yaml -n "${NAMESPACE}"
    log_success "Frontend deployed"
}

# ==============================================================================
# INGRESS
# ==============================================================================
deploy_ingress() {
    log_info "Deploying ingress resources..."
    kubectl apply -f ingress.yaml -n "${NAMESPACE}"
    log_success "Ingress deployed"
}

# ==============================================================================
# SUMMARY
# ==============================================================================
print_summary() {
    echo -e "\n${GREEN}======================================================================${NC}"
    echo -e "${GREEN}         MindX Application Deployment Summary${NC}"
    echo -e "${GREEN}======================================================================${NC}\n"

    log_info "Pods:"
    kubectl get pods -n "${NAMESPACE}"
    echo ""

    log_info "Services:"
    kubectl get svc -n "${NAMESPACE}"
    echo ""

    log_info "Ingress:"
    kubectl get ingress -n "${NAMESPACE}"
    echo ""

    log_success "✅ Deployment completed successfully!"
    log_info "Use the EXTERNAL-IP from the Ingress to access your app."
    echo ""
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
main() {
    echo -e "\n${BLUE}======================================================================${NC}"
    echo -e "${BLUE}         Deploying MindX Application to Kubernetes${NC}"
    echo -e "${BLUE}======================================================================${NC}\n"

    read -p "⚠️  This will deploy to namespace '${NAMESPACE}'. Continue? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_warning "Deployment cancelled."
        exit 0
    fi

    cd ../k8s

    check_kubectl
    create_namespace
    create_backend_secret
    create_backend_configmap
    deploy_backend
    create_frontend_configmap
    deploy_frontend
    deploy_ingress
    print_summary
}

main "$@"

if [ -t 0 ]; then
    echo "🎉 Script finished. Press Enter to exit..."
    read
fi