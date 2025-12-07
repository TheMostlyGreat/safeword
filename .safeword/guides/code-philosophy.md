# Code Philosophy & Practices

**Note:** This file provides instructions for LLM-based coding agents. For comprehensive framework on writing clear, actionable LLM-consumable instructions, see `@.safeword/guides/llm-guide.md`.

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

Where (all fields describe **this response only**, not cumulative):

- `proposedChanges`: `true` if you suggested/proposed changes to specific files **in this response**
- `madeChanges`: `true` if you **modified files in this response** using Write/Edit tools
- `askedQuestion`: `true` if you asked the user a question and need their response before proceeding

Examples:

- Discussed approach only: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}`
- Proposed edits but waiting for approval: `{"proposedChanges": true, "madeChanges": false, "askedQuestion": false}`
- Made edits directly: `{"proposedChanges": false, "madeChanges": true, "askedQuestion": false}`
- Proposed AND made edits: `{"proposedChanges": true, "madeChanges": true, "askedQuestion": false}`
- Asked user a question: `{"proposedChanges": false, "madeChanges": false, "askedQuestion": true}`
- **Quality review response** (no new changes): `{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}`

## Code Philosophy

- **Elegant code and architecture** - Prioritize developer experience
- **AVOID BLOAT** - Simple, focused solutions over complex ones
- **Self-documenting code** - Minimal inline comments, clear naming and structure
- **Explicit error handling** - NEVER suppress or swallow errors silently

**Error handling examples:**

| ❌ Bad                         | ✅ Good                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `catch (e) {}` (swallowed)     | `catch (e) { throw new Error(\`Failed to read ${filePath}: ${e.message}\`) }` |
| `catch (e) { console.log(e) }` | `catch (e) { logger.error('Payment failed', { userId, amount, error: e }) }`  |
| Generic "Something went wrong" | "Failed to save user profile: database connection timeout"                    |

**Naming examples:**

| ❌ Bad             | ✅ Good                        |
| ------------------ | ------------------------------ |
| `calcTot`          | `calculateTotalWithTax`        |
| `d`, `tmp`, `data` | `userProfile`, `pendingOrders` |
| `handleClick`      | `submitPaymentForm`            |
| `process()`        | `validateAndSaveUser()`        |

**When to comment:**

- ✅ Non-obvious business logic ("Tax exempt for orders >$500 per policy X")
- ✅ Workarounds ("Safari requires this delay due to bug #123")
- ❌ Obvious code (`// increment counter` before `i++`)
- ❌ Restating the function name

**Bloat examples (avoid these):**

| ❌ Bloat                                    | ✅ Instead                |
| ------------------------------------------- | ------------------------- |
| Utility class for one function              | Single function           |
| Factory pattern for simple object           | Direct construction       |
| Abstract base class with one implementation | Concrete class            |
| Config file for 2 options                   | Hardcode or simple params |
| "Future-proofing" unused code paths         | Delete, add when needed   |

**When to push back:** If a feature request would add >50 lines for a "nice to have", ask: "Is this essential now, or can we add it later?"

## Documentation Verification (CRITICAL)

- **Always look up current documentation** for libraries, tools, and frameworks
- Do NOT assume API compatibility - verify the actual version being used
- Check docs unless they're already loaded in the context window
- **NEVER assume features exist** - Training data is at least 1 year old; when uncertain, verify first

**How to verify:**

1. Check `package.json` (or equivalent) for installed version
2. Use Context7 MCP or official docs for current API
3. If uncertain, ask user: "Which version of X are you using?"

## Testing Philosophy

**Test what matters** - Focus on user experience and delivered features, not implementation details.

**Test-Driven Development (TDD):**

- Write tests BEFORE implementing features (RED → GREEN → REFACTOR)
- Tests define expected behavior, code makes them pass
- Refactor with confidence knowing tests catch regressions

**Always test what you build** - Run tests yourself before completion. Don't ask the user to verify.

**NEVER modify or skip tests without approval:**

- ❌ Changing test expectations to match broken code
- ❌ Adding `.skip()` or `.todo()` to make failures go away
- ❌ Deleting tests you can't get passing
- ✅ If a test fails, fix the implementation—not the test
- ✅ If a test seems wrong or requirements changed, explain why and ask before changing it

**Workflow:** See `@.safeword/guides/development-workflow.md` for comprehensive TDD workflow (RED → GREEN → REFACTOR phases)

## Debugging & Troubleshooting

**Debug Logging:**

- When debugging, log **actual vs expected** values (not just pass/fail)
- Use JSON.stringify() for complex objects to see structure
- Remove debug logging after fixing (keep production code clean)

```javascript
// ❌ Bad: console.log('here')
// ✅ Good: console.log('validateUser', { expected: 'admin', actual: user.role })
```

**Cross-Platform Development:**

- Test on all target platforms early (macOS, Windows, Linux)
- Never assume Unix-style paths (`/`) - handle both `/` and `\`
- Be aware of runtime environment (browser vs Node.js, client vs server)

```javascript
// ❌ Bad: dir + '/' + filename
// ✅ Good: path.join(dir, filename)
```

## Best Practices (Always Apply)

Before implementing, research and apply:

- **Tool-specific best practices** - Use libraries/frameworks as intended
- **Domain best practices** - Follow conventions for the type of app (CLI, web editor, API, etc.)
- **UX best practices** - Prioritize user experience in design decisions

**How to research:** Use Context7 MCP or official docs. Check for established patterns before inventing your own.

## Self-Review Checklist

Before completing any work, verify:

- ✓ Is it correct? Will it actually work?
- ✓ Is it elegant? Does it avoid bloat?
- ✓ Does it follow best practices?
- ✓ Are you using the right docs/versions?
- ✓ Have you tested the user-facing functionality?

**Blockers:** If something can't be fixed now, note it explicitly: "Deferred: [issue] because [reason]"

## Asking Questions

- **Be proactive and self-sufficient** - Don't be lazy
- Only ask questions when you genuinely can't find the answer through:
  - Online documentation and research
  - Reading the codebase
  - Running tests or experiments
- Ask non-obvious questions that require user domain knowledge or preferences
- **When asking, show what you tried:** "I checked X and Y but couldn't determine Z. What's your preference?"

## Tools & CLIs

**Keep these updated** (check before starting new projects):

- GitHub CLI (`gh`)
- AWS CLI
- Railway CLI
- PostHog CLI

**Update workflow:**

1. Check current version: `gh --version`, `aws --version`, etc.
2. Check for updates: `brew upgrade gh` or tool-specific update command
3. Review changelog for breaking changes before major version updates
4. If breaking changes affect your workflow, pin to current version until migration planned

**When to pin versions:** If a tool is used in CI/automation, pin to specific version in scripts to avoid surprise breakages.

## Git Workflow

- Commit whenever work is completed
- Commit often to checkpoint progress
- Use descriptive commit messages
- Make atomic commits (one logical change per commit)

```text
# ❌ Bad: "misc fixes"
# ✅ Good: "fix: login button not responding to clicks"
```

---

## Key Takeaways

- Clarity → Simplicity → Correctness (in that order)
- Delete unused code—no "just in case" abstractions
- Commit often with descriptive messages
- Verify library versions before using APIs (training data is stale)
