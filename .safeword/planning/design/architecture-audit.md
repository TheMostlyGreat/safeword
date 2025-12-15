# Design: Architecture Audit System

**Guide**: `.safeword/guides/design-doc-guide.md`
**Template**: `.safeword/templates/design-doc-template.md`

**Related**: Feature Spec: `.safeword/planning/specs/feature-architecture-audit.md`

---

## Relationship to eslint-plugin-safeword

This system **complements** eslint-plugin-safeword:

| Concern                   | Tool                   | Scope         |
| ------------------------- | ---------------------- | ------------- |
| Code quality, style, bugs | eslint-plugin-safeword | Single file   |
| **Circular dependencies** | dependency-cruiser     | Cross-file    |
| **Layer violations**      | dependency-cruiser     | Cross-file    |
| **Dead code/exports**     | knip                   | Whole project |
| **Unused dependencies**   | knip                   | Whole project |

ESLint analyzes individual files. Architecture tools analyze relationships between files.

---

## Architecture

The architecture audit system adds three components to safeword:

1. **Config Generator** - Functions to generate dependency-cruiser rules from detected architecture
2. **Sync Command** - `safeword sync-config` CLI command to refresh config from current structure
3. **Audit Command** - `/audit` slash command for comprehensive code health checks

```text
┌─────────────────────────────────────────────────────────────────┐
│                        safeword setup                           │
│  Detects architecture → Generates configs → Installs deps       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Config Layer                                 │
│  .dependency-cruiser.js ←── imports ←── .safeword/depcruise-config.js │
│  knip.json (optional)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────────┐
              │   /audit Command                    │
              │   (On-demand, thorough)             │
              │                                     │
              │   • Full project scan               │
              │   • Circular deps, layer violations │
              │   • Orphans, god modules            │
              │   • Dead code (knip)                │
              │   • Auto-fixes safe issues          │
              └─────────────────────────────────────┘
```

---

## Components

### Component 1: DepCruiseConfigGenerator

**What**: Generates dependency-cruiser configuration from detected architecture
**Where**: `packages/cli/src/utils/depcruise-config.ts` (new file)

**Interface**:

```typescript
import type { DetectedArchitecture } from './boundaries.js';

// Note: dependency-cruiser rule shapes are complex and vary by rule type.
// See https://github.com/sverweij/dependency-cruiser for full schema.
// We generate rules as JS strings, not typed objects, for simplicity.

/**
 * Generate .safeword/depcruise-config.js (forbidden rules + options)
 */
function generateDepCruiseConfigFile(arch: DetectedArchitecture): string;

/**
 * Generate .dependency-cruiser.js (main config that imports generated)
 */
function generateDepCruiseMainConfig(): string;
```

**Dependencies**: `./boundaries.ts` (reuse `detectArchitecture`, `HIERARCHY`)
**Tests**: Story 1 acceptance criteria

**Monorepo detection** (reads `workspaces` from package.json):

```typescript
// package.json
{ "workspaces": ["packages/*", "apps/*", "libs/*"] }

// Parsed → generates rules for: packages/, apps/, libs/
```

Falls back to scanning for common dirs if no workspaces field.

**Hierarchy detection** (based on workspace names):

| Pattern                  | Layer   | Can import from |
| ------------------------ | ------- | --------------- |
| `lib/`, `libs/`          | lowest  | nothing         |
| `packages/`, `modules/`  | middle  | libs            |
| `apps/`, `applications/` | highest | packages, libs  |

Unrecognized workspace names (e.g., `services/*`) get circular dep protection only, no hierarchy rules. Users can add custom rules to `.dependency-cruiser.js`.

**Note**: Cross-package internal imports (reaching into `../other-pkg/src/`) are better enforced via TypeScript `paths` config and package.json `exports` field, not dependency-cruiser rules.

### Component 2: SyncConfigCommand

**What**: CLI command that regenerates depcruise config from current project structure
**Where**: `packages/cli/src/commands/sync-config.ts` (new file)

**Usage**:

```bash
npx safeword sync-config
```

**What it does**:

1. Checks if `.safeword/` exists - if not, fails with "Run `safeword setup` first"
2. Calls `detectArchitecture()` from boundaries.ts
3. Generates config based on detected structure
4. Writes `.safeword/depcruise-config.js` (rules + options)
5. Writes `.dependency-cruiser.js` if not exists (main config that imports generated)

**Why separate command**: Allows `/audit` to refresh config without running full `safeword upgrade`. Creates main config if missing (self-healing).

**Tests**: Story 1 acceptance criteria (config generation)

### Component 3: AuditCommand

**What**: Slash command prompt that instructs LLM to run audit checks
**Where**: `.safeword/commands/audit.md`

**Content** (this is the actual file):

```markdown
Run a comprehensive code audit. Execute these commands and report results:

1. **Refresh config** (detect current architecture):
   npx safeword sync-config

2. **Architecture check** (circular deps, layer violations):
   npx depcruise --output-type err --config .dependency-cruiser.js .

3. **Dead code check + auto-fix** (unused exports, deps):
   npx knip --fix

4. **Outdated packages** (informational):
   npm outdated

Report format:

- Fixed: [what knip auto-fixed]
- Errors: [circular deps, layer violations - require manual fix]
- Info: [unused files to review, outdated packages]
```

**Note**: Step 1 ensures config reflects current project structure - no drift possible.

**Tests**: Story 3, 4 acceptance criteria

### Generated Config (.safeword/depcruise-config.js)

**Single file with rules + options**:

```javascript
module.exports = {
  forbidden: [
    // ERROR RULES (block on violations)
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'packages-cannot-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'libs-cannot-import-packages-or-apps',
      severity: 'error',
      from: { path: '^libs/' },
      to: { path: '^(packages|apps)/' },
    },

    // INFO RULES (reported in /audit, not errors)
    {
      name: 'no-orphans',
      severity: 'info',
      from: { orphan: true, pathNot: ['\\.test\\.', 'index\\.ts$', 'main\\.ts$'] },
      to: {},
    },
    {
      name: 'no-god-modules',
      severity: 'info',
      from: { pathNot: ['index\\.ts$', 'app\\.ts$', '\\.test\\.'] },
      to: {},
      module: { numberOfDependenciesMoreThan: 15 },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules', '.safeword'] },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
  },
};
```

### Knip Config

**Note**: No separate component needed. Knip config (`knip.json`) is generated via the existing reconcile schema in `schema.ts`, like other safeword-managed files. Uses sensible defaults; user can customize.

**Default knip.json** (ignores `.safeword`):

```json
{
  "ignore": [".safeword/**"],
  "ignoreDependencies": ["eslint-plugin-safeword"]
}
```

---

## Data Model

### Generated Files Structure

```text
project/
├── .dependency-cruiser.js          # User-editable, imports .safeword/depcruise-config.js
├── knip.json                       # User-editable (optional)
└── .safeword/
    ├── depcruise-config.js         # Auto-generated by sync-config (rules + options)
    └── commands/
        └── audit.md                # /audit slash command
```

### Config Hierarchy

```javascript
// .dependency-cruiser.js (user's file - preserved if exists)
const generated = require('./.safeword/depcruise-config.js');

module.exports = {
  forbidden: [
    ...generated.forbidden,
    // User's custom rules below (never touched by safeword)
    // { name: 'no-legacy', from: { path: 'legacy/' }, to: { path: 'new/' } },
  ],
  options: {
    ...generated.options,
    // User overrides here
  },
};
```

---

## Component Interaction

### Setup Flow

```text
safeword setup
    │
    ├─► detectArchitecture()           # From boundaries.ts
    │       │
    │       ▼
    │   Elements found?
    │       │
    │   Yes ▼
    ├─► Prompt: "Enable architecture checks?"
    │       │
    │   Yes ▼
    ├─► sync-config                    # Writes .safeword/depcruise-config.js + .dependency-cruiser.js
    ├─► Write: knip.json (if not exists)
    ├─► Install: dependency-cruiser, knip
    └─► Write: commands/audit.md
```

### Audit Command Flow

```text
/audit (slash command expands to prompt)
    │
    ▼
LLM executes via Bash tool:
    │
    ├─► npx safeword sync-config              # Refresh config from current structure
    ├─► npx depcruise --output-type err --config .dependency-cruiser.js .
    ├─► npx knip --fix
    ├─► npm outdated
    │
    ▼
LLM formats and reports:
  • Fixed: [what was auto-fixed]
  • Errors: [circular deps, layer violations]
  • Info: [unused files, outdated packages]
```

### Sync Config Flow

```text
safeword sync-config (or called by /audit)
    │
    ├─► Check .safeword/ exists (fail if not)
    ├─► detectArchitecture()           # From boundaries.ts
    │       │
    │       ▼
    │   Parse package.json workspaces
    │   Scan for common dirs (fallback)
    │       │
    │       ▼
    ├─► generateDepCruiseConfigFile()  # Create rules + options
    ├─► Write .safeword/depcruise-config.js
    │
    ├─► .dependency-cruiser.js exists?
    │       │
    │   No  ▼
    ├─► generateDepCruiseMainConfig()
    └─► Write .dependency-cruiser.js
```

---

## Key Decisions

### Decision 1: dependency-cruiser over ESLint no-cycle

**What**: Use dependency-cruiser for circular dependency detection
**Why**:

- 10x faster on large codebases (benchmarks show 2s vs 20s for 1000 files)
- Better visualization and reporting
- `--ignore-known` for progressive adoption in legacy code
- More expressive rule language

**Trade-off**: Additional dependency (~2MB), separate config file

### Decision 2: Hybrid config (generated + editable)

**What**: Generated rules in `.safeword/depcruise-config.js`, user config imports them
**Why**:

- User customizations survive `safeword upgrade`
- Clear separation: generated vs custom
- Readable main config with escape hatch

**Trade-off**: Slightly more complex file structure

### Decision 3: On-demand `/audit` over automatic hooks

**What**: All checks run via `/audit` command, not automatically on every response
**Why**:

- Knip is slow (30s+ on large projects) - unsuitable for automatic hooks
- Dead code isn't an immediate correctness issue
- False positives during active development (WIP exports)
- Better UX: "cleanup when ready" not "interrupted constantly"
- Simpler v1: prove value before adding real-time enforcement

**Trade-off**: Issues can accumulate between audits (add stop hook in v2 if needed)

### Decision 4: ERROR level for LLM enforcement

**What**: Architecture violations are errors, not warnings
**Why**:

- LLMs ignore warnings (observed behavior)
- Errors force compliance and self-correction
- Humans can edit config to change severity if needed

**Trade-off**: May feel strict to human developers initially

### Decision 5: Detection-based opt-in during setup

**What**: Only prompt for architecture checks if structure detected
**Why**:

- Small scripts/utils don't need architecture enforcement
- Avoids noise for projects without structure
- User consciously opts in = better buy-in

**Trade-off**: Users must re-run setup or upgrade to enable later

### Decision 6: `/audit` as slash command (not CLI)

**What**: Implement `/audit` as `.safeword/commands/audit.md` slash command
**Why**:

- Works in both Claude Code and Cursor
- Inline in AI chat workflow (no context switch to terminal)
- Consistent with existing `/lint` pattern

**Trade-off**: Can't run from raw terminal (but users can run `npx knip` / `npx depcruise` directly)

---

## Implementation Notes

### Constraints

- Must work with both npm and bun
- Must handle monorepos with multiple packages

### Error Handling

- Missing dependency-cruiser: Skip arch checks, suggest install
- Missing knip: Skip dead code checks, suggest install
- Parse errors: Report clearly, don't crash

### Gotchas

- dependency-cruiser needs `tsconfig.json` path configured
- knip may report false positives for dynamic imports

### Resolved Questions

- [x] **`/audit` as slash command** - Yes, slash command for Claude Code + Cursor compatibility
- [x] **`--watch` mode** - Deferred to v2. `/audit` handles on-demand checks.
- [x] **Stop hook** - Deferred to v2. Start with on-demand `/audit` command; add real-time feedback via stop hook later if needed.

### Open Questions

- [ ] Include TypeScript strict mode check in audit? (potential scope creep)

---

## Implementation Order

### Phase 1: Foundation (Stories 1, 5)

1. Create `depcruise-config.ts` with `generateDepCruiseConfigFile()` and `generateDepCruiseMainConfig()`
2. Create `sync-config` CLI command (writes both files, main only if missing)
3. Test: generated rules match boundaries.ts logic

### Phase 2: Audit Command (Stories 3, 4)

1. Create `/audit` slash command
2. Add knip integration
3. Test: full audit produces correct report

### Phase 3: Setup Flow (Story 6)

1. Add detection prompt to setup command
2. Wire up config generation and package install
3. Test: setup flow with and without architecture

---

## References

- [dependency-cruiser docs](https://github.com/sverweij/dependency-cruiser)
- [knip docs](https://knip.dev/)
- Existing: `packages/cli/src/utils/boundaries.ts`
