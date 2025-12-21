# Plan: Convert Shell Hooks to TypeScript/Bun

## Goal

Replace 9 shell script hooks with standalone TypeScript files using Bun runtime.

**Before:** `.sh` files requiring `jq` for JSON parsing
**After:** `.ts` files with native JSON parsing, no external dependencies

---

## Bun APIs (verified)

```typescript
#!/usr/bin/env bun

// Stdin
await Bun.stdin.text()                    // read all as string
await Bun.stdin.json()                    // parse as JSON (throws on invalid)

// Files
await Bun.file(path).text()               // read file
await Bun.file(path).exists()             // check existence
await Bun.write(path, content)            // write file

// Subprocesses (for ESLint/Prettier)
import { $ } from "bun";
await $`npx eslint --fix ${file}`.quiet() // run command, suppress output
const result = await $`cmd`.nothrow()     // don't throw on non-zero exit

// Environment
process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

// Exit
process.exit(0)   // success
process.exit(2)   // blocking feedback (stderr shown to Claude)
```

---

## Hooks to Convert

| # | Hook | Complexity | Key Operations |
|---|------|------------|----------------|
| 1 | `prompt-timestamp.ts` | Trivial | Output dates |
| 2 | `session-version.ts` | Simple | Read file |
| 3 | `prompt-questions.ts` | Simple | Read stdin text |
| 4 | `session-lint-check.ts` | Simple | Check file exists |
| 5 | `session-verify-agents.ts` | Medium | Read/write file |
| 6 | `stop-quality.ts` | Complex | Parse JSON, regex match |
| 7 | `post-tool-lint.ts` | Complex | Run subprocesses |
| 8 | `cursor/after-file-edit.ts` | Complex | Subprocess + marker file |
| 9 | `cursor/stop.ts` | Medium | Check marker, output JSON |

---

## Files to Change

**Create:** `packages/cli/templates/hooks/*.ts` (9 files)

**Modify:**
- `packages/cli/src/schema.ts` - Change `.sh` → `.ts` in ownedFiles
- `packages/cli/src/templates/config.ts` - Change `.sh` → `.ts` in hook commands

**Deprecate:** Add `templates/hooks/*.sh` to deprecatedFiles in schema.ts

---

## Error Handling

- Empty stdin → return early (exit 0)
- File not found → handle gracefully, don't crash
- Invalid JSON → catch, return early
- Subprocess fails → log error, continue

---

## Success Criteria

- [ ] All 9 `.ts` hooks work with `#!/usr/bin/env bun`
- [ ] No `jq` dependency
- [ ] `safeword upgrade` replaces old `.sh` with new `.ts`
- [ ] Build passes
