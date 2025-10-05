set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

add_helm_repos() {
    log_info "Adding Helm repositories..."

    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm first."
        log_info "Visit: https://helm.sh/docs/intro/install/"
        exit 1
    fi

    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo update

    log_success "Helm repositories added"
}

install_nginx_ingress() {
    log_info "Installing Nginx Ingress Controller..."
    
    kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -
    
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --set controller.replicaCount=2 \
        --set controller.nodeSelector."kubernetes\.io/os"=linux \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz \
        --set controller.service.externalTrafficPolicy=Local \
        --wait
    
    log_success "Nginx Ingress Controller installed"
    
    log_info "Waiting for external IP address..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=120s
    
    sleep 10
    
    EXTERNAL_IP=$(kubectl get service -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_warning "External IP not yet assigned. It may take a few minutes."
        log_info "Run: kubectl get svc -n ingress-nginx ingress-nginx-controller --watch"
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

print_summary() {
    echo ""
    log_success "Ingress setup completed!"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure your DNS records to point to the external IP address."
    echo "2. Install cert-manager for managing SSL certificates."
    echo "3. Create Ingress resources for your applications."
    echo ""
}

main() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}          Setting Up Nginx Ingress Controller          ${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    add_helm_repos
    install_nginx_ingress
    print_summary
}

main

echo "🎉 Script finished. Press Enter to exit..."
read