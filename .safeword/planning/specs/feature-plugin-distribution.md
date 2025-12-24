# Feature Spec: Claude Code Plugin Distribution

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Package safeword as a Claude Code marketplace plugin

**Status**: ❌ Not Started (0/4 stories complete)

---

## Context

Safeword is currently installed via CLI (`npx safeword setup`). Claude Code has a plugin system that would enable:
- One-command installation (`/plugin install safeword`)
- Automatic updates
- Team-wide deployment via settings.json
- No npm/package.json dependency for pure Python projects

### Current State (80% aligned)

| Component | Current Location | Plugin Location | Status |
|-----------|------------------|-----------------|--------|
| Commands | `.claude/commands/` | `commands/` | ✅ Ready |
| Skills | `.claude/skills/` | `skills/` | ✅ Ready |
| Hooks | `.safeword/hooks/*.ts` | `scripts/` + `hooks.json` | ⚠️ Needs conversion |
| Guides | `.safeword/guides/` | `guides/` | ✅ Ready |
| Templates | `.safeword/templates/` | `templates/` | ✅ Ready |
| Manifest | None | `.claude-plugin/plugin.json` | ❌ Missing |

## Technical Constraints

### Plugin Requirements

- [ ] Valid `plugin.json` manifest with `name` field (required)
- [ ] All paths relative to plugin root, starting with `./`
- [ ] No files in `.claude-plugin/` except `plugin.json`
- [ ] Scripts use `${CLAUDE_PLUGIN_ROOT}` for path resolution

### Distribution

- [ ] Host marketplace on GitHub repository
- [ ] No Anthropic approval required (self-hosted marketplace)
- [ ] Semantic versioning for updates

### Compatibility

- [ ] Commands become `/safeword:lint`, `/safeword:audit`, etc.
- [ ] Hooks must use `hooks.json` declarative format
- [ ] Works alongside project-specific `.claude/` configs

---

## Story 1: Create Plugin Manifest

**As a** plugin distributor
**I want** a valid plugin.json manifest
**So that** Claude Code recognizes safeword as a plugin

**Acceptance Criteria**:

- [ ] Create `.claude-plugin/plugin.json` with metadata
- [ ] Include name, version, description, author, repository
- [ ] Reference commands, skills, hooks paths
- [ ] Validate manifest structure

**Implementation Status**: ❌ Not Started
**Tests**: Manual validation with `/plugin` command

**Files**:
- `.claude-plugin/plugin.json` (new)

**Example manifest**:
```json
{
  "name": "safeword",
  "version": "1.0.0",
  "description": "Linting, hooks, and development guides for Claude Code",
  "author": {
    "name": "Safeword Team",
    "url": "https://github.com/yourorg/safeword"
  },
  "repository": "https://github.com/yourorg/safeword",
  "license": "MIT",
  "commands": "./commands/",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json"
}
```

---

## Story 2: Convert Hooks to Declarative Format

**As a** plugin user
**I want** hooks to auto-trigger on events
**So that** linting and quality review happen automatically

**Acceptance Criteria**:

- [ ] Create `hooks/hooks.json` with event mappings
- [ ] Move TypeScript hooks to `scripts/` directory
- [ ] Update paths to use `${CLAUDE_PLUGIN_ROOT}`
- [ ] Map PostToolUse → lint hook
- [ ] Map Stop → quality review hook
- [ ] Map UserPromptSubmit → timestamp hook

**Implementation Status**: ❌ Not Started
**Tests**: Manual testing with plugin installed

**Files**:
- `hooks/hooks.json` (new)
- `scripts/` (move from `.safeword/hooks/`)

**Example hooks.json**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bun ${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-lint.ts"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun ${CLAUDE_PLUGIN_ROOT}/scripts/stop-quality.ts"
          }
        ]
      }
    ]
  }
}
```

---

## Story 3: Restructure Directory Layout

**As a** plugin maintainer
**I want** a clean plugin directory structure
**So that** the plugin is easy to maintain and distribute

**Acceptance Criteria**:

- [ ] Move commands to plugin root `commands/`
- [ ] Move skills to plugin root `skills/`
- [ ] Move guides to plugin root `guides/`
- [ ] Move templates to plugin root `templates/`
- [ ] Keep SAFEWORD.md as main context file
- [ ] Update CLI to generate plugin structure (optional)

**Implementation Status**: ❌ Not Started
**Tests**: Plugin install/uninstall cycle

**Files**:
- Multiple directory moves

**Target structure**:
```
safeword-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── lint.md
│   ├── audit.md
│   ├── cleanup-zombies.md
│   ├── architecture.md
│   └── quality-review.md
├── skills/
│   ├── safeword-debugging/SKILL.md
│   ├── safeword-brainstorming/SKILL.md
│   ├── safeword-enforcing-tdd/SKILL.md
│   ├── safeword-refactoring/SKILL.md
│   ├── safeword-quality-reviewer/SKILL.md
│   └── safeword-writing-plans/SKILL.md
├── hooks/
│   └── hooks.json
├── scripts/
│   ├── post-tool-lint.ts
│   ├── stop-quality.ts
│   └── lib/
├── guides/
├── templates/
├── SAFEWORD.md
├── README.md
└── LICENSE
```

---

## Story 4: Create Marketplace

**As a** user
**I want** to install safeword via `/plugin install`
**So that** I don't need npm or the CLI

**Acceptance Criteria**:

- [ ] Create `marketplace.json` in repository root
- [ ] Document installation: `/plugin marketplace add owner/repo`
- [ ] Document plugin install: `/plugin install safeword`
- [ ] Add team deployment docs (settings.json config)
- [ ] Create README with installation instructions

**Implementation Status**: ❌ Not Started
**Tests**: Fresh install on new project

**Files**:
- `marketplace.json` (new)

**Example marketplace.json**:
```json
{
  "name": "safeword-marketplace",
  "owner": {
    "name": "Safeword Team"
  },
  "plugins": [
    {
      "name": "safeword",
      "source": "./",
      "description": "Linting, hooks, and development guides for Claude Code",
      "version": "1.0.0"
    }
  ]
}
```

---

## Summary

**Completed**: 0/4 stories (0%)
**Remaining**: 4/4 stories (100%)

### Phase 1: Plugin Structure (Stories 1-3)

- Story 1: Plugin manifest
- Story 2: Hooks conversion
- Story 3: Directory restructure

### Phase 2: Distribution (Story 4)

- Story 4: Marketplace and documentation

### Future Considerations

- Dual distribution (CLI + plugin) during transition
- Version sync between CLI and plugin
- Python-specific plugin variant (post Python support)

**Next Steps**: Implement Story 1 (Plugin manifest)

---

## Relationship to Other Specs

- **Python Support**: Independent - can be done before or after
- **CLI**: Plugin could eventually replace CLI for project setup
- **ESLint Plugin**: Separate npm package, unaffected
