# Step 1: AI Chat Integration - Complete ✅

## Hoàn thành những gì

✅ **Backend:**

- Tích hợp Google Gemini AI thông qua LangChain
- API endpoint: `/api/ai/chat/stream` (streaming only - keep simple!)
- Real-time streaming với Server-Sent Events (SSE)
- Error handling và logging
- Monitoring với App Insights

✅ **Frontend:**

- AI service với streaming support
- Custom hook `useAIChat` để quản lý chat state
- ChatPanel component với real-time streaming
- Navigation link "AI Chat" trong header
- Error handling và loading states

✅ **Deployment:**

- K8s configs đã có GOOGLE_AI_API_KEY
- ConfigMap đã có AI model settings

## Cách test local

### 1. Setup Backend

```bash
cd backend

# Tạo file .env từ env.example
cp env.example .env

# Cập nhật các giá trị cần thiết trong .env:
# - GOOGLE_AI_API_KEY: Lấy từ https://aistudio.google.com/apikey
# - Các secrets khác (JWT, database, redis...)

# Install dependencies (nếu chưa có)
npm install

# Start backend
npm run dev
```

Backend sẽ chạy ở `http://localhost:3000`

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies (nếu chưa có)
npm install

# Start frontend
npm run dev
```

Frontend sẽ chạy ở `http://localhost:5173`

### 3. Test AI Chat

1. Đăng nhập vào ứng dụng
2. Click vào "AI Chat" trong navigation
3. Gửi một tin nhắn test: "Hello, how are you?"
4. Xem AI response streaming real-time

### 4. Verify Monitoring

- Check console logs trong backend để xem AI events
- Metrics được track: `ai_chat_completion`, `ai_streaming_completion`
- Errors được track tự động qua telemetryService

## Deploy lên AKS

### 1. Cập nhật Backend Secret

```bash
# Edit backend-secret.yaml (không commit file này)
kubectl apply -f k8s/backend-secret.yaml
```

Đảm bảo `GOOGLE_AI_API_KEY` đã được set trong secret.

### 2. Build & Deploy

```bash
# Build và push Docker images
cd backend
docker build -t <your-registry>/mindx-backend:latest .
docker push <your-registry>/mindx-backend:latest

cd ../frontend
docker build -t <your-registry>/mindx-frontend:latest .
docker push <your-registry>/mindx-frontend:latest

# Apply K8s configs
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n mindx-app

# Check logs
kubectl logs -n mindx-app <backend-pod-name>

# Test AI endpoint
curl -X GET https://your-domain.mindx.edu.vn/api/ai/config \
  -H "Authorization: Bearer <your-token>"
```

## Monitoring Metrics

### App Insights Events

- `ai_chat_completion`: Standard chat completions
- `ai_streaming_completion`: Streaming chat completions
- `ai_chat_error`: AI errors
- `ai_streaming_error`: Streaming errors

### Google Analytics Events

- `ai_chat_start`: User starts chat
- `ai_chat_complete`: AI response complete
- `ai_chat_error`: Chat errors

## Files Created/Modified

### Backend

- ✅ `src/controllers/ai.controller.ts`
- ✅ `src/services/ai.service.ts`
- ✅ `src/routes/ai.routes.ts`
- ✅ `src/types/ai.types.ts`
- ✅ `src/config/config.ts` (updated)
- ✅ `package.json` (updated với @langchain/google-genai)

### Frontend

- ✅ `src/services/ai.ts`
- ✅ `src/hooks/use-ai-chat.ts`
- ✅ `src/components/chat-panel.tsx` (updated)
- ✅ `src/screens/chat.tsx`
- ✅ `src/constants.ts` (updated)

### K8s

- ✅ `k8s/backend-secret.example.yaml` (updated)
- ✅ `k8s/backend-configmap.yaml` (updated)

## Troubleshooting

### Backend không kết nối được AI

```bash
# Check API key
echo $GOOGLE_AI_API_KEY

# Check backend logs
tail -f backend/logs/*.log
```

### Frontend không nhận được streaming response

- Check browser console cho errors
- Verify access token trong request headers
- Check backend logs cho streaming errors

### CORS errors

- Verify FRONTEND_URL trong backend .env
- Check CORS settings trong backend config

## Next Steps (Step 2)

Sau khi Step 1 hoàn thành và test OK:

1. Vector Database + RAG
2. MCP Tool Framework
3. Agent Coordination

Tham khảo `docs/plans/week-3/tasks.md` cho chi tiết Step 2.

---

**Status:** ✅ Ready for testing and deployment
**Date:** 2025-10-18
