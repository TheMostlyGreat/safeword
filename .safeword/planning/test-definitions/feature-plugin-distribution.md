# Test Definitions: Plugin Distribution

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Package safeword as a Claude Code marketplace plugin

**Test Files**:

- Manual testing with Claude Code `/plugin` command
- `packages/cli/tests/plugin-structure.test.ts` (new)

**Total Tests**: 12 (0 passing, 0 skipped, 12 not implemented)

---

## Test Suite 1: Plugin Manifest

Tests for Story 1 - valid plugin.json manifest.

### Test 1.1: plugin.json has required name field ❌

**Status**: ❌ Not Implemented
**Description**: Verifies manifest has minimum required field

**Steps**:

1. Read `.claude-plugin/plugin.json`
2. Parse JSON
3. Check for `name` field

**Expected**:

- `name` field exists
- Value is non-empty string

---

### Test 1.2: plugin.json has valid version ❌

**Status**: ❌ Not Implemented
**Description**: Verifies version follows semver format

**Steps**:

1. Read plugin.json
2. Check `version` field
3. Validate semver format

**Expected**:

- Version matches `X.Y.Z` pattern
- Parseable by semver library

---

### Test 1.3: plugin.json paths are relative ❌

**Status**: ❌ Not Implemented
**Description**: Verifies all paths start with `./`

**Steps**:

1. Read plugin.json
2. Check `commands`, `skills`, `hooks` paths
3. Verify format

**Expected**:

- All paths start with `./`
- No absolute paths

---

### Test 1.4: Referenced directories exist ❌

**Status**: ❌ Not Implemented
**Description**: Verifies all referenced directories are present

**Steps**:

1. Read plugin.json paths
2. Check each directory exists
3. Verify not empty

**Expected**:

- `commands/` exists with .md files
- `skills/` exists with SKILL.md files
- `hooks/hooks.json` exists

---

## Test Suite 2: Hooks Configuration

Tests for Story 2 - declarative hooks.json format.

### Test 2.1: hooks.json is valid JSON ❌

**Status**: ❌ Not Implemented
**Description**: Verifies hooks.json parses correctly

**Steps**:

1. Read `hooks/hooks.json`
2. Parse as JSON
3. Check no syntax errors

**Expected**:

- Valid JSON
- No parse errors

---

### Test 2.2: hooks.json has correct structure ❌

**Status**: ❌ Not Implemented
**Description**: Verifies hooks.json follows Claude Code schema

**Steps**:

1. Parse hooks.json
2. Check for `hooks` object
3. Validate event types

**Expected**:

- Top-level `hooks` object exists
- Event types are valid (PostToolUse, Stop, etc.)
- Hook configurations have required fields

---

### Test 2.3: Script paths use CLAUDE_PLUGIN_ROOT ❌

**Status**: ❌ Not Implemented
**Description**: Verifies scripts use correct path variable

**Steps**:

1. Parse hooks.json
2. Find all `command` values
3. Check path format

**Expected**:

- All script paths include `${CLAUDE_PLUGIN_ROOT}`
- No hardcoded absolute paths

---

### Test 2.4: Referenced scripts exist ❌

**Status**: ❌ Not Implemented
**Description**: Verifies all hook scripts are present

**Steps**:

1. Extract script paths from hooks.json
2. Resolve paths (replace variable with `.`)
3. Check files exist

**Expected**:

- All referenced .ts scripts exist
- Scripts are executable

---

## Test Suite 3: Directory Structure

Tests for Story 3 - clean plugin layout.

### Test 3.1: .claude-plugin only contains plugin.json ❌

**Status**: ❌ Not Implemented
**Description**: Verifies no other files in .claude-plugin directory

**Steps**:

1. List `.claude-plugin/` contents
2. Check file count

**Expected**:

- Only `plugin.json` present
- No commands/, skills/, etc. inside

---

### Test 3.2: Commands directory structure correct ❌

**Status**: ❌ Not Implemented
**Description**: Verifies commands are properly formatted

**Steps**:

1. List `commands/` directory
2. Read each .md file
3. Check YAML frontmatter

**Expected**:

- All files are .md
- Each has `description` in frontmatter
- Content follows command template

---

### Test 3.3: Skills directory structure correct ❌

**Status**: ❌ Not Implemented
**Description**: Verifies skills have SKILL.md files

**Steps**:

1. List `skills/` subdirectories
2. Check each has `SKILL.md`
3. Validate skill format

**Expected**:

- Each skill in subdirectory
- `SKILL.md` file present
- Valid skill metadata

---

## Test Suite 4: Marketplace

Tests for Story 4 - marketplace.json configuration.

### Test 4.1: marketplace.json is valid ❌

**Status**: ❌ Not Implemented
**Description**: Verifies marketplace.json parses and has required fields

**Steps**:

1. Read `marketplace.json`
2. Parse JSON
3. Check required fields

**Expected**:

- `name` field exists
- `plugins` array exists
- At least one plugin entry

---

## Summary

**Total**: 12 tests
**Passing**: 0 tests (0%)
**Skipped**: 0 tests (0%)
**Not Implemented**: 12 tests (100%)
**Failing**: 0 tests (0%)

### Coverage by Story

| Story                        | Tests | Status |
| ---------------------------- | ----- | ------ |
| Story 1: Plugin Manifest     | 4     | ❌ 0%  |
| Story 2: Hooks Config        | 4     | ❌ 0%  |
| Story 3: Directory Structure | 3     | ❌ 0%  |
| Story 4: Marketplace         | 1     | ❌ 0%  |

### Skipped Tests Rationale

None currently - all tests should be implemented.

---

## Test Execution

```bash
# Run plugin structure tests
bun run test -- packages/cli/tests/plugin-structure.test.ts

# Manual validation with Claude Code
# 1. cd to plugin directory
# 2. Run: claude
# 3. Type: /plugin
# 4. Verify safeword appears
```

---

**Last Updated**: 2025-12-24
