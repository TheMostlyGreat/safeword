# Backlog

Feature requests and planned improvements.

## Planned

### Knip Framework Plugin Integration

**Priority:** Medium

Extend knip configuration to automatically include relevant plugins based on the frameworks being installed. When a user installs a language pack (e.g., typescript, python, golang), detect their project's frameworks and enable corresponding knip plugins.

**Context:** Knip has 126+ plugins for frameworks like Next.js, Remix, Vitest, Jest, etc. Currently we use a static knip.json. This should be dynamic based on detected dependencies.

**Acceptance criteria:**

- Detect frameworks from package.json/requirements.txt/go.mod
- Generate knip config with appropriate plugins enabled
- Consider adding to `safeword init` or as separate `safeword knip` command

---

### Drift Detection for Documentation Files

**Priority:** Medium

Extend the drift detection system to cover documentation and agent configuration files beyond just code files.

**Files to track:**

- `docs/**/*.md` - Documentation files
- `AGENTS.md` - Root agent instructions
- `.claude/**/*` - Claude Code configuration
- `.cursor/**/*` - Cursor configuration
- `README.md` - Project readme

**Acceptance criteria:**

- Drift command reports changes to these files
- Can diff between installed templates and current state
- Useful for auditing what customizations have been made

---

### Refactor Command

**Priority:** Low

Create a `safeword refactor` command that helps with common refactoring operations using the safeword-refactoring skill as a guide.

**Possible features:**

- Analyze code for refactoring opportunities (code smells)
- Suggest refactorings from the catalog (Rename, Extract Function, etc.)
- Generate characterization tests before refactoring
- Track refactoring in small steps with commits

**Acceptance criteria:**

- Command exists and provides useful refactoring guidance
- Integrates with existing test infrastructure
- Follows the "one change at a time" principle

---

### BDD State Management

**Priority:** Low

Add behavior-driven development (BDD) state management to track feature specifications and their implementation status.

**Possible features:**

- Parse Gherkin/feature files
- Track which scenarios are implemented vs pending
- Generate test scaffolds from feature specs
- Report coverage of BDD scenarios

**Acceptance criteria:**

- Can track BDD feature state across the project
- Integrates with existing test runners
- Provides clear reporting on feature implementation status

---

## Completed

_(Move completed items here with date)_
