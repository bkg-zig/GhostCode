# Phase 3: Helper-Agent Integration

## Overview

Phase 3 introduces Helper-Agents that actively participate in the live-coding process and serve as interactive project consultants in the Chat-Agent. The agents leverage `helper::planner` for structured planning and `helper::agents::LiveAdvisor` for real-time code assistance.

## Architecture

```
[Dashboard Chat & Editor]
        │
        ▼
 [NestJS API Proxy (optional)]
        │
        ▼
 [Rust Gateway (helper::planner / agents)]
        │
        ├── helper::planner::plan_action()      → Chat-Agent Planning
        └── helper::agents::LiveAdvisor::run()  → Real-time Code Help
```

## New Endpoints

### Chat Planning API

**POST `/api/chat/plan`**

Request body:
```json
{
  "prompt": "How should I structure my Rust web application?",
  "context": "I'm building a REST API with authentication"
}
```

Response:
```json
{
  "summary": "Based on your requirements, here's a recommended structure...",
  "suggestions": [
    "Use a layered architecture with clear separation of concerns",
    "Implement proper error handling with custom error types",
    "Add comprehensive logging and monitoring",
    "Consider using middleware for authentication and CORS"
  ]
}
```

### Live Agent WebSocket

**WS `/ws/agent`**

The WebSocket connection provides real-time agent advice during coding sessions.

Message format:
```json
{
  "content": "Consider adding error handling for this operation.",
  "level": "warning",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## UI Integration

### ChatAgent Component

The ChatAgent now includes:
- Natural language conversation with Helper-Agent
- Context-aware responses using conversation history
- Structured suggestions display
- Error handling and loading states

### LiveCanvas Component

The LiveCanvas (terminal) now:
- Connects to `/ws/agent` WebSocket
- Displays real-time agent advice alongside execution logs
- Color-coded messages (info/warning/error)
- Maintains connection state

## Implementation Details

### Gateway Integration

New module `crates/gateway/src/agents.rs` provides:
- `chat_plan()` handler for planning requests
- `agent_ws()` handler for WebSocket connections
- Placeholder implementations ready for helper-core integration

### Type Definitions

Shared types in `@ghost/types`:
```typescript
export interface ChatPlanRequest {
  prompt: string;
  context?: string;
}

export interface ChatPlanResponse {
  summary: string;
  suggestions: string[];
}

export interface AgentAdvice {
  content: string;
  level: 'info' | 'warning' | 'error';
  timestamp: string;
}
```

## Example Workflow

### 1. Chat Consultation

User asks: *"How should I structure my Python data processing pipeline?"*

Agent responds with:
- Summary of recommended architecture
- Step-by-step implementation suggestions
- Best practices and considerations

### 2. Live Coding Assistance

While user writes code:
- Agent detects potential issues (missing error handling, inefficient algorithms)
- Provides real-time suggestions in terminal
- Offers improvements and optimizations

### 3. Context-Aware Help

Agent considers:
- Current project structure
- Programming language and framework
- Recent conversation history
- Code patterns and conventions

## Future Integration

When `helper-core` becomes available:
1. Replace stub implementations with actual `helper::planner::plan_action()`
2. Integrate `helper::agents::LiveAdvisor::run()` for WebSocket handling
3. Add more sophisticated context analysis
4. Implement agent learning from user feedback

## Testing

### Manual Testing Checklist

1. **Chat Functionality**
   - Send planning request to `/api/chat/plan`
   - Verify structured response format
   - Test error handling

2. **WebSocket Connection**
   - Connect to `/ws/agent`
   - Receive agent advice messages
   - Handle connection errors gracefully

3. **UI Integration**
   - Chat messages display correctly
   - Agent suggestions formatted properly
   - Terminal shows live agent advice

### E2E Testing

1. Start dashboard and gateway
2. Ask question in ChatAgent
3. Verify response appears
4. Write code and observe live agent feedback

## Security Considerations

- WebSocket connections require proper origin validation
- Rate limiting on chat planning requests
- Input sanitization for prompts and context
- Secure handling of conversation history

## Performance

- WebSocket connections are lightweight and efficient
- Planning requests cached where appropriate
- Agent advice generation optimized for real-time response
- Memory usage monitored for long-running sessions
