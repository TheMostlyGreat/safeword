**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---@.safeword/SAFEWORD.md

---

## Cross-Platform Skills

**Source of truth:** `.safeword/skills/*.md`

Skills are authored once in `.safeword/skills/` and synced to both Claude Code and Cursor formats via script.

**Sync command:** `.safeword/scripts/sync-skills.sh`

| Output      | Location                    | Format                  |
| ----------- | --------------------------- | ----------------------- |
| Claude Code | `.claude/skills/*/SKILL.md` | YAML frontmatter + body |
| Cursor      | `.cursor/rules/*.mdc`       | YAML frontmatter + body |

**Skills available:**

| Skill              | Trigger                                   |
| ------------------ | ----------------------------------------- |
| `brainstorming`    | 'brainstorm', 'design', 'explore options' |
| `debugging`        | 'debug', 'fix error', 'not working'       |
| `enforcing-tdd`    | 'implement', 'build', 'feature'           |
| `quality-reviewer` | 'double check', 'verify versions'         |

**Authoring guide:** @./.safeword-project/guides/skill-authoring-guide.md

**Never edit generated files directly** - they contain `AUTO-GENERATED` headers. Edit the source in `.safeword/skills/` and re-run the sync script.

---

## Project-Specific Content

**Location:** `.safeword-project/` (never touched by CLI reset/upgrade)

| Folder    | Purpose                 |
| --------- | ----------------------- |
| `guides/` | Project-specific guides |
