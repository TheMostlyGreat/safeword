---
id: 018b
type: feature
phase: refactor
status: in-progress
parent: 018
created: 2026-01-10T20:42:00Z
last_modified: 2026-01-11T01:30:00Z
---

# Skill Sync from Single Source

**User Story:** When I update a Safeword skill, I want to edit one file and have both Claude Code and Cursor get the updated content.

**Goal:** Single source of truth for skill content in `.safeword/skills/`, with a sync script generating IDE-specific formats.

**Parent:** [018 - IDE Parity](../018-ide-parity/ticket.md)

## The Problem

Skills are duplicated with different formats:

```
.claude/skills/safeword-debugging/SKILL.md   # Claude format
.cursor/rules/safeword-debugging.mdc          # Cursor format
```

### Frontmatter Differs

**Claude:**

```yaml
---
name: debugging
description: Four-phase debugging...
allowed-tools: '*'
---
```

**Cursor:**

```yaml
---
description: Four-phase debugging...
alwaysApply: false
---
```

### Content Has Drifted

Diff analysis reveals content is NOT identical - significant drift has occurred:

| Skill             | Drift Type                              | Severity |
| ----------------- | --------------------------------------- | -------- |
| debugging         | Formatting (`####` vs `**bold**`)       | Low      |
| bdd-orchestrating | Section headers (`###` vs `####`)       | Low      |
| quality-reviewing | Missing sections, different wording     | **High** |
| refactoring       | Missing code examples, missing sections | **High** |
| core              | Cursor-only (includes SAFEWORD.md)      | N/A      |

**Key findings:**

- `quality-reviewing`: **Bidirectional drift** - Cursor has extra guide reference (`code-philosophy.md`), Claude has different structure/wording. Neither is superset.
- `refactoring`: Claude has code examples and "Edge Cases" section that Cursor lacks
- `core`: Only exists in Cursor (`alwaysApply: true`, includes SAFEWORD.md) - Claude achieves same via CLAUDE.md → SAFEWORD.md reference chain

**Decision needed:** When unifying, which version is canonical? For most skills, Claude is more complete. For `quality-reviewing`, must manually reconcile both versions.

## Solution

### Source Format

Create `.safeword/skills/*.md` with flat frontmatter (all fields, sync script picks what each IDE needs):

```yaml
---
name: debugging
description: Four-phase debugging framework...
allowed-tools: '*'
alwaysApply: false
---
# Systematic Debugger
...
```

**Why flat:** Simpler to read/write. No nested parsing. Sync script just picks the fields it needs.

### Sync Script

Create `.safeword/scripts/sync-skills.ts`:

```typescript
for (const source of glob('.safeword/skills/*.md')) {
  const { frontmatter, content } = parse(source);

  // Claude: name, description, allowed-tools
  write(
    `.claude/skills/safeword-${frontmatter.name}/SKILL.md`,
    `---
name: ${frontmatter.name}
description: ${frontmatter.description}
allowed-tools: ${frontmatter['allowed-tools'] ?? '*'}
---
${content}`,
  );

  // Cursor: description, alwaysApply
  write(
    `.cursor/rules/safeword-${frontmatter.name}.mdc`,
    `---
description: ${frontmatter.description}
alwaysApply: ${frontmatter.alwaysApply ?? false}
---
${content}`,
  );
}
```

### Integration

Run sync via:

- **Pre-commit hook** - Auto-sync on commit (primary)
- **CI check** - Fail if generated files are stale (safety net)

## Implementation

1. Create `.safeword/skills/` directory
2. Migrate skills to source format (reconcile drift per table below)
3. Create `sync-skills.ts` script
4. Add pre-commit hook + CI check
5. Run sync → generated files replace manual ones
6. Verify both IDEs work correctly

## Acceptance Criteria

- [ ] `.safeword/skills/` contains 4 source files (debugging, bdd-orchestrating, quality-reviewing, refactoring)
- [ ] Sync script generates Claude (`SKILL.md`) and Cursor (`.mdc`) formats
- [ ] Skills work identically in both IDEs after sync
- [ ] CI fails if generated files don't match source
- [ ] Adding new skill = create 1 source file + run sync

## Skills to Migrate

| Skill             | Source                              | Notes                                     |
| ----------------- | ----------------------------------- | ----------------------------------------- |
| debugging         | Claude (more consistent formatting) | Merge any Cursor additions                |
| bdd-orchestrating | Claude                              | Merge any Cursor additions                |
| quality-reviewing | **Review both**                     | High drift - manual reconciliation        |
| refactoring       | **Claude**                          | Has code examples Cursor lacks            |
| core              | **N/A - skip**                      | Claude has equivalent via CLAUDE.md chain |

## Work Log

---

- 2026-01-11T01:30:00Z Refactored: Removed vagueness, explicit core skip, tightened criteria
- 2026-01-11T01:28:00Z Clarified: quality-reviewing has bidirectional drift, core uses different mechanism
- 2026-01-10T21:13:00Z Added: Content drift analysis - quality-reviewing and refactoring have high drift
- 2026-01-10T20:42:00Z Created: Skill sync from single source

---
