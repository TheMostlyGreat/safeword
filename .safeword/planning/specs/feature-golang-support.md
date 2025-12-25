# Feature Spec: Golang Support

**Guide**: `.safeword/guides/planning-guide.md`
**Template**: `.safeword/templates/feature-spec-template.md`

**Feature**: Enable safeword to work with Go projects using golangci-lint

**Status**: ❌ Not Started (0/4 stories complete)

---

## Context

Safeword's core value propositions:
1. **Philosophy/guides** (language-agnostic) - already works for Go
2. **Claude hooks** (mostly language-agnostic) - already works except lint hook
3. **Linting infrastructure** (JS/TS-specific) - needs Go support

Since Claude Code runs on Node.js, the Node dependency is not a concern - users already have it.

Go has excellent built-in tooling (`go fmt`, `go vet`) plus the meta-linter `golangci-lint` which is the de facto standard.

## Technical Constraints

### Compatibility

- [ ] Support go.mod (Go modules - standard since Go 1.11)
- [ ] Support mixed JS/Go projects (polyglot)

### Dependencies

- [ ] golangci-lint for linting (runs 100+ linters)
- [ ] gofmt/goimports for formatting (built-in, always available)
- [ ] go vet for static analysis (built-in, always available)
- [ ] No new npm dependencies for Go detection

### golangci-lint Configuration (Phase 2 reference)

```yaml
# .golangci.yml - recommended for LLM-assisted development
linters:
  enable:
    - errcheck      # unchecked errors (matches @eslint/js)
    - ineffassign   # unused assignments (matches no-unused-vars)
    - staticcheck   # comprehensive static analysis (matches sonarjs)
    - gosimple      # simplifications (matches unicorn)
    - gocritic      # opinionated checks (matches sonarjs)
    - gosec         # security (matches eslint-plugin-security)
    - goimports     # import formatting (matches import-x)
    - misspell      # spelling (catches LLM errors)
    - gocyclo       # complexity (matches max-complexity)

linters-settings:
  gocyclo:
    min-complexity: 10
```

### Design

- [ ] Config generation deferred to Phase 2 (users bring their own .golangci.yml initially)
- [ ] Reuse existing reconcile/schema patterns

### Architecture Note

Extends the `Languages` interface with `golang: boolean`. Detection follows the same pattern as Python: check for marker file (`go.mod`).

---

## Story 1: Detect Go Projects

**As a** developer with a Go project
**I want** safeword to recognize my project as Go
**So that** it can apply appropriate tooling

**Acceptance Criteria**:

- [ ] Detect go.mod as Go project
- [ ] Add `golang: boolean` to Languages interface
- [ ] Work without package.json (Go-only projects)

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/src/utils/project-detector.test.ts`

**Files**:
- `packages/cli/src/utils/project-detector.ts`

**Notes**: Framework detection (gin/echo/fiber/chi) and go.work support deferred to Phase 2 - Go frameworks don't require different linting configs.

---

## Story 2: Go-Aware Lint Hook

**As a** developer editing Go files with Claude
**I want** the lint hook to run golangci-lint on my .go files
**So that** code quality is maintained automatically

**Acceptance Criteria**:

- [ ] Detect .go file extension in lint hook
- [ ] Run `gofmt -w` for formatting (always available)
- [ ] Run `golangci-lint run --fix` if installed
- [ ] Continue running ESLint for .js/.ts files (polyglot support)
- [ ] Skip golangci-lint gracefully if not installed
- [ ] Skip ESLint gracefully if not installed (Go-only projects)

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/tests/integration/hooks.test.ts`

**Files**:
- `packages/cli/templates/hooks/lib/lint.ts`
- `packages/cli/templates/hooks/post-tool-lint.ts`

**Notes**: gofmt is always available in a Go environment. golangci-lint requires installation but provides comprehensive linting.

---

## Story 3: Conditional Setup for Go Projects

**As a** developer running `safeword setup` in a Go-only project
**I want** setup to skip ESLint installation
**So that** I don't get unnecessary JS tooling

**Acceptance Criteria**:

- [ ] Skip ESLint/Prettier install for Go-only projects
- [ ] Skip package.json creation for Go-only projects
- [ ] Show Go-appropriate next steps (e.g., "go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest")
- [ ] Still create .safeword directory with guides/templates
- [ ] Still create Claude hooks

**Implementation Status**: ❌ Not Started
**Tests**: `packages/cli/tests/commands/setup-golang.test.ts`

**Files**:
- `packages/cli/src/commands/setup.ts`
- `packages/cli/src/utils/install.ts`

---

## Story 4: Lint Command for Go

**As a** developer using Claude Code
**I want** the `/lint` command to work for Go
**So that** I can manually trigger full linting

**Acceptance Criteria**:

- [ ] `/lint` detects Go project
- [ ] Runs `gofmt -w .` for formatting
- [ ] Runs `go vet ./...` for static analysis
- [ ] Runs `golangci-lint run` if installed
- [ ] Falls back to ESLint/tsc for JS/TS projects

**Implementation Status**: ❌ Not Started
**Tests**: Manual testing

**Files**:
- `packages/cli/templates/commands/lint.md` (update command template)

---

## Summary

**Completed**: 0/4 stories (0%)
**Remaining**: 4/4 stories (100%)

### Phase 1: MVP (Stories 1-4)

- Story 1: Go detection
- Story 2: Lint hook with golangci-lint
- Story 3: Conditional setup
- Story 4: Lint command

### Phase 2: Tooling Parity (Out of Scope)

- Config generation (create .golangci.yml with recommended settings)
- Go workspace support (go.work)
- Framework detection (gin, echo, fiber, chi)
- go-cleanarch integration (architecture validation, replaces dependency-cruiser)
- deadcode/unused integration (dead code detection, replaces Knip)

### Phase 3: Rule Optimization (Out of Scope)

- Analyze which golangci-lint linters catch the most LLM-generated issues
- Remove linters with high false-positive rates
- Add new linters as golangci-lint evolves
- Tune severity levels based on real-world usage
- Cross-pollinate insights between ESLint, Ruff, and golangci-lint

**Next Steps**: Implement Story 1 (Go detection)
