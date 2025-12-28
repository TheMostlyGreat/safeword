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

## Integration Points (Checklist)

### 1. Pack File (`src/packs/{lang}.ts`)

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
- Python → `pyproject.toml`
- TypeScript/JS → `package.json`
- Go → `go.mod`
- Rust → `Cargo.toml`
- Java → `pom.xml` or `build.gradle`

### 2. Registry (`src/packs/registry.ts`)

```typescript
import { {lang}Pack } from './{lang}.js';

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

### 4. Test Helpers (`tests/helpers.ts`)

```typescript
// Tool availability check
export function is{Tool}Installed(): boolean {
  return isCommandAvailable('{tool}');
}

// Project scaffolding
export function create{Lang}Project(dir: string, options?: {...}): void {
  writeTestFile(dir, '{manifest}', '...');
}
```

### 5. Golden Path Test (`tests/integration/{lang}-golden-path.test.ts`)

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

### 6. Tooling Validation Test (`tests/integration/tooling-validation.test.ts`)

Add a suite if the language has type checking or framework-specific rules:

```typescript
describe('E2E: {Tool} Type Error Detection', () => {
  it.skipIf(!TOOL_AVAILABLE)('{tool} catches type errors', () => {...});
});
```

## Package Manager Detection (Optional)

Only needed if the language has multiple package managers (Python: pip/poetry/uv). Skip for languages with one PM (Go: `go mod`).

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

## Utils File Pattern (`src/utils/{lang}-setup.ts`)

Complex languages need a dedicated utils file:

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

**Project Types:**
- [ ] Pure {lang} project (no package.json) works end-to-end
- [ ] Mixed project (JS + {lang}) works correctly
- [ ] Existing tool configs are preserved (not clobbered)
