# Language Pack Specification

How to add support for a new language in safeword.

## Core Interface

Every language pack implements `LanguagePack` from `types.ts`:

```typescript
interface LanguagePack {
  id: string;           // e.g., 'python', 'golang'
  name: string;         // e.g., 'Python', 'Go'
  extensions: string[]; // e.g., ['.py', '.pyi'] or ['.go']
  detect(cwd: string): boolean;
  setup(cwd: string, ctx: SetupContext): SetupResult;
}
```

## Linter Philosophy

**Strictness:** Enable ALL rules by default, then selectively disable noisy/conflicting ones.

| Language | Strictness Setting | Exclusions |
|----------|-------------------|------------|
| TypeScript | ESLint: multiple strict plugins | Minimal (Prettier conflicts) |
| Python | `select = ["ALL"]` | `D`, `ANN`, formatter conflicts |
| Go | `default: all` | `std-error-handling`, `common-false-positives` |

**Design Constraints (Required):** Every language pack MUST enforce:

| Constraint | ESLint | Ruff | golangci-lint |
|------------|--------|------|---------------|
| Cyclomatic complexity ≤10 | `complexity: 10` | `C901` (max-complexity=10) | `cyclop` (default: 10) |
| Max nesting depth ≤4 | `max-depth: 4` | N/A | `nestif` (min-complexity=4) |
| Max function params ≤5 | `max-params: 5` | `PLR0913` (default: 5) | N/A |
| Max callback nesting ≤3 | `max-nested-callbacks: 3` | N/A | N/A |

**Why:** LLMs write dense, complex code. These constraints force decomposition and improve maintainability.

**Rule Categories (Required):** Every language pack SHOULD enable rules for:

| Category | ESLint | Ruff | golangci-lint |
|----------|--------|------|---------------|
| Security | `eslint-plugin-security` | `S` (bandit) | `gosec` |
| Import cycles | `import-x/no-cycle` | - | `depguard` |
| Async/Promise | `eslint-plugin-promise` | `ASYNC` | N/A |
| Regex safety | `eslint-plugin-regexp` | - | - |

**Severity:** Use `error` not `warn`. LLMs ignore warnings—only errors stop code generation.

## Integration Points (Checklist)

### 1. Pack File (`src/packs/{lang}/index.ts`)

```typescript
export const {lang}Pack: LanguagePack = {
  id: '{lang}',
  name: '{Lang}',
  extensions: ['.ext'],
  detect(cwd) { /* return true if lang manifest exists */ },
  setup(cwd, ctx) { /* configure tooling, return { files: [...] } */ },
};
```

**Note:** TypeScript is special-cased—its setup lives in `schema.ts` (ESLint/tsconfig generation) not `setup()`. New languages should put setup logic in `setup()` or a dedicated `utils/{lang}-setup.ts`.

**Detection heuristic:** Check for the language's manifest file:
- Python → `pyproject.toml` OR `requirements.txt`
- TypeScript/JS → `package.json`
- Go → `go.mod`
- Rust → `Cargo.toml`
- Java → `pom.xml` or `build.gradle`

### 2. Registry (`src/packs/registry.ts`)

```typescript
import { {lang}Pack } from './{lang}/index.js';

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  // ...existing
  {lang}: {lang}Pack,
};
```

### 3. Lint Hook (`templates/hooks/lib/lint.ts`)

Add extension set and linting logic:

```typescript
// Note: extensions WITHOUT leading dot (different from LanguagePack.extensions)
const {LANG}_EXTENSIONS = new Set(['{ext}', '{ext2}']);

// In lintFile():
if ({LANG}_EXTENSIONS.has(extension)) {
  await $`{linter} --fix ${file}`.nothrow().quiet();
  await $`{formatter} ${file}`.nothrow().quiet();
  return;
}
```

**Pattern:** `linter --fix` then `formatter`. Use `.nothrow().quiet()` to skip gracefully if tools not installed.

**Error output:** For tools that should show errors (ESLint, shellcheck), print stderr on failure:
```typescript
const result = await $`npx eslint --fix ${file}`.nothrow().quiet();
if (result.exitCode !== 0 && result.stderr.length > 0) {
  console.log(result.stderr.toString());
}
```

**Shell scripts:** Handled as a special case (not a full language pack):
```typescript
const SHELL_EXTENSIONS = new Set(['sh']);

if (SHELL_EXTENSIONS.has(extension)) {
  await $`npx shellcheck ${file}`.nothrow().quiet();
  if (existsSync(`${projectDir}/node_modules/prettier-plugin-sh`)) {
    await $`npx prettier --write ${file}`.nothrow().quiet();
  }
}
```

### 4. Project Detector (`src/utils/project-detector.ts`)

Add language to detection:

```typescript
// Add to GO_MOD constant area
const {LANG}_MANIFEST = '{manifest}';

// Update Languages interface
export interface Languages {
  javascript: boolean;
  python: boolean;
  golang: boolean;
  {lang}: boolean;  // Add new language
}

// Update detectLanguages()
export function detectLanguages(cwd: string): Languages {
  // ...existing...
  const has{Lang}Manifest = existsSync(nodePath.join(cwd, {LANG}_MANIFEST));

  return {
    // ...existing...
    {lang}: has{Lang}Manifest,
  };
}
```

### 5. Setup Command (`src/commands/setup.ts`)

Integrate language setup into the main flow:

```typescript
// Import setup function
import { setup{Lang}Tooling } from '../packs/{lang}/setup.js';

// In setup():
// 1. Update isNonJsOnly check
const isNonJsOnly = (languages.python || languages.golang || languages.{lang}) && !languages.javascript;

// 2. Add detection message
if (languages.{lang} && !languages.javascript) info('{Lang} project detected (skipping JS tooling)');

// 3. Call language setup (after Python setup block)
const {lang}Files: string[] = [];
if (languages.{lang}) {
  const {lang}Result = setup{Lang}Tooling(cwd);
  {lang}Files.push(...{lang}Result.files);
  if ({lang}Result.files.length > 0) {
    info('\n{Lang} tooling configured:');
    info('  Created {config-file}');
  }
}

// 4. Add to printSetupSummary options interface and call
```

### 6. Test Helpers (`tests/helpers.ts`)

```typescript
// Tool availability check
export function is{Tool}Installed(): boolean {
  return isCommandAvailable('{tool}');
}

// Project scaffolding
export function create{Lang}Project(dir: string, options?: {...}): void {
  writeTestFile(dir, '{manifest}', '...');
  // Include minimal valid source file if needed
  writeTestFile(dir, 'main.{ext}', '...');
}

// Linter execution (for TypeScript/ESLint)
export function runEslint(dir: string, file: string, extraArgs: string[] = []): SpawnSyncReturns<string> {
  return spawnSync('npx', ['eslint', file, ...extraArgs], { cwd: dir, encoding: 'utf8' });
}
```

### 7. Golden Path Test (`tests/integration/{lang}-golden-path.test.ts`)

```typescript
const TOOL_AVAILABLE = is{Tool}Installed();

describe('E2E: {Lang} Golden Path', () => {
  let projectDirectory: string;

  beforeAll(async () => {
    projectDirectory = createTemporaryDirectory();
    create{Lang}Project(projectDirectory);
    initGitRepo(projectDirectory);
    await runCli(['setup', '--yes'], { cwd: projectDirectory, timeout: TIMEOUT_SETUP });
  }, 180_000);

  afterAll(() => {
    if (projectDirectory) removeTemporaryDirectory(projectDirectory);
  });

  // Always runs - config generation
  it('creates {tool} config', () => {
    // Verify tool config exists (format varies by language)
    // Python: expect(config).toContain('[tool.ruff]')
    // Go: gofmt needs no config, just verify setup completes
  });

  // Skipped if tool not installed
  it.skipIf(!TOOL_AVAILABLE)('{tool} config is valid and runs', () => {...});
  it.skipIf(!TOOL_AVAILABLE)('{tool} detects violations', () => {...});
  it.skipIf(!TOOL_AVAILABLE)('{tool} formats files', () => {...});
  it.skipIf(!TOOL_AVAILABLE)('post-tool-lint hook processes {lang} files', () => {...});
});
```

**Tip: Violation Tests Must Use Actual Caught Violations**

Test code must trigger linters that are actually enabled. Research what your linter catches:

```typescript
// ❌ Go: unused functions in `package main` are NOT caught (golangci-lint)
writeTestFile(dir, 'bad.go', `package main
func unused() {} // NOT detected!
`);

// ✅ Go: unused imports ARE caught by 'unused' linter
writeTestFile(dir, 'bad.go', `package main
import "fmt" // unused import - DETECTED
func bad() { println("not using fmt") }
`);
```

Research the default linter set before writing violation tests.

### 8. Tooling Validation Test (`tests/integration/tooling-validation.test.ts`)

Add a suite if the language has type checking or framework-specific rules:

```typescript
describe('E2E: {Tool} Type Error Detection', () => {
  it.skipIf(!TOOL_AVAILABLE)('{tool} catches type errors', () => {...});
});
```

## Package Manager Detection (Optional)

Only needed if the language has multiple package managers (Python: pip/poetry/uv/pipenv). Skip for languages with one PM (Go: `go mod`).

```typescript
export function detect{Lang}PackageManager(cwd: string): '{pm1}' | '{pm2}' | '{pm3}' {
  // Check lockfiles first (most reliable)
  if (exists(join(cwd, '{pm1}.lock'))) return '{pm1}';
  if (exists(join(cwd, '{pm2}.lock'))) return '{pm2}';
  // Check manifest markers
  if (manifestContains('[tool.{pm1}]')) return '{pm1}';
  // Default
  return '{pm3}';
}

export function get{Lang}InstallCommand(cwd: string, tools: string[]): string {
  const pm = detect{Lang}PackageManager(cwd);
  switch (pm) {
    case '{pm1}': return `{pm1} add --dev ${tools.join(' ')}`;
    // ...
  }
}
```

## Dependency Installation (Optional)

Languages with package managers should auto-install tooling dependencies during setup:

```typescript
export function install{Lang}Dependencies(cwd: string, tools: string[]): boolean {
  const pm = detect{Lang}PackageManager(cwd);

  // Skip if package manager doesn't support dev dependencies well (e.g., pip with PEP 668)
  if (pm === 'pip') return false;

  try {
    execSync(get{Lang}InstallCommand(cwd, tools), { cwd, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
```

| Language | Auto-Install | Reason |
|----------|--------------|--------|
| TypeScript | ✓ via npm/yarn/pnpm | Standard dev dependency workflow |
| Python | ✓ via uv/poetry | pip skipped (PEP 668 externally-managed) |
| Go | ✗ | Tools installed globally via `go install` |

## Type Checking Config (Optional)

Languages with separate type checkers should configure them during setup:

| Language | Type Checker | Config Location |
|----------|--------------|-----------------|
| TypeScript | tsc | `tsconfig.json` (user-managed) |
| Python | mypy | `[tool.mypy]` in pyproject.toml |
| Go | N/A | Built into compiler |

```typescript
// Example: Python mypy config
export function generateMypyConfig(): string {
  return `[tool.mypy]
ignore_missing_imports = true
show_error_codes = true
pretty = true`;
}
```

## Existing Tooling Detection (Optional)

For languages with established ecosystems, detect if the project already has linting/formatting configured:

```typescript
// In project-detector.ts or {lang}-setup.ts
export function hasExisting{Lang}Linter(cwd: string): boolean {
  // Check for config files, scripts, or dependencies
}
```

| Language | Linter Detection | Formatter Detection |
|----------|------------------|---------------------|
| TypeScript | ESLint config files, `lint` script | Prettier/Biome configs, `format` script |
| Python | `[tool.ruff]` section | Ruff format, Black configs |
| Go | N/A (go vet is built-in) | N/A (gofmt is built-in) |

**Usage:** Skip auto-configuration if tooling already exists to avoid conflicts.

## Setup File Pattern (`src/packs/{lang}/setup.ts`)

Complex languages need a dedicated setup file in their pack directory:

```typescript
// Detection functions
export function detect{Lang}Layers(cwd: string): string[] { /* architecture detection */ }
export function has{Tool}Dependency(cwd: string): boolean { /* check if tool already declared */ }

// Config generators
export function generate{Tool}Config(): string { /* tool config content */ }

// Main setup - called by pack's setup()
export function setup{Lang}Tooling(cwd: string): SetupResult {
  // 1. Read existing manifest (or create minimal one)
  // 2. Append tool configs without clobbering existing content
  // 3. Return { files: [] } if language needs no config (Go)
  return { files: ['modified-file'] };
}
```

## Architecture Validation (Optional)

If the language ecosystem has import/layer enforcement tools:

| Language | Tool | Config Location |
|----------|------|-----------------|
| Python | import-linter | `[tool.importlinter]` in pyproject.toml |
| TypeScript | eslint-boundaries | eslint.config.mjs |
| Go | depguard | .golangci.yml |

Pattern: Detect layer directories (domain, services, api, etc.), generate contracts if 2+ layers found.

## Framework Detection (Optional)

Languages with frameworks may need framework-specific configs:

```typescript
// In utils/{lang}-setup.ts or detect.ts
export function detect{Lang}Framework(cwd: string): 'django' | 'flask' | 'fastapi' | null {
  const deps = readManifestDependencies(cwd);
  if (deps.includes('django')) return 'django';
  // ...
}
```

TypeScript does this at **lint time** via `safeword.detect()` in eslint.config.mjs. Python does it at **setup time**.

## Additional Test Files

Beyond golden-path and tooling-validation, add:

**File Naming Convention:** Create language-specific test files rather than adding to existing generic files:
- `mixed-project-{lang}.test.ts` (not adding to `mixed-project.test.ts`)
- `add-language-{lang}.test.ts` (not adding to `add-language.test.ts`)
- `setup-{lang}.test.ts` (not adding to `setup.test.ts`)

This keeps test files focused and makes it easy to run language-specific tests.

### Unit Tests (`tests/utils/{lang}-setup.test.ts`)

```typescript
describe('Package Manager Detection', () => {
  it('detects {pm} from lockfile', () => {...});
  it('defaults to {default-pm}', () => {...});
});

describe('{Tool} Dependency Detection', () => {
  it('returns false when manifest missing', () => {...});
  it('detects {tool} in dependencies array', () => {...});
  it('does NOT match config section', () => {...}); // Avoid false positives
});
```

### Conditional Setup Tests (`tests/commands/setup-{lang}.test.ts`)

```typescript
describe('Conditional Setup for {Lang} Projects', () => {
  it('skips JS tooling for {lang}-only projects', () => {...});
  it('does NOT create package.json for pure {lang}', () => {...});
  it('shows {lang}-appropriate next steps', () => {...});
  it('still creates .safeword directory', () => {...});
  it('installs both toolchains for polyglot projects', () => {...});
});
```

### Mixed Project Test (`tests/integration/mixed-project.test.ts`)

Verify polyglot projects work correctly:

```typescript
describe('E2E: Mixed Project (TypeScript + {Lang})', () => {
  it('detects and installs both language packs', () => {...});
  it('ESLint runs on TypeScript files', () => {...});
  it('{tool} config added to {manifest}', () => {...});
  it('lint hook routes .ts to ESLint', () => {...});
  it.skipIf(!TOOL_AVAILABLE)('lint hook routes .{ext} to {tool}', () => {...});
});
```

### Add Language Test (`tests/integration/add-language.test.ts`)

Verify upgrade path when adding a language to existing project:

```typescript
describe('E2E: Add {Lang} to Existing Project', () => {
  beforeAll(/* setup with TypeScript only */);

  it('starts with only TypeScript pack installed', () => {...});

  describe('after adding {manifest} and running upgrade', () => {
    beforeAll(/* add {manifest}, run upgrade */);

    it('installs {lang} pack', () => {...});
    it('adds {tool} config', () => {...});
    it.skipIf(!TOOL_AVAILABLE)('{tool} works on {lang} files', () => {...});
    it('ESLint still works on TypeScript files', () => {...});
  });
});
```

## Parity Checklist

Before shipping a new language pack, verify:

**Core Integration:**
- [ ] `detect()` returns true for lang-only projects
- [ ] `setup()` creates valid tool config
- [ ] Hook lints files with correct extension
- [ ] Hook skips gracefully if tools not installed

**Testing (6 test areas):**
- [ ] Golden path: config created, tool runs, violations detected, formatting works, hook works
- [ ] Tooling validation: type checker catches errors (if applicable)
- [ ] Unit tests: detection functions, dependency checks
- [ ] Conditional setup: pure {lang} skips irrelevant tooling
- [ ] Mixed project: both languages work together, hook routes correctly
- [ ] Add language: upgrade path installs pack when manifest added

**Test Helpers:**
- [ ] `is{Tool}Installed()` for each tool
- [ ] `create{Lang}Project(dir, options?)` with package manager variants
- [ ] `run{Linter}(dir, file)` for linter execution (if applicable)

**Project Types:**
- [ ] Pure {lang} project (no package.json) works end-to-end
- [ ] Mixed project (JS + {lang}) works correctly
- [ ] Existing tool configs are preserved (not clobbered)

**Optional Integrations:**
- [ ] Package manager detection (if language has multiple)
- [ ] Auto-install dependencies (if package manager supports dev deps)
- [ ] Type checking config (if separate type checker exists)
- [ ] Existing tooling detection (if ecosystem has established tools)
- [ ] Architecture/layer detection (if import enforcement tools exist)

**Research Before Implementation:**
- [ ] Verify linter default preset (what's enabled out-of-the-box)
- [ ] Test violation detection manually (don't assume what gets caught)
- [ ] Check config format version (e.g., golangci-lint v1 vs v2 syntax)
- [ ] Confirm formatter integration (separate tool or linter flag?)
