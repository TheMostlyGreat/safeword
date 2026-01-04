---
name: brainstorming
description: Use before implementation when refining rough ideas into specs. Guides collaborative design through Socratic questioning, alternative exploration, and incremental validation. Triggers: 'brainstorm', 'design', 'explore options', 'figure out', 'think through', 'what approach'.
allowed-tools: '*'
---

# Brainstorming Ideas Into Specs

Turn rough ideas into validated specs through Socratic dialogue.

**Iron Law:** ONE QUESTION AT A TIME. EXPLORE ALTERNATIVES BEFORE DECIDING.

## When to Use

Answer IN ORDER. Stop at first match:

1. Rough idea needs refinement? → Use this skill
2. Multiple approaches possible? → Use this skill
3. Unclear requirements? → Use this skill
4. Clear task, obvious approach? → Skip (use tdd-enforcing directly)
5. Pure research/investigation? → Skip

---

## Phase 1: CONTEXT

**Purpose:** Understand what exists before asking questions.

**Protocol:**

1. Check project state (files, recent commits, existing specs)
2. Review relevant docs in `.safeword/planning/`
3. Identify constraints and patterns already established

**Exit Criteria:**

- [ ] Reviewed relevant codebase areas
- [ ] Checked existing specs/designs
- [ ] Ready to ask informed questions

---

## Phase 2: QUESTION

**Iron Law:** ONE QUESTION PER MESSAGE

**Protocol:**

1. Ask one focused question
2. Prefer multiple choice (2-4 options) when possible
3. Open-ended is fine for exploratory topics
4. Focus on: purpose, constraints, success criteria, scope

**Question Types (in order of preference):**

| Type            | When                    | Example                                              |
| --------------- | ----------------------- | ---------------------------------------------------- |
| Multiple choice | Clear options exist     | "Should this be (A) real-time or (B) polling-based?" |
| Yes/No          | Binary decision         | "Do we need offline support?"                        |
| Bounded open    | Need specifics          | "What's the max number of items to display?"         |
| Open-ended      | Exploring problem space | "What problem are you trying to solve?"              |

**Exit Criteria:**

- [ ] Understand the core problem/goal
- [ ] Know key constraints
- [ ] Have success criteria
- [ ] Scope boundaries are clear

---

## Phase 3: ALTERNATIVES

**Iron Law:** ALWAYS PRESENT 2-3 OPTIONS BEFORE DECIDING

**Protocol:**

1. Present 2-3 approaches with trade-offs
2. Lead with your recommendation and why
3. Be explicit about what each gives up
4. Let user choose (or suggest hybrid)

**Format:**

```text
I'd recommend Option A because [reason].

**Option A: [Name]**
- Approach: [how it works]
- Pros: [benefits]
- Cons: [drawbacks]

**Option B: [Name]**
- Approach: [how it works]
- Pros: [benefits]
- Cons: [drawbacks]

**Option C: [Name]** (if applicable)
- Approach: [how it works]
- Pros: [benefits]
- Cons: [drawbacks]

Which direction feels right?
```

**Exit Criteria:**

- [ ] Presented 2-3 viable approaches
- [ ] Gave clear recommendation with reasoning
- [ ] User selected approach (or hybrid)

---

## Phase 4: DESIGN

**Iron Law:** PRESENT IN 200-300 WORD SECTIONS. VALIDATE EACH.

**Protocol:**

1. Present design incrementally (not all at once)
2. After each section: "Does this look right so far?"
3. Cover: architecture, components, data flow, error handling
4. Apply YAGNI ruthlessly - remove anything "just in case"
5. Go back and clarify when something doesn't fit

**Sections (present one at a time):**

1. **Overview** - What we're building, high-level approach
2. **Components** - Key pieces and responsibilities
3. **Data Flow** - How data moves through system
4. **Edge Cases** - Error handling, boundaries
5. **Out of Scope** - What we're explicitly NOT doing

**Exit Criteria:**

- [ ] Each section validated by user
- [ ] Design is complete and coherent
- [ ] YAGNI applied (no speculative features)
- [ ] Ready to create spec

---

## Phase 5: SPEC

**Purpose:** Convert validated design into structured spec.

**Protocol:**

1. Determine level (patch/task/feature) using triage questions
2. Create spec using appropriate template
3. Commit the spec

**Triage:**

| Question                                 | If Yes →                        |
| ---------------------------------------- | ------------------------------- |
| User-facing feature with business value? | **feature** → Feature Spec      |
| Bug, improvement, internal, or refactor? | **task** → Task Spec            |
| Typo, config, or trivial change?         | **patch** → Task Spec (minimal) |

**Output Locations:**

- feature: `.safeword/planning/specs/feature-[slug].md`
- task/patch: `.safeword/planning/specs/task-[slug].md`
- feature Test Defs: `.safeword/planning/test-definitions/feature-[slug].md`

**Exit Criteria:**

- [ ] Spec created in correct location
- [ ] feature: Test definitions created
- [ ] Spec committed to git

---

## Phase 6: HANDOFF

**Protocol:**

1. Summarize what was created
2. Ask: "Ready to start implementation with TDD?"
3. If yes → Invoke tdd-enforcing skill

**Exit Criteria:**

- [ ] User confirmed spec is complete
- [ ] Handed off to tdd-enforcing (if continuing)

---

## Key Principles

| Principle                     | Why                                     |
| ----------------------------- | --------------------------------------- |
| One question at a time        | Prevents overwhelm, gets better answers |
| Multiple choice preferred     | Faster to answer, reduces ambiguity     |
| Alternatives before decisions | Avoids premature commitment             |
| Incremental validation        | Catches misunderstandings early         |
| YAGNI ruthlessly              | Scope creep kills projects              |

---

## Anti-Patterns

| Don't                          | Do                               |
| ------------------------------ | -------------------------------- |
| Dump full design at once       | Present in 200-300 word sections |
| Ask 5 questions in one message | Ask ONE question                 |
| Skip alternatives              | Always present 2-3 options       |
| Accept vague requirements      | Probe until concrete             |
| Add "nice to have" features    | Put them in "Out of Scope"       |
