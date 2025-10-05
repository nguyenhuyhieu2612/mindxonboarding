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

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl found"
}

check_helm() {
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm first."
        log_info "Visit: https://helm.sh/docs/intro/install/"
        exit 1
    fi
    log_success "Helm found"
}

check_cluster_connection() {
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Failed to connect to the Kubernetes cluster."
        log_info "Run: kubectl cluster-info"
        exit 1
    fi
    log_success "Connected to Kubernetes cluster"
}

add_helm_repos() {
    log_info "Adding Helm repositories..."

    helm repo add jetstack https://charts.jetstack.io
    helm repo update

    log_success "Helm repositories added"
}

install_cert_manager() {
    log_info "Installing cert-manager..."

    helm install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --version v1.13.0 \
    --set installCRDs=true \
    --set global.leaderElection.namespace=cert-manager
    
    log_info "Waiting for cert-manager to become ready"
    sleep 10

    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

    log_success "cert-manager installed"
}

print_summary() {
    echo ""
    log_success "Cert-manager setup completed!"
    echo ""
    echo -e "Cert manager pod:"
    kubectl get pods -n cert-manager
    echo ""
    echo -e "Cert manager service:"
    kubectl get svc -n cert-manager
    echo ""
}

main() {    
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}          Setting Up Cert-Manager          ${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    check_kubectl
    check_helm
    check_cluster_connection
    add_helm_repos
    install_cert_manager
    print_summary
}

main

echo "🎉 Script finished. Press Enter to exit..."
read