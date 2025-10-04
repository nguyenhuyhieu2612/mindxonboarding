# set -e

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
    log_info "Creating Kubernetes namespace 'mindx-app'..."

    if kubectl get namespace mindx-app &> /dev/null; then
        log_warning "Namespace 'mindx-app' already exists. Skipping creation."
        return
    fi

    kubectl apply -f namespace.yaml
    log_success "Namespace created"
}

create_backend_secret() {
    log_info "Creating backend secret..."

    if kubectl get secret backend-secret -n mindx-app &> /dev/null; then
        log_warning "Secret 'backend-secret' already exists in namespace 'mindx-app'. Skipping creation."
        return
    fi

    kubectl apply -f backend-secret.yaml -n mindx-app
    log_success "Backend secret created"
}

create_backend_configmap() {
    log_info "Creating backend configmap..."

    if kubectl get configmap backend-config -n mindx-app &> /dev/null; then
        log_warning "ConfigMap 'backend-config' already exists in namespace 'mindx-app'. Skipping creation."
        return
    fi

    kubectl apply -f backend-configmap.yaml -n mindx-app
    log_success "Backend configmap created"
}

deploy_backend() {
    log_info "Deploying backend..."
    kubectl apply -f backend-deployment.yaml
    log_success "Backend deployed"
}

create_frontend_configmap() {
    log_info "Creating frontend configmap..."

    if kubectl get configmap frontend-config -n mindx-app &> /dev/null; then
        log_warning "ConfigMap 'frontend-config' already exists in namespace 'mindx-app'. Skipping creation."
        return
    fi

    kubectl apply -f frontend-configmap.yaml -n mindx-app
    log_success "Backend configmap created"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    kubectl apply -f frontend-deployment.yaml
    log_success "Frontend deployed"
}

deploy_ingress() {
    log_info "Deploying Ingress resources..."
    kubectl apply -f ingress.yaml
    log_success "Ingress resources deployed"
}

print_summary() {
    echo -e "${GREEN}=========================================================================${NC}"
    echo -e "${GREEN}          MindX Application Deployed Successfully!${NC}"
    echo -e "${GREEN}=========================================================================${NC}"
    echo ""
    log_info "Pods: "
    kubectl get pods -n mindx-app
    echo ""

    log_info "Services: "
    kubectl get svc -n mindx-app
    echo ""

    log_info "Ingress: "
    kubectl get ingress -n mindx-app
    echo ""    
    log_info "To access the application, use the EXTERNAL-IP from the Ingress resource."
}

main() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}          Deploying MindX Application to Kubernetes${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    check_kubectl
    create_namespace
    # create_backend_secret
    # create_backend_configmap
    # deploy_backend
    # create_frontend_configmap
    # deploy_frontend
    # deploy_ingress
    # print_summary
}

main

echo "🎉 Script finished. Press Enter to exit..."
read

