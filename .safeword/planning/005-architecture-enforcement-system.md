# Plan: Architecture Enforcement for SAFEWORD

**Created:** 2025-11-27  
**Status:** Draft

---

## Problem

AI agents write code without respecting architectural boundaries → circular dependencies, god modules (>10 dependents or >500 lines), unsafe refactoring.

## Solution

Codify layers + boundaries in `ARCHITECTURE.md`, enforce via static analysis tools and LLM prompts.

---

## Deliverables

### Phase 1: Documentation

| Deliverable                          | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `templates/architecture-template.md` | Layers/boundaries section template          |
| Update `architecture-guide.md`       | Add layers/boundaries guidance + edge cases |

**Layers Template (sample):**

```markdown
## Layers & Boundaries

### Layer Definitions

| Layer  | Directory     | Responsibility              |
| ------ | ------------- | --------------------------- |
| app    | `src/app/`    | UI, routing, composition    |
| domain | `src/domain/` | Business rules, pure logic  |
| infra  | `src/infra/`  | IO, APIs, DB, external SDKs |

### Allowed Dependencies

| From   | To     | Allowed | Rationale                         |
| ------ | ------ | ------- | --------------------------------- |
| app    | domain | ✅      | UI composes business logic        |
| app    | infra  | ✅      | UI triggers side effects          |
| domain | app    | ❌      | Domain must be framework-agnostic |
| domain | infra  | ❌      | Domain contains pure logic only   |
| infra  | domain | ✅      | Adapters may use domain types     |

Note: This template allows direct app→infra. Alternative: force app→domain→infra for stricter separation (hexagonal/ports-adapters pattern).
```

**Edge Cases (must document):**

- Project doesn't fit 3-layer model → Document actual layers, same boundary rules apply
- Feature module needs another feature → Import via public API (`index.ts`) only
- Shared utilities → Create `shared/` layer, all layers may import
- Brownfield adoption → Start with warnings-only mode, fix violations incrementally, then enforce

### Phase 2: Boundary Enforcement (ESLint)

| Deliverable                    | Description                                           |
| ------------------------------ | ----------------------------------------------------- |
| Add `eslint-plugin-boundaries` | To all ESLint modes in `setup-linting.sh`             |
| Remove `--biome` mode          | ESLint is the only supported linter (breaking change) |
| Update `architecture-guide.md` | Boundary rule setup instructions                      |

**Why ESLint-only:**

- IDE integration (errors show in editor immediately)
- Single config file (no separate tool)
- Most TypeScript projects use ESLint anyway
- Simpler maintenance (one path)

**User flow:**

1. Run `setup-linting.sh` → gets ESLint + boundary rules
2. Create `ARCHITECTURE.md` → define layers
3. Configure boundary rules in `eslint.config.mjs`
4. Errors appear in IDE + CI automatically

### Phase 3: LLM Prompts + Pre-commit Hook

| Deliverable                 | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `framework/prompts/` folder | New folder for LLM inputs (copied to `.safeword/prompts/`) |
| `prompts/quality-review.md` | Extract existing prompt from `setup-quality.sh`            |
| `prompts/arch-review.md`    | Semantic architecture review prompt                        |
| `scripts/arch-review.sh`    | Shell script calling Haiku API for arch review             |
| Update `setup-safeword.sh`  | Copy `prompts/` folder + add pre-commit hook               |
| Update `setup-quality.sh`   | Reference `.safeword/prompts/quality-review.md`            |

**`prompts/arch-review.md`:**

```
Review for architectural issues:

1. **Misplaced logic** - Business rules in wrong layer?
2. **God module** - Too many responsibilities?
3. **Leaky abstraction** - Implementation details exposed?
4. **Tight coupling** - Changes cascade unnecessarily?

Return JSON:
{
  "issues": [{ "type": string, "location": string, "fix": string }],
  "verdict": "clean" | "minor" | "refactor_needed"
}
```

**`scripts/arch-review.sh`:**

- Sends changed files + ARCHITECTURE.md + prompt
- Returns JSON verdict
- Requires `ANTHROPIC_API_KEY` env var

**Pre-commit hook integration:**

- Git pre-commit hook runs:
  1. `eslint` on staged files (fast, free, deterministic)
  2. `arch-review.sh` on staged files (semantic review)
- Lint errors → blocks commit
- Arch verdict `refactor_needed` → blocks commit
- Arch verdict `minor` → warns, allows commit

### Phase 4: CI Integration

| Deliverable                           | Description                      |
| ------------------------------------- | -------------------------------- |
| `templates/ci/architecture-check.yml` | GitHub Actions workflow template |

**CI Steps (in order):**

1. `tsc --noEmit` - Type check
2. `eslint` - Includes boundary rules via eslint-plugin-boundaries
3. LLM review (optional, non-blocking initially)

### Phase 5: Drift Detection

Deferred. Revisit after Phase 4 validated in production use.

---

## Dependencies

| Phase            | Depends On | Can Parallelize With |
| ---------------- | ---------- | -------------------- |
| Phase 1: Docs    | None       | Phase 2, 3           |
| Phase 2: Tooling | None       | Phase 1, 3           |
| Phase 3: Prompts | None       | Phase 1, 2           |
| Phase 4: CI      | Phase 2    | —                    |
| Phase 5: Drift   | Phase 4    | —                    |

**Recommended start:** Phase 1 + Phase 2 + Phase 3 in parallel, then Phase 4.

---

## Open Questions

1. **Scope:** TypeScript-only, or Python support in Phase 6?
2. **CI LLM review:** Blocking or advisory-only initially?
3. **Template flexibility:** Ship opinionated 3-layer, or configurable?

---

## Next Steps

1. ✅ Ticket created: `.safeword/tickets/002-architecture-enforcement.md`
2. Write user stories for Phase 1
3. Prototype boundary rules in a test project
