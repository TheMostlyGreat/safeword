# Feature Spec: Language Packs

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Modular language support with bundled language packs

**Status**: Draft

---

## Context

Current safeword has Python and TypeScript/JavaScript support hardcoded. As more languages are added (Go, Rust, etc.), this becomes unwieldy. Language packs modularize this:

- Each language has its own "pack" with config generators
- Packs are bundled in safeword core (not separate npm packages)
- Detection happens at setup/check/upgrade
- Hooks verify pack is installed before linting

**Blueprint**: Existing Python support (`python-setup.ts`, `toml.ts`) and TS/JS support are the reference implementations.

---

## Technical Constraints

### Pack Contents (config generation only)

Each language pack provides:

- **Detection function**: Is this language present? (e.g., `pyproject.toml` exists)
- **Config generators**: Generate linter/formatter config (e.g., `generateRuffConfig()`)
- **Setup function**: Install config files during setup
- **File extensions**: Which extensions this pack handles (e.g., `.py`, `.pyi`)
- **Audit commands**: Dead code detection + outdated deps check (see Audit Parity below)

NOT included (handled by core):

- Hook execution logic
- CLI commands
- Templates/guides

### Audit Parity Requirement

**Every language pack MUST provide equivalent `/audit` capabilities:**

| Capability    | TypeScript/JS  | Python                  | Go                     |
| ------------- | -------------- | ----------------------- | ---------------------- |
| Architecture  | depcruise      | Runtime + import-linter | Compiler (built-in)    |
| Dead code     | knip           | deadcode                | golangci-lint --unused |
| Duplication   | jscpd (shared) | jscpd (shared)          | jscpd (shared)         |
| Outdated deps | bun outdated   | poetry/pip outdated     | go list -m -u all      |

**Architecture checking notes:**

- **TypeScript/JS**: depcruise detects circular deps + enforces layer rules
- **Python**: Circular imports cause ImportError at runtime; for static analysis use import-linter
- **Go**: Compiler enforces no circular imports at build time (free!)

When adding a new language pack:

1. Identify architecture/circular dep tool for that language
2. Identify dead code tool for that language
3. Identify outdated deps tool for that language
4. Add conditional commands to `/audit` command template
5. Update audit report format

### Pack Registry

```typescript
interface LanguagePack {
  id: string; // e.g., 'python', 'typescript'
  name: string; // e.g., 'Python', 'TypeScript'
  extensions: string[]; // e.g., ['.py', '.pyi']
  detect: (cwd: string) => boolean; // Is this language present?
  setup: (cwd: string, ctx: PackContext) => PackSetupResult;
}

// Bundled packs registry
const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  python: pythonPack,
  typescript: typescriptPack,
  // future: go, rust, etc.
};
```

### Local Tracking

Installed packs tracked in `.safeword/config.json`:

```json
{
  "version": "0.14.2",
  "installedPacks": ["python", "typescript"]
}
```

### Detection Flow

**During `safeword setup`:**

1. Scan project for language markers (package.json, pyproject.toml, go.mod, etc.)
2. For each detected language, run pack's `setup()` function
3. Record installed packs in `.safeword/config.json`

**During `safeword check`:**

1. Re-detect languages
2. Warn if new language detected but pack not installed
3. Suggest: "Run `safeword upgrade` to add Python support"

**During `safeword upgrade`:**

1. Re-detect languages
2. Install any new packs
3. Update existing pack configs if pack version changed

### Hook Integration

**Before linting in hook:**

```typescript
// In post-tool-lint hook
const extension = path.extname(changedFile);
const pack = findPackForExtension(extension);

if (pack && !isPackInstalled(pack.id)) {
  // Block and install
  await installPack(pack.id, cwd);
}

// Now run lint command for this file type
```

**Blocking install** means:

- Hook pauses
- Pack's `setup()` runs
- Config files created
- Then linting proceeds

---

## Story 1: Define Language Pack Interface

**As a** safeword maintainer
**I want** a clear interface for language packs
**So that** adding new languages is consistent

**Acceptance Criteria**:

- [ ] Define `LanguagePack` interface in `src/packs/types.ts`
- [ ] Interface includes: id, name, extensions, detect(), setup()
- [ ] Create pack registry in `src/packs/registry.ts`
- [ ] Export helper: `findPackForExtension(ext)`
- [ ] Export helper: `detectLanguages(cwd)` returns pack IDs

---

## Story 2: Refactor Python Support to Pack

**As a** developer
**I want** Python support as a language pack
**So that** it follows the modular pattern

**Acceptance Criteria**:

- [ ] Create `src/packs/python.ts` implementing `LanguagePack`
- [ ] Move detection from `project-detector.ts` to pack
- [ ] Move config generation from `toml.ts` to pack
- [ ] Move setup from `python-setup.ts` to pack's `setup()`
- [ ] Register in pack registry
- [ ] Existing tests still pass

---

## Story 3: Refactor TypeScript/JS Support to Pack

**As a** developer
**I want** TS/JS support as a language pack
**So that** it follows the modular pattern

**Acceptance Criteria**:

- [ ] Create `src/packs/typescript.ts` implementing `LanguagePack`
- [ ] Move detection logic to pack
- [ ] Move ESLint config generation to pack
- [ ] Register in pack registry
- [ ] Existing tests still pass

---

## Story 4: Track Installed Packs

**As a** developer
**I want** installed packs tracked in config
**So that** hooks know what's available

**Acceptance Criteria**:

- [ ] Add `installedPacks` to `.safeword/config.json` schema
- [ ] Update setup to write installed pack IDs
- [ ] Add `isPackInstalled(packId)` helper
- [ ] Add `getInstalledPacks()` helper

---

## Story 5: Hook Pack Verification

**As a** developer using Claude
**I want** hooks to verify pack is installed
**So that** linting works for any file type

**Acceptance Criteria**:

- [ ] Before linting, hook checks file extension
- [ ] Finds appropriate pack via `findPackForExtension()`
- [ ] If pack not installed, runs pack's `setup()` (blocking)
- [ ] Updates config.json with newly installed pack
- [ ] Then proceeds with linting

---

## Story 6: Check Command Pack Detection

**As a** developer
**I want** `safeword check` to detect missing packs
**So that** I know when to upgrade

**Acceptance Criteria**:

- [ ] Check command re-runs language detection
- [ ] Compares detected vs installed packs
- [ ] Warns: "Detected Python files but Python pack not installed"
- [ ] Suggests: "Run `safeword upgrade` to add support"

---

## Story 7: Upgrade Command Pack Installation

**As a** developer
**I want** `safeword upgrade` to install new packs
**So that** new languages are automatically supported

**Acceptance Criteria**:

- [ ] Upgrade re-runs language detection
- [ ] Installs any missing packs
- [ ] Updates pack configs if pack version changed
- [ ] Reports: "Installed Python pack"

---

## Summary

| Story | Description               | Complexity |
| ----- | ------------------------- | ---------- |
| 1     | Define pack interface     | Low        |
| 2     | Refactor Python to pack   | Medium     |
| 3     | Refactor TS/JS to pack    | Medium     |
| 4     | Track installed packs     | Low        |
| 5     | Hook pack verification    | Medium     |
| 6     | Check command detection   | Low        |
| 7     | Upgrade pack installation | Low        |

**Implementation order**: 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Open Questions

- [ ] Should we support user-defined packs in future? (probably not initially)
