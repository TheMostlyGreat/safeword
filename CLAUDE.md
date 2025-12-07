**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**

The SAFEWORD.md file contains core development patterns, workflows, and conventions.
Read it BEFORE working on any task in this project.

---@.safeword/SAFEWORD.md

---

## Cross-Platform Skills

This project maintains skill parity between Claude Code and Cursor using the `.mdc` format.

**How it works:**

| Tool        | Reads                          | Location                    |
| ----------- | ------------------------------ | --------------------------- |
| Claude Code | SKILL.md (ignores frontmatter) | `.claude/skills/*/SKILL.md` |
| Cursor      | .mdc with YAML frontmatter     | `.cursor/rules/*.mdc`       |

**Skills available:**

| Skill              | Trigger                                   |
| ------------------ | ----------------------------------------- |
| `brainstorming`    | 'brainstorm', 'design', 'explore options' |
| `debugging`        | 'debug', 'fix error', 'not working'       |
| `enforcing-tdd`    | 'implement', 'build', 'feature'           |
| `quality-reviewer` | 'double check', 'verify versions'         |

**Authoring guide:** @./.safeword/guides/skill-authoring-guide.md

---

## Project-Specific Guidance

Add Claude-specific context, commands, or workflow notes here.
