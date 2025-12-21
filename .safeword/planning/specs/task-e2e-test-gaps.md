# Task: E2E Test Coverage Gaps

**Type:** L1 Task (Testing improvement)
**Status:** Draft
**Created:** 2024-12-21

---

## Goal

Fill E2E test coverage gaps across the safeword project.

---

## Test Gaps

### 1. ESLint Plugin Tests (Critical - No tests exist!)

**Location:** `packages/eslint-plugin/tests/`

#### 1a. Plugin Export Tests
| Test | Description |
|------|-------------|
| Plugin loads | `import safeword from 'eslint-plugin-safeword'` doesn't throw |
| Meta properties | `meta.name` and `meta.version` are defined |
| All configs exist | All 9 configs are exported as arrays |
| Rules exported | `rules` object contains custom rules |
| Detect exported | `detect` object contains detection utilities |

#### 1b. Custom Rule: `no-incomplete-error-handling`
| Test | Description |
|------|-------------|
| Catches console.error without rethrow | Reports on `catch { console.error(e); }` |
| Allows console.error + throw | No error on `catch { console.error(e); throw e; }` |
| Allows console.error + return | No error on `catch { console.error(e); return null; }` |
| Handles logger variants | Works with `logger.error`, `log.warn`, etc. |
| Handles nested if blocks | Both branches must terminate |

#### 1c. Detection Utilities (`detect.ts`)
| Test | Description |
|------|-------------|
| detectFramework - Next.js | Returns `'next'` when `next` in deps |
| detectFramework - React | Returns `'react'` when `react` in deps (no next) |
| detectFramework - TypeScript | Returns `'typescript'` when only TS in deps |
| hasTailwind | Returns true for `tailwindcss`, `@tailwindcss/vite`, etc. |
| hasTanstackQuery | Returns true for any `@tanstack/*-query` package |
| hasVitest/hasPlaywright | Correct detection |
| collectAllDeps | Merges root + workspace deps |

#### 1d. Config Integration Tests
| Test | Description |
|------|-------------|
| Config lint works | ESLint can use `safeword.configs.recommended` without error |
| TypeScript config | Lints a TS file, catches `any` type |
| React config | Lints JSX, catches hooks violations |

**How to test:**
```typescript
// 1a. Plugin exports
import safeword from 'eslint-plugin-safeword';
expect(safeword.configs.recommended).toBeInstanceOf(Array);
expect(safeword.rules['no-incomplete-error-handling']).toBeDefined();

// 1b. Custom rule with RuleTester
import { RuleTester } from 'eslint';
import noIncompleteErrorHandling from '../src/rules/no-incomplete-error-handling';

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022 } });
tester.run('no-incomplete-error-handling', noIncompleteErrorHandling, {
  valid: [
    'try { foo(); } catch (e) { console.error(e); throw e; }',
    'try { foo(); } catch (e) { console.error(e); return null; }',
  ],
  invalid: [
    { code: 'try { foo(); } catch (e) { console.error(e); }', errors: [{ messageId: 'incompleteErrorHandling' }] },
  ],
});

// 1c. Detection utilities
import { detectFramework, hasTailwind } from '../src/detect';
expect(detectFramework({ next: '14.0.0' })).toBe('next');
expect(hasTailwind({ tailwindcss: '3.0.0' })).toBe(true);

// 1d. Config integration (eslint.config.mjs works)
import { ESLint } from 'eslint';
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: safeword.configs.recommended });
const results = await eslint.lintText('var unused;');
expect(results[0].errorCount).toBeGreaterThan(0);
```

---

### 2. Hook Error Handling

**Location:** `packages/cli/tests/integration/hooks.test.ts`

| Test | Description |
|------|-------------|
| Hook throws error | Exit code should be non-zero, stderr has error |
| Hook times out | Process killed after timeout, clean exit |
| Invalid JSON input | Hook handles malformed stdin gracefully |
| Missing transcript | stop-quality handles missing file |
| Partial transcript | Handles truncated JSONL |

**How to test:**
```typescript
it('handles hook errors gracefully', () => {
  // Create a hook that throws
  writeTestFile(dir, '.safeword/hooks/bad-hook.ts', 'throw new Error("boom")');
  const result = spawnSync('bun', ['.safeword/hooks/bad-hook.ts'], {...});
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('boom');
});
```

---

### 3. Template Content Validation

**Location:** `packages/cli/tests/commands/setup-templates.test.ts`

| Test | Description |
|------|-------------|
| SAFEWORD.md structure | Has required sections (Guides, Templates, etc.) |
| Guide structure | Each guide has expected headings |
| Template placeholders | Templates have fillable sections |
| Markdown valid | No syntax errors in markdown |
| No TODO/FIXME | Templates don't have dev placeholders |

**How to test:**
```typescript
it('SAFEWORD.md has required sections', () => {
  const content = readTestFile(dir, '.safeword/SAFEWORD.md');
  expect(content).toContain('## Guides');
  expect(content).toContain('## Templates');
  expect(content).toContain('## Response Format');
});
```

---

### 4. Version Migration (Schema Changes)

**Location:** `packages/cli/tests/commands/upgrade.test.ts`

| Test | Description |
|------|-------------|
| v0.11 → v0.12 | Hook format migration (shell → TypeScript) |
| Old hook format | Handles `.sh` hooks, upgrades to `.ts` |
| Missing new files | Adds files that didn't exist in old version |
| Removed files | Cleans up deprecated files |

**How to test:**
```typescript
it('upgrades from v0.11 to v0.12', async () => {
  // Create a v0.11 project structure (old hook format)
  writeTestFile(dir, '.safeword/version', '0.11.0');
  writeTestFile(dir, '.safeword/hooks/lint.sh', '#!/bin/bash\neslint .');

  await runCli(['upgrade'], { cwd: dir });

  // Old hooks removed, new hooks added
  expect(fileExists(dir, '.safeword/hooks/lint.sh')).toBe(false);
  expect(fileExists(dir, '.safeword/hooks/post-tool-lint.ts')).toBe(true);
});
```

---

### 5. Partial Installation Recovery

**Location:** `packages/cli/tests/commands/setup-core.test.ts`

| Test | Description |
|------|-------------|
| Interrupted setup | Setup fails mid-way, project in clean state |
| Retry after failure | Can run setup again after failure |
| Disk full simulation | Handles write errors gracefully |

**How to test:**
```typescript
it('leaves project clean after interrupted setup', async () => {
  // Make a file read-only to cause failure mid-setup
  mkdirSync(path.join(dir, '.safeword'));
  chmodSync(path.join(dir, '.safeword'), 0o444);

  const result = await runCli(['setup', '--yes'], { cwd: dir });
  expect(result.exitCode).not.toBe(0);

  // Remove read-only, retry should work
  chmodSync(path.join(dir, '.safeword'), 0o755);
  rmdirSync(path.join(dir, '.safeword'));

  const retry = await runCli(['setup', '--yes'], { cwd: dir });
  expect(retry.exitCode).toBe(0);
});
```

---

## Priority Order

1. **ESLint Plugin Tests** - Critical, no tests exist, most impactful
2. **Hook Error Handling** - Important for robustness
3. **Template Content Validation** - Ensures quality
4. **Version Migration** - Important for upgrades
5. **Partial Installation Recovery** - Edge case handling

---

## Success Criteria

- [ ] eslint-plugin has ≥20 tests covering: exports (5), custom rule (5), detect utilities (7), config integration (3)
- [ ] Hook error scenarios covered (5 tests)
- [ ] Template structure validated (5 tests)
- [ ] Version migration tested for v0.11→v0.12
- [ ] All tests pass in CI

---

## Notes

- Slash commands and skills cannot be E2E tested (Claude Code runs them)
- MCP servers are external processes (test config only)
- Focus on what WE control: hooks, templates, CLI, plugin
