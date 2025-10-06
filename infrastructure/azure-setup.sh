# set -e
# set -u

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

check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        log_info "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    log_success "Azure CLI found"
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

install_azure_extensions() {
    log_info "Checking for required Azure CLI extensions..."
    
    # Check for application-insights extension
    if ! az extension show --name application-insights &> /dev/null; then
        log_warning "Azure CLI extension 'application-insights' not found. Installing now..."
        az extension add --name application-insights --yes
        log_success "Extension 'application-insights' installed."
    else
        log_info "Extension 'application-insights' is already installed."
    fi
}

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
    
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
    log_info "ACR Login Server: $ACR_LOGIN_SERVER"
    
    log_info "Enabling ACR admin user..."
    az acr update --name "$ACR_NAME" --admin-enabled true
    log_success "ACR admin user enabled"
}

create_log_analytics_workspace() {
    log_info "Creating Log Analytics Workspace: $LOG_ANALYTICS_WORKSPACE_NAME..."

    if az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP" --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" &> /dev/null; then
        log_warning "Log Analytics Workspace '$LOG_ANALYTICS_WORKSPACE_NAME' already exists. Skipping creation."
    else
        az monitor log-analytics workspace create \
            --resource-group "$RESOURCE_GROUP" \
            --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" \
            --location "$LOCATION" \
            --sku PerGB2018 \
            --retention-time 30
        log_success "Log Analytics Workspace created successfully"
    fi
}

create_app_insights() {
    log_info "Creating Application Insights: $APP_INSIGHTS_NAME..."

    WORKSPACE_ID=$(az monitor log-analytics workspace show \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$LOG_ANALYTICS_WORKSPACE_NAME" \
        --query id -o tsv)

    if az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "Application Insights '$APP_INSIGHTS_NAME' already exists. Skipping creation."
    else
        az monitor app-insights component create \
            --app "$APP_INSIGHTS_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --workspace "$WORKSPACE_ID" \
            --application-type web \
            --kind web
        log_success "Application Insights created successfully"
    fi
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
    echo "Log Analytics Workspace: $LOG_ANALYTICS_WORKSPACE_NAME"
    echo "Application Insights: $APP_INSIGHTS_NAME"
    echo "AKS Node Count: $AKS_NODE_COUNT"
    echo "AKS Node Size: $AKS_NODE_SIZE"
    echo ""
    echo "================================================="
    echo ""
}

main() {
    check_azure_cli
    check_azure_login
    install_azure_extensions
    create_resource_group
    create_log_analytics_workspace
    create_app_insights
    create_acr
    create_aks
    get_aks_credentials
    print_summary
}

main "$@"

echo "🎉 Script finished. Press Enter to exit..."
read