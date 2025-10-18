# AI Model Access Setup Guide

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Authors:** MindX Engineering Team

## Overview

This guide provides comprehensive instructions for setting up AI model access in the MindX backend API using OpenRouter. OpenRouter serves as a unified gateway to multiple Large Language Model (LLM) providers, allowing you to access models from OpenAI, Anthropic, Google, and others through a single API.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OpenRouter API Key Setup](#openrouter-api-key-setup)
3. [Configuration](#configuration)
4. [Secure Secret Management](#secure-secret-management)
5. [Usage Examples](#usage-examples)
6. [Testing AI Connection](#testing-ai-connection)
7. [Troubleshooting](#troubleshooting)
8. [Cost Management](#cost-management)
9. [Available Models](#available-models)

## Prerequisites

### Developer Requirements

- ✅ Access to the MindX backend codebase
- ✅ Node.js environment set up
- ✅ Understanding of environment variables and configuration

### DevOps/SysAdmin Requirements

- 🔧 Access to Azure Key Vault (for production) OR
- 🔧 Access to Kubernetes cluster secret management
- 🔧 Ability to provision and manage API keys
- 🔧 Understanding of secure credential storage

## OpenRouter API Key Setup

### Step 1: Create OpenRouter Account

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account or log in
3. Navigate to the API Keys section

### Step 2: Generate API Key

1. Click "Create API Key"
2. Give it a descriptive name (e.g., "MindX Backend - Production")
3. Set spending limits if desired (recommended for cost control)
4. Copy the API key - **you won't see it again!**

### Step 3: Configure Spending Limits

⚠️ **Important for Cost Control:**

1. In OpenRouter dashboard, go to "Settings" → "Spending Limits"
2. Set daily/monthly limits:
   - **Development:** $5-10/month
   - **Production:** Based on expected usage
3. Enable email alerts at 50% and 80% of limit

## Configuration

### Local Development Setup

1. **Copy the example environment file:**

   ```bash
   cd backend
   cp env.example .env
   ```

2. **Add your OpenRouter API key to `.env`:**

   ```env
   # AI Model Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
   OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1
   AI_MODEL=openai/gpt-3.5-turbo
   AI_MAX_TOKENS=2000
   AI_TEMPERATURE=0.7
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Verify configuration:**

   The application will validate your configuration on startup. Check for:

   ```
   ✅ Environment variables loaded successfully
   ✅ OPENROUTER_API_KEY is set
   ```

### Configuration Parameters

| Parameter                 | Description                 | Default Value                  | Recommended Values                        |
| ------------------------- | --------------------------- | ------------------------------ | ----------------------------------------- |
| `OPENROUTER_API_KEY`      | Your OpenRouter API key     | _Required_                     | `sk-or-v1-...`                            |
| `OPENROUTER_API_BASE_URL` | OpenRouter API endpoint     | `https://openrouter.ai/api/v1` | Use default                               |
| `AI_MODEL`                | Model to use                | `openai/gpt-3.5-turbo`         | See [Available Models](#available-models) |
| `AI_MAX_TOKENS`           | Maximum tokens per response | `2000`                         | 500-4000                                  |
| `AI_TEMPERATURE`          | Response randomness (0-2)   | `0.7`                          | 0.1-1.0                                   |

## Secure Secret Management

### Option 1: Kubernetes Secrets (Recommended for Production)

#### For DevOps Team:

1. **Update the Kubernetes secret file:**

   ```bash
   cd k8s
   cp backend-secret.example.yaml backend-secret.yaml
   ```

2. **Add your OpenRouter API key:**

   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: backend-secret
     namespace: mindx-app
   type: Opaque
   stringData:
     OPENROUTER_API_KEY: "sk-or-v1-your-actual-api-key-here"
     # ... other secrets
   ```

3. **Apply the secret to your cluster:**

   ```bash
   kubectl apply -f backend-secret.yaml
   ```

4. **Verify the secret was created:**

   ```bash
   kubectl get secret backend-secret -n mindx-app
   kubectl describe secret backend-secret -n mindx-app
   ```

#### ConfigMap for Non-Secret AI Configuration

For non-sensitive AI configuration, use ConfigMap:

```bash
kubectl apply -f backend-configmap.yaml
```

Update `backend-configmap.yaml` to include:

```yaml
data:
  OPENROUTER_API_BASE_URL: "https://openrouter.ai/api/v1"
  AI_MODEL: "openai/gpt-3.5-turbo"
  AI_MAX_TOKENS: "2000"
  AI_TEMPERATURE: "0.7"
```

### Option 2: Azure Key Vault (Enterprise Production)

#### For SysAdmin Team:

1. **Create/Update Key Vault secret:**

   ```bash
   az keyvault secret set \
     --vault-name <your-keyvault-name> \
     --name OPENROUTER-API-KEY \
     --value "sk-or-v1-your-actual-api-key-here"
   ```

2. **Grant access to AKS cluster:**

   ```bash
   az keyvault set-policy \
     --name <your-keyvault-name> \
     --object-id <aks-identity-object-id> \
     --secret-permissions get list
   ```

3. **Configure Key Vault integration in AKS:**

   Follow Azure documentation for integrating Key Vault with AKS workload identity.

### Security Best Practices

✅ **DO:**

- Store API keys in Kubernetes secrets or Azure Key Vault
- Use RBAC to limit who can access secrets
- Rotate API keys periodically (every 90 days)
- Set spending limits on your OpenRouter account
- Monitor API usage and costs regularly
- Use different API keys for development and production

❌ **DON'T:**

- Commit API keys to Git (`.env` is in `.gitignore`)
- Share API keys via email or Slack
- Use production keys in development environments
- Give API keys to users or embed in frontend code

## Usage Examples

### Basic Chat Completion

```typescript
import { generateChatCompletion } from "@/services/ai.services";

// Simple chat completion
const result = await generateChatCompletion([
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What is Node.js?" },
]);

console.log(result.content);
console.log("Tokens used:", result.usage?.totalTokens);
```

### Streaming Response

```typescript
import { generateStreamingChatCompletion } from "@/services/ai.services";

// Streaming chat completion
const stream = generateStreamingChatCompletion([
  { role: "user", content: "Tell me a story" },
]);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Custom Model and Parameters

```typescript
import { generateChatCompletion } from "@/services/ai.services";

const result = await generateChatCompletion(
  [{ role: "user", content: "Write a haiku about coding" }],
  {
    model: "anthropic/claude-3-sonnet",
    temperature: 0.9,
    maxTokens: 100,
  }
);
```

### In an Express Route

```typescript
import express from "express";
import { generateChatCompletion } from "@/services/ai.services";
import { asyncHandler } from "@/utils/async";

const router = express.Router();

router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { message } = req.body;

    const result = await generateChatCompletion([
      { role: "user", content: message },
    ]);

    res.json({
      response: result.content,
      model: result.model,
      usage: result.usage,
    });
  })
);

export default router;
```

## Testing AI Connection

### Automated Connection Test

The AI service includes a built-in connection test:

```typescript
import { testAIConnection } from "@/services/ai.services";

const isConnected = await testAIConnection();
console.log("AI Connection:", isConnected ? "✅ OK" : "❌ Failed");
```

### Manual Testing with HTTP Client

Create a test file `backend/src/http/ai-test.http`:

```http
### Test AI Chat Completion
POST http://localhost:3000/api/ai/chat
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "message": "Hello! Please tell me a joke."
}
```

### Testing in Development

1. **Start the backend server:**

   ```bash
   npm run dev
   ```

2. **Check startup logs for:**

   ```
   ✅ AI Model configured: openai/gpt-3.5-turbo
   ✅ OpenRouter API connection ready
   ```

3. **Test the connection:**

   ```bash
   # Using curl
   curl -X POST http://localhost:3000/api/ai/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Troubleshooting

### Error: "OPENROUTER_API_KEY is required"

**Problem:** The API key is not set or not loaded.

**Solutions:**

1. Verify `.env` file exists and contains `OPENROUTER_API_KEY`
2. Check the key doesn't have extra spaces or quotes
3. Restart the application after updating `.env`
4. In production, verify Kubernetes secret is applied: `kubectl get secret backend-secret -n mindx-app`

### Error: "Invalid API key" or 401 Unauthorized

**Problem:** The API key is incorrect or revoked.

**Solutions:**

1. Verify the API key is correct (starts with `sk-or-v1-`)
2. Check if the key was revoked in OpenRouter dashboard
3. Generate a new API key and update configuration
4. Ensure no extra characters in the key (newlines, spaces)

### Error: "Rate limit exceeded"

**Problem:** Too many requests to the API.

**Solutions:**

1. Implement request throttling in your application
2. Add retry logic with exponential backoff
3. Upgrade your OpenRouter plan if needed
4. Check for infinite loops or bugs causing excessive calls

### Error: "Insufficient credits"

**Problem:** Your OpenRouter account has no credits.

**Solutions:**

1. Add credits to your OpenRouter account
2. Check your spending limits
3. Review usage in OpenRouter dashboard
4. Implement cost tracking in your application

### Slow Response Times

**Problem:** AI responses are taking too long.

**Solutions:**

1. Use a faster model (e.g., `gpt-3.5-turbo` instead of `gpt-4`)
2. Reduce `maxTokens` parameter
3. Use streaming responses for better UX
4. Check your network connection
5. Monitor OpenRouter status page for issues

## Cost Management

### Estimating Costs

Approximate costs per 1,000 tokens:

| Model                       | Input Cost | Output Cost |
| --------------------------- | ---------- | ----------- |
| `openai/gpt-3.5-turbo`      | $0.0005    | $0.0015     |
| `openai/gpt-4`              | $0.03      | $0.06       |
| `anthropic/claude-3-sonnet` | $0.003     | $0.015      |
| `google/gemini-pro`         | $0.00025   | $0.00075    |

### Cost Optimization Tips

1. **Choose the right model:**

   - Use GPT-3.5 for simple tasks
   - Reserve GPT-4 for complex reasoning
   - Test cheaper models first

2. **Optimize prompts:**

   - Be concise and specific
   - Avoid unnecessary context
   - Use system messages effectively

3. **Set token limits:**

   - Use `maxTokens` parameter
   - Adjust based on expected response length

4. **Monitor usage:**

   - Track token usage in Application Insights
   - Set up cost alerts
   - Review usage patterns weekly

5. **Implement caching:**
   - Cache common responses
   - Use Redis for response caching
   - Implement TTL based on content freshness

### Tracking Usage

The AI service automatically tracks:

- Request count
- Token usage
- Response times
- Error rates

View metrics in Azure Application Insights:

```
customEvents
| where name == "ai_chat_completion"
| summarize
    TotalRequests = count(),
    TotalTokens = sum(toint(customDimensions.tokenCount)),
    AvgDuration = avg(toint(customDimensions.duration))
| extend EstimatedCost = TotalTokens * 0.000002
```

## Available Models

### Recommended Models

| Model                       | Best For          | Speed  | Cost | Context Window |
| --------------------------- | ----------------- | ------ | ---- | -------------- |
| `openai/gpt-3.5-turbo`      | General purpose   | Fast   | $    | 16k tokens     |
| `openai/gpt-4`              | Complex reasoning | Medium | $$$  | 8k tokens      |
| `openai/gpt-4-turbo`        | Long context      | Fast   | $$   | 128k tokens    |
| `anthropic/claude-3-sonnet` | Balanced          | Fast   | $$   | 200k tokens    |
| `anthropic/claude-3-opus`   | Best quality      | Slow   | $$$$ | 200k tokens    |
| `google/gemini-pro`         | Cost-effective    | Fast   | $    | 32k tokens     |

### Finding More Models

Visit [OpenRouter Models](https://openrouter.ai/models) to see all available models, pricing, and capabilities.

## Monitoring and Alerts

### Azure Application Insights Integration

The AI service automatically sends telemetry to Application Insights:

**Events tracked:**

- `ai_chat_completion` - Successful completions
- `ai_streaming_completion` - Streaming responses
- `ai_chat_completion_error` - Failed requests

**Properties logged:**

- Model used
- Duration
- Token count
- Success/failure status

### Setting Up Alerts

Create alerts in Azure Portal:

1. **High Error Rate:**

   ```
   customEvents
   | where name == "ai_chat_completion_error"
   | summarize ErrorCount = count() by bin(timestamp, 5m)
   | where ErrorCount > 10
   ```

2. **Slow Responses:**

   ```
   customEvents
   | where name == "ai_chat_completion"
   | where toint(customDimensions.duration) > 10000
   ```

3. **High Token Usage:**
   ```
   customEvents
   | where name == "ai_chat_completion"
   | summarize TotalTokens = sum(toint(customDimensions.tokenCount))
   | where TotalTokens > 1000000
   ```

## Support and Resources

### Documentation Links

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenAI SDK Documentation](https://github.com/openai/openai-node)
- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)

### Getting Help

1. **Internal:** Contact the MindX DevOps team
2. **OpenRouter:** Check [OpenRouter Discord](https://discord.gg/openrouter)
3. **Azure:** Open support ticket in Azure Portal

## Changelog

| Version | Date     | Changes             |
| ------- | -------- | ------------------- |
| 1.0     | Oct 2025 | Initial setup guide |

---

**Next Steps:** Proceed to Step 1.2 - Update API Backend for AI Integration
