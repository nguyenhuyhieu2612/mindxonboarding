# AI Integration Guide

## Overview

This backend integrates Google Gemini AI through LangChain for intelligent chat capabilities. The integration supports both standard and streaming responses with full monitoring and error handling.

## Architecture

```
Frontend (React)
    ↓
AI Service (streaming fetch)
    ↓
Backend API (/api/ai/*)
    ↓
AI Service (LangChain)
    ↓
Google Gemini API
```

## Endpoint

### POST /api/ai/chat/stream

Streaming chat completion using Server-Sent Events.

**Auth:** Required  
**Request Body:**

```json
{
  "message": "Hello, how are you?",
  "systemPrompt": "You are a helpful assistant.",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Response:** Server-Sent Events stream

```
data: {"type":"start","metadata":{"model":"gemini-2.0-flash-exp"}}

data: {"type":"token","content":"Hello"}

data: {"type":"token","content":" there"}

data: {"type":"end","metadata":{"model":"gemini-2.0-flash-exp"}}
```

## Configuration

Environment variables (in `.env` or K8s ConfigMap/Secret):

```bash
# Required
GOOGLE_AI_API_KEY=your_api_key_here

# Optional (defaults shown)
AI_MODEL=gemini-2.0-flash-exp
AI_MAX_TOKENS=8192
AI_TEMPERATURE=0.7
```

## Features

### ✅ Streaming Responses

Real-time token-by-token streaming using Server-Sent Events (SSE).

### ✅ Conversation History

Maintains context across messages (last 10 messages).

### ✅ Error Handling

- API key validation
- Rate limit handling
- Timeout management
- Graceful error responses

### ✅ Monitoring

All AI operations are tracked via:

- **App Insights**: `ai_chat_completion`, `ai_streaming_completion`, errors
- **Logger**: Structured logs with duration, token usage, user ID

### ✅ Token Usage Tracking

Monitors prompt tokens, completion tokens, and estimated costs.

## Usage Example

### JavaScript/TypeScript

```typescript
// Streaming chat
const response = await fetch("/api/ai/chat/stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: "Hello!",
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process SSE data...
}
```

## Testing

Test with curl:

```bash
# Streaming chat
curl -N -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Rate Limits

Google Gemini free tier limits:

- 15 requests per minute
- 1 million tokens per day

Production considerations:

- Implement request queuing
- Add rate limit headers
- Cache frequent responses

## Security

✅ Authentication required for all endpoints  
✅ API key stored in environment variables  
✅ Request validation (max message length: 10,000 chars)  
✅ Error messages don't expose internal details

## Monitoring Metrics

### Custom Events (App Insights)

- `ai_chat_completion` - Standard completions
- `ai_streaming_completion` - Streaming completions
- `ai_chat_error` - Errors during chat
- `ai_streaming_error` - Errors during streaming

### Log Fields

- `userId` - Authenticated user
- `duration` - Request duration in ms
- `model` - AI model used
- `tokenCount` - Total tokens used
- `messageLength` - Input message length

## Troubleshooting

### AI service not responding

1. Check API key: `echo $GOOGLE_AI_API_KEY`
2. Check logs: `kubectl logs <pod-name>`
3. Verify model config in environment

### Streaming not working

1. Verify SSE headers are set
2. Check nginx buffering: `X-Accel-Buffering: no`
3. Test with curl: `curl -N http://...`

### Rate limit errors

1. Check daily quota
2. Implement exponential backoff
3. Consider upgrading to paid tier

## Next Steps

See `docs/plans/week-3/tasks.md` for:

- Step 2: Vector Database + RAG
- Step 3: MCP Tools + Agent Coordination
- Step 4: Production deployment

## References

- [Google Gemini API](https://ai.google.dev/)
- [LangChain Documentation](https://js.langchain.com/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
