# Design: Python Support

**Guide**: `.safeword/guides/design-doc-guide.md`
**Template**: `.safeword/templates/design-doc-template.md`

**Related**: Spec: `.safeword/planning/specs/feature-python-support.md` | Tests: `.safeword/planning/test-definitions/feature-python-support.md` | Architecture: `ARCHITECTURE.md`

**TDD Note**: This design implements tests from Test Definitions. Each component references its test suite.

---

## Architecture

Extends safeword to support Python projects via Ruff + mypy. See `ARCHITECTURE.md` for language detection pattern and key decisions.

**Diagram**:

```text
detectLanguages() → JavaScript | Python | Polyglot
       ↓                ↓           ↓
detectProjectType  detectPythonType  Both
       ↓                ↓           ↓
    ESLint           Ruff        Both linters
```

---

## Components

### Component 1: LanguageDetector

**What**: Detects JavaScript/Python from project files
**Where**: `packages/cli/src/utils/project-detector.ts`
**Interface**: See `ARCHITECTURE.md` → Language Detection
**Dependencies**: Node.js `fs` module
**Tests**: Suite 1 (Tests 1.1-1.10)
**Integration**: Called in `setup()` before `createProjectContext(cwd, languages)`

### Component 2: ExtendedLintHook

**What**: Routes files to Ruff or ESLint by extension
**Where**: `packages/cli/templates/hooks/lib/lint.ts`
**Interface**:

```typescript
const PYTHON_EXTENSIONS = new Set(['py', 'pyi']);
export async function lintFile(file: string, projectDir: string): Promise<void>;
```

**Dependencies**: Bun shell (`$`), Ruff CLI, ESLint
**Tests**: Suite 2 (Tests 2.1-2.6)

### Component 3: ConditionalSetup

**What**: Skips JS tooling for Python-only projects
**Where**: `packages/cli/src/commands/setup.ts`, `packages/cli/src/schema.ts`
**Interface**:

```typescript
function printSetupSummary(
  result: ReconcileResult,
  packageJsonCreated: boolean,
  languages: Languages,
  archFiles?: string[],
  workspaceUpdates?: string[]
): void;
```

**Dependencies**: LanguageDetector (Component 1)
**Tests**: Suite 3 (Tests 3.1-3.6)

**Schema Modifications** (in `schema.ts`):
- `managedFiles['eslint.config.mjs']` - return empty if `!ctx.languages.javascript`
- `managedFiles['knip.json']` - return empty if `!ctx.languages.javascript`
- `jsonMerges['package.json']` - add `skipIfMissing: true`
- `packages.base` - move JS tools to `conditional.javascript`

### Component 4: LintCommand

**What**: Extends /lint to run Python tooling
**Where**: `packages/cli/templates/commands/lint.md`
**Behavior**:

| Language   | Commands |
|------------|----------|
| Python     | `ruff check --fix .`, `ruff format .`, `mypy .` |
| JavaScript | `npm run lint`, `npm run format`, `npx tsc` |

**Dependencies**: Shell commands (Ruff, mypy, npm scripts)
**Tests**: Suite 4 (Tests 4.1-4.4)

---

## Component Interaction

**Setup Flow:**

```text
setup()
  → languages = detectLanguages(cwd)
  → if languages.javascript: ensurePackageJson()
  → ctx = createProjectContext(cwd, languages)  // adds languages to ctx
  → reconcile(schema, ctx)                       // schema checks ctx.languages
  → if languages.javascript: installDependencies()
  → printSetupSummary(..., languages)            // shows Python guidance if languages.python
```

**Lint Hook Flow:**

```text
lintFile(file)
  → PYTHON_EXTENSIONS? → ruff check --fix && ruff format (with .nothrow().quiet())
  → JS_EXTENSIONS? → npx eslint --fix && npx prettier (existing behavior)
  → else: existing behavior
```

---

## User Flow

### Python-only setup

1. User runs `safeword setup` with only `pyproject.toml`
2. System detects Python, skips package.json creation
3. System creates `.safeword/` with guides, hooks
4. User sees: "Run `pip install ruff mypy`"

### Polyglot lint hook

1. Claude edits `.py` file → Ruff runs
2. Claude edits `.ts` file → ESLint runs
3. Both complete without blocking

---

## Implementation Notes

**Constraints**: No new npm deps for detection; hooks < 1 second

**Error Handling**: Missing linters skip silently (see `ARCHITECTURE.md`)

**Gotchas**:
- Check both `uv.lock` and `[tool.uv]` for uv detection
- `pip` is fallback when no manager detected

**Open Questions**:
- [ ] `.pyx` (Cython) files - defer, low priority

---

## References

- Architecture decisions: `ARCHITECTURE.md`
- Ruff rules: See spec Technical Constraints
