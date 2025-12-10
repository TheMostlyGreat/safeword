# Feature Spec: eslint-plugin-safeword

**Feature**: Quality enforcement system for LLM-generated code

**Status**: 🚧 In Progress (4/9 stories complete)

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

**Extended Coverage** (19 rules tested):

- Security: `detect-eval-with-expression`, `detect-non-literal-regexp`, `detect-non-literal-fs-filename`, `detect-child-process`
- SonarJS: `os-command`, `no-identical-expressions`
- Promise: `no-multiple-resolved`, `no-nesting`, `valid-params`
- Safeword: `no-incomplete-error-handling`
- Unicorn: `no-array-reduce`
- Design: `max-depth` (4), `max-params` (5)
- TypeScript: `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`, `no-unnecessary-condition`

**Tests**: `errors-on-bugs.test.ts` - Runtime tests lint buggy code, config tests verify type-checked rules at error severity

**Status**: ✅ Complete

---

## Story 5: Warns on Suspicious

**As a** human reviewer
**I want** suspicious patterns flagged as warnings
**So that** I can review them without blocking CI

**Acceptance Criteria**:

- [ ] `security/detect-object-injection` = warn
- [ ] `security/detect-possible-timing-attacks` = warn
- [ ] Complexity warnings (sonarjs) = warn

**Tests**: Lint suspicious code → verify warnings (not errors)

**Status**: ❌ Not Started

---

## Story 6: Human-Friendly

**As a** human engineer
**I want** minimal noise in my editor
**So that** I'm not annoyed by the LLM-focused rules

**Acceptance Criteria**:

- [ ] `unicorn/no-null` = off
- [ ] `unicorn/prevent-abbreviations` = off
- [ ] `unicorn/no-array-for-each` = off
- [ ] Clean idiomatic code produces 0 errors, 0 warnings

**Tests**: Lint idiomatic JS/TS → verify 0 errors, 0 warnings

**Status**: ❌ Not Started

---

## Story 7: React Support

**As a** React developer
**I want** React-specific linting
**So that** hooks and JSX rules are enforced

**Acceptance Criteria**:

- [ ] `recommendedTypeScriptReact` config exists
- [ ] Includes eslint-plugin-react-hooks
- [ ] `react-hooks/rules-of-hooks` = error
- [ ] `react-hooks/exhaustive-deps` = error
- [ ] Catches: conditional hook call, missing dependency

**Status**: ❌ Not Started

---

## Story 8: Next.js Support

**As a** Next.js developer
**I want** Next.js-specific linting
**So that** framework rules are enforced

**Acceptance Criteria**:

- [ ] `recommendedTypeScriptNext` config exists
- [ ] Includes @next/eslint-plugin-next
- [ ] `@next/next/no-img-element` = error
- [ ] `@next/next/no-html-link-for-pages` = error
- [ ] Catches: `<img>` instead of `<Image>`, `<a>` instead of `<Link>`

**Status**: ❌ Not Started

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

**Completed**: 4/9 stories (44%)

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

**Future**: Vue, Svelte, Python (ruff?), Go (golangci-lint?)

**Next Steps**: Implement Story 5 (Warns on Suspicious) - test that suspicious patterns warn (not error).
