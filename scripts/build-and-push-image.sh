#!/usr/bin/env bash
set -euo pipefail

# ===============================
# Color & Logging
# ===============================
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ===============================
# Load .env
# ===============================
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    log_success "Loaded environment variables from $ENV_FILE"
else
    log_error ".env file not found!"
    exit 1
fi

REQUIRED_VARS=(ACR_USERNAME ACR_PASSWORD ACR_LOGIN_SERVER)
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ] || [ "${!var}" == "PLEASE_FILL_ME" ]; then
        log_error "Missing or invalid value for $var!"
        exit 1
    fi
done

# ===============================
# Check Docker & Login
# ===============================
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found! Please install it first."
        exit 1
    fi
}

acr_login() {
    log_info "Logging into ACR..."
    echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin
    log_success "Logged into ACR"
}

# ===============================
# Build & Push Functions
# ===============================
build_backend() {
    log_info "Building backend..."
    cd ../backend
    docker build -t "$ACR_LOGIN_SERVER/backend:latest" -t "$ACR_LOGIN_SERVER/backend:$TIMESTAMP_TAG" .
    cd ../scripts
    log_success "Backend built successfully"
}

push_backend() {
    log_info "Pushing backend..."
    docker push "$ACR_LOGIN_SERVER/backend:latest"
    docker push "$ACR_LOGIN_SERVER/backend:$TIMESTAMP_TAG"
    log_success "Backend pushed"
}

build_frontend() {
    log_info "Building frontend..."
    cd ../frontend
    docker build -t "$ACR_LOGIN_SERVER/frontend:latest" -t "$ACR_LOGIN_SERVER/frontend:$TIMESTAMP_TAG" .
    cd ../scripts
    log_success "Frontend built successfully"
}

push_frontend() {
    log_info "Pushing frontend..."
    docker push "$ACR_LOGIN_SERVER/frontend:latest"
    docker push "$ACR_LOGIN_SERVER/frontend:$TIMESTAMP_TAG"
    log_success "Frontend pushed"
}

# ===============================
# Summary
# ===============================
print_summary() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}                  Build & Push Summary                      ${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
    log_info "Backend Image : $ACR_LOGIN_SERVER/backend:$TIMESTAMP_TAG"
    log_info "Frontend Image: $ACR_LOGIN_SERVER/frontend:$TIMESTAMP_TAG"
    echo ""
    log_success "✅ All images built and pushed successfully!"
}

# ===============================
# Main
# ===============================
main() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}   Build & Push Docker Images to Azure Container Registry    ${NC}"
    echo -e "${BLUE}============================================================${NC}\n"

    TIMESTAMP_TAG=$(date +%Y%m%d-%H%M%S)
    export TIMESTAMP_TAG

    check_docker
    acr_login
    build_backend
    push_backend
    build_frontend
    push_frontend
    print_summary
}

main "$@"

if [ -t 0 ]; then
    echo "🎉 Script finished. Press Enter to exit..."
    read
fi