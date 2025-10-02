set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

echo -e "${BLUE}=========================================================================${NC}"
echo -e "${BLUE}          Deploying MindX Application to Kubernetes${NC}"
echo -e "${BLUE}=========================================================================${NC}"
echo ""

cd ../k8s

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl found"
}

create_namespace() {
    log_info "Creating Kubernetes namespace 'mindx'..."
    kubectl apply -f namespace.yaml
    log_success "Namespace created"
}

create_secret() {
    log_info "Creating Docker registry secret..."
    kubectl apply -f secret.yaml
    log_success "Secret created"
}

deploy_backend() {
    log_info "Deploying backend..."
    kubectl apply -f backend-deployment.yaml
    log_success "Backend deployed"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    kubectl apply -f frontend-deployment.yaml
    log_success "Frontend deployed"
}