# Task: ESLint Plugin Review for LLM Coding Agents

## Goal

Review each ESLint plugin in our config for optimal LLM coding agent usage. Verify defaults, severities, and configuration match best practices.

**Related files:**

- Config: `eslint.config.mjs`
- Learnings (overview): `.safeword/learnings/llm-coding-agents-linting.md`
- Learnings (hooks): `.safeword/learnings/post-tool-linting-strategies.md`
- Plugin research: `.safeword/planning/linting/` (one file per plugin)

## Success Criteria

- Each plugin reviewed at same depth as SDL review
- Config verified with `eslint --print-config`
- Learnings doc updated with findings
- Any misconfigurations fixed

---

## Plugin Review Order (by LLM relevance)

### Tier 1 - Critical for LLM Code Quality

| Plugin                     | Status  | Key Focus                                      |
| -------------------------- | ------- | ---------------------------------------------- |
| `typescript-eslint`        | done    | Type safety, async/await, `any` escape hatches |
| `eslint-plugin-promise`    | pending | Floating promises, unhandled rejections        |
| `eslint-plugin-boundaries` | pending | Architecture enforcement                       |

### Tier 2 - High Value

| Plugin                  | Status  | Key Focus                           |
| ----------------------- | ------- | ----------------------------------- |
| `eslint-plugin-sonarjs` | pending | Cognitive complexity, code smells   |
| `eslint-plugin-unicorn` | pending | Modern JS vs outdated training data |
| `eslint-plugin-regexp`  | pending | ReDoS, malformed regex              |

### Tier 3 - Moderate Value

| Plugin                   | Status  | Key Focus                        |
| ------------------------ | ------- | -------------------------------- |
| `eslint-plugin-import-x` | pending | Import validation, circular deps |
| `@eslint/js`             | pending | Base JS rules                    |
| `eslint-plugin-jsdoc`    | pending | Documentation for LLM context    |

### Tier 4 - Framework-Specific

| Plugin                      | Status  | Key Focus        |
| --------------------------- | ------- | ---------------- |
| `eslint-plugin-react-hooks` | pending | Rules of hooks   |
| `@next/eslint-plugin-next`  | pending | Next.js patterns |
| `@vitest/eslint-plugin`     | pending | Test patterns    |
| `eslint-plugin-playwright`  | pending | E2E patterns     |
| `eslint-plugin-astro`       | pending | Astro patterns   |
| `eslint-plugin-vue`         | pending | Vue patterns     |
| `eslint-plugin-svelte`      | pending | Svelte patterns  |

### Tier 5 - Skip (Style/Formatting)

| Plugin                             | Reason                             |
| ---------------------------------- | ---------------------------------- |
| `eslint-plugin-simple-import-sort` | Auto-fix only, no config decisions |
| `eslint-config-prettier`           | Conflict resolution, no rules      |

---

## Review Checklist (per plugin)

For each plugin:

1. [ ] Check installed version vs latest
2. [ ] Web search for official docs + LLM-specific research
3. [ ] Verify which preset we're using (recommended, strict, etc.)
4. [ ] Check if preset actually enables rules (SDL trap)
5. [ ] Audit severities (warn → error for LLM-critical rules)
6. [ ] Verify config works with `eslint --print-config`
7. [ ] Create plugin research doc + fix any config issues
8. [ ] Get user approval → commit

---

## Decisions

| Question                 | Decision                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| Parallelization          | Sequential                                                       |
| Plugin research location | Subfolder - one file per plugin in `.safeword/planning/linting/` |
| Web research             | Web search for EVERY plugin (don't trust LLM memory)             |
| Commit frequency         | Commit after user approval of each plugin                        |

### Plugin Research Doc Format

**Location:** `.safeword/planning/linting/{plugin-name}.md`

**Rationale:** Separate files prevent bloating main doc. Claude Code reads only relevant plugin docs as needed.

**Per-plugin file format:**

```markdown
# {plugin-name}

- **Version**: x.y.z (installed) | x.y.z (latest)
- **Preset**: which config we use
- **Gotcha**: any "recommended preset trap" issues (or "None")
- **LLM-critical rules**: rules that catch common LLM mistakes
- **Overrides**: rules we disable/modify and why

## Research

[findings from web search, official docs, etc.]
```

---

## Completed Reviews

| Plugin                         | Date       | Findings                                                                                                                        |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `@microsoft/eslint-plugin-sdl` | 2025-12-08 | SDL registers security plugin but doesn't enable rules; configured all 13 security rules with error/warn split                  |
| `typescript-eslint`            | 2025-12-08 | Using `strictTypeChecked` + `stylisticTypeChecked`; all LLM-critical rules at error; custom `strict-boolean-expressions` config |
