# Task: Consolidate "User Stories" → "Feature Specs" Naming

**Type:** Refactor

**Scope:** Rename `user-stories-template.md` → `feature-spec-template.md` and consolidate folder structure from `user-stories/` → `specs/` for consistency with TDD Enforcer skill terminology. **Templates only** - dogfooded copies (`.safeword/`, `.claude/`) will sync on next `safeword setup`.

**Out of Scope:**

- Changing the actual template content (format stays the same)
- Renaming `user-story-guide.md` (guide explains HOW to write, not what it's called)
- Changing promptfoo test logic (only updating string references)
- Migration tooling for existing user projects
- `test-definitions-feature.md` references to "user story" (methodology, not file name)
- **Dogfooded copies** (`.safeword/`, `.claude/`) - these sync automatically via `safeword setup`

---

## Complete File List

All 12 files that need modification (templates + project docs only):

| #   | File                                                            | Changes                                               |
| --- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `packages/cli/templates/doc-templates/user-stories-template.md` | Rename → `feature-spec-template.md` + content (L1, 4) |
| 2   | `packages/cli/src/schema.ts`                                    | Template paths (lines 155-156)                        |
| 3   | `packages/cli/templates/SAFEWORD.md`                            | Template table (line 71)                              |
| 4   | `packages/cli/templates/skills/safeword-tdd-enforcer/SKILL.md`  | Template ref (line 54)                                |
| 5   | `packages/cli/templates/doc-templates/task-spec-template.md`    | Template ref (line 151)                               |
| 6   | `packages/cli/templates/guides/tdd-best-practices.md`           | Template + folder refs (lines 15, 24)                 |
| 7   | `packages/cli/templates/guides/user-story-guide.md`             | Template + folder refs (lines 5, 11, 17, 245)         |
| 8   | `packages/cli/templates/doc-templates/design-doc-template.md`   | Label change (line 6)                                 |
| 9   | `packages/cli/templates/doc-templates/ticket-template.md`       | Text + folder refs (lines 53, 55)                     |
| 10  | `packages/cli/templates/guides/architecture-guide.md`           | Folder ref (line 280)                                 |
| 11  | `README.md`                                                     | Multiple refs (lines 57, 109, 140)                    |
| 12  | `promptfoo.yaml`                                                | Template + folder refs (lines 1221, 1437, 1827, 1836) |

**Note:** File 1 is a rename; files 2-12 are content edits only.

---

## Rationale

The TDD Enforcer skill introduced a tiered artifact system:

- L2: "Feature Spec" + Test Definitions
- L1: "Task Spec" with inline tests
- L0: "Task Spec" (minimal)

But the template is named `user-stories-template.md` and files go in `user-stories/`. This creates confusion:

1. Skill says "Feature Spec" but links to "user-stories-template"
2. SAFEWORD.md says specs go in `specs/` but also references `user-stories/`
3. LLM may not connect "Feature Spec" → "user-stories-template"

---

## Migration Phases

### Phase 1: Rename Template File

**File:** `packages/cli/templates/doc-templates/user-stories-template.md` → `feature-spec-template.md`

**Content updates inside renamed file:**

- Line 1: `# User Stories: [Feature Name]` → `# Feature Spec: [Feature Name]`
- Line 3: Keep guide reference (guide name unchanged)
- Line 4: `**Template**: ...user-stories-template.md` → `...feature-spec-template.md`

---

### Phase 2: Update Schema

**File:** `packages/cli/src/schema.ts`

| Line | Old                                                  | New                                                  |
| ---- | ---------------------------------------------------- | ---------------------------------------------------- |
| 155  | `'.safeword/templates/user-stories-template.md'`     | `'.safeword/templates/feature-spec-template.md'`     |
| 156  | `template: 'doc-templates/user-stories-template.md'` | `template: 'doc-templates/feature-spec-template.md'` |

---

### Phase 3: Update SAFEWORD.md

**File:** `packages/cli/templates/SAFEWORD.md`

| Line | Section         | Old                                                      | New                                                   |
| ---- | --------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| 71   | Templates table | `user-stories-template.md`                               | `feature-spec-template.md`                            |
| 71   | Trigger         | "User asks for user story OR planning new feature scope" | "Planning new feature scope OR creating feature spec" |

---

### Phase 4: Update TDD Skill

**File:** `packages/cli/templates/skills/safeword-tdd-enforcer/SKILL.md`

**Change (line 54):**

```diff
- L2 Feature: @./.safeword/templates/user-stories-template.md
+ L2 Feature: @./.safeword/templates/feature-spec-template.md
```

---

### Phase 5: Update Task Spec Template

**File:** `packages/cli/templates/doc-templates/task-spec-template.md`

**Change (line 151):**

```diff
-For L2 features, use: `@./.safeword/templates/user-stories-template.md`
+For L2 features, use: `@./.safeword/templates/feature-spec-template.md`
```

---

### Phase 6: Update TDD Best Practices Guide

**File:** `packages/cli/templates/guides/tdd-best-practices.md`

| Line | Old                                | New                         |
| ---- | ---------------------------------- | --------------------------- |
| 15   | `user-stories-template.md`         | `feature-spec-template.md`  |
| 15   | `.safeword/planning/user-stories/` | `.safeword/planning/specs/` |
| 24   | `user-stories-template.md`         | `feature-spec-template.md`  |

**Note:** Keep "User Stories" in explanatory text where it refers to the format/methodology, not the file.

---

### Phase 7: Update User Story Guide

**File:** `packages/cli/templates/guides/user-story-guide.md`

| Line | Old                                         | New                                          |
| ---- | ------------------------------------------- | -------------------------------------------- |
| 5    | `user-stories-template.md`                  | `feature-spec-template.md`                   |
| 11   | `user-stories-template.md`                  | `feature-spec-template.md`                   |
| 17   | `planning/user-stories/45-feature-name.md`  | `planning/specs/feature-45-name.md`          |
| 245  | `.safeword/planning/user-stories/[slug].md` | `.safeword/planning/specs/feature-[slug].md` |

---

### Phase 8: Update Design Doc Template

**File:** `packages/cli/templates/doc-templates/design-doc-template.md`

**Change (line 6):**

```diff
- **Related**: User Stories: `[path]` | Test Definitions: `[path]`
+ **Related**: Feature Spec: `[path]` | Test Definitions: `[path]`
```

---

### Phase 9: Update Ticket Template

**File:** `packages/cli/templates/doc-templates/ticket-template.md`

| Line | Old                                                   | New                                            |
| ---- | ----------------------------------------------------- | ---------------------------------------------- |
| 53   | "user stories, test definitions"                      | "feature specs, test definitions"              |
| 55   | `.safeword/planning/user-stories/XXX-feature-name.md` | `.safeword/planning/specs/feature-XXX-name.md` |

---

### Phase 10: Update Architecture Guide

**File:** `packages/cli/templates/guides/architecture-guide.md`

**Change (line ~280):**

```diff
-│   ├── user-stories/
+│   ├── specs/
```

---

### Phase 11: Update README.md

**File:** `README.md`

| Line | Old                                                | New                                                   |
| ---- | -------------------------------------------------- | ----------------------------------------------------- |
| 57   | `(user-stories, test-definitions, design, issues)` | `(specs, test-definitions, design, issues)`           |
| 109  | `user-stories-template.md`                         | `feature-spec-template.md`                            |
| 109  | Description: "User story structure"                | "Feature spec structure (user stories + constraints)" |
| 140  | `├── user-stories/`                                | `├── specs/`                                          |
| 140  | Description: "User story documents"                | "Feature and task specs"                              |

---

### Phase 12: Update promptfoo.yaml Test Assertions

**File:** `promptfoo.yaml`

Key changes:

| Lines            | Type              | Change                                                           |
| ---------------- | ----------------- | ---------------------------------------------------------------- |
| 1221, 1437, 1827 | Template name     | `user-stories-template.md` → `feature-spec-template.md`          |
| 1827             | Folder path       | `.safeword/planning/user-stories/` → `.safeword/planning/specs/` |
| 1836-1837        | Expected response | Update to expect `feature-spec-template.md`                      |

**Note:** Many promptfoo references are about the USER STORY FORMAT (methodology), not the file name. These should NOT change:

- "Create user stories" (user action)
- "Is this a good user story?" (format question)
- "INVEST criteria for user stories" (methodology)

Only change references to the TEMPLATE FILE NAME and FOLDER PATH.

---

## Test Plan

1. **Run schema tests:** `npm test -- tests/schema.test.ts`
   - Verify 49 owned files still detected
   - Verify no orphan schema entries

2. **Run full test suite:** `npm test`
   - All tests should pass

3. **Run promptfoo subset:** `npx promptfoo eval --filter-pattern "story-*"`
   - Verify user story guide tests still pass

4. **Manual verification:**
   - `safeword setup` in test project
   - Verify `feature-spec-template.md` is installed
   - Verify `.safeword/planning/specs/` folder created

5. **Build and lint:**
   - `npm run build`
   - `npm run lint`
   - `npm run lint:md`

---

## Rollout Order

Execute phases in order. Commit after each major phase group:

1. **Commit 1:** Phases 1-2 (rename template + schema)
2. **Commit 2:** Phases 3-11 (update template references)
3. **Commit 3:** Phase 12 (promptfoo tests)

---

## Summary

**Total files to modify:** 12 unique files (templates + project docs)

| Category                            | Count |
| ----------------------------------- | ----- |
| Template file renames               | 1     |
| Files with template name references | 9     |
| Files with folder path references   | 5     |
| Files with "User Stories:" label    | 2     |

**Note:** Some files have multiple types of references (counted once in total).

**Dogfooded copies** (`.safeword/`, `.claude/`) sync automatically via `safeword setup`.

---

## Done When

- [ ] Template file renamed (`packages/cli/templates/doc-templates/`)
- [ ] Schema updated
- [ ] All template guide references updated
- [ ] All template cross-references updated
- [ ] Template SAFEWORD.md updated
- [ ] README.md updated
- [ ] Template TDD skill updated
- [ ] promptfoo.yaml assertions updated
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Lint passes
