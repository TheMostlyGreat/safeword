# LLM Guide

This guide covers two related topics:

**Part 1: Integration** - How to call LLMs effectively (API calls, structured outputs, caching, testing)

**Part 2: Writing for LLMs** - How to write documentation that LLMs will read and follow (SAFEWORD.md, CLAUDE.md, guides)

---

## Part 1: Integration

### Structured Outputs

Use JSON mode for predictable LLM responses. Define explicit schemas with validation. Return structured data, not prose.

```typescript
// ❌ BAD - Prose output
"The user wants to create a campaign named 'Shadows' with 4 players"

// ✅ GOOD - Structured JSON
{ "intent": "create_campaign", "name": "Shadows", "playerCount": 4 }
```

### Cost Optimization

**Prompt Caching (Critical for AI Agents):**

- Static rules → System prompt with cache_control: ephemeral (caches for ~5 min, auto-expires)
- Dynamic data (character state, user input) → User message (no caching)
- Example: 468-line prompt costs $0.10 without caching, $0.01 with (90% reduction)
- Cache invalidation: ANY change to cached blocks breaks ALL caches
- Rule: Change system prompts sparingly; accept one-time cache rebuild cost

**Message Architecture:**

```typescript
// ✅ GOOD - Cacheable system prompt
systemPrompt: [
  { text: STATIC_RULES, cache_control: { type: 'ephemeral' } },
  { text: STATIC_EXAMPLES, cache_control: { type: 'ephemeral' } },
];
userMessage: `Character: ${dynamicState}\nAction: ${userInput}`;

// ❌ BAD - Uncacheable (character state in system prompt)
systemPrompt: `Rules + Character: ${dynamicState}`;
```

### Context Management

**Observation Masking:**

- Summarize large tool outputs (>2k tokens) before adding to context
- Reference artifacts by path, don't inline full content
- Example: "File has 500 lines, 3 functions: parseConfig(), validate(), apply()" vs full file

**Per-Phase Loading:**

- Load only phase-relevant artifacts at each step
- Work logs: Summarize previous sessions, don't replay verbatim
- Test definitions: Load current slice, not all scenarios

**Summarization Strategies:**

- Use LLM to summarize exploration results before continuing
- Compress completed work into bullet points
- Keep active context focused on current task

**Research basis:** "Context rot"—as tokens increase, model recall degrades. Good context management keeps starting context under 17k tokens.

---

### Testing AI Outputs

**LLM-as-Judge Pattern:**

- Use LLM to evaluate nuanced qualities (narrative tone, reasoning quality)
- Avoid brittle keyword matching for creative outputs
- Define rubrics: EXCELLENT / ACCEPTABLE / POOR with criteria
- Example: "Does the GM's response show collaborative tone?" vs checking for specific words

**Evaluation Framework:**

- Unit tests: Pure functions (parsing, validation)
- Integration tests: Agent + real LLM calls (schema compliance)
- LLM Evals: Judgment quality (position/effect reasoning, atmosphere)
- Cost awareness: 30 scenarios ≈ $0.15-0.30 per run with caching

---

## Part 2: Writing for LLMs

When creating documentation that LLMs will read and follow (AGENTS.md, CLAUDE.md, testing guides, coding standards), apply these principles:

### 1. MECE Principle (Mutually Exclusive, Collectively Exhaustive)

Decision trees must have no overlap and cover all cases. LLMs struggle with overlapping categories.

```markdown
❌ BAD - Not mutually exclusive:
├─ Pure function?
├─ Multiple components interacting?
├─ Full user flow?

Problem: A function with database calls could match both

✅ GOOD - Sequential, mutually exclusive:

1. AI content quality? → LLM Eval
2. Requires real browser? → E2E test
3. Multiple components? → Integration test
4. Pure function? → Unit test

Stops at first match, no ambiguity.
```

### 2. Explicit Over Implicit

Never assume LLMs know what you mean. Define all terms, even "obvious" ones.

```markdown
❌ BAD: "Test at the lowest level"
✅ GOOD: "Test with the fastest test type that can catch the bug"

Examples needing definition:

- "Critical paths" → Always critical: auth, payment. Rarely: UI polish, admin
- "Browser" → Real browser (Playwright/Cypress), not jsdom
- "Pure function" → Input → output, no I/O (define edge cases like Date.now())
```

### 3. No Contradictions

Different sections must align. LLMs don't reconcile conflicting guidance. When updating, grep for related terms and update all references.

```markdown
❌ BAD:
Section A: "Write E2E tests only for critical user paths"
Section B: "All user-facing features have at least one E2E test"

✅ GOOD:
Section A: "Write E2E tests only for critical user paths"
Section B: "All critical multi-page user flows have at least one E2E test"

- Definition of "critical" with examples
```

### 4. Concrete Examples Over Abstract Rules

Show, don't just tell. LLMs learn patterns from examples. For every rule, include 2-3 concrete examples showing good vs bad.

```markdown
❌ BAD: "Follow best practices for testing"

✅ GOOD:
// ❌ BAD - Testing business logic with E2E
test('discount calculation', async ({ page }) => {
await page.goto('/checkout')
await page.fill('[name="price"]', '100')
await expect(page.locator('.total')).toContainText('80')
})

// ✅ GOOD - Unit test (runs in milliseconds)
it('applies 20% discount', () => {
expect(calculateDiscount(100, 0.20)).toBe(80)
})
```

### 5. Edge Cases Must Be Explicit

What seems obvious to humans often isn't to LLMs. After stating a rule, add "Edge cases:" section.

```markdown
❌ BAD: "Unit test pure functions"

✅ GOOD: "Unit test pure functions"

Edge cases:

- Non-deterministic functions (Math.random(), Date.now()) → Unit test with mocked randomness/time
- Environment dependencies (process.env) → Integration test
- Mixed pure + I/O → Extract pure part, unit test separately
```

### 6. Actionable Over Vague

Replace subjective terms with optimization rules + red flags.

```markdown
❌ BAD: "Most tests: Fast, Some tests: Slow"

✅ GOOD:

- Write as many fast tests as possible
- Write E2E tests only for critical paths requiring a browser
- Red flag: If you have more E2E tests than integration tests, suite is too slow
```

### 7. Decision Trees: Sequential Over Parallel

Structure decisions as ordered steps, not simultaneous checks.

```markdown
❌ BAD - Parallel branches:
├─ Pure function?
├─ Multiple components?
└─ Full user flow?

✅ GOOD - Sequential:
Answer questions IN ORDER. Stop at the first match.
```

### 8. Tie-Breaking Rules

When multiple options could apply, tell LLMs how to choose.

```markdown
✅ GOOD:
"If multiple test types can catch the bug, choose the fastest one."

Reference in decision trees:
"If multiple seem to apply, use the tie-breaking rule stated above: choose the faster one."
```

### 9. Lookup Tables for Complex Decisions

When decision logic has 3+ branches, provide a reference table.

```markdown
| Bug Type           | Unit? | Integration? | E2E? | Best Choice       |
| ------------------ | ----- | ------------ | ---- | ----------------- |
| Calculation error  | ✅    | ✅           | ✅   | Unit (fastest)    |
| Database query bug | ❌    | ✅           | ✅   | Integration       |
| CSS layout broken  | ❌    | ❌           | ✅   | E2E (only option) |
```

### 10. Avoid Caveats in Tables

Keep patterns clean. Parentheticals break LLM pattern matching.

```markdown
❌ BAD: | State management bug | ❌ NO (if mocked) | ✅ YES |
✅ GOOD: | State management bug (Zustand, Redux) | ❌ NO | ✅ YES |
```

### 11. Percentages: Context or None

Don't use percentages without adjustment guidance.

```markdown
❌ BAD: "70% unit tests, 20% integration, 10% E2E"

✅ BETTER: "Baseline: 70/20/10. Adjust: Microservices → 60/30/10, UI-heavy → 60/20/20"

✅ BEST: "Write as many fast tests as possible. Red flag: More E2E than integration = too slow."
```

### 12. Specificity in Questions

Use precise technical terms, not general descriptions.

```markdown
❌ BAD: "Does this require seeing the UI?"
✅ GOOD: "Does this require a real browser (Playwright/Cypress)?"

Note: React Testing Library does NOT require a browser - that's integration testing.
```

### 13. Re-evaluation Paths

When LLMs hit dead ends, provide concrete next steps.

```markdown
❌ BAD: "If none of the above apply, re-evaluate your approach"

✅ GOOD: "If testing behavior that doesn't fit the categories:

1. Break it down: Separate pure logic from I/O/UI concerns
2. Test each piece: Pure → Unit, I/O → Integration, Multi-page → E2E
3. Example: Login validation
   - isValidEmail(email) → Unit test
   - checkUserExists(email) → Integration test (database)
   - Login form → Dashboard → E2E test (multi-page)"
```

### 14. Position-Aware Writing (Recency Bias)

LLMs retain information at the **beginning and end** of context better than the middle. Structure documents accordingly.

```markdown
❌ BAD - Critical rules buried in middle:

# Guide

## Background (100 lines)

## Details (200 lines)

## Critical Rules (10 lines) ← forgotten

## Appendix (50 lines)

✅ GOOD - Critical rules at end:

# Guide

## Background (100 lines)

## Details (200 lines)

## Appendix (50 lines)

## Key Takeaways (10 lines) ← retained
```

**Application:**

- CLAUDE.md / SAFEWORD.md: Put "Always Remember" section last
- Guides: End with "Key Takeaways" section
- Templates: Put most important sections at top OR bottom, not middle

**Research basis:** "Lost in the middle" phenomenon—models show <40% recall for middle content vs >80% for beginning/end content.

---

## Anti-Patterns

❌ **Visual metaphors** - Pyramids, icebergs—LLMs don't process visual information well
❌ **Undefined jargon** - "Technical debt", "code smell" need definitions
❌ **Competing guidance** - Multiple decision frameworks that contradict each other
❌ **Outdated references** - Remove concepts, but forget to update all mentions
❌ **Critical info in the middle** - Most important rules buried between background and appendix

---

## Quality Checklist

Before saving/committing LLM-consumable documentation:

- [ ] Decision trees follow MECE principle (mutually exclusive, collectively exhaustive)
- [ ] Technical terms explicitly defined
- [ ] No contradictions between sections
- [ ] Every rule has 2-3 concrete examples (good vs bad)
- [ ] Edge cases explicitly covered
- [ ] Vague terms replaced with actionable principles
- [ ] Tie-breaking rules provided
- [ ] Complex decisions (3+ branches) have lookup tables
- [ ] Dead-end paths have re-evaluation steps with examples
- [ ] Critical rules positioned at END of document (recency bias)

---

## Example: Before and After

**Before (ambiguous):**

```markdown
Follow the test pyramid: lots of unit tests, some integration tests, few E2E tests.
```

**After (LLM-optimized):**

```markdown
Answer these questions IN ORDER to choose test type:

1. Pure function (input → output, no I/O)? → Unit test
2. Multiple components/services interacting? → Integration test
3. Requires real browser (Playwright)? → E2E test

If multiple apply: choose the faster one.

Edge cases:

- React components with React Testing Library → Integration (not E2E, no real browser)
- Non-deterministic functions (Date.now()) → Unit test with mocked time
```

---

## Key Takeaways

- Decision trees: sequential, MECE, with tie-breakers
- Every rule needs concrete examples (good vs bad)
- Define all terms explicitly—assume nothing is obvious
- Put critical rules at the END of documents (recency bias)
