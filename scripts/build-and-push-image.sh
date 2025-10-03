set -e

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

if [ -f ../.env ]; then
    source ../.env
else
    log_error ".env file not found!"
    exit 1
fi

acr_login() {
    log_info "Logging into Azure Container Registry..."

    echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin
    if [ $? -ne 0 ]; then
        log_error "Failed to log in to ACR. Please check your credentials."
        exit 1
    fi

    log_success "Logged into ACR successfully"
}

build_backend() {
    log_info "Building backend Docker image..."

    cd ../backend
    docker build -t "$ACR_LOGIN_SERVER/backend:latest" .
    docker build -t "$ACR_LOGIN_SERVER/backend:$(date +%Y%m%d-%H%M%S)" .

    cd ../scripts
    log_success "Backend Docker image built"
}

push_backend() {
    log_info "Pushing backend Docker image to ACR..."

    docker push "$ACR_LOGIN_SERVER/backend:latest"

    log_success "Backend Docker image pushed to ACR"
}

build_frontend() {
    log_info "Building frontend Docker image..."

    cd ../frontend
    docker build -t "$ACR_LOGIN_SERVER/frontend:latest" .
    docker build -t "$ACR_LOGIN_SERVER/frontend:$(date +%Y%m%d-%H%M%S)" .

    cd ../scripts
    log_success "Frontend Docker image built"
}

push_frontend() {
    log_info "Pushing frontend Docker image to ACR..."

    docker push "$ACR_LOGIN_SERVER/frontend:latest"

    log_success "Frontend Docker image pushed to ACR"
}

print_summary() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}          Deployment Summary           ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    log_info "Backend Image: $ACR_LOGIN_SERVER/backend:latest"
    log_info "Frontend Image: $ACR_LOGIN_SERVER/frontend:latest"
    echo ""
    echo -e "${BLUE}========================================${NC}"
}

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Build and Push Docker Images  ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    acr_login
    build_backend
    push_backend
    build_frontend
    push_frontend
    print_summary

    log_success "All tasks completed successfully!"
}

main

echo "🎉 Script finished. Press Enter to exit..."
read