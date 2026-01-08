# Bun Migration Plan

## Current State

| Component       | Current           | Target   |
| --------------- | ----------------- | -------- |
| Package Manager | npm               | bun      |
| Test Framework  | Vitest 2.0.0      | bun:test |
| Runtime         | Node.js           | Bun      |
| Lockfile        | package-lock.json | bun.lock |

### Packages

- `packages/cli` - Main CLI tool
- `packages/eslint-plugin` - ESLint rules

---

## Phase 1: Package Manager Migration

### 1.1 Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 1.2 Generate bun.lock

```bash
rm -rf node_modules package-lock.json
bun install
```

### 1.3 Update CI/CD

- Replace `npm ci` with `bun install --frozen-lockfile`
- Replace `npm run` with `bun run`

### 1.4 Update package.json Scripts

No changes needed - `bun run` executes npm scripts.

---

## Phase 2: Test Framework Migration (Vitest → bun:test)

### 2.1 Update Imports

**Before:**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
```

**After:**

```typescript
import { describe, expect, it, vi, beforeEach } from 'bun:test';
```

### 2.2 Files to Update

```text
packages/cli/
├── tests/**/*.test.ts
├── src/**/*.test.ts
└── vitest.config.ts (delete)

packages/eslint-plugin/
├── tests/**/*.test.ts
└── vitest.config.ts (delete if exists)
```

### 2.3 Update Test Scripts

**packages/cli/package.json:**

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

**packages/eslint-plugin/package.json:**

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch"
  }
}
```

### 2.4 Configuration Migration

**Delete:** `vitest.config.ts`

**Create:** `bunfig.toml` (if needed)

```toml
[test]
timeout = 60000
preload = ["./tests/setup.ts"]  # if you have setup files
```

### 2.5 Remove Vitest Dependencies

```bash
bun remove vitest @vitest/coverage-v8
```

### 2.6 Add Bun Types

```bash
bun add -d @types/bun
```

---

## Phase 3: TypeScript Configuration

### 3.1 Update tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "types": ["bun-types"]
  }
}
```

---

## Phase 4: API Compatibility Check

### Known Compatible

- File system operations (fs/promises)
- Path operations
- Child process spawning
- ESLint (pure JS)

### Verify Before Migration

- [ ] `execa` - subprocess handling
- [ ] `chalk` - terminal colors
- [ ] `commander` - CLI parsing
- [ ] Any native modules

---

## Phase 5: Validation

### 5.1 Run Tests

```bash
bun test
```

### 5.2 Run CLI

```bash
bun run packages/cli/src/index.ts --help
```

### 5.3 Build Check

```bash
bun run build
```

### 5.4 Integration Tests

```bash
bun test tests/integration/
```

---

## Migration Checklist

### Phase 1: Package Manager

- [ ] Install Bun locally
- [ ] Delete node_modules and package-lock.json
- [ ] Run `bun install`
- [ ] Verify all scripts work with `bun run`
- [ ] Update CI workflows

### Phase 2: Testing

- [ ] Update test imports in `packages/cli`
- [ ] Update test imports in `packages/eslint-plugin`
- [ ] Update test scripts in package.json files
- [ ] Delete vitest.config.ts files
- [ ] Remove vitest dependencies
- [ ] Add @types/bun
- [ ] Run full test suite

### Phase 3: TypeScript

- [ ] Update tsconfig.json
- [ ] Verify type checking passes

### Phase 4: Validation

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] CLI runs correctly
- [ ] Build succeeds

### Phase 5: Cleanup

- [ ] Remove any npm-specific configs
- [ ] Update README with bun instructions
- [ ] Update CONTRIBUTING.md

---

## Rollback Plan

If issues arise:

```bash
rm -rf node_modules bun.lock
npm install
# Revert import changes via git
git checkout -- .
```

---

## Expected Benefits

| Metric       | Before (npm/Vitest) | After (Bun) | Improvement |
| ------------ | ------------------- | ----------- | ----------- |
| Install time | ~15s                | ~1-2s       | 10-15x      |
| Test startup | ~2s                 | ~200ms      | 10x         |
| Cold start   | ~500ms              | ~50ms       | 10x         |

---

## References

- [Bun Documentation](https://bun.sh/docs)
- [Bun Test Runner](https://bun.sh/docs/test)
- [Migrating from Vitest](https://bun.sh/docs/guides/test/migrate-from-jest)
