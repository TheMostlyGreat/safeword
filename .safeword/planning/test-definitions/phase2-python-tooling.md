# Test Definitions: Python Tooling Parity (Phase 2)

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Bring Python tooling to parity with JS
**Status**: RED Phase (tests written, implementation pending)
**Total Tests**: 8 (2 passing, 6 failing)
**Test File**: `packages/cli/tests/commands/setup-python-phase2.test.ts`

---

## Test Suite 1: Ruff Config Generation

### Test 1.1: Generates [tool.ruff] section 🔴

**Status**: 🔴 RED (failing)
**Description**: Setup adds Ruff config to pyproject.toml

**Steps**:

1. Run `safeword setup` in Python project
2. Check pyproject.toml

**Expected**:

- `[tool.ruff]` section present with rules
- Existing content preserved

---

## Test Suite 2: Pre-commit Integration

### Test 2.1: Generates .pre-commit-config.yaml 🔴

**Status**: 🔴 RED (failing)
**Description**: Setup creates pre-commit config for Python

**Steps**:

1. Run `safeword setup` in Python project with git
2. Check for .pre-commit-config.yaml

**Expected**:

- File created with Ruff hooks

---

## Test Suite 3: Architecture Validation

### Test 3.1: Generates import-linter config 🔴

**Status**: 🔴 RED (failing)
**Description**: Setup adds import-linter contracts to pyproject.toml

**Steps**:

1. Run `safeword setup` in Python project with layer structure
2. Check pyproject.toml for [tool.importlinter]

**Expected**:

- Layer contracts generated

---

## Test Suite 4: Dead Code Detection

### Test 4.1: /audit runs deadcode 🔴

**Status**: 🔴 RED (failing)
**Description**: Audit command includes deadcode for Python

**Steps**:

1. Run `/audit` in Python project
2. Check output

**Expected**:

- Unused code reported

---

## Test Suite 5: Copy/Paste Detection

### Test 5.1: /audit runs jscpd 🔴

**Status**: 🔴 RED (failing)
**Description**: Audit command includes jscpd for all languages

**Steps**:

1. Run `/audit` in project
2. Check output

**Expected**:

- Duplicated blocks reported

---

## Summary

**Total**: 8 tests (6 positive + 2 negative)
**RED**: 6 tests (75%)
**Passing**: 2 tests (negative tests)

| Tool | Tests | Status |
|------|-------|--------|
| Ruff config | 2 | 🔴 RED |
| pre-commit | 2 | 🔴 RED (1 negative passes) |
| import-linter | 2 | 🔴 RED (1 negative passes) |
| deadcode | 1 | 🔴 RED |
| jscpd | 1 | 🔴 RED |

---

**Last Updated**: 2025-12-26
