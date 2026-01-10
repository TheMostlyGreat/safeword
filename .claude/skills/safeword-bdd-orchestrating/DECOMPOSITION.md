# Phase 5: Technical Decomposition

**Entry:** Agent enters `decomposition` phase (after scenarios validated)

## Analyze Scenarios

1. **Identify components** — What parts of the system does each scenario touch?
   - UI components
   - API endpoints
   - Data models
   - Business logic modules

2. **Assign test layers** — For each component:
   - Pure logic (no I/O) → unit test
   - API boundaries, database → integration test
   - User flows → E2E test

3. **Create task breakdown** — Order by dependencies:
   - Data models first
   - Business logic second
   - API endpoints third
   - UI components fourth
   - E2E tests last (prove everything works)

4. **Present to user** — Show components, test layers, task order

## Complex Features

Features with 3+ components, new tech choices, or schema changes may warrant documentation first:

- Feature-level decisions → `.safeword/guides/design-doc-guide.md`
- Cross-cutting choices → `.safeword/guides/architecture-guide.md`

**Exit:** User approves breakdown → update ticket to `phase: implement`
