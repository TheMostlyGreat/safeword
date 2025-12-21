# Safeword Roadmap - December 2025

**Status:** Active
**Created:** 2025-12-21

---

## Goal

Define comprehensive testing strategy including:
- E2E functional test coverage gaps
- User Acceptance Tests (UATs) by persona
- New language support (Go, Python)

---

## Target Personas

| Persona | Description | Primary Tool |
|---------|-------------|--------------|
| **TypeScript Dev** | Modern TS developer, uses latest patterns | Cursor, Claude Code |
| **Go Dev** | Backend/systems developer, values simplicity | Claude Code, Cursor |
| **Python Dev** | Data/ML engineer or backend dev | Claude Code, Cursor |
| **Team Lead** | Evaluating AI tooling for team adoption | Any |

---

## User Acceptance Tests (UATs)

UATs are **dynamic per spec/ticket** - defined based on what's being built and who it's for.

### UAT Framework

Each spec should define:

```markdown
## UATs

### [Persona Name]
| Criteria | How to Evaluate |
|----------|-----------------|
| "[User says/feels X]" | [Concrete evaluation method] |
```

### Choosing Personas

Pick personas relevant to the feature being built:

| Persona | When to Include |
|---------|-----------------|
| TypeScript Dev | JS/TS tooling, ESLint, React/Next features |
| Go Dev | Go linting, Go-specific hooks |
| Python Dev | Python linting, pyproject.toml |
| Team Lead | Onboarding, docs, setup UX |
| Beginner | First-time users, error messages, recovery |
| Power User | Advanced config, customization, escape hatches |

### UAT Criteria Types

| Type | Example | Evaluation |
|------|---------|------------|
| Speed/Friction | "Setup takes <2 min" | Time it, count retries |
| Correctness | "Catches real issues, not noise" | Run on real projects, review output |
| Feel/Polish | "Feels modern" | Compare to 2024/2025 DX trends |
| Compatibility | "Works with my existing X" | Test with common configs |
| Recommendation | "Would recommend to team" | Dogfooding, NPS-style feedback |

### Example: This Spec's UATs

For the E2E test gaps and Go/Python linting work:

**TypeScript Dev (existing feature)**
| Criteria | Evaluate |
|----------|----------|
| "ESLint plugin catches LLM mistakes" | Test `no-incomplete-error-handling` on real code |
| "Hook errors don't break my flow" | Trigger error scenarios, check recovery |

**Go Dev (new feature)**
| Criteria | Evaluate |
|----------|----------|
| "safeword setup detects my Go project" | Run on Go monorepo |
| "golangci-lint config catches unchecked errors" | Lint code with ignored errors |

**Python Dev (new feature)**
| Criteria | Evaluate |
|----------|----------|
| "ruff config works with my pyproject.toml" | Run on Python project with existing ruff |
| "Catches unused imports without breaking my workflow" | Lint real Python code |

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

## Feature Gaps

### 6. Go Linting Support

**Goal:** Safeword detects Go projects and configures appropriate linting.

| Component | Description |
|-----------|-------------|
| Detection | `detectFramework()` returns `'go'` when `go.mod` exists |
| Config template | `.golangci.yml` with LLM-optimized rules |
| Hook integration | `post-tool-lint.ts` runs `golangci-lint` for `.go` files |
| Common LLM mistakes | Unchecked errors, unused variables, shadowing |

**Tools to consider:** golangci-lint (wraps staticcheck, go vet, errcheck, etc.)

**Tests needed:**
- [ ] Detect Go project from `go.mod`
- [ ] Generate valid `.golangci.yml`
- [ ] Hook runs golangci-lint on Go file changes
- [ ] Catches unchecked error returns

---

### 7. Python Linting Support

**Goal:** Safeword detects Python projects and configures appropriate linting.

| Component | Description |
|-----------|-------------|
| Detection | `detectFramework()` returns `'python'` when `pyproject.toml` or `requirements.txt` exists |
| Config template | `ruff.toml` or `pyproject.toml [tool.ruff]` section |
| Hook integration | `post-tool-lint.ts` runs `ruff` for `.py` files |
| Type checking | Optional mypy/pyright integration |
| Common LLM mistakes | Unused imports, type errors, f-string issues |

**Tools to consider:** ruff (fast, replaces flake8/isort/black), mypy, pyright

**Tests needed:**
- [ ] Detect Python project from `pyproject.toml` or `requirements.txt`
- [ ] Generate valid `ruff.toml`
- [ ] Hook runs ruff on Python file changes
- [ ] Catches unused imports, type annotation issues

---

## Priority Order

### E2E Test Gaps (Functional)
1. **ESLint Plugin Tests** - Critical, no tests exist, most impactful
2. **Hook Error Handling** - Important for robustness
3. **Template Content Validation** - Ensures quality
4. **Version Migration** - Important for upgrades
5. **Partial Installation Recovery** - Edge case handling

### Feature Gaps (New Capabilities)
6. **Go Linting** - Expands to new language
7. **Python Linting** - Expands to new language

---

## Success Criteria

### Functional Tests
- [ ] eslint-plugin has ≥20 tests covering: exports (5), custom rule (5), detect utilities (7), config integration (3)
- [ ] Hook error scenarios covered (5 tests)
- [ ] Template structure validated (5 tests)
- [ ] Version migration tested for v0.11→v0.12
- [ ] All tests pass in CI

### UAT Validation (this spec)
- [ ] TypeScript dev: ESLint plugin catches LLM mistakes, hook errors recoverable
- [ ] Go dev: setup detects Go, golangci-lint catches unchecked errors
- [ ] Python dev: ruff works with existing config, catches unused imports

### New Language Support
- [ ] Go detection and linting works
- [ ] Python detection and linting works
- [ ] Multi-language projects handled correctly

---

## Process TODOs

### Evolve Spec Phase for UATs

Spec templates should require clarifying questions and UAT criteria:

- [ ] Update `feature-spec-template.md`:
  - Add ⚠️ Clarifying Questions section (gate before implementation)
  - Add Target Personas section
  - Add UAT criteria per persona (evaluable)
- [ ] Update `task-spec-template.md`:
  - Add Clarifying Questions to L1 template
  - Add Target Persona + UAT criteria
  - Update examples to show completed questions
- [ ] Update `planning-guide.md`:
  - Add "Clarifying Questions (CRITICAL)" section
  - Add "User Acceptance Tests (UATs)" section
  - Add Quick Reference red flags for both
- [ ] Define how to "run" UAT evaluations:
  - LLM evals with persona prompts (promptfoo)
  - Manual review checklists
  - Dogfooding sessions with structured feedback
- [ ] Run `safeword upgrade` to sync templates to local project

### Linear Integration

Most teams use Linear for project management. Planning files in `.safeword/planning/` should integrate:

- [ ] Research Linear API/CLI for syncing tasks
- [ ] Define mapping: spec file → Linear issue/project
- [ ] Consider: bi-directional sync vs one-way export
- [ ] Consider: Linear as source of truth vs Git as source of truth

### Claude Code Plugin Architecture

Make safeword installable as a Claude Code plugin:

- [ ] Research Claude Code plugin architecture (how do plugins work?)
- [ ] Add Claude Code's official front-end dev plugin to safeword's recommended plugins
- [ ] Define what "safeword as a plugin" means:
  - One-command install (`claude plugin install safeword`?)
  - Auto-configures hooks, skills, guides
  - Updates via plugin system instead of `npx safeword upgrade`
- [ ] Understand relationship between: MCP servers, plugins, skills, hooks
- [ ] Prototype safeword as a Claude Code plugin

### Auto Upgrade

Automatically check for and apply safeword updates:

- [ ] Check for new version on session start (hook)
- [ ] Prompt user to upgrade when new version available
- [ ] Option for auto-upgrade without prompting
- [ ] Respect user preference (never ask, always ask, auto-upgrade)
- [ ] Store preference in `.safeword/config.json` or similar

### Telemetry

Anonymous usage telemetry to understand adoption and issues:

- [ ] Define what to track (setup success/failure, upgrade events, feature usage)
- [ ] Choose telemetry provider (PostHog, Mixpanel, custom)
- [ ] Implement opt-in/opt-out (respect privacy, default OFF or prompt)
- [ ] Add telemetry to key events:
  - `safeword setup` completion
  - `safeword upgrade` completion
  - Hook execution counts
  - Error events (anonymized)
- [ ] Dashboard for viewing adoption metrics

### Arcade Integration

Wire up Arcade properly with a setup wizard:

- [ ] Research Arcade capabilities and API
- [ ] Add Arcade to `safeword setup` wizard:
  - Detect if user wants Arcade integration
  - Configure Arcade connection/auth
  - Set up Arcade-specific hooks or skills
- [ ] Create Arcade-specific templates or workflows
- [ ] Document Arcade integration in guides

---

## Notes

- Slash commands and skills cannot be E2E tested (Claude Code runs them)
- MCP servers are external processes (test config only)
- Focus on what WE control: hooks, templates, CLI, plugin
- UATs require human/LLM evaluation, not just automated tests
