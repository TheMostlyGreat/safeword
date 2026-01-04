---
description: Check architecture docs match reality, or create if missing
---

# Drift Check

Compare `ARCHITECTURE.md` against actual codebase, or create it if missing.

## Instructions

**First, check if `ARCHITECTURE.md` exists at project root.**

### If ARCHITECTURE.md does NOT exist:

1. Analyze the codebase:
   - Read package.json/pyproject.toml for tech stack
   - Examine folder structure for layer patterns
   - Identify key dependencies and their purposes
2. Create `ARCHITECTURE.md` at project root using template from `.safeword/templates/architecture-template.md`
3. Fill in sections based on codebase analysis (Tech Stack, Layers, Key Decisions)
4. Set Status to "Production" and Last Updated to today

**After creation:** Summarize what was documented, suggest running `/audit` to validate boundaries.

### If ARCHITECTURE.md exists:

1. Extract documented decisions (tech choices, patterns, layers)
2. Verify each decision against reality (package.json, folder structure, imports)
3. Check freshness (when was doc last updated vs recent commits?)

**Report:**

- **Drift**: Code contradicts documentation (e.g., doc says "Redux", code uses Zustand)
- **Gap**: Undocumented tech/patterns (e.g., `@tanstack/query` not documented)
- **Stale**: Doc outdated (e.g., last updated 6 months ago, 50 commits since)

If a finding fits multiple categories, report as Drift (most serious).

**After reporting:** Ask if user wants to update ARCHITECTURE.md:

- **Gaps**: Add documented decisions for undocumented tech/patterns
- **Stale**: Update "Last Updated" date
- **Drift**: Do NOT auto-fix (requires human decision on which is correct)
