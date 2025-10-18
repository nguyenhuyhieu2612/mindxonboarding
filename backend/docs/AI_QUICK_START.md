# AI Model Access - Quick Start Guide

⚡ Fast-track guide for setting up AI model access in 5 minutes.

## 🎯 Goal

Get AI chat functionality working in your local development environment.

## ✅ Prerequisites Checklist

- [ ] OpenRouter API key (get from [openrouter.ai](https://openrouter.ai))
- [ ] Backend repository cloned
- [ ] Node.js installed

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key (2 min)

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / Log in
3. Navigate to "API Keys" → "Create API Key"
4. Copy the key (starts with `sk-or-v1-`)

### Step 2: Configure Environment (1 min)

```bash
cd backend
cp env.example .env
```

Edit `.env` and add your API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### Step 3: Install Dependencies (1 min)

```bash
npm install
```

### Step 4: Test It Works (1 min)

```bash
npm run dev
```

Look for:

```
✅ AI Model configured: openai/gpt-3.5-turbo
✅ OpenRouter API connection ready
```

## 🧪 Quick Test

Create `test-ai.ts` in `backend/src`:

```typescript
import {
  testAIConnection,
  generateChatCompletion,
} from "./services/ai.services";

async function test() {
  console.log("Testing AI connection...");
  const isConnected = await testAIConnection();
  console.log("Connected:", isConnected);

  if (isConnected) {
    console.log("\nTesting chat completion...");
    const result = await generateChatCompletion([
      { role: "user", content: "Say 'Hello, MindX!' if you can hear me." },
    ]);
    console.log("Response:", result.content);
    console.log("Tokens used:", result.usage?.totalTokens);
  }
}

test();
```

Run:

```bash
npx ts-node src/test-ai.ts
```

## 🎉 Success!

If you see a response, you're ready to go!

## ❌ Something Wrong?

### Error: "OPENROUTER_API_KEY is required"

→ Check your `.env` file has the key

### Error: "Invalid API key"

→ Verify the key is correct (no extra spaces)

### Error: "Insufficient credits"

→ Add credits to your OpenRouter account

## 📚 Next Steps

1. Read the [Full Setup Guide](./AI_MODEL_ACCESS_SETUP.md)
2. Continue to Task 1.2 - Update API Backend for AI Integration
3. Set up secure secrets for production

## 💰 Cost Warning

⚠️ Set spending limits in OpenRouter dashboard to avoid unexpected charges!

Recommended limits:

- Development: $5-10/month
- Testing: $20-50/month

---

**Need Help?** See the [Full Setup Guide](./AI_MODEL_ACCESS_SETUP.md) or contact the DevOps team.
