# MCP Servers for Quality Automation: Analysis

**Context**: Evaluating whether MCP servers are better than Skills/Hooks for "double check and critique" automation

**User's current MCP config**:
```json
{
  "mcp": {
    "context7": "allow",
    "playwright": "allow",
    "fetch": "allow",
    "websearch": "allow"
  }
}
```

---

## What Are MCP Servers?

**MCP (Model Context Protocol)** = Open standard for connecting Claude Code to **external tools, APIs, and data sources**

**Three types**:
1. **HTTP servers** - Remote cloud services (recommended)
2. **SSE servers** - Server-Sent Events (deprecated)
3. **Stdio servers** - Local processes on your machine

**Key characteristic**: MCP servers provide access to **EXTERNAL systems** (GitHub, databases, APIs, linting tools)

---

## MCP vs Skills vs Hooks vs Subagents

| Feature | MCP Servers | Skills | Hooks | Subagents |
|---------|-------------|--------|-------|-----------|
| **Purpose** | External integrations | Internal automation | Event-driven checks | Delegated tasks |
| **Examples** | GitHub, ESLint, databases | Quality reviewer | Post-code validation | Long searches |
| **Location** | External services/processes | Claude's logic | Shell scripts | Separate context |
| **Intelligence** | Depends (can use LLMs) | Full AI (Claude) | Scripted | Full AI (Claude) |
| **Speed** | Variable (network/process) | Fast | Very fast | Slow |
| **When invoked** | Explicit or auto | Auto (model-invoked) | Event-driven | Explicit or auto |
| **Best for** | External tool integration | Internal quality checks | Deterministic gates | Complex analysis |

---

## Available MCP Servers for Code Quality

### 1. praneybehl/code-review-mcp

**What**: Code review using OpenAI, Google Gemini, or Anthropic models
**How**: Analyzes git diffs (staged changes, HEAD, branches)
**Use case**: "Review my staged changes before committing"

**Installation**:
```bash
claude mcp add code-review [url]
```

**Usage in Claude Code**:
```
User: "Review my staged changes for code quality issues"
Claude: [Uses code-review MCP tool to analyze git diff]
Claude: [Returns review from external LLM]
```

**Strengths**:
- ✅ Uses multiple LLM models (not just Claude)
- ✅ Focused on git diffs (pre-commit reviews)
- ✅ External analysis (second opinion)

**Weaknesses**:
- ❌ Requires external service/API keys
- ❌ Network latency (API calls)
- ❌ Cost (external LLM calls)
- ❌ Less context (doesn't see full conversation)

---

### 2. MCP Server Analyzer (Python)

**What**: RUFF linting + VULTURE dead code detection
**How**: Runs analysis tools on Python code
**Use case**: "Lint this Python file and find dead code"

**Strengths**:
- ✅ Deterministic (actual linter, not AI opinion)
- ✅ Fast (local tools)
- ✅ Standard Python tooling

**Weaknesses**:
- ❌ Python-only
- ❌ Requires installation/setup
- ❌ Limited to linting (doesn't evaluate architecture, elegance)

---

### 3. clj-kondo MCP Server

**What**: Clojure/ClojureScript linting
**How**: Runs clj-kondo linter
**Use case**: Clojure-specific linting

**Relevance**: ❌ Not relevant (you're not using Clojure)

---

### 4. Claude-Codex MCP Server

**What**: Granular control over code operations, quality checks, CI/CD
**How**: Requires external Codex CLI
**Use case**: Advanced code generation and quality workflows

**Weaknesses**:
- ❌ Requires external CLI installation
- ❌ More complex setup
- ❌ Unclear documentation on quality check capabilities

---

## MCP Servers You Currently Have

**From your settings.json**:

### context7
**Purpose**: Unknown (likely context management)
**Relevance**: Unknown

### playwright
**Purpose**: Browser automation/testing
**Relevance**: ✅ Could be used for E2E test automation
**Usage**: "Run Playwright tests and show me failures"

### fetch
**Purpose**: HTTP requests (likely WebFetch alternative)
**Relevance**: ✅ Useful for looking up latest docs
**Current**: Already using WebFetch tool for doc lookups

### websearch
**Purpose**: Web search capabilities
**Relevance**: ✅ Useful for looking up latest best practices
**Current**: Already using WebSearch tool for research

---

## Should You Use MCP Servers for Quality Automation?

### The Core Question

**Your "double check and critique" workflow needs**:
1. ✅ Evaluate code for correctness, elegance, standards
2. ✅ Check latest documentation for libraries used
3. ✅ Assess for bloat, edge cases, error handling
4. ✅ Provide structured feedback (PROCEED / REVISE / USER INPUT)
5. ✅ Access conversation context (requirements, templates, guides)

### Comparison: MCP Servers vs Skills

| Requirement | MCP Servers | Skills | Winner |
|-------------|-------------|--------|--------|
| **Correctness check** | ⚠️ External LLM opinion | ✅ Claude evaluates with full context | Skills |
| **Elegance check** | ❌ Hard to automate externally | ✅ Claude understands your style | Skills |
| **Standards check** | ⚠️ Need external config | ✅ Claude reads CLAUDE.md | Skills |
| **Latest docs lookup** | ✅ Can integrate doc APIs | ✅ WebFetch already does this | Tie |
| **Conversation context** | ❌ MCP servers don't have it | ✅ Skills run in same context | Skills |
| **Speed** | ⚠️ Network latency | ✅ Fast (in-context) | Skills |
| **Cost** | ⚠️ External API costs | ✅ Included in Claude Code | Skills |
| **Setup complexity** | ❌ Install servers, config APIs | ✅ Just create SKILL.md | Skills |

---

## When to Use MCP Servers

### ✅ Use MCP Servers When:

1. **Integrating with external systems**:
   - "Review my GitHub PR and suggest improvements"
   - "Check Sentry for errors in the last 24 hours"
   - "Query our database for user analytics"

2. **Running external linters/tools**:
   - "Run ESLint on this file" (via ESLint MCP server)
   - "Check Python code with RUFF" (via Analyzer MCP server)
   - "Run security scan" (via Socket MCP server)

3. **Need second opinion from different LLM**:
   - "Get GPT-4's opinion on this architecture"
   - "Compare Gemini's vs Claude's code review"

4. **Accessing proprietary tools**:
   - Your company's internal linter
   - Custom compliance checker
   - Domain-specific analyzer

---

### ❌ Don't Use MCP Servers When:

1. **Claude can do it internally**:
   - ❌ Code quality evaluation (Claude is expert)
   - ❌ Reading project files (Read tool)
   - ❌ Searching codebase (Grep/Glob tools)
   - ❌ Looking up docs (WebFetch tool)

2. **Need conversation context**:
   - ❌ "Does this match our design doc?" (needs to read design doc)
   - ❌ "Is this elegant?" (subjective, needs your style context)
   - ❌ "Does it follow our standards?" (needs CLAUDE.md context)

3. **Want simplicity**:
   - ❌ Skills require 1 file (SKILL.md)
   - ❌ MCP servers require installation + config + API keys

---

## Recommendation: Skills + Hooks (NOT MCP)

### For Your "Double Check and Critique" Automation

**Best approach**: Skills + Hooks (from Phase 2 plan)

**Why NOT MCP servers**:

1. **Claude is the expert** - Your quality criteria (correct, elegant, standards-compliant) require AI judgment WITH conversation context. External MCP servers don't have this context.

2. **No external dependencies needed** - You don't need ESLint, RUFF, or other linters. You need Claude to evaluate code quality holistically.

3. **Simpler setup** - Skills: Create 1 file. MCP: Install server + configure + manage API keys.

4. **Faster** - Skills run in-context (no network latency). MCP servers require network calls or process spawning.

5. **Cost-effective** - Skills included in Claude Code. MCP servers may require external LLM API costs.

6. **Context-aware** - Skills see your requirements, CLAUDE.md, templates. MCP servers operate independently.

---

## When MCP Servers WOULD Be Valuable for You

### Scenario 1: GitHub PR Reviews

**Use case**: "Review PR #123 before I approve it"

**MCP server**: GitHub MCP server
**What it does**: Fetches PR diff, comments, CI status
**Why useful**: Integrates with external GitHub API

**Implementation**:
```bash
claude mcp add github https://github-mcp-server.example.com
```

**Usage**:
```
You: "Review PR #123 and check if it follows our standards"
Claude: [Uses GitHub MCP to fetch PR]
Claude: [Uses Quality Reviewer Skill to evaluate]
Claude: [Posts review comment via GitHub MCP]
```

**Value**: ✅ Automates PR review workflow

---

### Scenario 2: External Linter Integration

**Use case**: "Run ESLint and fix all errors"

**MCP server**: ESLint MCP server (if it exists)
**What it does**: Runs ESLint CLI and returns results
**Why useful**: Deterministic linting (not AI opinion)

**Implementation**:
```bash
claude mcp add eslint [url]
```

**Usage**:
```
You: "Lint this file and auto-fix issues"
Claude: [Uses ESLint MCP to run linter]
Claude: [Receives errors/warnings]
Claude: [Applies fixes using Edit tool]
```

**Value**: ✅ Integrates external linting tools

**Alternative**: PostToolUse Hook already does this!
```yaml
script: |
  npm run lint --fix
```

**Conclusion**: Hook simpler than MCP for local linters

---

### Scenario 3: Database Query for Validation

**Use case**: "Check if this feature will break production queries"

**MCP server**: PostgreSQL/MySQL MCP server
**What it does**: Connects to database, runs queries
**Why useful**: Validates against real production data

**Implementation**:
```bash
claude mcp add postgres postgres://[connection]
```

**Usage**:
```
You: "Will this schema change break existing queries?"
Claude: [Uses Postgres MCP to check current schema]
Claude: [Analyzes proposed changes]
Claude: [Tests queries against real schema]
```

**Value**: ✅ Validates against live production environment

---

## Updated Recommendation Matrix

| Automation Goal | Tool | Why |
|----------------|------|-----|
| **Quality checks** (correct, elegant, standards) | Skills ✓✓✓ | Needs context, AI judgment |
| **Post-code validation** (lint, test, type check) | Hooks ✓✓✓ | Deterministic, fast, simple |
| **GitHub PR reviews** | MCP (GitHub) ✓✓ | External integration needed |
| **Database validation** | MCP (Postgres) ✓✓ | Production data access |
| **External linter** | Hooks ✓✓✓ or MCP ✓ | Hooks simpler for local tools |
| **Security scanning** | MCP (Socket) ✓✓ | External service |
| **Second LLM opinion** | MCP (code-review) ✓ | Different model perspective |

---

## Should You Install MCP Servers?

### For Phase 2 (Quality Automation): ❌ NO

**Reasons**:
1. Skills + Hooks are simpler and faster
2. Claude's evaluation > external LLM without context
3. No external dependencies needed
4. Lower cost (no API calls)

### For Future (PR Reviews, External Tools): ⚠️ MAYBE

**Consider MCP servers for**:
- ✅ GitHub PR automation (if you do many PRs)
- ✅ Production database validation (if needed)
- ✅ Company-specific internal tools
- ✅ Advanced Playwright test orchestration

**Don't bother with MCP for**:
- ❌ Local linting (use Hooks with npm scripts)
- ❌ Quality evaluation (use Skills)
- ❌ Post-code checks (use Hooks)

---

## Your Current MCP Servers: Analysis

**What you have**:
```json
{
  "context7": "allow",    // Unknown - possibly context management
  "playwright": "allow",  // Browser automation
  "fetch": "allow",       // HTTP requests (redundant with WebFetch?)
  "websearch": "allow"    // Web search (redundant with WebSearch?)
}
```

**Questions**:
1. **What is context7?** - Not standard MCP server, might be custom
2. **Are fetch/websearch redundant?** - Claude Code has WebFetch and WebSearch tools built-in
3. **Is playwright being used?** - Useful for E2E testing automation

**Recommendation**: Keep as-is for now, these aren't hurting anything

---

## Comparison: Code Review MCP Server vs Quality Reviewer Skill

### External Code Review MCP (praneybehl/code-review-mcp)

**Workflow**:
```
1. User: "Review my changes"
2. Claude: [Calls MCP server]
3. MCP server: [Fetches git diff]
4. MCP server: [Sends to GPT-4/Gemini/Claude API]
5. External LLM: [Reviews code]
6. MCP server: [Returns review]
7. Claude: [Shows results to user]
```

**Pros**:
- ✅ Second opinion from different LLM
- ✅ Can use GPT-4 Turbo, Gemini Pro, etc.
- ✅ Specialized for git diffs

**Cons**:
- ❌ External API costs ($$$)
- ❌ Network latency (slower)
- ❌ No conversation context (doesn't see your requirements)
- ❌ Complex setup (API keys, configuration)
- ❌ Security concern (code sent to external service)

---

### Quality Reviewer Skill (Internal)

**Workflow**:
```
1. Claude proposes code change
2. Quality Reviewer Skill: [Activates automatically]
3. Skill: [Reads CLAUDE.md, design doc, templates]
4. Skill: [Evaluates with full context]
5. Skill: [Returns PROCEED / REVISE / USER INPUT]
6. User: "yes"
7. Claude: [Implements with confidence]
```

**Pros**:
- ✅ Full conversation context (knows your requirements)
- ✅ Fast (in-context, no API calls)
- ✅ Free (included in Claude Code)
- ✅ Simple setup (one SKILL.md file)
- ✅ Secure (no external services)
- ✅ Reads your project standards (CLAUDE.md)

**Cons**:
- ❌ Single perspective (only Claude)
- ❌ Limited to Claude's knowledge

---

## The Verdict

**For your use case** (347 "double check and critique" prompts):

### Winner: Quality Reviewer Skill ✓✓✓

**Why**:
1. Needs conversation context → Skills have it, MCP servers don't
2. Evaluating "elegance" → Subjective, needs your style understanding
3. Checking "standards" → Needs to read CLAUDE.md
4. Fast iteration → Skills are instant, MCP servers add latency
5. Cost-effective → Skills included, MCP servers cost $$$ for external LLM calls
6. Simple setup → 1 file vs install + config + API keys

---

### When to Add MCP Servers (Future)

**Only if you need**:
1. GitHub PR automation ("Review and comment on PR #456")
2. External tool integration (company-specific linters)
3. Database validation (query production schemas)
4. Second opinion from different LLM model

**Not needed for**:
- ❌ Basic quality checks (Skills handle this)
- ❌ Post-code validation (Hooks handle this)
- ❌ Looking up docs (WebFetch handles this)
- ❌ Running npm scripts (Hooks handle this)

---

## Final Recommendation

### Phase 2 Plan (UNCHANGED)

**Phase 2A**: Quality Reviewer Skill ⭐
- Create `~/.claude/skills/quality-reviewer/SKILL.md`
- Handles all 347 quality check prompts automatically
- No MCP servers needed

**Phase 2B**: PostToolUse Hook ⭐
- Create `~/.claude/hooks/post-code-validation.yaml`
- Runs linters/tests after code changes
- No MCP servers needed

### MCP Servers (FUTURE - Optional)

**Consider adding** (Phase 3+):
- GitHub MCP server (for PR automation)
- Database MCP server (if validating against production)

**Don't add**:
- Code review MCP (Skills better for your use case)
- Linting MCP (Hooks simpler)

---

## Summary

| Question | Answer |
|----------|--------|
| **Are MCP servers relevant?** | Yes, but not for Phase 2 |
| **Should we use MCP for quality checks?** | No - Skills are better |
| **When are MCP servers useful?** | External integrations (GitHub, databases) |
| **Do we need to install MCP servers now?** | No - Skills + Hooks sufficient |
| **What about your current MCP config?** | Keep as-is, not interfering |

**Bottom line**: MCP servers are powerful for external integrations, but Skills + Hooks are the right tools for internal quality automation. Stick with Phase 2 plan: Skills + Hooks.
