# Test Definitions: Python Tooling Parity (Phase 2)

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Bring Python tooling to parity with JS
**Status**: Not Started (Out of Scope for MVP)
**Total Tests**: 5 (0 passing, 5 not implemented)

---

## Test Suite 1: Ruff Config Generation

### Test 1.1: Generates [tool.ruff] section ❌

**Status**: ❌ Not Implemented
**Description**: Setup adds Ruff config to pyproject.toml

**Steps**:

1. Run `safeword setup` in Python project
2. Check pyproject.toml

**Expected**:

- `[tool.ruff]` section present with rules
- Existing content preserved

---

## Test Suite 2: Pre-commit Integration

### Test 2.1: Generates .pre-commit-config.yaml ❌

**Status**: ❌ Not Implemented
**Description**: Setup creates pre-commit config for Python

**Steps**:

1. Run `safeword setup` in Python project with git
2. Check for .pre-commit-config.yaml

**Expected**:

- File created with Ruff hooks

---

## Test Suite 3: Architecture Validation

### Test 3.1: Generates import-linter config ❌

**Status**: ❌ Not Implemented
**Description**: Setup adds import-linter contracts to pyproject.toml

**Steps**:

1. Run `safeword setup` in Python project with layer structure
2. Check pyproject.toml for [tool.importlinter]

**Expected**:

- Layer contracts generated

---

## Test Suite 4: Dead Code Detection

### Test 4.1: /audit runs deadcode ❌

**Status**: ❌ Not Implemented
**Description**: Audit command includes deadcode for Python

**Steps**:

1. Run `/audit` in Python project
2. Check output

**Expected**:

- Unused code reported

---

## Test Suite 5: Copy/Paste Detection

### Test 5.1: /audit runs jscpd ❌

**Status**: ❌ Not Implemented
**Description**: Audit command includes jscpd for all languages

**Steps**:

1. Run `/audit` in project
2. Check output

**Expected**:

- Duplicated blocks reported

---

## Summary

**Total**: 5 tests
**Not Implemented**: 5 tests (100%)

| Tool | Tests | Status |
|------|-------|--------|
| Ruff config | 1 | ❌ |
| pre-commit | 1 | ❌ |
| import-linter | 1 | ❌ |
| deadcode | 1 | ❌ |
| jscpd | 1 | ❌ |

---

**Last Updated**: 2025-12-26
