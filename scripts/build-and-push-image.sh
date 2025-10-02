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

# Load environment variables
if [ -f ../.env ]; then
    source ../.env
else
    log_error ".env file not found!"
    exit 1
fi


echo -e "${BLUE}=========================================================================${NC}"
echo -e "${BLUE}          Building and Pushing Docker Images to ACR${NC}"
echo -e "${BLUE}=========================================================================${NC}"
echo ""

# Login to ACR
echo -e "${BLUE}🔐 Logging into Azure Container Registry...${NC}"
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin
echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# Build and push backend
echo -e "${BLUE}=========================================================================${NC}"
echo -e "${BLUE}🔨 Building Backend Image...${NC}"
echo -e "${BLUE}=========================================================================${NC}"
cd ../backend
docker build -t "$ACR_LOGIN_SERVER/backend:latest" .
docker build -t "$ACR_LOGIN_SERVER/backend:$(date +%Y%m%d-%H%M%S)" .

echo -e "${BLUE}📤 Pushing Backend Image to ACR...${NC}"
docker push "$ACR_LOGIN_SERVER/backend:latest"
echo -e "${GREEN}✅ Backend image pushed successfully${NC}"
echo ""

# Build and push frontend
echo -e "${BLUE}=========================================================================${NC}"
echo -e "${BLUE}🔨 Building Frontend Image...${NC}"
echo -e "${BLUE}=========================================================================${NC}"
cd ../frontend
docker build -t "$ACR_LOGIN_SERVER/frontend:latest" .
docker build -t "$ACR_LOGIN_SERVER/frontend:$(date +%Y%m%d-%H%M%S)" .

echo -e "${BLUE}📤 Pushing Frontend Image to ACR...${NC}"
docker push "$ACR_LOGIN_SERVER/frontend:latest"
echo -e "${GREEN}✅ Frontend image pushed successfully${NC}"
echo ""

# Summary
echo -e "${BLUE}=========================================================================${NC}"
echo -e "${GREEN}✅ All images built and pushed successfully!${NC}"
echo -e "${BLUE}=========================================================================${NC}"
echo ""
echo "📦 Images pushed to: $ACR_LOGIN_SERVER"
echo "   - backend:latest"
echo "   - frontend:latest"
echo ""
echo "Next steps:"
echo "1. Deploy to Kubernetes: ./scripts/deploy-all.sh"
echo ""

echo "🎉 Script finished. Press Enter to exit..."
read