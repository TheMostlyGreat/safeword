# Code Philosophy & Practices

**Note:** This file provides instructions for LLM-based coding agents. For comprehensive framework on writing clear, actionable LLM-consumable instructions, see `@~/.agents/coding/guides/llm-instruction-design.md`.

---

## Communication Style
- Be concise, clear, direct, technical, friendly, and educational
- Show reasoning when it adds value, otherwise just deliver results
- No emojis unless explicitly requested

## Response Format
At the end of EVERY response, include a JSON summary with this exact structure:
```json
{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}
```

Where:
- `proposedChanges`: `true` if you suggested/proposed changes to specific files in your response
- `madeChanges`: `true` if you actually modified files using Write/Edit tools
- `askedQuestion`: `true` if you asked the user a question and need their response before proceeding

Examples:
- Discussed approach only: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}`
- Proposed edits but waiting for approval: `{"proposedChanges": true, "madeChanges": false, "askedQuestion": false}`
- Made edits directly: `{"proposedChanges": false, "madeChanges": true, "askedQuestion": false}`
- Proposed AND made edits: `{"proposedChanges": true, "madeChanges": true, "askedQuestion": false}`
- Asked user a question: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": true}`

## Code Philosophy
- **Elegant code and architecture** - Prioritize developer experience
- **AVOID BLOAT** - Simple, focused solutions over complex ones
- **Self-documenting code** - Minimal inline comments, clear naming and structure
- **Explicit error handling** - NEVER suppress or swallow errors silently

## Documentation Verification (CRITICAL)
- **Always look up current documentation** for libraries, tools, and frameworks
- Do NOT assume API compatibility - verify the actual version being used
- Check docs unless they're already loaded in the context window
- **NEVER assume features exist** - Training data is at least 1 year old; when uncertain, verify first

## Testing Philosophy

**Test what matters** - Focus on user experience and delivered features, not implementation details.

**Test-Driven Development (TDD):**
- Write tests BEFORE implementing features (RED → GREEN → REFACTOR)
- Tests define expected behavior, code makes them pass
- Refactor with confidence knowing tests catch regressions

**Always test what you build** - Run tests yourself before completion. Don't ask the user to verify.

**Workflow:** See `@~/.agents/coding/guides/testing-methodology.md` for comprehensive TDD workflow (RED → GREEN → REFACTOR phases)

## Debugging & Troubleshooting

**Debug Logging:**
- When debugging, log **actual vs expected** values (not just pass/fail)
- Use JSON.stringify() for complex objects to see structure
- Remove debug logging after fixing (keep production code clean)

**Cross-Platform Development:**
- Test on all target platforms early (macOS, Windows, Linux)
- Never assume Unix-style paths (`/`) - handle both `/` and `\`
- Be aware of runtime environment (browser vs Node.js, client vs server)

## Best Practices (Always Apply)
Before implementing, research and apply:
- **Tool-specific best practices** - Use libraries/frameworks as intended
- **Domain best practices** - Follow conventions for the type of app (CLI, web editor, API, etc.)
- **UX best practices** - Prioritize user experience in design decisions

## Self-Review Checklist
Before completing any work, verify:
- ✓ Is it correct? Will it actually work?
- ✓ Is it elegant? Does it avoid bloat?
- ✓ Does it follow best practices?
- ✓ Are you using the right docs/versions?
- ✓ Have you tested the user-facing functionality?

## Asking Questions
- **Be proactive and self-sufficient** - Don't be lazy
- Only ask questions when you genuinely can't find the answer through:
  - Online documentation and research
  - Reading the codebase
  - Running tests or experiments
- Ask non-obvious questions that require user domain knowledge or preferences

## Tools & CLIs
Keep these updated to latest versions:
- GitHub CLI (`gh`)
- AWS CLI
- Railway CLI
- PostHog CLI

## Git Workflow
- Commit whenever work is completed
- Commit often to checkpoint progress
- Use descriptive commit messages
