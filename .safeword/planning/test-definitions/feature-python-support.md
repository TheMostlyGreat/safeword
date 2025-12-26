# Test Definitions: Python Support

**Guide**: `.safeword/guides/testing-guide.md`
**Template**: `.safeword/templates/test-definitions-feature.md`

**Feature**: Enable safeword to work with Python projects using Ruff + mypy

**Test Files**:
- `packages/cli/src/utils/project-detector.test.ts` (Story 1)
- `packages/cli/tests/integration/hooks.test.ts` (Story 2)
- `packages/cli/tests/commands/setup-python.test.ts` (Story 3)

**Total Tests**: 30 (16 passing, 6 manual for Story 4, 6 manual for Story 2, 2 constraints)

---

## Test Suite 1: Python Project Detection

Tests for Story 1 - detecting Python projects and their characteristics.

### Test 1.1: Detects pyproject.toml as Python project ❌

**Status**: ❌ Not Implemented
**Description**: Verifies that presence of pyproject.toml indicates a Python project

**Steps**:

1. Create temp directory with only pyproject.toml (no package.json)
2. Call detectProjectType/detectLanguages
3. Check result

**Expected**:

- `python` property is `true`
- `javascript` property is `false` (no package.json)

---

### Test 1.2: Detects requirements.txt as Python fallback ❌

**Status**: ❌ Not Implemented
**Description**: Verifies that requirements.txt indicates Python when pyproject.toml is absent

**Steps**:

1. Create temp directory with only requirements.txt
2. Call detectProjectType/detectLanguages
3. Check result

**Expected**:

- `python` property is `true`
- Works without pyproject.toml

---

### Test 1.3: Detects Django framework ❌

**Status**: ❌ Not Implemented
**Description**: Verifies Django detection from pyproject.toml dependencies

**Steps**:

1. Create pyproject.toml with `django` in dependencies
2. Call detectProjectType
3. Check framework detection

**Expected**:

- `pythonFramework` is `'django'`

---

### Test 1.4: Detects Flask framework ❌

**Status**: ❌ Not Implemented
**Description**: Verifies Flask detection from pyproject.toml dependencies

**Steps**:

1. Create pyproject.toml with `flask` in dependencies
2. Call detectProjectType
3. Check framework detection

**Expected**:

- `pythonFramework` is `'flask'`

---

### Test 1.5: Detects FastAPI framework ❌

**Status**: ❌ Not Implemented
**Description**: Verifies FastAPI detection from pyproject.toml dependencies

**Steps**:

1. Create pyproject.toml with `fastapi` in dependencies
2. Call detectProjectType
3. Check framework detection

**Expected**:

- `pythonFramework` is `'fastapi'`

---

### Test 1.6: Detects Poetry package manager ❌

**Status**: ❌ Not Implemented
**Description**: Verifies Poetry detection from pyproject.toml [tool.poetry] section

**Steps**:

1. Create pyproject.toml with `[tool.poetry]` section
2. Call detectProjectType
3. Check package manager detection

**Expected**:

- `pythonPackageManager` is `'poetry'`

---

### Test 1.7: Detects uv package manager ❌

**Status**: ❌ Not Implemented
**Description**: Verifies uv detection from uv.lock or [tool.uv] section

**Steps**:

1. Create directory with uv.lock file
2. Call detectProjectType
3. Check package manager detection

**Expected**:

- `pythonPackageManager` is `'uv'`

---

### Test 1.8: Defaults to pip package manager ❌

**Status**: ❌ Not Implemented
**Description**: Verifies pip is default when no other manager detected

**Steps**:

1. Create directory with only requirements.txt (no pyproject.toml)
2. Call detectProjectType
3. Check package manager detection

**Expected**:

- `pythonPackageManager` is `'pip'`

---

### Test 1.9: Detects polyglot project (JS + Python) ❌

**Status**: ❌ Not Implemented
**Description**: Verifies detection of projects with both package.json and pyproject.toml

**Steps**:

1. Create temp directory with both package.json and pyproject.toml
2. Call detectProjectType/detectLanguages
3. Check both languages detected

**Expected**:

- `python` is `true`
- `javascript` is `true`
- Both languages' dependencies parsed

---

### Test 1.10: Works without package.json ❌

**Status**: ❌ Not Implemented
**Description**: Verifies Python detection works for Python-only projects

**Steps**:

1. Create temp directory with only pyproject.toml
2. Call setup or detection functions
3. Verify no errors thrown

**Expected**:

- No package.json required
- Detection completes successfully
- No JavaScript tooling assumed

---

## Test Suite 2: Python-Aware Lint Hook

Tests for Story 2 - running Ruff on Python files in the post-tool lint hook.

### Test 2.1: Runs Ruff check on .py files ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint hook runs `ruff check --fix` for Python files

**Steps**:

1. Set up project with Ruff installed
2. Create .py file with linting issues
3. Run lint hook with file path
4. Check file was modified

**Expected**:

- `ruff check --fix` executed
- Fixable issues corrected
- Exit code 0 on success

---

### Test 2.2: Runs Ruff format on .py files ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint hook runs `ruff format` for Python files

**Steps**:

1. Set up project with Ruff installed
2. Create .py file with formatting issues
3. Run lint hook with file path
4. Check formatting applied

**Expected**:

- `ruff format` executed
- File formatted according to Ruff defaults

---

### Test 2.3: Continues running ESLint for .js/.ts files ❌

**Status**: ❌ Not Implemented
**Description**: Verifies JS/TS files still use ESLint in polyglot projects

**Steps**:

1. Set up polyglot project (both languages)
2. Run lint hook on .ts file
3. Run lint hook on .py file
4. Verify each uses correct linter

**Expected**:

- `.ts` file: ESLint executed
- `.py` file: Ruff executed
- Both complete successfully

---

### Test 2.4: Skips Ruff gracefully if not installed ❌

**Status**: ❌ Not Implemented
**Description**: Verifies hook doesn't fail when Ruff is missing

**Steps**:

1. Set up Python project without Ruff installed
2. Run lint hook on .py file
3. Check behavior

**Expected**:

- No error thrown
- Silent skip (exit 0)
- Warning message optional

---

### Test 2.5: Skips ESLint gracefully for Python-only projects ❌

**Status**: ❌ Not Implemented
**Description**: Verifies hook doesn't fail when no ESLint in Python-only project

**Steps**:

1. Set up Python-only project (no package.json)
2. Run lint hook on .py file
3. Check no ESLint errors

**Expected**:

- No ESLint execution attempted
- Ruff runs successfully
- No npm/npx errors

---

### Test 2.6: Detects file extension correctly ❌

**Status**: ❌ Not Implemented
**Description**: Verifies extension detection for various Python file types

**Steps**:

1. Test with `.py` file
2. Test with `.pyi` file (stub)
3. Test with `.pyx` file (Cython)

**Expected**:

- `.py` → Ruff
- `.pyi` → Ruff
- `.pyx` → Skip or Ruff (decision needed)

---

## Test Suite 3: Conditional Setup for Python Projects

Tests for Story 3 - setup behavior for Python-only projects.

### Test 3.1: Skips ESLint install for Python-only projects ❌

**Status**: ❌ Not Implemented
**Description**: Verifies ESLint/Prettier not installed when only Python detected

**Steps**:

1. Create temp directory with only pyproject.toml
2. Run `safeword setup --yes`
3. Check installed packages

**Expected**:

- No eslint in node_modules
- No prettier in node_modules
- No package.json created (or minimal)

---

### Test 3.2: Skips package.json creation for Python-only ❌

**Status**: ❌ Not Implemented
**Description**: Verifies package.json not created for pure Python projects

**Steps**:

1. Create temp directory with only pyproject.toml
2. Run `safeword setup --yes`
3. Check for package.json

**Expected**:

- No package.json file created
- Setup completes successfully

---

### Test 3.3: Shows Python-appropriate next steps ❌

**Status**: ❌ Not Implemented
**Description**: Verifies setup output mentions pip/Ruff instead of npm/ESLint

**Steps**:

1. Create Python-only project
2. Run `safeword setup --yes`
3. Capture output

**Expected**:

- Output mentions `pip install ruff mypy` or similar
- No mention of `npm install`
- Python-specific guidance shown

---

### Test 3.4: Still creates .safeword directory ❌

**Status**: ❌ Not Implemented
**Description**: Verifies guides and templates still created for Python projects

**Steps**:

1. Create Python-only project
2. Run `safeword setup --yes`
3. Check .safeword directory

**Expected**:

- `.safeword/` directory created
- `SAFEWORD.md` present
- Guides and templates present

---

### Test 3.5: Still creates Claude hooks ❌

**Status**: ❌ Not Implemented
**Description**: Verifies hooks created for Python projects

**Steps**:

1. Create Python-only project
2. Run `safeword setup --yes`
3. Check .safeword/hooks directory

**Expected**:

- Hooks directory created
- Lint hook present (Python-aware version)
- Quality hook present

---

### Test 3.6: Installs both toolchains for polyglot projects ❌

**Status**: ❌ Not Implemented
**Description**: Verifies both ESLint and Ruff setup for mixed projects

**Steps**:

1. Create directory with both package.json and pyproject.toml
2. Run `safeword setup --yes`
3. Check tooling

**Expected**:

- ESLint configured
- Ruff guidance shown
- Both languages supported in hooks

---

## Test Suite 4: Lint Command for Python

Tests for Story 4 - the /lint skill working with Python projects.

**Note**: These are manual tests since lint.md is a skill template (markdown instructions for Claude), not executable code. Test by running `/lint` in each project type.

### Test 4.1: Detects Python project in /lint command ❌

**Status**: ❌ Not Implemented
**Description**: Verifies /lint command detects Python and runs appropriate tools

**Steps**:

1. Create Python project
2. Invoke lint command logic
3. Check execution path

**Expected**:

- Python detected from pyproject.toml
- Ruff commands executed
- mypy command executed

---

### Test 4.2: Runs ruff check --fix and ruff format ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint command runs both Ruff check and format

**Steps**:

1. Create Python project with issues
2. Run lint command
3. Verify both commands executed

**Expected**:

- `ruff check --fix` executed
- `ruff format` executed
- Issues fixed

---

### Test 4.3: Runs mypy for type checking ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint command runs mypy (analogous to tsc)

**Steps**:

1. Create Python project with type errors
2. Run lint command
3. Check mypy output

**Expected**:

- `mypy` executed
- Type errors reported
- Exit code reflects mypy result

---

### Test 4.4: Falls back to ESLint for JS projects ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint command still works for JS-only projects

**Steps**:

1. Create JS-only project (package.json, no pyproject.toml)
2. Run lint command
3. Verify ESLint executed

**Expected**:

- ESLint runs (not Ruff)
- tsc runs (not mypy)
- Existing behavior preserved

---

### Test 4.5: Runs both toolchains for polyglot projects ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint command runs both Python and JS tools for mixed projects

**Steps**:

1. Create polyglot project (both package.json and pyproject.toml)
2. Run lint command
3. Verify both toolchains executed

**Expected**:

- Ruff check + format executed
- mypy executed
- ESLint executed
- tsc executed (if tsconfig.json exists)

---

### Test 4.6: Detects Python from requirements.txt ❌

**Status**: ❌ Not Implemented
**Description**: Verifies lint command detects Python when only requirements.txt exists

**Steps**:

1. Create Python project with requirements.txt (no pyproject.toml)
2. Run lint command
3. Verify Python tools executed

**Expected**:

- Python detected from requirements.txt
- Ruff check + format executed
- mypy executed

---

## Test Suite 5: Technical Constraints

Tests for non-functional requirements from the spec.

### Test 5.1: No new npm dependencies for detection ❌

**Status**: ❌ Not Implemented
**Category**: Dependencies
**Constraint**: Python detection must not add npm dependencies

**Steps**:

1. Check package.json before Python support
2. Implement Python detection
3. Check package.json after

**Expected**:

- No new entries in dependencies/devDependencies
- Detection uses only Node.js built-ins or existing deps

---

### Test 5.2: pyproject.toml parsing is correct ❌

**Status**: ❌ Not Implemented
**Category**: Compatibility
**Constraint**: Support pyproject.toml (PEP 518/621)

**Steps**:

1. Create pyproject.toml with various formats:
   - `[project]` section (PEP 621)
   - `[tool.poetry]` section
   - `[tool.uv]` section
2. Parse each format
3. Verify correct extraction

**Expected**:

- All standard pyproject.toml formats parsed
- Dependencies extracted correctly
- No parsing errors on valid files

---

## Summary

**Total**: 26 tests
**Passing**: 16 tests (62%) - Stories 1, 2, 3 implemented
**Skipped**: 0 tests (0%)
**Not Implemented**: 8 tests (31%) - Story 4 + constraints
**Manual Only**: 2 tests (8%) - Story 2 (hooks)

### Coverage by Story

| Story | Tests | Status |
|-------|-------|--------|
| Story 1: Python Detection | 10 | ✅ 100% (36 tests in detector) |
| Story 2: Lint Hook | 6 | ✅ Manual (pre-existing code) |
| Story 3: Conditional Setup | 6 | ✅ 100% (6 tests passing) |
| Story 4: Lint Command | 6 | ❌ 0% (manual testing) |
| Technical Constraints | 2 | ⏭️ Verified during implementation |

### Skipped Tests Rationale

None currently - all tests should be implemented.

---

## Test Execution

```bash
# Run all Python support tests
bun run test -- --grep "Python"

# Run Story 1 tests (detection)
bun run test -- packages/cli/src/utils/project-detector.test.ts

# Run Story 2 tests (hooks)
bun run test -- packages/cli/tests/integration/hooks.test.ts --grep "Python"

# Run Story 3 tests (setup)
bun run test -- packages/cli/tests/commands/setup-python.test.ts
```

---

**Last Updated**: 2025-12-25
