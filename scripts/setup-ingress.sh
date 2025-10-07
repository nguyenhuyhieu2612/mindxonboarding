#!/usr/bin/env bash
set -euo pipefail

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
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================================== 
# DEFAULT VARIABLES
# ============================================================================== 
INGRESS_NAMESPACE='ingress-nginx'

# ============================================================================== 
# CHECK DEPENDENCIES
# ============================================================================== 
check_requirements() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install it first."
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl found"

    if ! command -v helm &> /dev/null; then
        log_error "Helm not found. Please install Helm first."
        log_info "Visit: https://helm.sh/docs/intro/install/"
        exit 1
    fi
    log_success "Helm found"
}

# ============================================================================== 
# ADD HELM REPOSITORIES
# ============================================================================== 
add_helm_repos() {
    log_info "Adding Helm repositories..."
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    log_success "Helm repositories added"
}

# ============================================================================== 
# INSTALL NGINX INGRESS CONTROLLER
# ============================================================================== 
install_nginx_ingress() {
    log_info "Installing Nginx Ingress Controller into namespace '${INGRESS_NAMESPACE}'..."
    
    kubectl create namespace "${INGRESS_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace "${INGRESS_NAMESPACE}" \
        --set controller.replicaCount=2 \
        --set controller.nodeSelector."kubernetes\.io/os"=linux \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz \
        --set controller.service.externalTrafficPolicy=Local \
        --wait
    
    log_success "Nginx Ingress Controller installed"
    
    log_info "Waiting for external IP address..."
    kubectl wait --namespace "${INGRESS_NAMESPACE}" \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=120s

    log_info "Giving Kubernetes a few seconds to assign the IP..."
    sleep 15

    EXTERNAL_IP=$(kubectl get service -n "${INGRESS_NAMESPACE}" ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_warning "External IP not yet assigned. It may take a few minutes."
        log_info "Run: kubectl get svc -n ${INGRESS_NAMESPACE} ingress-nginx-controller --watch"
    else
        echo ""
        log_success "External IP assigned: ${EXTERNAL_IP}"
        echo ""
        echo -e "${YELLOW}IMPORTANT:${NC} Configure your DNS records:"
        echo "  your-domain.com         A    ${EXTERNAL_IP}"
        echo "  api.your-domain.com     A    ${EXTERNAL_IP}"
        echo ""
    fi
}

# ============================================================================== 
# PRINT SUMMARY
# ============================================================================== 
print_summary() {
    echo ""
    echo -e "${GREEN}=========================================================================${NC}"
    echo -e "${GREEN}                 NGINX Ingress Controller Setup Completed                ${NC}"
    echo -e "${GREEN}=========================================================================${NC}"
    echo ""
    kubectl get pods -n "${INGRESS_NAMESPACE}"
    echo ""
    kubectl get svc -n "${INGRESS_NAMESPACE}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Point your domain DNS A record to the external IP above."
    echo "2. (Optional) Install cert-manager for SSL certificates:"
    echo "      helm install cert-manager jetstack/cert-manager \\"
    echo "          --namespace cert-manager \\"
    echo "          --create-namespace \\"
    echo "          --set installCRDs=true"
    echo ""
}

main() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}          Setting Up Nginx Ingress Controller          ${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    check_requirements
    add_helm_repos
    install_nginx_ingress
    print_summary
}

main

if [ -t 0 ]; then
    echo "🎉 Script finished. Press Enter to exit..."
    read
fi
