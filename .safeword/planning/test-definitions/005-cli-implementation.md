# Test Definitions: Safeword CLI (Issue #1)

**Guide**: `@./.safeword/guides/test-definitions-guide.md` - Structure, status tracking, and TDD workflow
**Template**: `@./.safeword/templates/test-definitions-feature.md`

**Feature**: TypeScript CLI (`safeword`) for project setup, verification, and maintenance

**Related Issue**: #1 (GitHub)
**User Stories**: `.safeword/planning/user-stories/005-cli-implementation.md`
**Test Files**:
- Unit: `packages/cli/src/**/*.test.ts`
- Integration: `packages/cli/tests/**/*.test.ts`

**Total Tests**: 70 (0 passing, 0 skipped, 70 not implemented)

---

## Test Suite 0: Technical Constraints

Tests for non-functional requirements that apply across all commands.

### Test 0.1: CLI startup time under 500ms ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies CLI starts quickly (no heavy imports at top level)

**Steps**:
1. Run `time npx safeword --version` 10 times
2. Calculate average startup time

**Expected**:
- Average startup time < 500ms
- No individual run > 750ms

---

### Test 0.2: Setup completes under 30s ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup completes in reasonable time

**Steps**:
1. Create temp directory with package.json
2. Time `safeword setup --yes`

**Expected**:
- Setup completes in < 30s
- Includes npm install time for linting deps

---

### Test 0.3: Node.js version check ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies CLI checks Node.js version and exits gracefully if too old

**Steps**:
1. Run CLI with Node.js < 18 (mock or container)
2. Capture stderr

**Expected**:
- Exit code 1
- Error message mentions Node.js version requirement
- Suggests upgrading to Node.js 18+

---

### Test 0.4: Works with different package managers ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup works regardless of package manager

**Steps**:
1. Create temp directory with package.json
2. Run `safeword setup --yes` using npm
3. Verify setup succeeded
4. Repeat with pnpm, yarn (where available)

**Expected**:
- Setup succeeds with npm
- Setup succeeds with pnpm
- Setup succeeds with yarn
- Linting deps installed correctly with each

**Notes**: May need separate CI jobs per package manager rather than single test.

---

## Test Suite 1: Version and Help (Story 1)

Tests for CLI entry point, version display, and help output.

### Test 1.1: --version flag shows CLI version ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies `safeword --version` outputs the version from package.json

**Steps**:
1. Run `npx safeword --version`
2. Capture stdout

**Expected**:
- Output matches semver pattern (e.g., "1.0.0")
- Exit code 0

---

### Test 1.2: --help flag shows help text ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies `safeword --help` displays comprehensive help

**Steps**:
1. Run `npx safeword --help`
2. Capture stdout

**Expected**:
- Output contains "setup" command
- Output contains "check" command
- Output contains "upgrade" command
- Output contains "diff" command
- Output contains "reset" command
- Output contains "--version" flag
- Output contains "--help" flag
- Output contains "--yes" flag
- Output contains "--verbose" flag
- Output contains "--offline" flag
- Exit code 0

---

### Test 1.3: Bare command shows help ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies `safeword` with no arguments shows help (same as --help)

**Steps**:
1. Run `npx safeword` (no arguments)
2. Capture stdout

**Expected**:
- Output matches `--help` output
- Exit code 0

---

## Test Suite 2: Setup - Core Files (Story 2)

Tests for `.safeword/` directory creation and AGENTS.md handling.

### Test 2.1: Creates .safeword directory structure ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup creates complete `.safeword/` directory

**Steps**:
1. Create empty temp directory with package.json
2. Run `safeword setup --yes`
3. Check directory structure

**Expected**:
- `.safeword/` directory exists
- `.safeword/SAFEWORD.md` exists
- `.safeword/version` exists and contains CLI version
- `.safeword/guides/` directory exists
- `.safeword/templates/` directory exists
- `.safeword/hooks/` directory exists
- Exit code 0

---

### Test 2.2: Creates AGENTS.md if missing ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup creates AGENTS.md when it doesn't exist

**Steps**:
1. Create empty temp directory with package.json (no AGENTS.md)
2. Run `safeword setup --yes`
3. Check AGENTS.md

**Expected**:
- `AGENTS.md` file exists
- First line contains `**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**`

---

### Test 2.3: Prepends link to existing AGENTS.md ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup prepends link to existing AGENTS.md without losing content

**Steps**:
1. Create temp directory with package.json
2. Create AGENTS.md with content "# My Project\n\nExisting content"
3. Run `safeword setup --yes`
4. Read AGENTS.md

**Expected**:
- First line is `**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**`
- Original content preserved below the link
- "# My Project" still present
- "Existing content" still present

---

### Test 2.4: No duplicate links in AGENTS.md on upgrade ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade doesn't add duplicate link if already present

**Steps**:
1. Create configured project (run setup first)
2. Verify AGENTS.md has safeword link
3. Run `safeword upgrade`
4. Count occurrences of link in AGENTS.md

**Expected**:
- Link appears exactly once
- No duplicate lines added by upgrade

---

### Test 2.5: Prints summary of created files ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup outputs summary of what was created

**Steps**:
1. Create empty temp directory with package.json
2. Run `safeword setup --yes`
3. Capture stdout

**Expected**:
- Output contains "Created .safeword/"
- Output contains file count or list
- Output indicates success

---

## Test Suite 3: Setup - Hooks and Skills (Story 3)

Tests for Claude Code hook registration and skill copying.

### Test 3.1: Registers hooks in settings.json ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup creates/updates `.claude/settings.json` with hooks

**Steps**:
1. Create empty temp directory with package.json
2. Run `safeword setup --yes`
3. Read `.claude/settings.json`

**Expected**:
- `.claude/settings.json` exists
- Contains "hooks" object
- Contains "SessionStart" hook array
- Contains "PostToolUse" hook array
- Hooks reference `.safeword/hooks/` paths

---

### Test 3.2: Copies skills to .claude/skills ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup copies skills to Claude skills directory

**Steps**:
1. Create empty temp directory with package.json
2. Run `safeword setup --yes`
3. Check `.claude/skills/` directory

**Expected**:
- `.claude/skills/` directory exists
- Contains `safeword-*/` subdirectory(ies)
- Each skill directory contains `SKILL.md`

---

### Test 3.3: Preserves existing hooks ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup appends to existing hooks without replacing

**Steps**:
1. Create temp directory with package.json
2. Create `.claude/settings.json` with existing custom hook
3. Run `safeword setup --yes`
4. Read `.claude/settings.json`

**Expected**:
- Original custom hook still present
- Safeword hooks added (appended)
- No hooks removed or overwritten

---

### Test 3.4: Includes SessionStart hook for AGENTS.md ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies SessionStart hook includes AGENTS.md verification script

**Steps**:
1. Create empty temp directory with package.json
2. Run `safeword setup --yes`
3. Read `.claude/settings.json`
4. Find SessionStart hooks

**Expected**:
- SessionStart array contains hook with command referencing AGENTS.md check
- Hook script file exists at referenced path

---

### Test 3.5: Exit 1 if hook registration fails ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup fails with exit 1 if hooks can't be registered

**Steps**:
1. Create temp directory with package.json
2. Create `.claude/settings.json` as read-only file
3. Run `safeword setup --yes`

**Expected**:
- Exit code 1
- Error message mentions hook registration failure
- No partial setup left behind

---

## Test Suite 4: Setup - Linting (Story 4)

Tests for ESLint + Prettier configuration.

### Test 4.1: Detects TypeScript project ❌
**Status**: ❌ Not Implemented
**Type**: Unit
**Description**: Verifies project type detection from package.json

**Steps**:
1. Create package.json with typescript in devDependencies
2. Call detectProjectType(packageJson)

**Expected**:
- Returns object with `typescript: true`

---

### Test 4.2: Detects React project ❌
**Status**: ❌ Not Implemented
**Type**: Unit
**Description**: Verifies React detection from package.json

**Steps**:
1. Create package.json with react in dependencies
2. Call detectProjectType(packageJson)

**Expected**:
- Returns object with `react: true`

---

### Test 4.3: Detects Next.js project ❌
**Status**: ❌ Not Implemented
**Type**: Unit
**Description**: Verifies Next.js detection from package.json

**Steps**:
1. Create package.json with next in dependencies
2. Call detectProjectType(packageJson)

**Expected**:
- Returns object with `nextjs: true`
- Also sets `react: true` (Next.js implies React)

---

### Test 4.4: Creates eslint.config.mjs ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup creates ESLint flat config

**Steps**:
1. Create temp directory with TypeScript package.json
2. Run `safeword setup --yes`
3. Check for eslint.config.mjs

**Expected**:
- `eslint.config.mjs` file exists
- Contains TypeScript config (detected from package.json)

---

### Test 4.5: Creates .prettierrc ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup creates Prettier config

**Steps**:
1. Create temp directory with package.json
2. Run `safeword setup --yes`
3. Check for .prettierrc

**Expected**:
- `.prettierrc` file exists
- Contains valid JSON config

---

### Test 4.6: Adds lint script to package.json ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup adds lint script

**Steps**:
1. Create temp directory with package.json (no scripts.lint)
2. Run `safeword setup --yes`
3. Read package.json

**Expected**:
- `scripts.lint` equals "eslint ."

---

### Test 4.7: Adds format script to package.json ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup adds format script

**Steps**:
1. Create temp directory with package.json (no scripts.format)
2. Run `safeword setup --yes`
3. Read package.json

**Expected**:
- `scripts.format` equals "prettier --write ."

---

### Test 4.8: Exit 1 if linting setup fails ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup fails with exit 1 if linting can't be configured

**Steps**:
1. Create temp directory with read-only package.json
2. Run `safeword setup --yes`

**Expected**:
- Exit code 1
- Error message mentions linting setup failure

---

## Test Suite 5: Setup Blocks on Existing (Story 5)

Tests for setup error when already configured.

### Test 5.1: Error when .safeword exists ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup errors if `.safeword/` already exists

**Steps**:
1. Create temp directory with package.json
2. Create `.safeword/` directory
3. Run `safeword setup`

**Expected**:
- Exit code 1
- Error message contains "Already configured"
- Error message contains "safeword upgrade"

---

### Test 5.2: No files modified on error ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies setup doesn't modify files when erroring

**Steps**:
1. Create temp directory with package.json and `.safeword/`
2. Create AGENTS.md with known content
3. Run `safeword setup`
4. Compare AGENTS.md content

**Expected**:
- AGENTS.md unchanged
- No new files created
- Exit code 1

---

## Test Suite 6: Non-Interactive Setup (Story 6)

Tests for CI/headless operation.

### Test 6.1: --yes flag skips all prompts ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies --yes flag enables non-interactive mode

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup --yes`
3. Verify no stdin required

**Expected**:
- Setup completes without hanging
- Exit code 0
- Git init skipped (default)

---

### Test 6.2: No TTY uses defaults ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies non-TTY environment uses defaults

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup` with stdin as pipe (non-TTY)
3. Verify no stdin required

**Expected**:
- Setup completes without hanging
- Exit code 0
- Warning about skipped git init

---

### Test 6.3: Warning shown when git skipped ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies warning message when git initialization skipped

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup --yes`
3. Capture stdout

**Expected**:
- Output contains "Skipped git initialization"
- Exit code 0

---

## Test Suite 7: Git Repository Handling (Story 7)

Tests for git detection and hook installation.

### Test 7.1: Prompts for git init when no .git ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies prompt appears when .git missing (TTY mode)

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup` with TTY simulation
3. Check for prompt

**Expected**:
- Output contains "Initialize git repository?"
- Waits for input

---

### Test 7.2: Runs git init when user confirms ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies git init runs when user says yes

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup` with "y" input
3. Check for .git directory

**Expected**:
- `.git/` directory exists
- Exit code 0

---

### Test 7.3: Skips git init when user declines ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies git init skipped when user says no

**Steps**:
1. Create temp directory with package.json (no .git)
2. Run `safeword setup` with "n" input
3. Check for .git directory

**Expected**:
- `.git/` directory does not exist
- Warning about skipped git hooks
- Exit code 0

---

### Test 7.4: Installs git hooks when .git present ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies git hooks installed in existing repo

**Steps**:
1. Create temp directory with package.json
2. Run `git init`
3. Run `safeword setup --yes`
4. Check `.git/hooks/pre-commit`

**Expected**:
- `.git/hooks/pre-commit` exists
- Contains `SAFEWORD_ARCH_CHECK_START` marker
- Contains `SAFEWORD_ARCH_CHECK_END` marker

---

### Test 7.5: Preserves existing pre-commit hooks ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies existing git hooks not overwritten

**Steps**:
1. Create temp directory with package.json
2. Run `git init`
3. Create `.git/hooks/pre-commit` with custom content
4. Run `safeword setup --yes`
5. Read `.git/hooks/pre-commit`

**Expected**:
- Original custom content preserved
- Safeword markers added (appended)
- Both custom and safeword hooks present

---

## Test Suite 8: Health Check (Story 8)

Tests for `safeword check` command.

### Test 8.1: Shows CLI version ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check displays CLI version

**Steps**:
1. Create configured project (run setup first)
2. Run `safeword check`
3. Capture stdout

**Expected**:
- Output contains "Safeword CLI:"
- Output contains version number

---

### Test 8.2: Shows project config version ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check displays project version

**Steps**:
1. Create configured project (run setup first)
2. Run `safeword check`
3. Capture stdout

**Expected**:
- Output contains "Project config:"
- Output contains version from `.safeword/version`

---

### Test 8.3: Shows update available ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check shows when update available

**Steps**:
1. Create configured project with older version in `.safeword/version`
2. Run `safeword check` (mock npm registry to return newer version)
3. Capture stdout

**Expected**:
- Output contains "available" or indicates update

---

### Test 8.4: Unconfigured project message ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check shows message on unconfigured project

**Steps**:
1. Create temp directory with package.json (no .safeword)
2. Run `safeword check`
3. Capture stdout

**Expected**:
- Output contains "Not configured"
- Output contains "safeword setup"
- Exit code 0

---

### Test 8.5: Graceful timeout on version check ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check handles network timeout gracefully

**Steps**:
1. Create configured project
2. Run `safeword check` with network blocked/slow (mock timeout)
3. Capture stdout

**Expected**:
- Completes within reasonable time (not hanging)
- Output contains "Couldn't check for updates"
- Exit code 0

---

### Test 8.6: --offline skips version check ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies --offline flag skips remote version check

**Steps**:
1. Create configured project
2. Run `safeword check --offline`
3. Capture stdout

**Expected**:
- No network request made
- Shows local versions only
- Exit code 0

---

### Test 8.7: Detects corrupted .safeword structure ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies check detects when required files are missing

**Steps**:
1. Create configured project
2. Delete `.safeword/SAFEWORD.md` (critical file)
3. Run `safeword check`
4. Capture stdout

**Expected**:
- Output indicates structure issue or missing files
- Suggests running `safeword upgrade` to repair
- Exit code 0 (warning, not failure)

---

## Test Suite 9: Upgrade (Story 9)

Tests for `safeword upgrade` command.

### Test 9.1: Overwrites .safeword files ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade replaces all .safeword files

**Steps**:
1. Create configured project
2. Modify a file in `.safeword/`
3. Run `safeword upgrade`
4. Check if modification is gone

**Expected**:
- Modified file restored to CLI version
- `.safeword/version` updated

---

### Test 9.2: Updates skills ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade updates skill files

**Steps**:
1. Create configured project
2. Modify a file in `.claude/skills/safeword-*/`
3. Run `safeword upgrade`
4. Check if modification is gone

**Expected**:
- Skill file restored to CLI version

---

### Test 9.3: Preserves non-safeword hooks ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade doesn't remove custom hooks

**Steps**:
1. Create configured project
2. Add custom hook to `.claude/settings.json`
3. Run `safeword upgrade`
4. Check `.claude/settings.json`

**Expected**:
- Custom hook still present
- Safeword hooks updated

---

### Test 9.4: Same-version reinstalls ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade works even with same version

**Steps**:
1. Create configured project (same version as CLI)
2. Modify a .safeword file
3. Run `safeword upgrade`
4. Check if modification is gone

**Expected**:
- File restored despite same version
- No "already up to date" skip

---

### Test 9.5: Refuses to downgrade ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade refuses when project newer than CLI

**Steps**:
1. Create configured project
2. Set `.safeword/version` to higher version than CLI
3. Run `safeword upgrade`

**Expected**:
- Exit code 1
- Error contains "older" or "downgrade"
- Error contains "Update CLI"

---

### Test 9.6: Unconfigured project error ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade errors on unconfigured project

**Steps**:
1. Create temp directory with package.json (no .safeword)
2. Run `safeword upgrade`

**Expected**:
- Exit code 1
- Error contains "Not configured"
- Error contains "safeword setup"

---

### Test 9.7: Prints summary of changes ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies upgrade shows what changed

**Steps**:
1. Create configured project with older version
2. Run `safeword upgrade`
3. Capture stdout

**Expected**:
- Output shows files added/modified/unchanged
- Output shows version transition

---

## Test Suite 10: Diff (Story 10)

Tests for `safeword diff` command.

### Test 10.1: Shows summary by default ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies diff shows summary without --verbose

**Steps**:
1. Create configured project with older version
2. Run `safeword diff`
3. Capture stdout

**Expected**:
- Output shows count of files (added, modified, unchanged)
- Output does NOT show full diff content
- Exit code 0

---

### Test 10.2: Lists files by category ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies diff categorizes files

**Steps**:
1. Create configured project with older version
2. Run `safeword diff`
3. Capture stdout

**Expected**:
- Output groups files as Added, Modified, or Unchanged

---

### Test 10.3: Shows version transition ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies diff shows from/to versions

**Steps**:
1. Create configured project with version "1.0.0"
2. Run `safeword diff` (CLI is "1.1.0")
3. Capture stdout

**Expected**:
- Output contains "1.0.0"
- Output contains "1.1.0"
- Output contains "→" or similar transition indicator

---

### Test 10.4: --verbose shows full diff ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies --verbose flag shows unified diff

**Steps**:
1. Create configured project with older version
2. Run `safeword diff --verbose`
3. Capture stdout

**Expected**:
- Output contains unified diff format (--- +++ @@ lines)
- Shows actual content changes

---

### Test 10.5: Unconfigured project error ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies diff errors on unconfigured project

**Steps**:
1. Create temp directory with package.json (no .safeword)
2. Run `safeword diff`

**Expected**:
- Exit code 1
- Error contains "Not configured"

---

## Test Suite 11: Reset (Story 11)

Tests for `safeword reset` command.

### Test 11.1: Prompts for confirmation ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset asks for confirmation

**Steps**:
1. Create configured project
2. Run `safeword reset` (TTY mode)
3. Check for prompt

**Expected**:
- Output contains "remove safeword"
- Output contains "Continue?"
- Waits for input

---

### Test 11.2: --yes auto-confirms ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies --yes skips confirmation

**Steps**:
1. Create configured project
2. Run `safeword reset --yes`
3. Check .safeword directory

**Expected**:
- No prompt displayed
- `.safeword/` removed
- Exit code 0

---

### Test 11.3: No TTY auto-confirms ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies non-TTY mode auto-confirms

**Steps**:
1. Create configured project
2. Run `safeword reset` with stdin as pipe
3. Check .safeword directory

**Expected**:
- No hanging for input
- `.safeword/` removed
- Exit code 0

---

### Test 11.4: Removes .safeword directory ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset removes .safeword

**Steps**:
1. Create configured project
2. Run `safeword reset --yes`
3. Check filesystem

**Expected**:
- `.safeword/` directory does not exist

---

### Test 11.5: Removes hooks from settings.json ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset removes safeword hooks

**Steps**:
1. Create configured project with custom hook
2. Run `safeword reset --yes`
3. Read `.claude/settings.json`

**Expected**:
- Safeword hooks removed
- Custom hooks preserved
- `.claude/settings.json` still valid JSON

---

### Test 11.6: Removes safeword skills ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset removes skill directories

**Steps**:
1. Create configured project
2. Run `safeword reset --yes`
3. Check `.claude/skills/`

**Expected**:
- `safeword-*/` directories removed
- Other skills (if any) preserved

---

### Test 11.7: Removes git hook markers ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset removes safeword markers from pre-commit

**Steps**:
1. Create configured project with git hooks
2. Add custom content to pre-commit outside markers
3. Run `safeword reset --yes`
4. Read `.git/hooks/pre-commit`

**Expected**:
- `SAFEWORD_ARCH_CHECK_START` marker gone
- `SAFEWORD_ARCH_CHECK_END` marker gone
- Content between markers removed
- Custom content outside markers preserved

---

### Test 11.8: Removes link from AGENTS.md ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset removes safeword link from AGENTS.md

**Steps**:
1. Create configured project
2. Add custom content to AGENTS.md below link
3. Run `safeword reset --yes`
4. Read `AGENTS.md`

**Expected**:
- Safeword link line removed
- Custom content preserved
- File not deleted (unless empty)

---

### Test 11.9: Preserves linting config ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset leaves linting artifacts

**Steps**:
1. Create configured project
2. Run `safeword reset --yes`
3. Check filesystem

**Expected**:
- `eslint.config.mjs` still exists
- `.prettierrc` still exists
- `scripts.lint` still in package.json
- `scripts.format` still in package.json

---

### Test 11.10: Unconfigured project message ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies reset shows message on unconfigured project

**Steps**:
1. Create temp directory with package.json (no .safeword)
2. Run `safeword reset --yes`

**Expected**:
- Output contains "Nothing to remove"
- Exit code 0

---

## Test Suite 12: AGENTS.md Self-Healing (Story 12)

Tests for SessionStart hook that maintains AGENTS.md link.

### Test 12.1: Hook detects missing link ❌
**Status**: ❌ Not Implemented
**Type**: Unit
**Description**: Verifies hook script detects when link is missing

**Steps**:
1. Create AGENTS.md without safeword link
2. Run hook script
3. Check return/output

**Expected**:
- Script detects link is missing
- Returns indication that repair is needed

---

### Test 12.2: Hook re-adds missing link ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies hook restores removed link

**Steps**:
1. Create configured project
2. Remove safeword link from AGENTS.md (keep other content)
3. Run SessionStart hook script
4. Read AGENTS.md

**Expected**:
- Link restored at top of file
- Original content preserved below

---

### Test 12.3: Hook shows warning on restoration ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies hook outputs warning when restoring

**Steps**:
1. Create configured project
2. Remove safeword link from AGENTS.md
3. Run SessionStart hook script
4. Capture stdout/stderr

**Expected**:
- Output contains "Restored" or similar
- Output mentions AGENTS.md

---

### Test 12.4: Hook recreates deleted AGENTS.md ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies hook recreates AGENTS.md if file deleted

**Steps**:
1. Create configured project
2. Delete AGENTS.md entirely
3. Run SessionStart hook script
4. Check filesystem

**Expected**:
- `AGENTS.md` file exists
- Contains safeword link

---

### Test 12.5: Hook prevents duplicates ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies hook doesn't add duplicate links

**Steps**:
1. Create configured project with link present
2. Run SessionStart hook script
3. Count link occurrences in AGENTS.md

**Expected**:
- Link appears exactly once
- No duplicates added

---

### Test 12.6: Hook exits cleanly ❌
**Status**: ❌ Not Implemented
**Type**: Integration
**Description**: Verifies hook doesn't block Claude Code startup

**Steps**:
1. Create configured project
2. Run SessionStart hook script
3. Check exit code and timing

**Expected**:
- Exit code 0
- Completes quickly (< 1s)
- No hanging

---

## Summary

**Total**: 70 tests
**Passing**: 0 tests (0%)
**Skipped**: 0 tests (0%)
**Not Implemented**: 70 tests (100%)
**Failing**: 0 tests (0%)

### Coverage by Story

| Story | Tests | Status |
|-------|-------|--------|
| Technical Constraints | 4 | ❌ 0% |
| Story 1: Version/Help | 3 | ❌ 0% |
| Story 2: Core Files | 5 | ❌ 0% |
| Story 3: Hooks/Skills | 5 | ❌ 0% |
| Story 4: Linting | 8 | ❌ 0% |
| Story 5: Blocks Existing | 2 | ❌ 0% |
| Story 6: Non-Interactive | 3 | ❌ 0% |
| Story 7: Git Handling | 5 | ❌ 0% |
| Story 8: Health Check | 7 | ❌ 0% |
| Story 9: Upgrade | 7 | ❌ 0% |
| Story 10: Diff | 5 | ❌ 0% |
| Story 11: Reset | 10 | ❌ 0% |
| Story 12: Self-Healing | 6 | ❌ 0% |

### Test Type Distribution

| Type | Count | Percentage |
|------|-------|------------|
| Unit | 4 | 6% |
| Integration | 66 | 94% |
| E2E | 0 | 0% |

**Rationale for distribution**: CLI testing is primarily integration testing - we test commands against real file systems in temp directories. Unit tests are used only for pure functions (project type detection). No E2E tests needed as CLI doesn't require a browser.

### Skipped Tests Rationale

None skipped.

---

## Test Execution

```bash
# Run all CLI tests
pnpm --filter @safeword/cli test

# Run specific test file
pnpm --filter @safeword/cli test -- src/commands/setup.test.ts

# Run tests matching pattern
pnpm --filter @safeword/cli test -- --grep "setup"

# Run with coverage
pnpm --filter @safeword/cli test:coverage
```

---

**Last Updated**: 2025-11-27
