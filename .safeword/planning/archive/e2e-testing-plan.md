# E2E Testing Plan

## Problem

Current tests verify files are created but don't verify they **work**:

- ESLint config exists but never runs
- Hook scripts exist but never execute
- Pre-commit hook created but never triggers

## Approach: Single Golden Path Test

Instead of many small E2E tests, create **one comprehensive test** that:

1. Sets up a project once (expensive: npm install ~10s)
2. Verifies all critical paths sequentially
3. Runs in CI and locally

This avoids:

- Test bloat (2300+ lines already exist)
- Slow execution from repeated setups
- Over-testing things integration tests cover

## Test File

````text
tests/e2e/golden-path.test.ts  (~80 lines)
```text

## Test Sequence

```typescript
describe('E2E: Golden Path', () => {
  let projectDir: string;

  beforeAll(async () => {
    // Setup ONCE - expensive operation
    projectDir = createTempDir();
    createTypeScriptPackageJson(projectDir);
    initGitRepo(projectDir);
    await runCli(['setup', '--yes'], { cwd: projectDir });
  }, 120000); // 2 min timeout for npm install

  afterAll(() => removeTempDir(projectDir));

  // 1. ESLint config is valid and runs
  it('eslint config runs without errors', () => {
    writeTestFile(projectDir, 'src/test.ts', 'export const x = 1;\n');
    execSync('npx eslint src/test.ts', { cwd: projectDir });
  });

  // 2. ESLint detects real issues
  it('eslint catches violations', () => {
    writeTestFile(projectDir, 'src/bad.ts', 'var x = 1\nconsole.log(x)\n');
    expect(() => execSync('npx eslint src/bad.ts', { cwd: projectDir })).toThrow(); // Should fail on issues
  });

  // 3. PostToolUse hook works
  it('post-tool-lint hook fixes files', () => {
    const file = join(projectDir, 'src/fixme.ts');
    writeTestFile(projectDir, 'src/fixme.ts', 'const x=1');

    const input = JSON.stringify({ tool_input: { file_path: file } });
    execSync(`echo '${input}' | bash .safeword/hooks/post-tool-lint.sh`, {
      cwd: projectDir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });

    const fixed = readTestFile(projectDir, 'src/fixme.ts');
    expect(fixed).toContain('const x = 1'); // Prettier formatted
  });

  // 4. Stop hook returns valid JSON
  it('stop-quality hook returns valid JSON', () => {
    writeTestFile(projectDir, 'src/change.ts', 'export const y = 2;\n');
    execSync('git add src/change.ts', { cwd: projectDir });

    const output = execSync('bash .safeword/hooks/stop-quality.sh', {
      cwd: projectDir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    }).toString();

    const json = JSON.parse(output);
    expect(json.message).toContain('/review');
  });

  // 5. Pre-commit hook runs lint-staged
  it('git commit triggers lint-staged', () => {
    writeTestFile(projectDir, 'src/commit.ts', 'export const z = 3;\n');
    execSync('git add .', { cwd: projectDir });
    execSync('git commit -m "test"', { cwd: projectDir });
    // If we get here, pre-commit passed
  });
});
```text

## Key Design Decisions

1. **Single `beforeAll`** - Setup once, test many things
2. **Sequential execution** - Tests share project state intentionally
3. **Real tools** - Uses actual eslint, prettier, git (not mocks)
4. **Failure tolerance** - If npm install fails, skip E2E (CI might not have deps)

## Vitest Configuration

```typescript
// vitest.config.ts - add e2e-specific config
export default defineConfig({
  test: {
    // Existing config...

    // E2E tests need longer timeout
    testTimeout: 30000,

    // E2E tests run sequentially (they share state)
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
```text

Already configured correctly.

## CI Integration

```yaml
# In GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
  if: success() # Only if unit tests pass
```text

Optional: Add `test:e2e` script:

```json
{
  "scripts": {
    "test:e2e": "vitest run tests/e2e/"
  }
}
```text

## What This Tests

| Component                      | Verified |
| ------------------------------ | -------- |
| ESLint config syntax           | ✓        |
| ESLint catches issues          | ✓        |
| PostToolUse hook JSON parsing  | ✓        |
| PostToolUse hook file fixing   | ✓        |
| Stop hook JSON output          | ✓        |
| Stop hook git status detection | ✓        |
| Husky pre-commit hook          | ✓        |
| lint-staged execution          | ✓        |

## What This Does NOT Test

- Claude Code itself (requires manual testing)
- MCP servers (separate integration)
- All hook edge cases (covered by unit tests)
- All ESLint plugin combinations (covered by config tests)

## Files to Create

1. `tests/e2e/golden-path.test.ts` - The test file (~80 lines)
2. Update `package.json` - Add `test:e2e` script (optional)

## Estimated Effort

- Implementation: 30 minutes
- Test execution time: ~20-30 seconds (one npm install)
````
