# Feature Spec: eslint-plugin-safeword

**Feature**: Quality enforcement system for LLM-generated code

**Status**: 🚧 In Progress (8/10 stories complete)

---

## Philosophy

LLM code with Safeword should be **pristine**. We constrain LLMs on:

- Basic linting & style
- Architecture boundaries
- Security vulnerabilities
- Common LLM mistakes

**Key insight**: LLMs ignore warnings - they either block or don't. Rules are tuned accordingly:

- **Errors** for real bugs (LLMs must fix to proceed)
- **Warnings** for suspicious patterns (humans review on PR - no LLM value)
- **Auto-fix** for style (noise removed automatically)

---

## Execution Points

| When                   | What happens                 | Why                                  |
| ---------------------- | ---------------------------- | ------------------------------------ |
| **PostToolUse** (edit) | Auto-fix runs silently       | Keep code clean per-file             |
| **Stop**               | Errors block                 | LLM must fix before user sees result |
| **Commit**             | Errors block, warnings pass  | Safety net for all                   |
| **PR**                 | Full lint + warnings visible | Humans review what slipped through   |

---

## Technical Constraints

### Compatibility

- [ ] ESLint 9.x flat config format
- [ ] Node.js 18+ / Bun 1.0+
- [ ] TypeScript 5.0+
- [ ] Coexists with Biome (if present)

---

## Config Structure

```text
recommended                      # JS base
recommendedTypeScript            # TS base (strict + stylistic)
recommendedTypeScriptReact       # + React hooks, JSX rules
recommendedTypeScriptNext        # + Next.js specific
recommendedTypeScriptAstro       # + Astro specific
```

---

## Usage Pattern

```js
// eslint.config.js
import safeword from 'eslint-plugin-safeword';

export default [
  // 1. Safeword config (spread first)
  ...safeword.configs.recommendedTypeScript,

  // 2. User overrides (spread after = wins)
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // override safeword
    },
  },

  // 3. User ignores
  { ignores: ['dist/**'] },
];
```

User overrides always win. On upgrade, user config unchanged.

---

## Story 1: Custom LLM Rules

**As a** project using LLM coding agents
**I want** rules that catch common LLM mistakes
**So that** I get value beyond bundled plugins

**Acceptance Criteria**:

- [x] `safeword/no-incomplete-error-handling` catches `catch` that logs but doesn't rethrow/return
- [x] Rule has `meta.docs` with description
- [x] Rule has tests (valid + invalid cases)
- [x] Rule is enabled at `error` in recommended configs

**Note**: Start with 1 solid rule. Add more based on real usage data.

**Status**: ✅ Complete

---

## Story 2: Config Loads and Lints

**As a** consumer of eslint-plugin-safeword
**I want** configs to load and lint code correctly
**So that** I can use them in my project

**Acceptance Criteria**:

- [x] `recommended` is a non-empty array with expected plugins
- [x] `recommendedTypeScript` is a non-empty array with TS plugins
- [x] TypeScript config includes `projectService: true` for type-checked rules
- [x] TypeScript config scopes rules to `.ts/.tsx` files
- [x] ESLint API loads config without errors
- [x] Linting valid code returns no errors
- [x] Linting invalid code returns expected errors
- [x] Plugin exports default + named exports
- [x] Default ignores for `node_modules/`, `dist/`

**Status**: ✅ Complete

---

## Story 3: Auto-fix Works

**As a** project using LLM coding agents
**I want** style issues to be auto-fixable
**So that** lint-staged can fix them on save

**Acceptance Criteria**:

- [x] Config enables fixable rules (import sorting, code style)
- [x] `eslint --fix` resolves import order violations
- [x] `eslint --fix` resolves code style violations (prefer-template, object-shorthand, etc.)
- [x] After fix, no fixable errors remain

**Tests**: `autofix.test.ts` - Lint messy code → run fix → verify 0 fixable errors

**Status**: ✅ Complete

---

## Story 4: Errors on Bugs

**As a** project using LLM coding agents
**I want** real bugs to error immediately
**So that** LLMs fix them before moving on

**Acceptance Criteria**:

- [x] `security/detect-eval-with-expression` = error
- [x] `@typescript-eslint/no-floating-promises` = error (via strictTypeChecked)
- [x] `@typescript-eslint/no-explicit-any` = error (we override to error)
- [x] `promise/no-multiple-resolved` = error

**Extended Coverage** (20 rules tested):

- Security: `detect-eval-with-expression`, `detect-non-literal-regexp`, `detect-non-literal-fs-filename`, `detect-child-process`
- SonarJS: `os-command`, `no-identical-expressions`
- Promise: `no-multiple-resolved`, `no-nesting`, `valid-params`
- Safeword: `no-incomplete-error-handling`
- Unicorn: `no-array-reduce`
- Design: `max-depth` (4), `max-params` (5), `eqeqeq` (null-safe)
- TypeScript: `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`, `no-unnecessary-condition`

**Tests**: `errors-on-bugs.test.ts` - Runtime tests lint buggy code, config tests verify type-checked rules at error severity

**Status**: ✅ Complete

---

## Story 5: Warns on Suspicious

**As a** human reviewer
**I want** suspicious patterns flagged as warnings
**So that** I can review them without blocking CI

**Acceptance Criteria**:

- [x] `security/detect-object-injection` = warn
- [x] `security/detect-possible-timing-attacks` = warn
- [x] `security/detect-buffer-noassert` = warn
- [x] `security/detect-new-buffer` = warn
- [x] `security/detect-pseudoRandomBytes` = warn
- [x] ~~Complexity (sonarjs) = warn~~ → Kept at error (LLMs ignore warnings, need to force simplification)

**Tests**: `warns-on-suspicious.test.ts` - Lint suspicious code → verify warnings (not errors)

**Status**: ✅ Complete

---

## Story 6: Human-Friendly

**As a** human engineer
**I want** safeword linting to only run during agent operations
**So that** I'm not interrupted by strict rules while coding

**Acceptance Criteria**:

- [x] Linting runs via CLI hooks (tool use, agent stop) - not in editor
- [x] Humans opt-in via `/lint` command if they want strict checking
- [x] Pre-commit/CI: out of scope (users handle their own)

**Architecture**: Safeword's strict rules only apply to agent-generated code via hooks. Humans have their own linting/CI setup.

**Status**: ✅ Complete

---

## Story 7: React Support

**As a** React developer
**I want** React-specific linting
**So that** hooks and JSX rules are enforced

**Acceptance Criteria**:

- [x] `recommendedTypeScriptReact` config exists
- [x] Includes eslint-plugin-react and eslint-plugin-react-hooks
- [x] `react-hooks/rules-of-hooks` = error
- [x] `react-hooks/exhaustive-deps` = error
- [x] `react/jsx-key` = error (LLMs forget keys)
- [x] `react/jsx-no-duplicate-props` = error
- [x] `react/prop-types` = off (TypeScript handles this)
- [x] `react/react-in-jsx-scope` = off (React 17+)

**Tests**: `react.test.ts` - Config severity tests for hooks and JSX rules

**Status**: ✅ Complete

---

## Story 8: Next.js Support

**As a** Next.js developer
**I want** Next.js-specific linting
**So that** framework rules are enforced

**Acceptance Criteria**:

- [x] `recommendedTypeScriptNext` config exists
- [x] Extends React config (inherits hooks + JSX rules)
- [x] Includes @next/eslint-plugin-next (core-web-vitals base)
- [x] `@next/next/no-img-element` = error
- [x] `@next/next/no-html-link-for-pages` = error
- [x] `@next/next/no-head-element` = error
- [x] All 21 Next.js rules at error severity (no warnings)

**Tests**: `nextjs.test.ts` - Config severity tests + no-warnings check

**Status**: ✅ Complete

---

## Story 9: Astro Support

**As an** Astro developer
**I want** Astro-specific linting
**So that** framework rules are enforced

**Acceptance Criteria**:

- [ ] `recommendedTypeScriptAstro` config exists
- [ ] Includes eslint-plugin-astro
- [ ] `astro/no-set-html-directive` = error (XSS prevention)
- [ ] `astro/no-conflict-set-directives` = error
- [ ] Catches: unsafe HTML injection, conflicting directives

**Status**: ❌ Not Started

---

## Story 10: Test Linting (Vitest + Playwright)

**As a** LLM coding agent
**I want** test-specific linting rules
**So that** I write correct, idiomatic tests

**Acceptance Criteria**:

- [ ] `eslint-plugin-vitest` integrated for unit tests
- [ ] `eslint-plugin-playwright` integrated for e2e tests
- [ ] Both apply to `**/*.test.ts`, `**/*.spec.ts`, `**/*.e2e.ts` (self-filter by globals)
- [ ] Separate exports available: `vitestConfig`, `playwrightConfig`
- [ ] Enforces: proper assertions, no focused tests, async handling
- [ ] Catches: missing awaits in async tests, incorrect matchers

**Architecture**: Both plugins apply to all test files. Plugins self-filter by detecting their own globals (`describe`/`it` vs `test.describe`). Separate exports for projects wanting explicit control.

**Key Rules**:

- [ ] `vitest/expect-expect` = error (tests must have assertions)
- [ ] `vitest/no-focused-tests` = error (no .only in CI)
- [ ] `vitest/no-identical-title` = error
- [ ] `vitest/valid-expect` = error
- [ ] `playwright/no-focused-test` = error
- [ ] `playwright/no-skipped-test` = warn
- [ ] `playwright/valid-expect` = error

**Status**: ❌ Not Started

---

## Open Questions

### Architecture

1. **Boundaries**: Include `eslint-plugin-boundaries` in plugin, or keep separate?

### Severity

2. **Warnings in CI**: Should PR checks fail on warnings too, or only errors?

### Testing

3. **Test isolation**: Temp files or virtual file system?
4. **tsconfig for TS tests**: Mock or fixture?

---

## Summary

**Completed**: 8/10 stories (80%)

### Phase 1: Core

- Story 1: Custom LLM Rules
- Story 2: Config Loads and Lints
- Story 3: Auto-fix Works

### Phase 2: Behavior

- Story 4: Errors on Bugs
- Story 5: Warns on Suspicious
- Story 6: Human-Friendly

### Phase 3: Frameworks

- Story 7: React
- Story 8: Next.js
- Story 9: Astro

### Phase 4: Testing

- Story 10: Vitest + Playwright

**Future**: Vue, Svelte, Python (ruff?), Go (golangci-lint?)

**Next Steps**: Implement Story 10 (Test Linting) - add Vitest and Playwright rules for TDD.
