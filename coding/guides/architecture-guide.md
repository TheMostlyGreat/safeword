# Architecture & Design Documentation Guide

**Important:** Architecture and design docs are instructions that LLMs read and follow. Apply LLM instruction design best practices for clarity and reliability.

**See:** `@.safeword/guides/llm-instruction-design.md` for comprehensive framework on writing LLM-consumable documentation.

---

## When to Use Each Document Type

### Architecture Document

**Use when**: Documenting project-wide architecture decisions, data models, and system design

**Characteristics**:
- One per project or package (in monorepos)
- Living document (updated as architecture evolves)
- Comprehensive (principles, decisions, data model, components)
- Documents WHY behind all major decisions
- Includes version, status, table of contents

**Location**: Project root (`ARCHITECTURE.md`, `DATA_MODEL_AND_ARCHITECTURE.md`)

### Design Doc

**Use when**: Designing a specific feature implementation

**Characteristics**:
- Feature-focused (2-3 pages, ~121 lines)
- Implementation details (components, data flow, user flow)
- References architecture doc for broader decisions
- Key technical decisions with rationale

**Location**: Project planning directory (`planning/design/`, `docs/design/`)

### Quick Decision Matrix

| Question | Architecture Doc | Design Doc |
|----------|------------------|------------|
| Choosing between technologies? | ✅ | - |
| Data model design? | ✅ | References it |
| Designing a new feature? | - | ✅ |
| Recording a trade-off? | ✅ | ✅ (brief) |
| Project-wide principles? | ✅ | - |
| Component breakdown? | - | ✅ |

---

## Architecture Document Best Practices

### 1. One Architecture Doc Per Project/Package

**✅ GOOD - Single comprehensive document:**
```
project/
├── ARCHITECTURE.md
└── docs/design/
    ├── three-pane-layout.md
    └── auth-system.md
```

**❌ BAD - Multiple scattered ADRs:**
```
project/docs/adr/
├── 001-use-typescript.md
├── 002-adopt-monorepo.md
└── ... (50+ files)
```
**Why bad**: Context fragmentation, hard to understand full architecture

**Monorepos**: Each package has its own `ARCHITECTURE.md`

---

### 2. Required Sections

- **Header**: Version, Last Updated, Status (Production/Design/Proposed)
- **Table of Contents**: Section links
- **Overview**: Technology choices, data model philosophy, high-level architecture
- **Data Architecture Principles**: What, Why, Trade-off for each principle
- **Data Model / Schema**: Tables, types, relationships
- **Component Design**: Major components and responsibilities
- **Data Flow Patterns**: How data moves through the system
- **Key Decisions**: What, Why, Trade-off, Alternatives Considered
- **Best Practices**: Domain-specific patterns
- **Migration Strategy**: How to evolve architecture

---

### 3. Living Document (Not Immutable)

Update in place, don't create new documents for changes.

```markdown
### Decision: State Management
**Status**: Active (Updated 2025-01-20)
**What**: Migrated from localStorage to IndexedDB
**Why**: Hit 5MB limit, needed unlimited storage
**Migration**: Completed 2025-01-20, users auto-migrated on load
```

---

### 4. Document WHY, Not Just WHAT

**✅ GOOD - Clear rationale with specifics:**
```markdown
### Principle: Separation of Concerns

**What**:
- Static data (config, rules) → [immutable storage]
- Mutable application state → [persistent storage]
- Reactive UI state → [state management]

**Why**:
- Static data doesn't need per-instance storage (saves NKB per instance)
- Updates to static data affect all instances instantly
- Type safety: Types derived from static data schema

**Trade-off**:
- More complex loading (fetch static + query persistent)
- Nms initial load time vs instant
```

**❌ BAD**: Just listing tech stack without rationale

---

### 5. Include Examples from Codebase

Reference actual implementations with file paths:

```markdown
**Implementation**: See `[module]/[file].[ext]:[line-start]-[line-end]`
```

---

### 6. Version and Track Status

```markdown
**Version**: 2.0
**Status**: Production (v1) + Proposed Extensions (v2+)

## Current Schema (v1 - Production)
[What's live now]

## Proposed Schema (v2 - Character Creation)
[What we're building next]
```

---

## Design Doc Best Practices

**Key points**:
- Feature-focused, ~121 lines
- Reference architecture doc (don't duplicate)
- Include user flow step-by-step
- Show component interactions
- Map to test definitions

**See:** `@.safeword/guides/design-doc-guide.md` for detailed guidance

---

## Integration with TDD Workflow

**Workflow Order**:
1. User Stories → What we're building
2. Test Definitions → How we'll verify
3. Design Doc → How we'll build it
4. Check Architecture Doc → Does this fit our principles?
5. Implement (RED → GREEN → REFACTOR)
6. Update Architecture Doc if needed → Record new patterns

**Update Architecture Doc when**:
- Adding new data model concepts
- Making technology choices
- Establishing new patterns/conventions
- Discovering architectural insights

**Don't update when**: Implementing single feature (use Design Doc), fixing bugs, refactoring without architectural changes

---

## Common Mistakes

**Architecture Docs**:
❌ Too many separate files (ADR-001, ADR-002...) → Use one comprehensive document
❌ No decision rationale → Every decision needs "WHY" with specifics
❌ Missing version/status → Readers need current vs proposed
❌ Implementation details instead of principles → Keep high-level

**Design Docs**:
❌ Repeating architecture content → Reference, don't duplicate
❌ Skipping user flow → Always show step-by-step interaction
❌ Missing test mapping → Link to test definitions

---

## File Organization

```
project/
├── ARCHITECTURE.md              # Single comprehensive doc
├── planning/
│   ├── user-stories/
│   ├── test-definitions/
│   └── design/                  # Feature-specific design docs
└── src/
```

**Complex projects** may have multiple architecture docs for major subsystems (e.g., `CHARACTER_CREATION_ARCHITECTURE.md`, `TEST_ARCHITECTURE.md`)

---

## Data Architecture Documentation

**For data-heavy projects**, see `@.safeword/guides/data-architecture-guide.md` for comprehensive guidance on:
- When to document data architecture (vs design docs)
- Core principles (data quality, governance, accessibility, living documentation)
- What to document (conceptual/logical/physical models, flows, policies)
- Documentation structure with complete examples
- Integration with TDD workflow

**Key principle**: Single comprehensive document with version tracking, clear principles, decision rationale, and migration strategy is better than many scattered ADR files.

---

## Key Takeaway

**One comprehensive architecture document per project/package** is better than **many scattered ADR files**:

✅ Full context in one place, easier to understand holistically
✅ Living document (update in place), searchable and scannable
✅ LLMs can consume entire architecture at once
