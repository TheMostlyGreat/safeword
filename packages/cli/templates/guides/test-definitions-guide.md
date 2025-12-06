# Test Definitions Guide for Claude Code

## How to Fill Out Feature Test Definitions

**Template:** `@.safeword/templates/test-definitions-feature.md`

**When user asks:** "Create test definitions for issue #N" or "Create test definitions for [feature]"

**What you do:**

1. Read `@.safeword/templates/test-definitions-feature.md`
2. Read user story's Technical Constraints section (if exists)
3. Fill in feature name, issue number, test file path
4. Organize tests into logical suites (e.g., "Layout Structure", "User Interactions", "Technical Constraints")
5. Create numbered tests (Test 1.1, Test 1.2, etc.)
6. Add status for each test (✅/⏭️/❌/🔴)
7. Include detailed steps and expected outcomes
8. Add summary with coverage breakdown
9. Save to project location (e.g., `planning/test-definitions/45-feature-name-test-definitions.md`)

**DO include:**

- Status tracking per test (✅ Passing / ⏭️ Skipped / ❌ Not Implemented / 🔴 Failing)
- Detailed steps (numbered list)
- Expected outcomes (bullet points)
- Coverage summary with percentages
- Skipped tests rationale
- Test execution commands

---

## Test Status Indicators

Use these consistently:

- **✅ Passing** - Test is implemented and passing
- **⏭️ Skipped** - Test is intentionally skipped (add rationale in summary)
- **❌ Not Implemented** - Test is defined but not yet written
- **🔴 Failing** - Test exists but is currently failing

---

## Test Naming Conventions

**✅ GOOD - Descriptive and specific:**

- "Render all three panes"
- "Cmd+J toggles AI pane visibility"
- "State persistence across sessions"
- "Button appearance reflects pane state"

**❌ BAD - Vague or technical:**

- "Test 1" (no description)
- "Check state" (too vague)
- "Verify useUIStore hook" (implementation detail)

---

## Writing Test Steps

**✅ GOOD - Clear, actionable steps:**

````text
**Steps**:
1. Toggle AI pane visible
2. Get bounding box for AI pane
3. Get bounding box for Editor pane
4. Compare X coordinates
```text

**❌ BAD - Vague or incomplete:**

```text
**Steps**:
1. Check panes
2. Verify order
```text

---

## Writing Expected Outcomes

**✅ GOOD - Specific, testable assertions:**

```text
**Expected**:
- AI pane X coordinate < Editor pane X coordinate
- Explorer pane X coordinate > Editor pane X coordinate
- All coordinates are positive numbers
```text

**❌ BAD - Vague expectations:**

```text
**Expected**:
- Panes are in correct order
- Everything works
```text

---

## Organizing Test Suites

**Group related tests into suites:**

- **Layout/Structure** - DOM structure, element presence, positioning
- **User Interactions** - Clicks, keyboard shortcuts, drag/drop
- **State Management** - State changes, persistence, reactivity
- **Accessibility** - ARIA labels, keyboard navigation, focus management
- **Edge Cases** - Error handling, boundary conditions, race conditions
- **Technical Constraints** - Non-functional requirements from user story (see below)

**Each suite should have:**

- Clear name describing what it tests
- Brief description (1-2 sentences)
- Related tests grouped logically

---

## Coverage Summary Best Practices

**Always include:**

- Total test count
- Breakdown by status (passing, skipped, not implemented, failing)
- Percentages for each category
- Coverage by feature table
- Rationale for skipped tests

**Example:**

```text
**Total**: 20 tests
**Passing**: 9 tests (45%)
**Skipped**: 4 tests (20%)
**Not Implemented**: 7 tests (35%)
**Failing**: 0 tests
```text

---

## Skipped Tests Rationale

**Always explain why tests are skipped:**

**✅ GOOD - Clear reasoning:**

- "Conflicts with Phase 2 design decision (AI pane hidden by default)"
- "Requires complex drag simulation, tested manually"
- "Blocked by upstream dependency (Issue #42)"

**❌ BAD - No explanation:**

- "Skipped"
- "Not needed"
- "TODO"

---

## Test Execution Section

**Include practical commands:**

```bash
# Run all tests for this feature
npm run test:e2e -- tests/feature-name.spec.ts

# Run specific test
npm run test:e2e -- tests/feature-name.spec.ts --grep "specific test name"
```text

---

## TDD Workflow Integration

**Test definitions should be created:**

1. **Before implementation** (TDD: write tests first)
2. **During planning** (alongside user stories)
3. **After user stories** (tests verify acceptance criteria)

**Update test definitions:**

- Mark tests ✅ as they pass
- Add ⏭️ with rationale if skipping
- Mark 🔴 if tests fail
- Update "Last Updated" date

---

## Relationship to User Stories

**Test definitions should:**

- Map directly to user story acceptance criteria
- Cover all acceptance criteria from user stories
- Include additional edge cases and error scenarios
- Reference test file locations mentioned in user stories
- **Include tests for Technical Constraints** (non-functional requirements)

**Example:**

- User Story AC: "AI pane is visible when toggled"
- Test: "Test 3.1: Cmd+J toggles AI pane visibility ✅"

---

## Testing Technical Constraints

**Purpose:** User stories include a Technical Constraints section with non-functional requirements. These constraints MUST have corresponding tests.

**See:** `@.safeword/guides/user-story-guide.md` for constraint categories and examples.

### Constraint Categories → Test Types

| Constraint Category | Test Type                  | What to Verify                                      |
| ------------------- | -------------------------- | --------------------------------------------------- |
| Performance         | Load/timing tests          | Response times, throughput, capacity limits         |
| Security            | Security tests             | Input sanitization, auth checks, rate limiting      |
| Compatibility       | Cross-browser/device tests | Browser versions, mobile, accessibility             |
| Data                | Compliance tests           | Retention, deletion, privacy rules                  |
| Dependencies        | Integration tests          | Required services work, no forbidden packages       |
| Infrastructure      | Resource tests             | Memory limits, offline behavior, deploy constraints |

### Writing Constraint Tests

**✅ GOOD - Specific, measurable:**

```markdown
### Test 7.1: API response under load ✅

**Status**: ✅ Passing
**Category**: Performance
**Constraint**: API response < 200ms at P95

**Steps**:

1. Spawn 100 concurrent requests to /api/data
2. Measure response times for all requests
3. Calculate P95 latency

**Expected**:

- P95 response time < 200ms
- No requests timeout
- No 5xx errors under load
```text

**❌ BAD - Vague, untestable:**

```markdown
### Test 7.1: Performance test

**Steps**: Check if fast
**Expected**: Good performance
```text

### When to Skip Constraint Tests

**Document skipped constraint tests with rationale:**

- "Performance: Tested in CI pipeline, not in unit tests"
- "Compatibility: Manual testing on BrowserStack, see QA checklist"
- "Security: Covered by automated SAST scan (Snyk)"

**Never skip without explanation.**

---

## Example: Good Test Definition

```markdown
### Test 3.1: Cmd+J toggles AI pane visibility ✅

**Status**: ✅ Passing
**Description**: Verifies Cmd+J keyboard shortcut toggles AI pane

**Steps**:

1. Verify AI pane hidden initially (default state)
2. Press Cmd+J (Mac) or Ctrl+J (Windows/Linux)
3. Verify AI pane becomes visible
4. Press Cmd+J again
5. Verify AI pane becomes hidden

**Expected**:

- AI pane starts hidden
- After first toggle: AI pane visible
- After second toggle: AI pane hidden
- Toggle action triggers state change in uiStore
```text

---

## Common Mistakes to Avoid

❌ **Don't test implementation details:**

- Bad: "Verify useState hook updates"
- Good: "Verify pane becomes visible when toggled"

❌ **Don't write vague steps:**

- Bad: "Check if it works"
- Good: "Click button and verify modal appears"

❌ **Don't skip rationale for skipped tests:**

- Always explain WHY a test is skipped

❌ **Don't forget coverage summary:**

- Always include totals and percentages

❌ **Don't duplicate test descriptions:**

- Each test should have a unique, descriptive name

---

## LLM Instruction Design

**Important:** Test definitions are instructions that LLMs read and follow. Apply best practices for clarity.

**See:** `@.safeword/guides/llm-guide.md` for comprehensive framework including:

- MECE decision trees (mutually exclusive, collectively exhaustive)
- Explicit definitions (never assume LLMs know what you mean)
- Concrete examples over abstract rules
- Edge cases must be explicit
- Actionable over vague language

---

## Key Takeaways

- Map each user story acceptance criterion to specific tests
- Include tests for technical constraints (performance, security, etc.)
- Test behavior, not implementation details
- Every skipped test needs documented rationale
