# AI Onboarding Assistant - Architecture

**Version:** 1.0  
**Last Updated:** October 14, 2025  
**Author:** Nguyễn Huy Hiếu

---

## 🏗️ System Overview

The AI Onboarding Assistant is built as a modern web application with a React frontend and Python FastAPI backend, leveraging OpenAI for AI capabilities and ChromaDB for vector storage.

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │◄───────►│    FastAPI   │◄───────►│   OpenAI API │
│  (React)    │  HTTPS  │   Backend    │   API   │  (GPT-4)     │
└─────────────┘         └──────────────┘         └──────────────┘
                              │  │
                              │  │
                   ┌──────────┘  └──────────┐
                   ▼                         ▼
            ┌─────────────┐          ┌─────────────┐
            │  ChromaDB   │          │ PostgreSQL  │
            │  (Vectors)  │          │  (Data)     │
            └─────────────┘          └─────────────┘
```

---

## 📦 Component Architecture

### Frontend (React + TypeScript)

```
src/
├── components/
│   ├── TaskList.tsx           # Task navigation & progress
│   ├── Chatbot.tsx            # Chat interface
│   ├── PromptRefinement.tsx   # Prompt suggestion UI
│   └── ProgressDashboard.tsx  # Analytics view
│
├── hooks/
│   ├── useTaskProgress.ts     # Track user progress
│   ├── useChatbot.ts          # Chatbot interactions
│   └── usePromptRefine.ts     # Prompt refinement logic
│
├── services/
│   └── api.ts                 # API client (Axios)
│
├── types/
│   ├── task.ts                # Task interfaces
│   ├── chat.ts                # Chat message types
│   └── user.ts                # User data types
│
└── App.tsx                    # Main component
```

**Key Technologies:**
- **React 18+** with TypeScript
- **TailwindCSS** for styling
- **React Router** for navigation
- **TanStack Query** for server state management
- **Zustand** for client state (optional)

### Backend (FastAPI + Python)

```
app/
├── api/
│   ├── chatbot.py             # POST /api/chat
│   ├── tasks.py               # GET /api/tasks, POST /api/tasks/:id/complete
│   ├── progress.py            # GET /api/progress
│   └── users.py               # User management
│
├── core/
│   ├── config.py              # Environment config
│   ├── rag.py                 # RAG implementation
│   ├── prompts.py             # Prompt templates
│   └── refinement.py          # Prompt refinement logic
│
├── models/
│   ├── task.py                # Task Pydantic models
│   ├── chat.py                # Chat request/response models
│   └── user.py                # User models
│
├── services/
│   ├── task_service.py        # Business logic for tasks
│   ├── chat_service.py        # Business logic for chat
│   └── progress_service.py    # Progress tracking
│
└── main.py                    # FastAPI app entry point
```

**Key Technologies:**
- **FastAPI** for web framework
- **LangChain** for RAG orchestration
- **OpenAI API** (GPT-4, embeddings)
- **ChromaDB** for vector storage
- **SQLAlchemy** for ORM (Phase 2)
- **Pydantic** for validation

---

## 🔄 Data Flow

### 1. Task Navigation Flow

```
User clicks task
    ↓
Frontend: GET /api/tasks/:id
    ↓
Backend: Retrieve task details + user context
    ↓
Backend: Mark as current_task for user
    ↓
Frontend: Display task + inject context to chatbot
```

### 2. Chat with RAG Flow

```
User types question
    ↓
Frontend: Show prompt refinement suggestion
    ↓
User confirms refined prompt
    ↓
Frontend: POST /api/chat with {question, context}
    ↓
Backend RAG Pipeline:
    1. Embed question (OpenAI ada-002)
    2. Vector search in ChromaDB (top 5 chunks)
    3. Check similarity scores (confidence check)
    4. If low confidence → flag for review
    5. Construct prompt with context + retrieved docs
    6. Call OpenAI GPT-4
    7. Parse and format response
    ↓
Frontend: Display answer + confidence score
```

### 3. Prompt Refinement Flow

```
User types vague question: "làm sao setup?"
    ↓
Frontend: Detect vague prompt (< 10 words, no specifics)
    ↓
Frontend: POST /api/refine-prompt
    ↓
Backend: Analyze with GPT-4:
    - Current task context
    - Previous questions
    - Common question patterns
    ↓
Backend: Generate refined prompt suggestion
    ↓
Frontend: Show side-by-side comparison
    ↓
User: Confirm or Edit
    ↓
Use refined prompt for actual query
```

---

## 🧠 RAG Implementation Details

### Document Ingestion

```python
# scripts/ingest_documents.py

1. Load markdown files from data/mindx_onboarding/
2. Split into chunks (512 tokens with 50 token overlap)
3. Generate embeddings using OpenAI text-embedding-ada-002
4. Store in ChromaDB with metadata:
   - source_file
   - chunk_id
   - task_id
   - section (Week 1, Week 2, etc.)
```

### Vector Search

```python
# core/rag.py

def retrieve_relevant_docs(question: str, context: dict):
    # 1. Embed question
    query_embedding = openai.embeddings.create(
        input=question,
        model="text-embedding-ada-002"
    )
    
    # 2. Search ChromaDB with filters
    results = chroma_collection.query(
        query_embeddings=[query_embedding],
        n_results=5,
        where={"task_id": context.get("current_task")}  # Filter by task
    )
    
    # 3. Check confidence
    if results[0].distance > 0.7:  # Low similarity
        return {"confidence": "low", "docs": []}
    
    return {"confidence": "high", "docs": results}
```

### Prompt Construction

```python
# core/prompts.py

SYSTEM_PROMPT = """
You are an AI assistant helping new team members with onboarding.

Context:
- User is currently working on: {current_task}
- User profile: {user_role}
- Previous questions: {recent_questions}

Guidelines:
- Provide accurate, step-by-step answers
- Reference specific documentation sections
- Be concise but thorough
- If uncertain, say so and suggest alternatives
"""

USER_PROMPT = """
Based on the following documentation:

{retrieved_docs}

Please answer this question:
{user_question}

If the documentation doesn't contain enough information, 
say so clearly and suggest what the user should do next.
"""
```

---

## 💾 Data Models

### Task Model

```typescript
// frontend/src/types/task.ts

interface Task {
  id: string;
  title: string;
  description: string;
  category: "Week 1" | "Week 2" | "Week 3" | "Week 4";
  order: number;
  estimatedMinutes: number;
  prerequisites: string[];  // Task IDs
  steps: TaskStep[];
  resources: Resource[];
}

interface TaskStep {
  id: string;
  description: string;
  completed: boolean;
}
```

```python
# backend/app/models/task.py

class Task(BaseModel):
    id: str
    title: str
    description: str
    category: str
    order: int
    estimated_minutes: int
    prerequisites: List[str]
    steps: List[TaskStep]
    resources: List[Resource]
```

### Chat Message Model

```typescript
// frontend/src/types/chat.ts

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  confidence?: "high" | "medium" | "low";
  refined_from?: string;  // Original user prompt
  sources?: DocumentSource[];
}
```

### User Progress Model

```python
# backend/app/models/user.py

class UserProgress(BaseModel):
    user_id: str
    current_task_id: Optional[str]
    completed_tasks: List[str]
    task_history: List[TaskHistory]
    total_questions_asked: int
    created_at: datetime
    updated_at: datetime
```

---

## 🔐 Security Considerations

### Phase 1 (Prototype)
- ⚠️ No authentication (single-user demo)
- ⚠️ API key in environment variables only
- ⚠️ CORS open for development

### Phase 2 (Production)
- ✅ JWT-based authentication
- ✅ Role-based access control (User / Mentor / Admin)
- ✅ API key stored in Azure Key Vault
- ✅ CORS restricted to known origins
- ✅ Rate limiting per user
- ✅ Input sanitization and validation
- ✅ Audit logging for sensitive actions

---

## 📈 Scalability Strategy

### Current (Phase 1)
- Local ChromaDB (single instance)
- No caching
- Single backend instance
- Handles: 1-5 concurrent users

### Phase 2 Target
- Pinecone/Weaviate Cloud (distributed)
- Redis caching for common questions
- 2-3 backend replicas
- Handles: 20-50 concurrent users

### Phase 3 Target
- Kubernetes autoscaling (2-10 pods)
- CDN for static assets
- Database connection pooling
- Response caching (Redis)
- Handles: 100+ concurrent users

---

## 🧪 Testing Strategy

### Unit Tests
- **Frontend:** Jest + React Testing Library
- **Backend:** Pytest
- **Coverage Target:** >80%

### Integration Tests
- API endpoint tests with TestClient
- RAG pipeline tests with mock embeddings
- Database integration tests

### E2E Tests
- **Tool:** Playwright
- **Scenarios:**
  - Complete onboarding flow
  - Chat interaction with refinement
  - Progress tracking

---

## 📊 Monitoring & Observability

### Application Insights (Phase 2)
- **Metrics:**
  - API request latency (P50, P95, P99)
  - Error rates by endpoint
  - OpenAI API call latency
  - Vector search performance

- **Custom Events:**
  - `question_asked`
  - `prompt_refined`
  - `low_confidence_detected`
  - `task_completed`

- **Logs:**
  - Structured JSON logs
  - Correlation IDs for request tracing
  - Error stack traces

### Dashboards
- Real-time user activity
- API performance metrics
- OpenAI cost tracking
- User engagement analytics

---

## 🔄 Deployment Pipeline

### Phase 1 (Development)
```bash
# Local deployment
docker-compose up

# Services:
# - frontend: http://localhost:5173
# - backend: http://localhost:8000
# - chromadb: http://localhost:8001
```

### Phase 2 (Production)
```yaml
# CI/CD with GitHub Actions

on: [push]

jobs:
  test:
    - Run unit tests
    - Run integration tests
    
  build:
    - Build Docker images
    - Push to Azure Container Registry
    
  deploy:
    - Deploy to AKS (dev → staging → prod)
    - Run smoke tests
    - Update Application Insights
```

---

## 🚀 Future Enhancements

### Technical
- [ ] GraphQL API for better frontend data fetching
- [ ] WebSocket for real-time chat updates
- [ ] Server-Sent Events for progress streaming
- [ ] Self-hosted LLM evaluation (llama.cpp)
- [ ] Advanced RAG techniques (HyDE, Multi-Query)

### Features
- [ ] Voice input/output
- [ ] Image/diagram analysis
- [ ] Video tutorial integration
- [ ] Code snippet execution sandbox
- [ ] Collaborative onboarding (pair mode)

---

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain RAG Tutorial](https://python.langchain.com/docs/use_cases/question_answering/)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [ChromaDB Guide](https://docs.trychroma.com/)

---

**For detailed API documentation, see [API.md](API.md)**

