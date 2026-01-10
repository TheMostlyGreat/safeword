---
id: 018b
type: feature
phase: intake
status: ready
parent: 018
created: 2026-01-10T20:42:00Z
last_modified: 2026-01-10T20:42:00Z
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

Content is ~95% identical, but frontmatter differs:

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

Run sync as part of:

- `safeword upgrade` (if that becomes a thing)
- Pre-commit hook
- CI check (fail if generated files differ from source)

## Implementation

1. Create `.safeword/skills/` with source files
2. Migrate existing skill content to source format
3. Create `sync-skills.ts` script
4. Add to pre-commit or CI
5. Delete manual skill files (now generated)

## Acceptance Criteria

- [ ] `.safeword/skills/` contains source files
- [ ] Sync script generates Claude and Cursor formats
- [ ] Generated files match current behavior
- [ ] CI fails if generated files are stale
- [ ] Adding new skill = edit 1 file + run sync

## Skills to Migrate

1. `debugging` → `.safeword/skills/debugging.md`
2. `bdd-orchestrating` → `.safeword/skills/bdd-orchestrating.md`
3. `quality-reviewing` → `.safeword/skills/quality-reviewing.md`
4. `refactoring` → `.safeword/skills/refactoring.md`

## Work Log

---

- 2026-01-10T20:42:00Z Created: Skill sync from single source

---
