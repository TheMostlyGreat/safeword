# Design: Python Support

**Guide**: `.safeword/guides/design-doc-guide.md` - Principles, structure guidelines, and avoiding bloat
**Template**: `.safeword/templates/design-doc-template.md`

**Related**: Feature Spec: `.safeword/planning/specs/feature-python-support.md` | Test Definitions: `.safeword/planning/test-definitions/feature-python-support.md`

**TDD Note**: This design implements tests from Test Definitions. Reference specific test scenarios (e.g., "Test 1.1: Detects pyproject.toml as Python project").

## Architecture

Python support adds a language detection layer above the existing `detectProjectType()` function. This layer determines which languages are present (JavaScript, Python, or both) before framework-specific detection runs. The lint hook extends to route files to the correct linter based on extension.

The key insight: current code assumes package.json exists. For Python-only projects, we must detect languages FIRST, then conditionally skip JS tooling. For polyglot projects (both JS and Python), both toolchains operate in parallel.

**Diagram**:

```text
                    ┌─────────────────────┐
                    │   detectLanguages() │  ← NEW: Reads pyproject.toml, requirements.txt
                    │   Returns: Languages │     package.json
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         JavaScript       Python          Polyglot
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────┐ ┌────────────┐
    │detectProjectType│ │detectPython │ │   Both     │
    │  (existing)     │ │  Type()     │ │ functions  │
    └─────────────────┘ └─────────────┘ └────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────────────────────────────────────┐
    │              Setup / Lint Hook                   │
    │   Routes to ESLint/Prettier OR Ruff OR Both     │
    └─────────────────────────────────────────────────┘
```

## Components

### Component 1: LanguageDetector

**What**: Detects which programming languages are present in a project
**Where**: `packages/cli/src/utils/project-detector.ts` (extend existing file)
**Interface**:

```typescript
export interface Languages {
  javascript: boolean;  // package.json exists
  python: boolean;      // pyproject.toml OR requirements.txt exists
}

export interface PythonProjectType {
  framework: 'django' | 'flask' | 'fastapi' | null;
  packageManager: 'poetry' | 'uv' | 'pip';
}

/**
 * Detect languages present in project.
 * Called BEFORE detectProjectType() to avoid package.json assumption.
 */
export function detectLanguages(cwd: string): Languages;

/**
 * Detect Python framework and package manager.
 * Checks pyproject.toml for [tool.poetry], [tool.uv], and uv.lock file.
 * Only called if detectLanguages().python is true.
 */
export function detectPythonType(cwd: string): PythonProjectType;
```

**Dependencies**: Node.js `fs` module, TOML parsing (see Decision 1)
**Tests**: Test Suite 1 (Tests 1.1-1.10)

### Component 2: ExtendedLintHook

**What**: Routes files to correct linter based on extension
**Where**: `packages/cli/templates/hooks/lib/lint.ts` (extend existing)
**Interface**:

```typescript
// Add to existing extension sets
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);

/**
 * Extended lintFile with Python support.
 * Calls ruff check --fix && ruff format for Python files.
 */
export async function lintFile(file: string, projectDir: string): Promise<void>;

/**
 * Check if Ruff is available in PATH.
 * Result cached for session (avoids repeated `which ruff` calls).
 */
function hasRuff(): Promise<boolean>;

/**
 * Check if ESLint is available (node_modules).
 * Result cached per projectDir.
 */
function hasEslint(projectDir: string): Promise<boolean>;
```

**Dependencies**: Bun shell (`$`), existing lintFile logic
**Tests**: Test Suite 2 (Tests 2.1-2.6)

### Component 3: ConditionalSetup

**What**: Skips JS tooling for Python-only projects
**Where**: `packages/cli/src/commands/setup.ts` (modify existing)
**Interface**:

```typescript
// Modify ensurePackageJson to be conditional
function ensurePackageJson(cwd: string, languages: Languages): boolean;

// Add Python-specific next steps
function printSetupSummary(
  result: ReconcileResult,
  packageJsonCreated: boolean,
  languages: Languages,  // NEW parameter
  archFiles?: string[],
  workspaceUpdates?: string[],
): void;
```

**Dependencies**: LanguageDetector component
**Tests**: Test Suite 3 (Tests 3.1-3.6)

### Component 4: LintCommand

**What**: Extends /lint skill to run Python tooling
**Where**: `packages/cli/templates/commands/lint.md`
**Behavior**:

The `/lint` command template already contains bash commands. Extend it to:
1. Detect project type (Python, JS, or both)
2. Run appropriate toolchain based on detection

| Language   | Commands                                      |
|------------|-----------------------------------------------|
| Python     | `ruff check --fix .`, `ruff format .`, `mypy .` |
| JavaScript | `eslint --fix .`, `prettier --write .`, `tsc --noEmit` |
| Polyglot   | All of the above                              |

**Dependencies**: Shell commands (Ruff, mypy, ESLint, Prettier, tsc)
**Tests**: Test Suite 4 (Tests 4.1-4.4)

## Data Model

```typescript
// Extended ProjectContext (packages/cli/src/utils/context.ts)
// Uses Languages and PythonProjectType from Component 1
export interface ProjectContext {
  cwd: string;
  packageJson?: PackageJson;       // Optional for Python-only
  languages: Languages;            // NEW: which languages detected
  projectType?: ProjectType;       // Only if languages.javascript
  pythonType?: PythonProjectType;  // Only if languages.python
}

// Pyproject.toml structure (partial, for parsing)
interface PyprojectToml {
  project?: {
    dependencies?: string[];       // PEP 621 format: ["django>=4.0"]
  };
  tool?: {
    poetry?: {
      dependencies?: Record<string, string>;  // Poetry format: {"django": "^4.0"}
    };
    uv?: Record<string, unknown>;
  };
}
```

## Component Interaction

**Setup Flow:**

```text
setup()
  → detectLanguages(cwd)           # First: what languages?
  → if languages.javascript:
      → ensurePackageJson()        # Only create if JS project
      → detectProjectType()
      → installDependencies()      # ESLint, Prettier, etc.
  → if languages.python:
      → detectPythonType()
      → printPythonGuidance()      # "pip install ruff mypy"
  → reconcile(schema)              # Always: .safeword dir, hooks, guides
```

**Lint Hook Flow:**

```text
lintFile(file, projectDir)
  → extension = getExtension(file)
  → if PYTHON_EXTENSIONS.has(extension):
      → if hasRuff():
          → ruff check --fix ${file}
          → ruff format ${file}
      → else: skip silently
  → else if JS_EXTENSIONS.has(extension):
      → if hasEslint(projectDir):
          → eslint --fix ${file}
          → prettier --write ${file}
      → else: skip silently
  → else: existing behavior (prettier, shellcheck)
```

## User Flow

### Python-only project setup

1. User runs `safeword setup` in directory with only `pyproject.toml`
2. System detects `languages.python = true, languages.javascript = false`
3. System creates `.safeword/` directory with guides, templates, hooks
4. System does NOT create `package.json`
5. System does NOT install ESLint/Prettier
6. User sees: "Python project detected. Run `pip install ruff mypy` for linting."
7. User sees success message with Python-appropriate next steps

### Polyglot project lint hook

1. Claude edits a `.py` file in a project with both package.json and pyproject.toml
2. PostToolUse hook fires
3. Hook detects `.py` extension
4. Hook runs `ruff check --fix file.py && ruff format file.py`
5. If Claude then edits a `.ts` file
6. Hook detects `.ts` extension
7. Hook runs `eslint --fix file.ts && prettier --write file.ts`

## Key Decisions

### Decision 1: TOML Parsing Strategy

**What**: Use regex-based extraction instead of full TOML parser
**Why**:
- No new npm dependencies (technical constraint from spec)
- pyproject.toml structure is predictable for our needs
- Only need to detect: `[tool.poetry]`, `[tool.uv]`, dependency names
- Full TOML parsing is overkill for detection
**Trade-off**: May fail on complex TOML edge cases, but acceptable for detection purposes

### Decision 2: Graceful Linter Fallback

**What**: Skip linter silently if not installed, rather than error
**Why**:
- Users may not have Ruff/ESLint installed immediately after setup
- Hook should never block Claude's workflow
- Matches existing behavior for shellcheck
**Trade-off**: User may not realize linting is skipped; mitigate with setup guidance

### Decision 3: Ruff in Hook, mypy in Command Only

**What**: Hook runs `ruff check --fix && ruff format`; mypy runs only via `/lint` command
**Why**:
- Ruff is fast (ms per file) - safe for per-file hook
- mypy is slow (seconds, whole project) - would block Claude
- Matches ESLint (hook) vs tsc (command) pattern for JS
**Trade-off**: Type errors not caught until explicit /lint run

### Decision 4: Detect Languages Before Framework

**What**: Call `detectLanguages()` before `detectProjectType()`
**Why**:
- Current code calls `ensurePackageJson()` which creates package.json
- For Python-only projects, this is wrong behavior
- Must detect languages first to avoid side effects
**Trade-off**: Additional file system reads at startup; acceptable overhead

## Implementation Notes

**Constraints**:

- No new npm dependencies for Python detection
- Must support pyproject.toml (PEP 518/621)
- Must support requirements.txt fallback
- Hooks must complete in <1 second per file

**Error Handling**:

- TOML parse errors: treat as "not Python", log warning
- Missing Ruff/ESLint: skip silently (exit 0)
- Ruff execution errors: log stderr, continue (don't block Claude)

**Gotchas**:

- `uv.lock` may exist without `[tool.uv]` in pyproject.toml - check both
- Poetry can be detected via `[tool.poetry]` section
- `pip` is the fallback when no manager detected (requirements.txt only)
- `.pyi` files (stubs) should also be linted with Ruff

**Open Questions**:

- [x] Ruff rule set confirmed (see spec Technical Constraints)
- [x] mypy configuration deferred to Phase 2
- [ ] Should `.pyx` (Cython) files be linted? (Low priority, defer)

## References

- Feature Spec: `.safeword/planning/specs/feature-python-support.md`
- Test Definitions: `.safeword/planning/test-definitions/feature-python-support.md`
- Ruff documentation: https://docs.astral.sh/ruff/
- PEP 621 (pyproject.toml metadata): https://peps.python.org/pep-0621/
