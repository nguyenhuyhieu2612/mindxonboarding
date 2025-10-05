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

DOMAIN_NAME=hieunh01.mindx.edu.vn
NAMESPACE=mindx-app

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        log_info "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl found"
}

get_ingress_ip() {
    log_info "Fetching Ingress external IP address..."
    EXTERNAL_IP=$(kubectl get service -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_error "Could not get Ingress external IP. Is the Ingress Controller installed and running?"
        log_info "You can install it by running 'setup-ingress.sh'."
        exit 1
    fi
    
    log_success "Ingress External IP: ${EXTERNAL_IP}"
    echo ""
    log_warning "IMPORTANT: Please ensure you have an 'A' record in your DNS provider:"
    echo -e "${YELLOW}  ${DOMAIN_NAME}    A    ${EXTERNAL_IP}${NC}"
    echo ""
    read -p "Press [Enter] to continue after you have configured the DNS record..."
}

apply_cluster_issuer() {
    log_info "Applying ClusterIssuer..."
    
    if kubectl get clusterissuer letsencrypt-prod &> /dev/null; then
        log_warning "ClusterIssuer 'letsencrypt-prod' already exists. Applying to ensure it's up-to-date."
    fi

    kubectl apply -f ../k8s/certificate/cluster-issuer.yaml
    log_success "ClusterIssuer 'letsencrypt-prod' applied."
}

apply_certificate() {
    log_info "Applying Certificate for domain: ${DOMAIN_NAME}..."

    if kubectl get certificate mindx-app-tls -n ${NAMESPACE} &> /dev/null; then
        log_warning "Certificate 'mindx-app-tls' already exists. Applying to ensure it's up-to-date."
    fi

    kubectl apply -f ../k8s/certificate/certificate.yaml
    log_success "Certificate 'mindx-app-tls' applied."
}

wait_for_certificate() {
    log_info "Waiting for the certificate to be issued by Let's Encrypt..."
    log_info "This can take a few minutes. Cert-manager is solving the HTTP-01 challenge."
    
    # Wait for the certificate to be ready
    if ! kubectl wait --for=condition=Ready certificate/mindx-app-tls -n ${NAMESPACE} --timeout=5m; then
        log_error "Certificate issuance timed out."
        echo ""
        log_info "Troubleshooting steps:"
        echo "1. Check cert-manager pod logs: kubectl logs -n cert-manager -l app=cert-manager"
        echo "2. Describe the certificate: kubectl describe certificate mindx-app-tls -n ${NAMESPACE}"
        echo "3. Describe the order: kubectl describe order -n ${NAMESPACE} -l cert-manager.io/certificate-name=mindx-app-tls"
        echo "4. Check if your DNS record for ${DOMAIN_NAME} points to ${EXTERNAL_IP}"
        exit 1
    fi

    log_success "Certificate for ${DOMAIN_NAME} has been issued successfully!"
}

print_summary() {
    echo ""
    log_success "SSL Certificate Setup Completed!"
    echo ""
    log_info "Certificate Status:"
    kubectl get certificate mindx-app-tls -n ${NAMESPACE}
    echo ""
    log_info "TLS Secret created:"
    kubectl get secret mindx-app-tls-secret -n ${NAMESPACE}
    echo ""
    log_warning "Next Step: Update your Ingress resource to use this TLS secret."
}

main() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}          Setting Up SSL Certificate with Cert-Manager & Let's Encrypt   ${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""

    check_kubectl
    get_ingress_ip
    apply_cluster_issuer
    apply_certificate
    wait_for_certificate
    print_summary
}

main

echo "🎉 Script finished. Press Enter to exit..."
read
