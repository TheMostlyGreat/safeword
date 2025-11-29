# Implementation Snippets

**Parent:** [013-cli-self-contained-templates.md](./013-cli-self-contained-templates.md)
**Date:** 2025-11-29

Reference code snippets for implementing the CLI. Copy/adapt as needed.

---

## Template Reader (src/utils/templates.ts)

```typescript
import { readFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

export function getTemplate(relativePath: string): string {
  return readFileSync(join(TEMPLATES_DIR, relativePath), 'utf-8');
}

export function copyTemplateDir(src: string, dest: string): void {
  cpSync(join(TEMPLATES_DIR, src), dest, { recursive: true });
}
```

---

## Setup/Upgrade Usage

```typescript
import { getTemplate, copyTemplateDir } from '../utils/templates.js';

// Copy templates to .safeword/
writeFile(join(safewordDir, 'SAFEWORD.md'), getTemplate('safeword/SAFEWORD.md'));
copyTemplateDir('safeword/guides', join(safewordDir, 'guides'));
copyTemplateDir('safeword/doc-templates', join(safewordDir, 'doc-templates'));
copyTemplateDir('safeword/prompts', join(safewordDir, 'prompts'));
copyTemplateDir('safeword/hooks', join(safewordDir, 'hooks'));
copyTemplateDir('safeword/lib', join(safewordDir, 'lib'));
copyTemplateDir('safeword/git', join(safewordDir, 'git'));

// Copy templates to .claude/
copyTemplateDir('claude/commands', join(claudeDir, 'commands'));
copyTemplateDir('claude/skills', join(claudeDir, 'skills'));

// Create empty planning directories
ensureDir(join(safewordDir, 'planning', 'user-stories'));
ensureDir(join(safewordDir, 'planning', 'design'));
ensureDir(join(safewordDir, 'tickets', 'completed'));
ensureDir(join(safewordDir, 'learnings'));
```

---

## Merge settings.json

```typescript
import { SETTINGS_HOOKS } from '../config/hooks.js';

function mergeSettingsJson(claudeDir: string): void {
  const settingsPath = join(claudeDir, 'settings.json');
  let existing = existsSync(settingsPath)
    ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
    : {};

  const merged = {
    ...existing,
    hooks: mergeHooks(existing.hooks || {}, SETTINGS_HOOKS),
  };
  writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
}

function mergeHooks(existing: object, safeword: object): object {
  const result = { ...existing };
  for (const [event, hooks] of Object.entries(safeword)) {
    result[event] = [...(result[event] || []), ...hooks];
  }
  return result;
}
```

---

## Linting Setup (Preserve Existing)

```typescript
function setupLinting(projectDir: string): void {
  const eslintPath = join(projectDir, 'eslint.config.js');
  const prettierPath = join(projectDir, '.prettierrc');

  if (!existsSync(eslintPath) && !existsSync(join(projectDir, '.eslintrc.js'))) {
    writeFileSync(eslintPath, getEslintConfig(detectProjectType(projectDir)));
  }

  if (!existsSync(prettierPath) && !existsSync(join(projectDir, '.prettierrc.js'))) {
    writeFileSync(prettierPath, JSON.stringify({ semi: true, singleQuote: true }, null, 2));
  }

  addLintScriptsIfMissing(projectDir);
}
```

---

## Error Handling

```typescript
// src/utils/errors.ts
export class SafewordError extends Error {
  constructor(message: string, public fatal: boolean = true) {
    super(message);
    this.name = 'SafewordError';
  }
}

export function handleError(error: SafewordError, context: string): void {
  if (error.fatal) {
    console.error(`❌ Fatal: ${error.message}`);
    process.exit(1);
  } else {
    console.warn(`⚠️  Warning: ${error.message} (continuing...)`);
  }
}
```

---

## Rollback

```typescript
// src/utils/rollback.ts
export async function withRollback<T>(
  operation: () => Promise<T>,
  backup: () => Promise<void>,
  restore: () => Promise<void>
): Promise<T> {
  await backup();
  try {
    return await operation();
  } catch (error) {
    console.error('❌ Operation failed, rolling back...');
    await restore();
    throw error;
  }
}

// Usage
await withRollback(
  () => installSafeword(options),
  () => backupExisting('.safeword', '.claude'),
  () => restoreBackup('.safeword', '.claude')
);
```

Backup locations: `.safeword.backup/`, `.claude.backup/` (deleted on success)

---

## ESLint Plugin Installation

```typescript
// src/commands/init.ts
async function installEslintPlugins(detected: DetectedStack): Promise<void> {
  const plugins: string[] = ['@eslint/js'];

  if (detected.typescript) plugins.push('typescript-eslint');
  if (detected.react) plugins.push('eslint-plugin-react', 'eslint-plugin-react-hooks');
  if (detected.security) plugins.push('@microsoft/eslint-plugin-sdl');
  if (detected.playwright) plugins.push('eslint-plugin-playwright');
  if (detected.vitest) plugins.push('@vitest/eslint-plugin');
  if (detected.boundaries) plugins.push('eslint-plugin-boundaries');

  const pm = detectPackageManager();
  const installCmd = {
    npm: `npm install -D ${plugins.join(' ')}`,
    yarn: `yarn add -D ${plugins.join(' ')}`,
    pnpm: `pnpm add -D ${plugins.join(' ')}`,
    bun: `bun add -D ${plugins.join(' ')}`,
  }[pm];

  console.log(`📦 Installing ESLint plugins: ${plugins.join(', ')}`);
  execSync(installCmd, { stdio: 'inherit' });
}
```

---

## MCP Config Setup

```typescript
// src/commands/init.ts
async function setupMcpConfigs(): Promise<void> {
  const mcpPath = '.mcp.json';
  const samplePath = '.mcp.json.sample';

  let mcpConfig: { mcpServers: Record<string, unknown> } = { mcpServers: {} };
  try {
    const existing = await fs.readFile(mcpPath, 'utf-8');
    mcpConfig = JSON.parse(existing);
  } catch { /* file doesn't exist */ }

  // Auto-activate free servers (merge, don't overwrite)
  mcpConfig.mcpServers['context7'] ??= {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
  };
  mcpConfig.mcpServers['playwright'] ??= {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  };

  await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2));

  // Sample for API-key servers
  const sampleExists = await fs.access(samplePath).then(() => true).catch(() => false);
  if (!sampleExists) {
    const sample = {
      mcpServers: {
        arcade: {
          type: 'http',
          url: 'https://mcp.arcade.dev',
          headers: { Authorization: 'Bearer YOUR_ARCADE_API_KEY' },
        },
      },
    };
    await fs.writeFile(samplePath, JSON.stringify(sample, null, 2));
  }

  console.log('📡 MCP: Context7 ✓, Playwright ✓ (see .mcp.json.sample for Arcade)');
}
```

---

## MCP Cleanup (Reset)

```typescript
// src/commands/reset.ts
async function cleanupMcpConfig(): Promise<void> {
  const mcpPath = '.mcp.json';
  try {
    const content = await fs.readFile(mcpPath, 'utf-8');
    const config = JSON.parse(content);

    delete config.mcpServers?.['context7'];
    delete config.mcpServers?.['playwright'];

    if (Object.keys(config.mcpServers || {}).length === 0) {
      await fs.unlink(mcpPath);
    } else {
      await fs.writeFile(mcpPath, JSON.stringify(config, null, 2));
    }
  } catch { /* file doesn't exist */ }

  await fs.unlink('.mcp.json.sample').catch(() => {});
}
```

---

## Hook Output (hookSpecificOutput)

```bash
# .safeword/hooks/session-verify-agents.sh
#!/bin/bash
if [[ -f "AGENTS.md" ]]; then
  jq -n '{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "AGENTS.md verified"}}'
else
  jq -n '{"hookSpecificOutput": {"hookEventName": "SessionStart", "blockReason": "AGENTS.md not found - run safeword init"}}'
  exit 2
fi
```

```bash
# .safeword/hooks/prompt-timestamp.sh
#!/bin/bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq -n --arg ts "$TIMESTAMP" \
  '{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": ("Timestamp: " + $ts)}}'
```

```bash
# .safeword/hooks/post-tool-lint.sh
#!/bin/bash
LINT_OUTPUT=$(npm run lint 2>&1 || true)
if echo "$LINT_OUTPUT" | grep -q "error"; then
  jq -n '{"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "Lint errors found - please fix"}}'
else
  jq -n '{"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "Lint passed"}}'
fi
```

---

## Slash Command Templates

```typescript
// src/config/commands.ts
export const COMMANDS = {
  'arch-review.md': `---
description: Run architecture review on current changes
allowed-tools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"]
---

Review the architecture of the current changes against the project's architecture guide.
Focus on: layering violations, dependency direction, and interface contracts.
`,
  'quality-review.md': `---
description: Deep code quality review with web research
allowed-tools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"]
---

Perform a comprehensive quality review of the current changes.
Check for security issues, performance concerns, and best practice violations.
`,
};
```

---

## Testing Examples

### Unit Tests

```typescript
// tests/unit/detect.test.ts
describe('detectStack', () => {
  it('detects TypeScript from tsconfig.json', async () => {
    const result = await detectStack('/mock/project');
    expect(result.typescript).toBe(true);
  });

  it('detects boundaries architecture (3+ dirs)', async () => {
    const result = await detectStack('/mock/layered-project');
    expect(result.boundaries).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/init.test.ts
describe('safeword init', () => {
  const testDir = '/tmp/safeword-test-project';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates .safeword directory', async () => {
    execSync('npx safeword init', { cwd: testDir });
    const exists = await fs.access(path.join(testDir, '.safeword')).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
```

### LLM Evals (promptfoo)

```yaml
# promptfoo.yaml
providers:
  - id: anthropic:messages:claude-sonnet-4-20250514
    config:
      temperature: 0

tests:
  - description: "init creates correct structure for React + TS project"
    vars:
      project_type: "React + TypeScript"
    assert:
      - type: contains
        value: ".safeword/"
      - type: contains
        value: "eslint-plugin-react"
```
