---
name: writing-plans
description: Use when spec is complete and you need detailed implementation tasks for LLM agents. Creates execution plans with exact file paths, complete code examples, and verification steps. Triggers: 'write plan', 'execution plan', 'implementation plan', 'break down into tasks', 'detailed steps'.
allowed-tools: '*'
---

# Writing Execution Plans

Convert specs into detailed implementation plans for LLM agents.

**Iron Law:** EXACT PATHS. COMPLETE CODE. VERIFICATION GATES.

## When to Use

Answer IN ORDER. Stop at first match:

1. Spec exists and is approved? → Use this skill
2. No spec yet? → Use brainstorming skill first
3. Simple task, obvious steps? → Skip (use enforcing-tdd directly)

---

## Phase 1: CONTEXT

**Purpose:** Understand the spec and identify all affected files.

**Protocol:**

1. Read the spec from `.safeword/planning/specs/`
2. Identify all files that will be created or modified
3. Check existing patterns in the codebase
4. Note test file locations and naming conventions

**Exit Criteria:**

- [ ] Spec read and understood
- [ ] All affected files identified
- [ ] Existing patterns noted

---

## Phase 2: DECOMPOSE

**Purpose:** Break the spec into atomic tasks.

**Protocol:**

1. Each task = one logical unit (one component, one function, one integration point)
2. Order tasks by dependency (foundations first)
3. Each task must be independently verifiable

**Task sizing guide:**

| Too Big           | Right Size                         | Too Small        |
| ----------------- | ---------------------------------- | ---------------- |
| "Add auth system" | "Add password validation function" | "Import bcrypt"  |
| "Build API"       | "Add POST /users endpoint"         | "Add route file" |

**Exit Criteria:**

- [ ] Tasks are atomic and ordered
- [ ] No task depends on uncommitted work from another
- [ ] Each task has clear boundaries

---

## Phase 3: DETAIL

**Purpose:** Write exact implementation details for each task.

**Protocol:**

For each task, provide:

1. **Files** - Exact paths (create/modify/test)
2. **Test code** - Complete, runnable test
3. **Implementation code** - Complete, minimal code to pass
4. **Verification command** - Exact command with expected output
5. **Commit message** - Ready to use

**Task Format** (adapt syntax to project's language/test framework):

````markdown
### Task N: [Name]

**Files:**

- Create: `src/path/to/file.ext`
- Test: `src/path/to/file.test.ext`

**Step 1: Write failing test**

```
[Complete test code using project's test framework]
```

**Step 2: Verify test fails**

Run: `[exact test command]`
Expected: FAIL - "[specific error message]"

**Step 3: Implement**

```
[Complete implementation code]
```

**Step 4: Verify test passes**

Run: `[exact test command]`
Expected: PASS

**Step 5: Commit**

```bash
git add [files]
git commit -m "[type]: [description]"
```
````

**Exit Criteria:**

- [ ] Every task has complete code (no "add validation here")
- [ ] Every task has exact verification command
- [ ] Every task has commit message

---

## Phase 4: SAVE

**Purpose:** Write the plan to disk.

**Protocol:**

1. Create plan file at `.safeword/planning/plans/{slug}.md`
2. Include header with metadata
3. Include all tasks in order

**Plan Header:**

```markdown
# [Feature Name] Execution Plan

**Source Spec:** `.safeword/planning/specs/{spec-file}.md`
**Created:** YYYY-MM-DD
**Status:** Ready

**Goal:** [One sentence]

**Tasks:** N tasks

---
```

**Exit Criteria:**

- [ ] Plan saved to `.safeword/planning/plans/`
- [ ] Header includes source spec reference
- [ ] All tasks included

---

## Phase 5: HANDOFF

**Purpose:** Transition to execution.

**Protocol:**

1. Summarize the plan (task count, scope)
2. Offer execution options:

```text
Plan saved to `.safeword/planning/plans/{slug}.md`

**Execution options:**

1. **Continue here** - I'll execute tasks one-by-one using enforcing-tdd
2. **Fresh session** - Open new session, reference the plan file

Which approach?
```

3. If continuing: Start with Task 1, use enforcing-tdd skill

**Exit Criteria:**

- [ ] User chose execution approach
- [ ] Handed off appropriately

---

## Key Principles

| Principle          | Why                                                |
| ------------------ | -------------------------------------------------- |
| Exact file paths   | LLMs hallucinate paths without specifics           |
| Complete code      | "Add X here" leads to inconsistent implementations |
| Verification gates | LLMs need explicit pass/fail criteria              |
| Atomic tasks       | Fresh context per task = less drift                |
| TDD per task       | Catches errors immediately                         |

---

## Anti-Patterns

| Don't                          | Do                                  |
| ------------------------------ | ----------------------------------- |
| "Add error handling"           | Show exact try/catch code           |
| "Create test file"             | Show complete test with assertions  |
| "Run tests"                    | `bun run test path/to/file.test.ts` |
| Combine 3 features in one task | One feature per task                |
| Skip verification step         | Always: Run X, expect Y             |

---

## Related

- @./.safeword/guides/planning-guide.md
- @./.safeword/guides/testing-guide.md
