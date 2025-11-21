# LLM-MCP Integration Patterns

**Version**: 1.0.0
**Last Updated**: 2025-01-20
**Scope**: Model Context Protocol (MCP) usage patterns for LLM-based agents

## Purpose

This guide defines best practices for integrating MCP servers into LLM-based autonomous agents. MCP provides a standardized way to expose tools, resources, and prompts to LLMs. This guide helps agents use MCP effectively, handle failures gracefully, and compose MCP calls with native tools.

**Reference**: [Model Context Protocol Specification](https://modelcontextprotocol.io/)

---

## 1. MCP vs. Native Tools

### When to Use MCP

**Use MCP when**:
1. **Interacting with external services** (Slack, GitHub, Jira, etc.)
   - Example: Post Slack message → Use Arcade MCP
2. **Managing remote resources** (cloud VMs, containers, databases)
   - Example: Create Daytona sandbox → Use Daytona MCP
3. **Accessing proprietary data sources** (company wiki, internal APIs)
   - Example: Query customer database → Use custom MCP server
4. **Need for standardized tool interface** across multiple agents
   - Example: 5 different agents all need Slack access → share one Arcade MCP config

**Key Benefit**: MCP servers handle authentication, rate limiting, retries, and API versioning for you.

### When to Use Native Tools

**Use native tools (Bash, Read, Write, etc.) when**:
1. **Operating on local filesystem** (read/write/search files)
   - Example: Read `package.json` → Use Read tool (not MCP)
2. **Running standard CLI commands** (git, npm, pytest)
   - Example: Run tests → Use Bash tool with `npm test`
3. **Simple data transformations** (parsing, formatting)
   - Example: Extract repo from URL → Use regex in agent logic
4. **MCP would add unnecessary latency** (extra network hop)
   - Example: Check if file exists → Use Bash `test -f` (not MCP file server)

**Key Benefit**: Native tools are faster (no server round-trip) and always available.

### Decision Tree

```
Need to perform operation
├─ Is resource remote (API, cloud service, external system)?
│  ├─ YES → Is there an MCP server for this service?
│  │  ├─ YES → Use MCP
│  │  └─ NO → Use native tool (Bash curl, WebFetch, etc.)
│  └─ NO → Is resource local (filesystem, process, etc.)?
│     └─ Use native tool (Read, Write, Bash, Grep, etc.)
```

**Example Decisions**:
| Operation | Tool | Rationale |
|-----------|------|-----------|
| Post Slack message | Arcade MCP | Remote API, handles auth/rate limits |
| Read local file | Read tool | Local filesystem, no network needed |
| Create GitHub issue | gh CLI (Bash) | Only 3 operations needed, simpler than full MCP |
| Create Daytona sandbox | Daytona MCP | Complex remote resource, MCP handles lifecycle |
| Search codebase | Grep tool | Local search, native tool is faster |
| Query Notion database | Notion MCP | Remote API, complex auth, benefits from MCP |

---

## 2. MCP Tool Discovery and Usage

### Tool Discovery Pattern

**On agent initialization**:
1. Query MCP server for available tools: `server.listTools()`
2. Cache tool list in agent state (avoid repeated discovery calls)
3. Include tool names and schemas in agent context

**Example Discovery**:
```typescript
// Query Arcade MCP on startup
const arcadeTools = await arcadeMcp.listTools();
// Returns: ["slack.postMessage", "slack.postReaction", "slack.updateMessage", ...]

// Include in agent context:
context += "\nAvailable Slack tools (via Arcade MCP):\n";
context += "- slack.postMessage(channel, text, thread_ts)\n";
context += "- slack.postReaction(channel, timestamp, reaction)\n";
```

### Dynamic Tool Selection

**Pattern**: Let the LLM choose which tool to use based on task.

**Anti-pattern**: Hardcode tool selection in bridge logic.
```typescript
// ❌ Bad: Bridge logic decides which tool to use
if (message.includes("post to Slack")) {
    await arcadeMcp.callTool("slack.postMessage", params);
}
```

**Better Pattern**: Provide tools to LLM, let it decide.
```typescript
// ✅ Good: LLM chooses tool based on user request
const tools = [
    ...arcadeTools,    // Slack operations
    ...daytonaTools,   // Sandbox operations
    ...nativeTools     // Read, Write, Bash, etc.
];
const response = await claude.sendMessage(message, { tools });
// Claude decides: "I'll use slack.postMessage to respond to the user"
```

---

## 3. MCP Error Handling

### Error Categories

MCP errors fall into same categories as general errors (see autonomous-agent-patterns.md), but with MCP-specific handling:

#### 3.1 MCP Server Unavailable (Transient)
**Symptoms**:
- Connection refused
- Timeout connecting to MCP server
- MCP server crashed/restarted

**Recovery**:
```
1. Retry with exponential backoff (1s, 2s, 4s)
2. Max 3 retries
3. If still failing, check if MCP server process is running
4. If not running, attempt to restart MCP server (if allowed)
5. If cannot restart, fail with diagnostic
```

**User Update**:
```
"Arcade MCP server is not responding.

Diagnosis: Connection refused on localhost:3001

Attempting to restart MCP server...

[If restart succeeds:]
✓ MCP server restarted. Retrying operation...

[If restart fails:]
Cannot connect to MCP server. Please check MCP configuration:
- Is mcp-server-arcade running?
- Check logs: ~/.mcp/logs/arcade.log
- Verify MCP_ARCADE_PORT=3001 in environment
```

#### 3.2 MCP Tool Not Found (User Error)
**Symptoms**:
- Tool name doesn't exist on MCP server
- Typo in tool name
- MCP server version doesn't support tool

**Recovery**:
```
1. Do NOT retry (tool won't magically appear)
2. List available tools from server
3. Suggest closest matching tool (fuzzy search)
4. Ask user to verify MCP server version
```

**User Update**:
```
"Tool 'slack.sendMessage' not found on Arcade MCP server.

Available Slack tools:
- slack.postMessage (send new message)
- slack.updateMessage (edit existing message)
- slack.postReaction (add emoji reaction)

Did you mean 'slack.postMessage'?
```

#### 3.3 MCP Tool Execution Failed (Classify Underlying Error)
**Symptoms**:
- MCP tool ran but returned error
- Could be auth error, rate limit, invalid params, etc.

**Recovery**:
```
1. Extract error from MCP response
2. Classify error using standard error categories:
   - 401/403 → Auth Error (fail fast)
   - 429 → Rate Limit (transient, retry with backoff)
   - 400 → Invalid Params (user error, show correct format)
   - 500 → Server Error (unknown, retry once)
3. Apply appropriate recovery strategy
```

**Example - Rate Limit**:
```
MCP Call: slack.postMessage(channel="C123", text="Hello")
MCP Response: { error: "rate_limited", retry_after: 30 }

Agent Action:
1. Classify as Transient Error
2. Wait 30 seconds
3. Retry same operation
4. Update user: "Slack rate limit hit. Retrying in 30 seconds..."
```

**Example - Auth Error**:
```
MCP Call: slack.postMessage(channel="C123", text="Hello")
MCP Response: { error: "not_authed" }

Agent Action:
1. Classify as Auth Error
2. Do NOT retry
3. Update user:
   "Slack authentication failed.

   Diagnosis: SLACK_BOT_TOKEN is invalid or expired.

   Fix:
   1. Generate new token at https://api.slack.com/apps
   2. Update .env: SLACK_BOT_TOKEN=xoxb-your-new-token
   3. Restart MCP server: mcp restart arcade

   Cannot post to Slack until token is fixed."
```

### MCP-Specific Retry Logic

**Principle**: Respect retry hints from MCP server.

**Standard Retry** (no hint provided):
```
Wait: exponential backoff (1s, 2s, 4s)
Max retries: 3
```

**Retry with Server Hint** (Retry-After header or retry_after field):
```
Wait: server-specified duration
Max retries: 3
Example: retry_after=30 → wait 30 seconds before retry
```

**Circuit Breaker** (repeated failures):
```
If same MCP tool fails 5 times in a row:
1. Stop calling that tool
2. Mark tool as "degraded" in agent state
3. Update user: "Slack posting is temporarily unavailable. Using alternative method..."
4. Fall back to alternative (if available)
5. Reset circuit after 5 minutes
```

---

## 4. MCP Tool Composition

### Parallel MCP Calls

**When safe to parallelize**:
- Calls to different MCP servers (no shared state)
- Calls to same server but independent operations
- Read operations (idempotent)

**Example - Parallel Cross-Server**:
```
[User asks: "Post update to Slack and create GitHub issue"]

Parallel calls:
1. Arcade MCP: slack.postMessage(...)
2. GitHub MCP: github.createIssue(...)

→ Both independent, execute simultaneously
```

**When to serialize**:
- Calls to same resource (e.g., editing same Slack message)
- Second call depends on first call's result
- Rate limits may be exceeded if parallel

**Example - Sequential Slack Edits**:
```
[User asks: "Post message then add reaction"]

Sequential calls:
1. Arcade MCP: slack.postMessage(...) → returns message timestamp
2. Arcade MCP: slack.addReaction(timestamp from step 1, ...)

→ Step 2 depends on step 1's result, must serialize
```

### MCP + Native Tool Composition

**Pattern**: Combine MCP and native tools in same workflow.

**Example - Sandbox Creation + File Operations**:
```
[User asks: "Create sandbox and add README"]

Workflow:
1. Daytona MCP: createSandbox(repo="user/repo")
   → Returns sandbox URL and ID
2. Daytona MCP: sandbox.exec(command="git clone {repo}")
   → Clones repo into sandbox
3. Native Write tool: Write file to /workspace/user/repo/README.md
   → Faster than MCP for simple file write
4. Daytona MCP: sandbox.exec(command="git add README.md && git commit -m 'Add README'")
   → Commit changes
```

**Principle**: Use MCP for resource lifecycle (create/destroy sandbox), use native tools for operations within resource (read/write files).

### Error Recovery in Composed Workflows

**Principle**: If any step fails, clean up resources created in previous steps.

**Example - Rollback on Failure**:
```
Workflow:
1. Daytona MCP: createSandbox() → sandboxId="abc123"
2. Daytona MCP: sandbox.exec("npm install")
   → FAILS with "package.json not found"

Recovery:
1. Detect failure in step 2
2. Rollback: Daytona MCP: destroySandbox(sandboxId="abc123")
3. Update user:
   "Cannot install dependencies: package.json not found in repository.

   Destroyed sandbox abc123 (no longer needed).

   Please verify repository contains package.json and try again."
```

**Cleanup Checklist**:
- Sandbox created → Destroy sandbox
- Slack message posted → Delete message (if appropriate)
- GitHub PR created → Close PR or add comment explaining failure
- Database transaction → Rollback

---

## 5. MCP Authentication and Security

### Credential Management

**Principle**: MCP servers handle auth, agent never touches credentials directly.

**MCP Server Responsibility**:
- Store API keys/tokens in MCP config (e.g., `~/.mcp/config.json`)
- Refresh OAuth tokens automatically
- Handle auth errors and prompt user to re-authenticate

**Agent Responsibility**:
- Pass user context to MCP (e.g., Slack user ID)
- Handle "not_authed" errors from MCP gracefully
- Never log or expose credentials in agent output

**Anti-pattern**:
```typescript
// ❌ Bad: Agent handles credentials
const slackToken = process.env.SLACK_BOT_TOKEN;
await axios.post('https://slack.com/api/chat.postMessage', {
    headers: { Authorization: `Bearer ${slackToken}` },
    // ...
});
```

**Better Pattern**:
```typescript
// ✅ Good: MCP handles credentials
await arcadeMcp.callTool('slack.postMessage', {
    channel: 'C123',
    text: 'Hello'
});
// Arcade MCP reads SLACK_BOT_TOKEN from its own config
```

### Permission Scoping

**Principle**: Request minimum necessary permissions from MCP.

**Example - Slack Scopes**:
```
Needed operations:
- Post messages
- Add reactions
- Read channel history (for thread context)

Required scopes:
- chat:write (post messages)
- reactions:write (add reactions)
- channels:history (read history)

Not needed:
- users:read (don't need user profiles)
- admin:* (no admin operations)
```

**MCP Configuration**:
```json
{
  "mcpServers": {
    "arcade": {
      "command": "npx",
      "args": ["-y", "@arcadeai/arcade-mcp"],
      "env": {
        "ARCADE_API_KEY": "...",
        "SLACK_BOT_TOKEN": "xoxb-...",
        "SLACK_SCOPES": "chat:write,reactions:write,channels:history"
      }
    }
  }
}
```

### Audit Logging

**What to Log** (for security review):
- MCP tool called
- User who initiated operation
- Timestamp
- Parameters (sanitize sensitive data)
- Result (success/failure)

**Example Log Entry**:
```json
{
  "timestamp": "2025-01-20T15:30:45Z",
  "user": "alice",
  "mcp_server": "arcade",
  "tool": "slack.postMessage",
  "params": {
    "channel": "C123",
    "text": "[sanitized]"
  },
  "result": "success",
  "duration_ms": 145
}
```

**What NOT to Log**:
- API keys/tokens
- User passwords
- Full message contents (may contain PII)
- Internal system paths

---

## 6. MCP Resource Management

### Resource Lifecycle

**MCP resources** are stateful entities created and managed via MCP (sandboxes, database connections, websockets, etc.).

**Lifecycle Stages**:
```
NULL (not created)
  └─ create() → CREATING

CREATING (resource being provisioned)
  ├─ Success → ACTIVE
  └─ Failure → ERROR

ACTIVE (resource ready for use)
  ├─ use() → ACTIVE (state persists)
  ├─ suspend() → SUSPENDED
  ├─ destroy() → DESTROYING
  └─ Error → ERROR

SUSPENDED (paused, not destroyed)
  ├─ resume() → ACTIVE
  └─ destroy() → DESTROYING

DESTROYING (cleanup in progress)
  ├─ Success → NULL
  └─ Failure → ERROR

ERROR (failed state)
  ├─ retry() → CREATING or ACTIVE (depends on error)
  └─ destroy() → DESTROYING (cleanup)
```

### Resource Reuse Pattern

**Principle**: Reuse resources within same session, destroy on session end.

**Example - Sandbox Reuse**:
```
Session start
  └─ User: "Check tests in my-repo"
       └─ Agent: Create sandbox for my-repo → sandboxId="abc123"
  └─ User: "Now fix the failing test"
       └─ Agent: Reuse sandbox abc123 (no recreation)
  └─ User: "Run tests again"
       └─ Agent: Reuse sandbox abc123
  └─ Session end (7 days inactive)
       └─ Agent: Destroy sandbox abc123
```

**Benefits**:
- Faster (no repeated clone/setup)
- Preserves state (installed packages, file edits)
- Cost-efficient (sandbox-hour billing)

**Storage**:
```typescript
// Store in session state
session.resources = {
  "daytona-sandbox": {
    id: "abc123",
    repo: "owner/repo",
    createdAt: "2025-01-20T14:00:00Z"
  }
};
```

### Resource Cleanup Triggers

**Destroy resources when**:
1. **User explicitly requests** (e.g., `/destroy-sandbox` command)
2. **Session expires** (no activity for 7 days)
3. **Switching to different repository** (optional: ask to confirm)
4. **Unrecoverable error** (resource corrupted, cannot proceed)

**Cleanup Procedure**:
```
1. Call MCP destroy method (e.g., daytona.destroySandbox(id))
2. Wait for confirmation (or timeout after 30s)
3. Remove resource ID from session state
4. Log cleanup action
5. Update user if action was unexpected
   Example: "Session expired. Destroyed sandbox abc123."
```

**Partial Failure Handling**:
```
If destroy fails (e.g., MCP server unreachable):
1. Log error with resource ID
2. Mark resource as "pending_cleanup" in state
3. Retry cleanup on next session initialization
4. If still failing after 3 retries, alert admin
   (Resource may be orphaned, manual cleanup needed)
```

---

## 7. MCP Server Configuration

### Multi-Server Configuration

**Pattern**: Use multiple MCP servers for different capabilities.

**Example `~/.mcp/config.json`**:
```json
{
  "mcpServers": {
    "arcade": {
      "command": "npx",
      "args": ["-y", "@arcadeai/arcade-mcp"],
      "env": {
        "ARCADE_API_KEY": "..."
      }
    },
    "daytona": {
      "command": "npx",
      "args": ["-y", "@daytona/mcp-server"],
      "env": {
        "DAYTONA_API_KEY": "..."
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    }
  }
}
```

**Agent Initialization**:
```typescript
// Connect to all configured MCP servers on startup
const arcadeMcp = await connectMcp('arcade');
const daytonaMcp = await connectMcp('daytona');
const githubMcp = await connectMcp('github');

// Combine tools from all servers
const allTools = [
  ...await arcadeMcp.listTools(),
  ...await daytonaMcp.listTools(),
  ...await githubMcp.listTools(),
  ...nativeTools
];
```

### Server Health Checks

**Pattern**: Verify MCP servers are healthy on startup.

**Health Check Steps**:
```
1. Attempt connection (timeout 5s)
2. Call server.ping() or server.listTools()
3. Verify expected tools are available
4. Log server version for debugging
```

**Failure Handling**:
```
If health check fails:
├─ Server is optional (e.g., GitHub MCP for only 3 operations)
│  └─ Log warning, continue without that server
│     "GitHub MCP unavailable. Falling back to gh CLI."
└─ Server is required (e.g., Daytona MCP for sandboxes)
   └─ Fail agent startup, require user to fix
      "Cannot start: Daytona MCP server not responding.

      Fix: Check MCP server logs at ~/.mcp/logs/daytona.log

      Verify DAYTONA_API_KEY is set in environment."
```

---

## 8. MCP Debugging and Observability

### MCP Call Logging

**What to Log**:
- Tool name
- Parameters (sanitized)
- Execution time
- Result status (success/error)
- Error details (if failed)

**Example Log**:
```
[2025-01-20T15:30:45Z] MCP Call: arcade/slack.postMessage
  Params: {"channel":"C123","text":"[sanitized]","thread_ts":"1234.5678"}
  Duration: 145ms
  Result: success
  Response: {"ok":true,"ts":"1234.5679"}
```

**Sanitization Rules**:
- Replace message content with `[sanitized]`
- Replace API keys with `[redacted]`
- Keep structural fields (channel ID, timestamp) for debugging

### MCP Error Diagnostics

**When MCP call fails, log**:
1. **Error message** from MCP server
2. **Full stack trace** (if available)
3. **Server version** and health status
4. **Recent successful calls** to same tool (shows if regression)
5. **Network conditions** (if timeout)

**Example Diagnostic**:
```
[ERROR] MCP Call Failed: arcade/slack.postMessage

Error: {"error":"channel_not_found","channel":"C999"}

Context:
- Arcade MCP version: 1.2.3
- Last successful call to this tool: 2025-01-20T15:25:00Z (5 min ago)
- Network: ping arcade-mcp.local = 2ms (healthy)

Diagnosis: Channel ID 'C999' does not exist or bot not invited.

Suggestion: Verify channel ID or invite bot to channel.
```

### Performance Monitoring

**Track MCP Performance**:
- P50/P95/P99 latency per tool
- Error rate per tool
- Timeout rate

**Example Metrics**:
```
arcade/slack.postMessage:
  P50: 120ms
  P95: 450ms
  P99: 1200ms
  Error rate: 0.5%
  Timeout rate: 0.1%

daytona/createSandbox:
  P50: 8500ms
  P95: 15000ms
  P99: 30000ms
  Error rate: 2.3%
  Timeout rate: 1.5%
```

**Alerting Thresholds**:
- Error rate >5% for 5 minutes → Alert
- P99 latency >30s → Alert
- MCP server restart detected → Alert

---

## Version History

- **1.0.0** (2025-01-20): Initial MCP integration patterns
