# Autonomous Agent Patterns

**Version**: 1.0.0
**Last Updated**: 2025-01-20
**Scope**: Generic patterns for ANY autonomous coding agent (Claude, GPT-4, etc.)

## Purpose

This guide defines reusable behavioral patterns for LLM-based autonomous agents that execute code, manage resources, and interact with users. These patterns apply whether the agent is invoked via CLI, Slack, Discord, or any other interface.

---

## 1. Progress Update Philosophy

### When to Provide Updates

**Principle**: Update the user at meaningful state transitions, not arbitrary time intervals.

**Update Triggers** (MECE):
1. **Before starting a long-running operation** (>10 seconds expected)
   - Example: "Starting test suite (47 tests)..."
2. **After completing a major step** in multi-step workflow
   - Example: "✓ All tests passing. Now building production bundle..."
3. **When encountering an error** that requires retry or user action
   - Example: "API rate limit hit. Retrying in 30 seconds..."
4. **When asking the user a question** (always precede question with context)
   - Example: "Found 3 dependency conflicts. Should I use npm overrides or upgrade dependencies?"

**Do NOT update**:
- During fast operations (<5 seconds)
- Multiple times during same logical step
- Just to "show activity" with no new information

### Update Detail Level

**Principle**: Match detail to task complexity and failure risk.

| Task Type | Detail Level | Example |
|-----------|-------------|---------|
| Low-risk, familiar | Brief status | "Running tests..." |
| Medium complexity | Key metrics | "Running tests (47 total, 12 integration)..." |
| High-risk or novel | Step-by-step trace | "Running integration tests:\n- Postgres container started\n- Migrations applied\n- Running 12 tests..." |
| Error recovery | Full diagnostic | "Test failure in auth.test.ts:45\nExpected 200, got 401\nChecking auth token configuration..." |

### Update Formatting

**For terminal/CLI agents**:
```
✓ Completed step description
⚠ Warning or non-fatal issue
✗ Error or failure
→ In-progress step
```

**For chat-based agents (Slack, Discord)**:
- Use thread replies for updates (keep main channel clean)
- Use emoji reactions for quick status (👀 = working, ✅ = done, ❌ = error)
- Provide detailed message only at start and completion

---

## 2. Error Classification and Recovery

### Error Categories (MECE)

All errors fall into exactly one category:

#### 2.1 Transient Errors (Retry Automatically)
**Definition**: Temporary failures likely to succeed on retry.

**Examples**:
- Network timeouts
- Rate limits (with Retry-After header)
- 502/503/504 HTTP status codes
- Database connection pool exhausted
- File lock conflicts

**Recovery Strategy**:
```
1. Wait with exponential backoff (1s, 2s, 4s, 8s)
2. Max 3 retries
3. If still failing after retries, reclassify as Unknown Error
```

**Update Pattern**:
```
First failure: "API timeout. Retrying in 1 second..."
Second failure: "API timeout. Retrying in 2 seconds..."
Third failure: "API timeout. Retrying in 4 seconds..."
Final failure: "API unavailable after 3 retries. Cannot proceed."
```

#### 2.2 Authentication/Authorization Errors (Fail Fast)
**Definition**: Invalid credentials or insufficient permissions.

**Examples**:
- 401 Unauthorized
- 403 Forbidden
- Invalid API key
- Expired OAuth token
- Missing environment variables (GITHUB_TOKEN, ANTHROPIC_API_KEY)

**Recovery Strategy**:
```
1. Do NOT retry (will never succeed without configuration change)
2. Provide clear diagnostic message
3. Tell user exactly what to fix
4. Stop execution immediately
```

**Update Pattern**:
```
"GitHub API returned 401 Unauthorized.

Diagnosis: GITHUB_TOKEN environment variable is missing or invalid.

Fix:
1. Generate a token at https://github.com/settings/tokens
2. Add to .env file: GITHUB_TOKEN=ghp_yourtoken
3. Restart the agent

Cannot proceed until token is configured."
```

#### 2.3 User Error (Provide Guidance)
**Definition**: Invalid input or request that user must correct.

**Examples**:
- Invalid repository name ("foo" instead of "owner/repo")
- Requested file doesn't exist
- Malformed command syntax
- Conflicting parameters (--force and --safe together)

**Recovery Strategy**:
```
1. Explain what was invalid
2. Show correct format with example
3. Ask user to retry with corrected input
4. Do NOT guess or auto-correct (user must confirm intent)
```

**Update Pattern**:
```
"Invalid repository format: 'my-repo'

Expected format: owner/repo
Example: anthropics/anthropic-sdk-python

Please provide the full repository name."
```

#### 2.4 Unknown Errors (Retry Cautiously)
**Definition**: Unexpected errors not matching above categories.

**Examples**:
- Unhandled exceptions
- 500 Internal Server Error (without retry guidance)
- Assertion failures
- Out of memory errors

**Recovery Strategy**:
```
1. Log full error details (stack trace, context)
2. Retry ONCE with same parameters (may be transient)
3. If retry fails, stop and request user intervention
4. Provide full diagnostic info for debugging
```

**Update Pattern**:
```
"Unexpected error in task execution:

Error: TypeError: Cannot read property 'data' of undefined
  at processResponse (handler.ts:45)
  at async executeTask (agent.ts:102)

Context:
- Operation: Fetch repository metadata
- Repository: anthropics/claude-sdk
- Timestamp: 2025-01-20T15:30:45Z

Retrying once...

[If retry fails:]
Still failing. This may be a bug in the agent code.
Full error details logged. Please report this issue."
```

### Error Recovery Decision Tree

```
Error occurred
├─ Is it 401/403 or missing credentials?
│  └─ YES → [Auth Error] Fail fast with fix instructions
├─ Is it 429, timeout, 502-504, or documented transient error?
│  └─ YES → [Transient Error] Retry with backoff
├─ Is it invalid user input or malformed request?
│  └─ YES → [User Error] Provide guidance and ask for correction
└─ None of above?
   └─ [Unknown Error] Log details, retry once, then fail with diagnostics
```

---

## 3. Repository Management Patterns

### Repository Context Validation

**Principle**: Always validate repository context before executing file operations.

**Validation Steps** (execute in order):
1. **Detect repository from user message** (if mentioned)
   - Regex: `\b([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)\b`
   - Example: "Fix the bug in anthropics/claude-sdk" → extract "anthropics/claude-sdk"
2. **Check if repository is already cloned/available**
   - For sandbox environments: Check if `/workspace/{repo}` exists
   - For local environments: Check if git remote matches
3. **Prompt user if ambiguous**
   - Multiple repos mentioned → ask which one
   - No repo mentioned but needed → ask for repo name
   - Wrong repo currently active → ask to confirm switch

**Repository Prompting Pattern**:
```
[If no repository set and user asks to read file:]

"No repository is currently active.

Which repository should I work with?
Format: owner/repo
Example: anthropics/anthropic-sdk-python"

[If repository set but user mentions different repo:]

"Currently working with: anthropics/claude-sdk
You mentioned: anthropics/anthropic-sdk-python

Should I switch to anthropics/anthropic-sdk-python?"
```

### Repository State Management

**State Transitions** (finite state machine):
```
NULL (no repo)
  ├─ User provides repo → REQUESTED
  └─ Agent detects repo in message → REQUESTED

REQUESTED (repo name known)
  ├─ Clone succeeds → ACTIVE
  ├─ Clone fails (auth) → ERROR_AUTH
  ├─ Clone fails (not found) → ERROR_NOT_FOUND
  └─ Clone fails (other) → ERROR_UNKNOWN

ACTIVE (repo available for work)
  ├─ User requests different repo → REQUESTED (new repo)
  ├─ User says "destroy sandbox" → NULL
  └─ Session expires → NULL

ERROR_* (cannot proceed)
  ├─ User fixes issue → REQUESTED (retry)
  └─ User cancels → NULL
```

**State Storage**:
- Store current repo in session: `{ currentRepo: "owner/repo" | null }`
- Update on successful clone
- Clear on sandbox destruction or session end
- Include in agent context: "Currently working with repository: {currentRepo}"

---

## 4. User Interaction Patterns

### Asking Questions

**Principle**: Only ask when truly ambiguous. Prefer smart defaults with confirmation.

**When to Ask** (MECE):
1. **Multiple valid interpretations exist**
   - Example: "Fix the tests" when 3 test files failed → ask which one
2. **High-risk operation requires confirmation**
   - Example: "Delete all database records" → confirm with consequences
3. **Missing required information cannot be inferred**
   - Example: User says "deploy" but no deployment target configured → ask where

**When NOT to Ask**:
- Obvious default exists (use it and mention in update)
- Can infer from context (previous messages, file structure)
- Low-risk operation that can be undone

**Question Formatting**:
```
[Context: 1-2 sentences explaining situation]

[Question with specific options]

[Example or clarification if needed]
```

**Example**:
```
"Found 3 failing tests:
- auth.test.ts (2 failures)
- api.test.ts (1 failure)
- db.test.ts (5 failures)

Which test file should I fix first?

Reply with filename or 'all' to fix all tests."
```

### Providing Guidance vs. Taking Action

**Decision Tree**:
```
User request
├─ Is request explicit and unambiguous?
│  └─ YES → Take action immediately
├─ Is request implicit but clear from context?
│  └─ YES → Take action with brief confirmation
│     Example: "Fixing auth tests (2 failures)..."
└─ Is request vague or multiple interpretations?
   └─ Ask clarifying question
```

**Guidance Format** (when user is learning):
```
[What I'm doing]
[Why I'm doing it this way]
[What to expect next]
```

**Example**:
```
"Installing pytest-mock as dev dependency.

This is needed because the test uses @patch decorator, which requires pytest-mock.
I'm adding it to devDependencies (not dependencies) since it's only used in tests.

After install, I'll re-run the failing test."
```

---

## 5. Tool Composition Patterns

### Parallel vs. Sequential Execution

**Principle**: Maximize parallelism when operations are independent.

**Execute in Parallel When**:
- Reading multiple files that don't depend on each other
- Running multiple independent API calls
- Starting multiple services that don't communicate

**Execute Sequentially When**:
- Operation B needs result of operation A
- Operations modify shared state
- Order matters for correctness

**Example - Parallel**:
```
[Reading 3 config files simultaneously]
- Read package.json
- Read tsconfig.json
- Read .env.example
→ All 3 reads issued in same tool call batch
```

**Example - Sequential**:
```
[Git workflow]
1. git add . (must complete first)
2. git commit -m "message" (needs files staged)
3. git push (needs commit created)
→ Cannot parallelize, must execute in order
```

### Retry Composition

**Principle**: Retry at the highest level possible.

**Anti-pattern**:
```
for file in files:
    for attempt in [1, 2, 3]:
        try:
            read(file)
            break
        except:
            wait(attempt)
```
→ Retries each file individually (slow if all timeout)

**Better Pattern**:
```
for attempt in [1, 2, 3]:
    try:
        read_all(files)  # Parallel batch
        break
    except:
        wait(attempt)
```
→ Retries entire batch (faster recovery)

### Tool Fallback Chains

**Principle**: Try preferred tool first, fall back to alternative if unavailable.

**Example - File Search**:
```
1. Try ripgrep (fastest)
   → If not installed, fall back to step 2
2. Try git grep (fast for git repos)
   → If not in git repo, fall back to step 3
3. Use find + grep (slowest but always available)
```

**Example - Package Manager**:
```
1. Detect package manager from lockfile
   - package-lock.json → npm
   - yarn.lock → yarn
   - pnpm-lock.yaml → pnpm
2. If no lockfile, check package.json "packageManager" field
3. If still unknown, ask user
```

---

## 6. Security and Sandboxing Patterns

### Principle of Least Privilege

**Default Assumptions**:
- Assume agent is running in untrusted environment
- Assume user input may be malicious (validate everything)
- Assume external APIs may be compromised (verify responses)

**File System Access**:
- Only read/write within designated workspace directory
- Never access ~/.ssh/, ~/.aws/, /etc/ unless explicitly needed and confirmed
- Validate all file paths (reject ../, absolute paths outside workspace)

**Command Execution**:
- Sanitize all user-provided parameters (no shell injection)
- Use parameterized commands, not string concatenation
- Reject dangerous commands (rm -rf /, dd, mkfs) unless in isolated sandbox

**Network Access**:
- Only connect to explicitly allowed hosts
- Use HTTPS, verify certificates
- Timeout all network requests (default 30s)

### Sandbox Lifecycle Management

**Creation**:
```
1. User requests code operation
2. Check if sandbox already exists for this session
   → If yes, reuse existing sandbox
   → If no, create new sandbox
3. Store sandbox ID in session state
4. Update user: "Created sandbox {id} for repository {repo}"
```

**Reuse**:
```
- Reuse same sandbox for entire conversation thread
- Avoids repeated clone/setup overhead
- Maintains state (installed packages, file edits)
```

**Destruction**:
```
Destroy sandbox when:
1. User explicitly requests (/destroy-sandbox command)
2. Session expires (7 days inactive)
3. Agent encounters unrecoverable error
4. User starts new repository (optional: ask to confirm)

Update pattern:
"Destroyed sandbox {id}. Repository changes are lost (not pushed to remote)."
```

---

## 7. State Management Patterns

### Session State Schema

**Minimum Required State**:
```
{
  "sessionId": "unique-session-identifier",
  "userId": "user-identifier",
  "currentRepo": "owner/repo | null",
  "sandboxId": "sandbox-identifier | null",
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "createdAt": "ISO-8601 timestamp",
  "lastActivity": "ISO-8601 timestamp"
}
```

**Optional State** (add as needed):
- `currentBranch`: Track git branch if needed
- `installedPackages`: Cache to avoid redundant installs
- `testResults`: Store last test run for comparison
- `lintErrors`: Track what's been fixed

### State Update Frequency

**Update Immediately**:
- User sends message (append to conversationHistory)
- Repository changes (update currentRepo)
- Sandbox created/destroyed (update sandboxId)

**Update Eventually** (batch):
- lastActivity timestamp (debounce to once per minute)
- Analytics/metrics (batch every 5 minutes)

**Never Store in State**:
- Derived values (can recompute from other state)
- Sensitive data (API keys, tokens)
- Large data (file contents, logs) → store separately with reference

---

## 8. Context Window Management

### Context Prioritization

**When approaching context limit, prioritize in this order**:
1. **System prompt** (always included, defines agent behavior)
2. **Current conversation turn** (user's immediate request)
3. **Recent conversation history** (last 5-10 messages)
4. **Repository context** (current repo, branch, recent files)
5. **Earlier conversation** (summarize or truncate)

### Summarization Triggers

**Trigger summarization when**:
- Conversation exceeds 50 messages
- Context window >80% full
- Agent switches to new repository/task

**Summarization Format**:
```
[CONVERSATION SUMMARY]
Repository: owner/repo
Branch: main
Completed:
- Fixed auth tests (3 failures → passing)
- Updated dependencies (chalk 4→5, typescript 5.1→5.3)
- Refactored API client to use async/await

Current Task: Add rate limiting to API endpoints
Status: In progress, implemented limiter, writing tests next
```

**What to Preserve**:
- User's stated goals
- Completed work (for context)
- Current task and status
- Key decisions made (why chose approach X over Y)

**What to Discard**:
- Intermediate debugging steps
- Redundant explanations
- Error messages that were resolved

---

## Version History

- **1.0.0** (2025-01-20): Initial patterns for autonomous coding agents
