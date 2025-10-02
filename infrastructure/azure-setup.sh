# set -e  # Exit on error
set -u  # Exit on undefined variable

PROJECT_NAME="mindx"
ENVIRONMENT="onboarding"
LOCATION="eastus"

if az group show --name "mindx-hieunh01-rg" &> /dev/null; then
    RESOURCE_GROUP="mindx-hieunh01-rg"
else
    RESOURCE_GROUP="${PROJECT_NAME}-${ENVIRONMENT}-rg"
fi
ACR_NAME="${PROJECT_NAME}${ENVIRONMENT}acr" 
AKS_NAME="${PROJECT_NAME}-${ENVIRONMENT}-aks"
AKS_NODE_COUNT=2
AKS_NODE_SIZE="Standard_D2s_v3"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        log_info "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    log_success "Azure CLI found"
}

log_out_from_company_account() {
    log_info "Logging out from any existing Azure account..."
    az logout
    log_success "Logged out successfully"
}

check_azure_login() {
    log_info "Checking Azure login status..."
    if ! az account show &> /dev/null; then
        log_warning "Not logged in to Azure. Initiating login..."
        az login --use-device-code
    fi
    
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    log_success "Logged in to Azure"
    log_info "Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
}

# =============================================================================
# MAIN SETUP FUNCTIONS
# =============================================================================

create_resource_group() {
    log_info "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
    
    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "Resource Group already exists. Skipping creation."
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --tags Environment="$ENVIRONMENT" Project="$PROJECT_NAME"
        log_success "Resource Group created successfully"
    fi
}

create_acr() {
    log_info "Creating Azure Container Registry: $ACR_NAME..."
    
    if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "ACR already exists. Skipping creation."
    else
        az acr create \
            --name "$ACR_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --sku Basic \
            --admin-enabled true
        log_success "ACR created successfully"
    fi
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
    log_info "ACR Login Server: $ACR_LOGIN_SERVER"
    
    # Enable admin user for easier authentication (for development)
    log_info "Enabling ACR admin user..."
    az acr update --name "$ACR_NAME" --admin-enabled true
    log_success "ACR admin user enabled"
}

create_aks() {
    log_info "Creating Azure Kubernetes Service: $AKS_NAME..."
    log_info "This may take a while. Please be patient..."
    
    if az aks show --name "$AKS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "AKS cluster already exists. Skipping creation."
    else
        az aks create \
            --name "$AKS_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --node-count "$AKS_NODE_COUNT" \
            --node-vm-size "$AKS_NODE_SIZE" \
            --enable-managed-identity \
            --attach-acr "$ACR_NAME" \
            --network-plugin azure \
            --ssh-key-value "$HOME/.ssh/id_rsa_aks.pub" \
            --tags Environment="$ENVIRONMENT" Project="$PROJECT_NAME"
        
        log_success "AKS cluster created successfully"
    fi
}

get_aks_credentials() {
    log_info "Getting AKS credentials and configuring kubectl..."
    
    az aks get-credentials \
        --name "$AKS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --overwrite-existing
    
    log_success "kubectl configured successfully"
    
    # Verify connection
    log_info "Verifying AKS connection..."
    kubectl cluster-info
    kubectl get nodes
    log_success "AKS cluster is accessible"
}

print_summary() {
    echo ""
    echo "==================== SUMMARY ===================="
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Location: $LOCATION"
    echo "ACR Name: $ACR_NAME"
    echo "ACR Login Server: $ACR_LOGIN_SERVER"
    echo "AKS Name: $AKS_NAME"
    echo "AKS Node Count: $AKS_NODE_COUNT"
    echo "AKS Node Size: $AKS_NODE_SIZE"
    echo ""
    echo "================================================="
    echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    check_azure_cli
    check_azure_login
    create_resource_group
    create_acr
    create_aks
    get_aks_credentials
    print_summary
}

main "$@"

echo "🎉 Script finished. Press Enter to exit..."
read