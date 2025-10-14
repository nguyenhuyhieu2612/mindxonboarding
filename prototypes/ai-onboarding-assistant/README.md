# AI Onboarding Assistant - Prototype

**Author:** Nguyễn Huy Hiếu  
**Created:** October 8, 2025  
**Status:** Phase 1 Prototype (Week 2)  
**Version:** 0.1.0

---

## 🎯 Overview

AI Onboarding Assistant is an intelligent tool that combines visual guided workflows with an AI-powered chatbot to help new team members self-onboard effectively. The system provides step-by-step guidance, suggests proper questions, and delivers accurate answers through Prompt Refinement, Retriever Validation, and context tracking.

### Key Features

- **📋 Task-Based Onboarding Flow:** Break down complex onboarding into manageable micro-tasks
- **🤖 Context-Aware AI Chatbot:** RAG-powered Q&A that understands your current task
- **✨ Prompt Refinement:** Learn how to ask AI the right questions
- **📊 Progress Tracking:** Monitor completion and identify bottlenecks
- **🎓 Learning from AI:** Improve your prompting skills

---

## 🚀 Quick Start

### Prerequisites

**Backend:**

- Python 3.10+
- OpenAI API key
- pip or poetry for package management

**Frontend:**

- Node.js 18+
- npm or yarn

### Installation

#### 1. Clone Repository

```bash
cd prototypes/ai-onboarding-assistant
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

#### 3. Initialize Vector Database

```bash
# Still in backend directory
python scripts/ingest_documents.py
```

This will:

- Load onboarding documents from `data/` directory
- Create embeddings using OpenAI
- Store in ChromaDB for fast semantic search

#### 4. Start Backend Server

```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

#### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Set API URL
cp .env.example .env
# VITE_API_URL=http://localhost:8000
```

#### 6. Start Frontend

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 📁 Project Structure

```
prototypes/ai-onboarding-assistant/
│
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── chatbot.py     # Chatbot endpoints
│   │   │   ├── tasks.py       # Task management
│   │   │   └── progress.py    # Progress tracking
│   │   ├── core/              # Core functionality
│   │   │   ├── config.py      # Configuration
│   │   │   ├── rag.py         # RAG implementation
│   │   │   └── prompts.py     # Prompt templates
│   │   ├── models/            # Pydantic models
│   │   └── services/          # Business logic
│   ├── data/                  # Onboarding documents
│   │   └── mindx_onboarding/  # MindX Week 1 & 2 docs
│   ├── scripts/               # Utility scripts
│   │   └── ingest_documents.py
│   ├── main.py                # FastAPI app entry
│   └── requirements.txt
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── TaskList.tsx   # Task navigation
│   │   │   ├── Chatbot.tsx    # Chat interface
│   │   │   └── ProgressBar.tsx
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx            # Main component
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                       # Documentation
│   ├── PROPOSAL.md            # Full proposal
│   ├── ARCHITECTURE.md        # Technical design
│   ├── USER_GUIDE.md          # How to use
│   └── API.md                 # API reference
│
├── tests/                      # Test files
│   ├── backend/
│   └── frontend/
│
└── README.md                   # This file
```

---

## 🎮 Usage Guide

### For New Members

#### Step 1: Start Your Onboarding Journey

1. Open the application
2. You'll see a list of onboarding tasks from MindX Week 1 & 2
3. Click on the first task to begin

#### Step 2: Follow Task Instructions

- Read the task description
- Complete each step
- Mark as "In Progress" or "Completed"

#### Step 3: Ask Questions Anytime

- Use the chatbot on the right side
- Type your question naturally
- The AI will suggest a better prompt if needed
- Confirm or modify the suggested prompt
- Get context-aware answers based on your current task

#### Step 4: Learn from Prompt Refinement

- Pay attention to how AI refines your questions
- Learn the pattern of effective prompts
- Apply this to future questions

### For Mentors

#### Monitor Progress

1. Access mentor dashboard (coming in Phase 2)
2. See completion status of all new members
3. Identify who needs additional help

#### Review Flagged Questions

1. Check questions with low confidence answers
2. Provide correct answer
3. System learns from your corrections

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Vector Database
CHROMA_PERSIST_DIRECTORY=./chroma_db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS (for development)
CORS_ORIGINS=["http://localhost:5173"]
```

**Frontend (.env):**

```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="AI Onboarding Assistant"
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Manual Testing Checklist

- [ ] Load task list successfully
- [ ] Navigate between tasks
- [ ] Mark tasks as complete
- [ ] Ask question in chatbot
- [ ] Receive prompt refinement suggestion
- [ ] Accept/reject suggested prompt
- [ ] Get context-aware answer
- [ ] View progress percentage
- [ ] Check answer confidence score

---

## 📊 Metrics Tracked

The prototype collects the following metrics:

| Metric                    | Description                 | Target          |
| ------------------------- | --------------------------- | --------------- |
| Questions per user/day    | Average daily questions     | 2-3 questions   |
| Questions per user/week   | Average weekly questions    | 15-20 questions |
| Return rate               | % users who use >1 time     | >80%            |
| Multi-question engagement | % users asking >2 questions | >70%            |
| Answer helpfulness        | % positive feedback         | >80%            |
| Task completion rate      | % tasks completed           | Track baseline  |
| Average time per task     | Time to complete each task  | Track baseline  |

---

## 🐛 Troubleshooting

### Backend Issues

**Issue:** `ModuleNotFoundError: No module named 'langchain'`

```bash
pip install -r requirements.txt
```

**Issue:** `OpenAI API key not found`

```bash
# Verify .env file exists
cat .env | grep OPENAI_API_KEY

# Or set temporarily
export OPENAI_API_KEY=sk-your-key-here
```

**Issue:** `ChromaDB not initialized`

```bash
# Reinitialize database
python scripts/ingest_documents.py --force
```

### Frontend Issues

**Issue:** `Cannot connect to backend`

```bash
# Check if backend is running
curl http://localhost:8000/health

# Verify VITE_API_URL in .env
```

**Issue:** `Module not found`

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 Roadmap

### ✅ Phase 1

- Basic task navigation
- RAG chatbot with context awareness
- Prompt refinement feature
- Simple progress tracking
- ChromaDB integration

### 🚧 Phase 2 (Week 3: Days 1-5) - **CORE MVP**

**MUST HAVE (Core value):**
- ✅ Task navigation from markdown
- ✅ RAG chatbot with context awareness
- ✅ Prompt refinement suggestions
- ✅ Basic progress tracking
- ✅ Simple multi-user (hardcoded profiles)
- ✅ Error handling & fallbacks

**NICE TO HAVE (If time permits):**
- ⭐ Mentor dashboard (simple)
- ⭐ User feedback collection
- ⭐ Better UI/UX polish

### 🔮 Phase 3 (Week 3-4: Days 6-10) - **PILOT & VALIDATE**

**Week 3-4 Focus:**
- Pilot with 5-10 real users
- Measure actual time savings
- Validate core value proposition
- Decide: scale up or adjust

**Post 1.5 weeks (if validated):**
- Vietnamese language support
- Production vector DB
- Advanced analytics
- Slack integration
- Gamification
- Mobile responsiveness

---

## 🤝 Contributing

This is a prototype project. Contributions and feedback are welcome!

### How to Contribute

1. **Report Issues:** Use GitHub Issues for bug reports
2. **Suggest Features:** Open feature request issues
3. **Submit Feedback:** Share your onboarding experience
4. **Code Contributions:** Fork, develop, and submit PR

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Test locally before submitting

---

## 📝 Documentation

- [Full Proposal](docs/PROPOSAL.md) - Detailed problem statement and solution
- [Architecture](docs/ARCHITECTURE.md) - Technical design and data flow
- [User Guide](docs/USER_GUIDE.md) - Complete usage instructions
- [API Reference](docs/API.md) - Backend API documentation

---

## 📄 License

This is a prototype project for MindX Engineer Onboarding Program Week 2.

---

## 👤 Contact

**Author:** Nguyễn Huy Hiếu  
**Email:** [Your Email]  
**Project:** MindX Engineer Onboarding - Week 2

---

## 🙏 Acknowledgments

- MindX Education for the onboarding program framework
- OpenAI for GPT-4 API
- LangChain community for RAG components
- All team members who provided feedback

---

**Note:** This is a Phase 1 prototype (3-4 days development). Features are intentionally limited to demonstrate core concepts. Full production implementation requires additional development time and resources.
