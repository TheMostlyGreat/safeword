# User Stories: Safeword CLI (Issue #1)

**Guide**: `@./.safeword/guides/user-story-guide.md` - Best practices, INVEST criteria, and examples
**Template**: `@./.safeword/templates/user-stories-template.md`

**Feature**: TypeScript CLI (`safeword`) that replaces bash scripts with elite developer experience for setup, verification, and team onboarding.

**Related Issue**: #1 (GitHub)
**Status**: ❌ Not Started (0/12 stories complete)

---

## Technical Constraints

### Performance
- [ ] CLI startup time < 500ms (no heavy imports at top level)
- [ ] Setup completes < 30s on average project
- [ ] Version check timeout: 3s max before graceful fallback

### Compatibility
- [ ] Node.js 18+ (LTS)
- [ ] macOS, Linux, Windows (WSL2)
- [ ] Works with pnpm, npm, yarn, bun
- [ ] Git optional (graceful degradation)

### Dependencies
- [ ] Minimal runtime dependencies (prefer Node built-ins)
- [ ] Must integrate with existing `.claude/settings.json` structure
- [ ] Must preserve existing Claude Code hooks (append, don't replace)
- [ ] Must preserve existing git pre-commit hooks (marker-based)

### Infrastructure
- [ ] Published to npm as `safeword`
- [ ] Executable via `npx safeword`
- [ ] No global install required

### Exit Codes
- [ ] Exit 0 = success (warnings acceptable)
- [ ] Exit 1 = core failure (linting fails, can't write files, unconfigured for diff/upgrade)

---

## Story 1: Version and Help

**As a** developer discovering safeword
**I want to** see version and help information
**So that** I can learn what commands are available

**Acceptance Criteria**:
- [ ] `npx safeword --version` shows CLI version (e.g., "1.2.0")
- [ ] `npx safeword --help` shows help with all commands and flags
- [ ] `npx safeword` (bare command) shows help
- [ ] Help includes: setup, check, upgrade, diff, reset commands
- [ ] Help includes: --version, --help, --yes, --verbose, --offline flags

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 2: First-Time Setup - Core Files

**As a** developer setting up a new project
**I want to** run `npx safeword setup` to install core files
**So that** I get safeword templates, guides, and configuration

**Acceptance Criteria**:
- [ ] Creates `.safeword/` directory with all templates
- [ ] Creates `.safeword/version` file with CLI version
- [ ] Prepends link to `AGENTS.md`: `**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**`
- [ ] Creates `AGENTS.md` if it doesn't exist
- [ ] Checks for duplicate link before prepending (no duplicates)
- [ ] Prints summary of files created

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 3: First-Time Setup - Hooks and Skills

**As a** developer setting up a new project
**I want to** setup to register Claude Code hooks and skills
**So that** I get automated linting, quality review, and AGENTS.md protection

**Acceptance Criteria**:
- [ ] Registers hooks in `.claude/settings.json` (SessionStart, PostToolUse, Stop, etc.)
- [ ] Copies skills to `.claude/skills/safeword-*/`
- [ ] Preserves any existing hooks in `.claude/settings.json` (appends, doesn't replace)
- [ ] Includes SessionStart hook for AGENTS.md verification
- [ ] Exit 1 if hook registration fails

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 4: First-Time Setup - Linting

**As a** developer setting up a new project
**I want to** setup to configure linting automatically
**So that** I get ESLint + Prettier working without manual configuration

**Acceptance Criteria**:
- [ ] Detects project type (Next.js, React, TypeScript, etc.) from package.json
- [ ] Installs ESLint + Prettier as devDependencies
- [ ] Creates `eslint.config.mjs` configured for detected project type
- [ ] Creates `.prettierrc` with standard config
- [ ] Adds `"lint": "eslint ."` script to package.json
- [ ] Adds `"format": "prettier --write ."` script to package.json
- [ ] Exit 1 if linting setup fails (core failure)

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 5: Setup Blocks on Existing Config

**As a** developer who already has safeword configured
**I want to** see a clear error when running `setup` again
**So that** I don't accidentally overwrite my configuration

**Acceptance Criteria**:
- [ ] Running `npx safeword setup` when `.safeword/` exists shows error
- [ ] Error message: "Already configured. Run `safeword upgrade` to update."
- [ ] Exit code is 1
- [ ] No files are modified

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 6: Non-Interactive Setup

**As a** developer running setup in CI or scripts
**I want to** setup to work without prompts
**So that** I can automate project initialization

**Acceptance Criteria**:
- [ ] No TTY detected → uses defaults automatically (no prompts)
- [ ] `--yes` flag → forces defaults even in terminal
- [ ] Default for git prompt: skip init, show warning
- [ ] Setup completes without user interaction
- [ ] Warning shown when git skipped: "Skipped git initialization (no TTY detected)"

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 7: Git Repository Handling

**As a** developer in a non-git directory
**I want to** be prompted about git initialization
**So that** I can choose whether to initialize git for hook support

**Acceptance Criteria**:
- [ ] No `.git/` detected + TTY → prompts "Initialize git repository? [y/N]"
- [ ] User says yes → runs `git init`, then installs git hooks
- [ ] User says no → continues setup, warns "Git hooks skipped (no repository)"
- [ ] With `--yes` or no TTY → auto-skips git init with warning
- [ ] With `.git/` present → installs git hooks, no prompt
- [ ] Git hooks use marker-based append (`SAFEWORD_ARCH_CHECK_START/END`)
- [ ] Preserves existing content in `.git/hooks/pre-commit`

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 8: Health Check

**As a** developer maintaining a project
**I want to** run `npx safeword check` to see project health
**So that** I can verify configuration and check for updates

**Acceptance Criteria**:
- [ ] Shows CLI version: "Safeword CLI: v1.2.0"
- [ ] Shows project config version: "Project config: v1.0.0"
- [ ] Shows if update available: "(v1.2.0 available)"
- [ ] Verifies `.safeword/` structure is intact
- [ ] Exit code 0 on success
- [ ] On unconfigured project: "Not configured. Run `safeword setup`." (exit 0)
- [ ] Version check timeout after 3s → graceful fallback
- [ ] On timeout: "Couldn't check for updates (offline?)"
- [ ] `--offline` flag → skips version check entirely

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 9: Upgrade Configuration

**As a** developer with an older safeword version
**I want to** run `npx safeword upgrade` to update my configuration
**So that** I get the latest templates, guides, and hooks

**Acceptance Criteria**:
- [ ] Overwrites all `.safeword/` files with CLI's bundled templates
- [ ] Updates `.claude/skills/safeword-*/` with latest skills
- [ ] Updates hooks in `.claude/settings.json` if changed
- [ ] Preserves non-safeword hooks in `.claude/settings.json`
- [ ] Updates `.safeword/version` file to CLI version
- [ ] Prints summary: files added, modified, unchanged
- [ ] Same-version upgrade → reinstalls anyway (for repairs)
- [ ] Refuses to downgrade: "CLI v1.0.0 is older than project v1.2.0. Update CLI first."
- [ ] On unconfigured project: "Not configured. Run `safeword setup`." (exit 1)

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Notes**: User customizations in `.safeword/` are overwritten by design. Documented behavior.

---

## Story 10: Preview Changes Before Upgrade

**As a** developer considering an upgrade
**I want to** run `npx safeword diff` to preview what would change
**So that** I can review changes before committing to upgrade

**Acceptance Criteria**:
- [ ] Default output shows summary: count of files added, modified, removed
- [ ] Lists each file by category (Added, Modified, Unchanged)
- [ ] Shows version transition: "Changes from v1.0.0 → v1.2.0"
- [ ] `--verbose` flag shows full unified diff for each modified file
- [ ] Exit code 0 on success
- [ ] On unconfigured project: "Not configured." (exit 1)

**Implementation Status**: ❌ Not Started
**Tests**: TBD

---

## Story 11: Remove Configuration

**As a** developer who wants to remove safeword
**I want to** run `npx safeword reset` to cleanly uninstall
**So that** I can remove safeword without leaving hook artifacts

**Acceptance Criteria**:
- [ ] Prompts for confirmation: "This will remove safeword configuration. Continue? [y/N]"
- [ ] `--yes` flag → auto-confirms without prompt
- [ ] No TTY → auto-confirms (like `--yes`)
- [ ] Removes `.safeword/` directory
- [ ] Removes safeword hooks from `.claude/settings.json` (preserves other hooks)
- [ ] Removes `.claude/skills/safeword-*/` directories
- [ ] Removes git hook markers from `.git/hooks/pre-commit` (preserves other content)
- [ ] Removes safeword link line from `AGENTS.md` (preserves other content)
- [ ] On unconfigured project: "Nothing to remove." (exit 0)

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Notes**:
- Linting artifacts intentionally preserved: `eslint.config.mjs`, `.prettierrc`, `lint`/`format` scripts, ESLint/Prettier devDependencies
- Rationale: Linting is useful independently, user may have customized, standard CLI behavior
- Summary should note: "Linting configuration preserved (remove manually if desired)"

---

## Story 12: AGENTS.md Self-Healing

**As a** developer who accidentally removed the AGENTS.md link
**I want to** safeword to detect and fix this automatically
**So that** the LLM always reads SAFEWORD.md first

**Acceptance Criteria**:
- [ ] SessionStart hook checks if AGENTS.md contains safeword link
- [ ] If link missing → re-adds link to top of AGENTS.md
- [ ] If link missing → shows warning: "Restored AGENTS.md link (was removed)"
- [ ] If AGENTS.md file deleted → recreates file with link only
- [ ] Checks for duplicate before adding (no duplicates)
- [ ] Hook exits cleanly (doesn't block Claude Code startup)

**Implementation Status**: ❌ Not Started
**Tests**: TBD

**Notes**: Ensures LLM primacy—SAFEWORD.md must be read first for consistent behavior.

---

## Summary

**Completed**: 0/12 stories (0%)
**Remaining**: 12/12 stories (100%)

### Phase 1: Foundation ❌
- Story 1: Version and Help

### Phase 2: Setup Flow ❌
- Story 2: First-Time Setup - Core Files
- Story 3: First-Time Setup - Hooks and Skills
- Story 4: First-Time Setup - Linting
- Story 5: Setup Blocks on Existing Config
- Story 6: Non-Interactive Setup
- Story 7: Git Repository Handling

### Phase 3: Lifecycle Commands ❌
- Story 8: Health Check
- Story 9: Upgrade Configuration
- Story 10: Preview Changes Before Upgrade

### Phase 4: Cleanup & Maintenance ❌
- Story 11: Remove Configuration
- Story 12: AGENTS.md Self-Healing

**Next Steps**: Create test definitions, then implement Phase 1 (foundation)
