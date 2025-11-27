# LangSmith Eval Setup Plan

**Goal:** Test whether an LLM agent correctly follows SAFEWORD documentation/guides when given various scenarios.

**Scale:** 140 user stories across 13 guides → expect 200+ test cases over time.

---

## Phase 1: Foundation (Do First)

### 1.1 Project Structure

```
evals/
├── package.json                 # Dependencies: langsmith, langchain, openai/anthropic SDK
├── tsconfig.json
├── .env.example                 # LANGSMITH_API_KEY, OPENAI_API_KEY, etc.
├── src/
│   ├── config.ts                # LangSmith project config, model selection
│   ├── context-loader.ts        # Load SAFEWORD.md + guides as context
│   ├── evaluators/
│   │   ├── section-presence.ts  # Check if output has required sections
│   │   ├── doc-type-decision.ts # Check if correct doc type was chosen
│   │   └── prerequisites.ts     # Check if prerequisites were verified
│   └── runner.ts                # Execute evals, upload to LangSmith
├── datasets/
│   ├── architecture-guide/      # Tests for architecture-guide.md
│   │   ├── create-doc.json      # Test 1: Create Architecture Doc
│   │   ├── tech-choice.json     # Test 2: Doc Type Decision - Tech Choice
│   │   └── ...
│   ├── design-doc-guide/        # Tests for design-doc-guide.md
│   └── ... (one folder per guide)
└── scripts/
    ├── run-all.ts               # Run full eval suite
    ├── run-guide.ts             # Run evals for one guide
    └── upload-datasets.ts       # Sync datasets to LangSmith
```

### 1.2 Core Dependencies

```json
{
  "dependencies": {
    "langsmith": "^0.1.0",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.30.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### 1.3 Dataset Schema (Standard for All Tests)

```typescript
interface TestCase {
  id: string;                    // e.g., "arch-001-create-doc"
  guide: string;                 // e.g., "architecture-guide"
  story_id: number;              // Maps to user story number
  input: string;                 // User prompt
  context_files: string[];       // Which files to load as context
  expected_behavior: string;     // What the agent should do
  rubric: {
    excellent: string;
    acceptable: string;
    poor: string;
  };
}
```

---

## Phase 2: Evaluator Patterns (Reusable)

### 2.1 Section Presence Evaluator

Used by: Tests 1, 6 (any "Create X Doc" test)

```typescript
// evaluators/section-presence.ts
const evaluate = (output: string, requiredSections: string[]) => {
  const found = requiredSections.filter(s => output.includes(s));
  const score = found.length / requiredSections.length;
  
  if (score === 1) return { score: 1, label: 'excellent' };
  if (score >= 0.8) return { score: 0.8, label: 'acceptable' };
  return { score: 0.4, label: 'poor' };
};
```

### 2.2 Decision Evaluator

Used by: Tests 2, 3, 5, 8, 10 (any "Which doc type?" test)

```typescript
// evaluators/doc-type-decision.ts
const evaluate = (output: string, expectedType: 'architecture' | 'design' | 'none') => {
  const mentionsArch = /architecture\s*(doc|document)/i.test(output);
  const mentionsDesign = /design\s*(doc|document)/i.test(output);
  
  // Scoring logic based on expectedType
};
```

### 2.3 Prerequisites Evaluator

Used by: Tests 7 (any "Did agent check prerequisites?" test)

```typescript
// evaluators/prerequisites.ts
const evaluate = (output: string) => {
  const asksAboutStories = /user stor(y|ies)/i.test(output);
  const asksAboutTestDefs = /test definition/i.test(output);
  const offersToCreate = /create|offer|would you like/i.test(output);
  
  // Excellent = checks before creating
};
```

### 2.4 LLM-as-Judge (General Purpose)

Used by: Complex cases where regex isn't enough

```typescript
// evaluators/llm-judge.ts
const judgePrompt = `
You are evaluating an AI coding assistant's response.

Rubric:
- EXCELLENT: {rubric.excellent}
- ACCEPTABLE: {rubric.acceptable}  
- POOR: {rubric.poor}

User Input: {input}
Assistant Output: {output}

Rate the response as EXCELLENT, ACCEPTABLE, or POOR. Explain briefly.
`;
```

---

## Phase 3: Implementation Order

### Week 1: Setup + First 10 Tests

| Task | Output |
|------|--------|
| Create `evals/` directory structure | Scaffolding |
| Install dependencies | `package.json` |
| Create context loader | Load SAFEWORD.md + guides |
| Create LangSmith project | `safeword-evals` project |
| Implement Tests 1-10 from prompt | First dataset uploaded |

### Week 2: Evaluator Library

| Task | Output |
|------|--------|
| Section presence evaluator | Reusable for all "create doc" tests |
| Decision evaluator | Reusable for all "which doc?" tests |
| Prerequisites evaluator | Reusable for workflow tests |
| LLM-as-judge wrapper | General fallback |

### Week 3+: Scale Up

| Guide | # Stories | Priority |
|-------|-----------|----------|
| architecture-guide.md | 11 | HIGH (4 done) |
| design-doc-guide.md | 10 | HIGH (partial) |
| testing-methodology.md | 13 | MEDIUM |
| tdd-templates.md | 16 | MEDIUM |
| llm-instruction-design.md | 15 | LOW |
| ... | ... | ... |

---

## Phase 4: CI Integration (Defer)

```yaml
# .github/workflows/evals.yml
name: Run Evals
on:
  push:
    paths:
      - 'framework/**'  # Run when guides change
  schedule:
    - cron: '0 0 * * 0'  # Weekly regression check

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd evals && npm ci
      - run: npm run eval:all
        env:
          LANGSMITH_API_KEY: ${{ secrets.LANGSMITH_API_KEY }}
```

---

## Cost Controls

| Control | Implementation |
|---------|---------------|
| **Model selection** | Use GPT-4o-mini for judge (cheap), GPT-4o for target (expensive) |
| **Sampling** | Run subset in CI, full suite on demand |
| **Caching** | Cache context loading; SAFEWORD.md rarely changes |
| **Budget alerts** | LangSmith has spend tracking |

**Estimated costs (200 test cases):**
- Full suite run: ~$5-10 (depends on output length)
- CI weekly run: ~$50/month

---

## Naming Conventions

```
Test ID format: {guide-prefix}-{story-num}-{test-slug}

Examples:
- arch-001-create-doc         (architecture-guide, story 1)
- arch-002-tech-choice        (architecture-guide, story 3)
- design-001-create-doc       (design-doc-guide, story 2)
- design-002-prereqs          (design-doc-guide, story 1)
```

| Guide | Prefix |
|-------|--------|
| architecture-guide.md | arch |
| design-doc-guide.md | design |
| testing-methodology.md | test |
| tdd-templates.md | tdd |
| code-philosophy.md | code |
| context-files-guide.md | ctx |
| data-architecture-guide.md | data |
| learning-extraction.md | learn |
| llm-instruction-design.md | llm-instr |
| llm-prompting.md | llm-prompt |
| test-definitions-guide.md | testdef |
| user-story-guide.md | story |
| zombie-process-cleanup.md | zombie |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Test coverage | ≥1 test per evaluated user story |
| Pass rate baseline | Establish baseline, track regressions |
| Cost per run | <$15 for full suite |
| Run time | <10 min for full suite |

---

## Files to Create (Initial Implementation)

1. `evals/package.json` — Dependencies
2. `evals/src/config.ts` — LangSmith + model config
3. `evals/src/context-loader.ts` — Load guide files
4. `evals/src/evaluators/section-presence.ts` — First evaluator
5. `evals/src/runner.ts` — Execute tests
6. `evals/datasets/architecture-guide/create-doc.json` — First test case
7. `evals/scripts/run-all.ts` — Entry point

---

## Related Files

- Evaluation plan: `.agents/planning/002-user-story-quality-evaluation.md`
- User stories source: `.agents/planning/user-stories/001-guides-review-user-stories.md`
- Original prompt: See "Prompt to Use" section below

---

## Prompt to Use in New Thread

```
I want to set up LLM evaluations using LangSmith for my AI coding agent framework (SAFEWORD).

**Goal:** Test whether an LLM agent correctly follows the documentation/guides when given various scenarios.

**Tech context:**
- Framework location: /Users/alex/projects/safeword/framework/
- Guides location: framework/guides/
- Main instruction file: framework/SAFEWORD.md

**What I need:**
1. LangSmith project setup for evals
2. Dataset creation with test scenarios
3. Evaluator rubrics (LLM-as-judge)
4. Integration with CI (optional, can defer)

**Test scenarios to implement:**

### Architecture Doc Tests (from architecture-guide.md)

**Test 1: Create Architecture Doc**
- Input: "Create an architecture doc for a new React + Supabase project"
- Expected: Output contains all 10 required sections (Header, TOC, Overview, Data Principles, Data Model, Components, Data Flows, Key Decisions, Best Practices, Migration)
- Rubric: EXCELLENT = all 10 sections with What/Why/Trade-off; ACCEPTABLE = 8+ sections; POOR = <8 sections

**Test 2: Doc Type Decision - Tech Choice**
- Input: "I need to document our decision to use PostgreSQL instead of MongoDB"
- Expected: Agent chooses Architecture Doc (not Design Doc)
- Rubric: EXCELLENT = correctly identifies Architecture Doc + explains why; POOR = suggests Design Doc

**Test 3: Doc Type Decision - Feature**
- Input: "I need to document how the user profile feature will work"
- Expected: Agent chooses Design Doc (not Architecture Doc)
- Rubric: EXCELLENT = correctly identifies Design Doc + checks for prerequisites; POOR = suggests Architecture Doc

**Test 4: Decision Documentation**
- Input: "Document our decision to use Redis for caching"
- Expected: Output includes What, Why, Trade-off, Alternatives Considered
- Rubric: EXCELLENT = all 4 fields with specifics; ACCEPTABLE = What/Why/Trade-off; POOR = missing Why or Trade-off

**Test 5: Ambiguous Scenario - Tie-breaker**
- Input: "I need to document adding a caching layer that will be used by multiple features"
- Expected: Agent chooses Architecture Doc (affects 2+ features)
- Rubric: EXCELLENT = Architecture Doc + cites tie-breaking rule; ACCEPTABLE = Architecture Doc; POOR = Design Doc

### Design Doc Tests (from design-doc-guide.md)

**Test 6: Create Design Doc**
- Input: "Create a design doc for a three-pane layout feature"
- Expected: Output has required sections (Architecture, Components with [N]/[N+1], User Flow, Key Decisions)
- Rubric: EXCELLENT = all required sections + references user stories/test defs; ACCEPTABLE = missing 1-2 optional sections; POOR = missing User Flow or Components

**Test 7: Prerequisites Check**
- Input: "Create a design doc for the payment flow feature" (assume no user stories exist)
- Expected: Agent asks about or offers to create user stories first
- Rubric: EXCELLENT = checks prerequisites before creating; POOR = creates design doc without checking

**Test 8: Complexity Assessment**
- Input: "Do I need a design doc for adding a logout button?"
- Expected: Agent says no (simple, <3 components, single user story)
- Rubric: EXCELLENT = correctly assesses as too simple + explains why; POOR = recommends design doc

### Edge Case Tests

**Test 9: Scattered ADRs Migration**
- Input: "Our project has 50 ADR files in docs/adr/. What should we do?"
- Expected: Agent recommends consolidating into single ARCHITECTURE.md
- Rubric: EXCELLENT = recommends consolidation + provides migration steps; POOR = suggests keeping ADRs

**Test 10: Borderline Complexity**
- Input: "I'm building a feature that touches exactly 3 components and has 2 user stories"
- Expected: Agent recommends design doc (meets threshold)
- Rubric: EXCELLENT = recommends design doc + cites complexity criteria; ACCEPTABLE = recommends design doc; POOR = says skip design doc

**Evaluation approach:**
- Use LLM-as-judge with Claude or GPT-4 as evaluator
- Each test should have the SAFEWORD.md and relevant guide loaded as context
- Track pass/fail rates over time to catch regressions

Please help me set this up in LangSmith. Start by explaining the LangSmith concepts I need to know, then walk me through creating the first few test cases.
```
