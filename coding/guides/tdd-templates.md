# TDD Templates & Best Practices

Concrete templates for user stories and test definitions following TDD best practices.

**LLM Instruction Design:** These templates create documentation that LLMs read and follow. For comprehensive framework on writing clear, actionable LLM-consumable documentation, see `@~/.claude/llm-instruction-design.md`.

---

## Fillable Template Files (When to Use Each)

**User Stories** (`@~/.claude/user-stories-template.md`) - **For features/issues**
- Multiple related stories in one file
- Status tracking (✅/❌ per story and AC)
- Test file references and implementation notes
- Completion % and phase tracking
- Use for GitHub issues with multiple user stories
- Guidance: `@~/.claude/user-story-guide.md`

**Test Definitions** (`@~/.claude/test-definitions-feature.md`) - **For feature test suites**
- Organized by test suites and individual tests
- Status tracking (✅ Passing / ⏭️ Skipped / ❌ Not Implemented / 🔴 Failing)
- Detailed steps and expected outcomes
- Coverage summary with percentages
- Test execution commands
- Guidance: `@~/.claude/test-definitions-guide.md`

**Design Doc** (`@~/.claude/design-doc-template.md`) - **For feature/system implementation**
- Implementation-focused (architecture, components, data model, user flow, component interaction)
- Key technical decisions with rationale (includes "why")
- Full [N] and [N+1] examples (matches user stories/test definitions pattern)
- ~121 lines, optimized for LLM filling and consumption
- No duplication (references user stories, test definitions)
- Guidance: `@~/.claude/architecture-guide.md`

**Architecture Document** (no template) - **For project/package-wide architecture decisions**
- One `ARCHITECTURE.md` per project or package (in monorepos)
- Document principles, data model, component design, decision rationale
- Living document (updated as architecture evolves)
- Include version, status, table of contents
- All architectural decisions in one place (not separate ADRs)
- Guidance: `@~/.claude/architecture-guide.md`

**Example prompts:**
- "Create user stories for issue #N" → Uses user stories template
- "Create test definitions for issue #N" → Uses test definitions template
- "Create a design doc for [feature]" → Uses design doc template (2-3 pages)
- "Update the project architecture doc" → Adds to existing ARCHITECTURE.md

**TDD Workflow:** See `@~/.claude/testing-methodology.md` for comprehensive RED → GREEN → REFACTOR workflow with latest best practices

---

## User Story Templates

### Standard Format (Recommended)

```
As a [role/persona]
I want [capability/feature]
So that [business value/benefit]

Acceptance Criteria:
- [Specific, testable condition 1]
- [Specific, testable condition 2]
- [Specific, testable condition 3]

Out of Scope:
- [What this story explicitly does NOT include]
```

### Given-When-Then Format (Behavior-Focused)

```
Given [initial context/state]
When [action/event occurs]
Then [expected outcome]

And [additional context/outcome]
But [exception/edge case]
```

### Job Story Format (Outcome-Focused)

```
When [situation/context]
I want to [motivation/job-to-be-done]
So I can [expected outcome]
```

---

## User Story Best Practices

### ✅ GOOD Examples

**Web App Feature:**
```
As a user with multiple campaigns
I want to switch between campaigns without reloading the page
So that I can quickly compare game states

Acceptance Criteria:
- Campaign list shows all saved campaigns with last-played timestamp
- Clicking a campaign loads its state within 200ms
- Current campaign is visually highlighted
- Switching preserves unsaved input in the current campaign

Out of Scope:
- Campaign merging/deletion (separate story)
- Multi-campaign view (future epic)
```

**API Feature:**
```
Given I am an authenticated API user
When I POST to /api/campaigns with valid JSON
Then I receive a 201 Created response with campaign ID
And the campaign appears in my GET /api/campaigns list
But invalid JSON returns 400 with descriptive error messages
```

**CLI Feature:**
```
When I'm debugging a failing test
I want to see the exact LLM prompt and response
So I can identify whether the issue is prompt engineering or code logic

Acceptance Criteria:
- `--verbose` flag prints full prompt to stderr
- Response JSON is pretty-printed with syntax highlighting
- Token count and cost are displayed
- Works with all agent types (rules, narrative, character)
```

### ❌ BAD Examples (Anti-Patterns)

**Too Vague:**
```
As a user
I want the app to work better
So that I'm happy
```
- ❌ No specific role
- ❌ "Work better" is not measurable
- ❌ No acceptance criteria

**Too Technical (Implementation Details):**
```
As a developer
I want to refactor the CharacterStore to use Immer
So that state mutations are prevented
```
- ❌ This is a technical task, not a user story
- ❌ Users don't care about Immer
- ✅ Better as: Spike ticket or refactoring task

**Missing "So That" (No Value):**
```
As a GM
I want to roll dice
```
- ❌ No business value stated
- ❌ Why does the GM need this?

**Multiple Features in One Story:**
```
As a player
I want to create characters, manage inventory, and track relationships
So that I can play the game
```
- ❌ 3+ separate features bundled together
- ❌ Cannot be completed in one sprint
- ✅ Split into 3 stories

---

## Test Definition Templates

### Unit Test Template

```typescript
describe('[Unit/Module Name]', () => {
  describe('[function/method name]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange: Set up test data and dependencies
      const input = { /* test data */ };
      const expected = { /* expected output */ };

      // Act: Execute the function under test
      const result = functionUnderTest(input);

      // Assert: Verify the outcome
      expect(result).toEqual(expected);
    });

    it('should throw [error type] when [invalid condition]', () => {
      const invalidInput = { /* bad data */ };

      expect(() => functionUnderTest(invalidInput))
        .toThrow('Expected error message');
    });

    it('should handle edge case: [specific edge case]', () => {
      // Edge cases: empty arrays, null, undefined, boundary values
    });
  });
});
```

### Integration Test Template

```typescript
describe('[Feature Name] Integration', () => {
  beforeEach(async () => {
    // Setup: Initialize database, mock external APIs
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Teardown: Clean up resources
    await cleanupTestDatabase();
  });

  it('should [complete user flow] successfully', async () => {
    // Arrange: Create test user and prerequisites
    const user = await createTestUser();

    // Act: Execute the full workflow
    const campaign = await createCampaign(user.id);
    const character = await createCharacter(campaign.id);
    const result = await performAction(character.id, 'Skirmish');

    // Assert: Verify end-to-end behavior
    expect(result.position).toBe('risky');
    expect(result.effect).toBe('standard');
    expect(campaign.history).toHaveLength(1);
  });

  it('should rollback transaction when [failure occurs]', async () => {
    // Test error handling and data consistency
  });
});
```

### E2E Test Template (Playwright/Cypress)

```typescript
test.describe('[User Journey Name]', () => {
  test('should [complete full user flow]', async ({ page }) => {
    // Arrange: Navigate to starting point
    await page.goto('/campaigns');

    // Act: Simulate user interactions
    await page.click('button:has-text("New Campaign")');
    await page.fill('[name="campaignName"]', 'The Bloodletters');
    await page.click('button:has-text("Create")');

    // Assert: Verify UI state matches expectations
    await expect(page.locator('h1')).toContainText('The Bloodletters');
    await expect(page.locator('.campaign-list')).toContainText('The Bloodletters');

    // Act: Continue the flow
    await page.click('button:has-text("Create Character")');

    // Assert: Verify next state
    await expect(page).toHaveURL(/\/characters\/create/);
  });
});
```

---

## Test Best Practices

### Test Naming Conventions

**✅ GOOD - Descriptive and Specific:**
```typescript
it('should return risky position when outnumbered 3-to-1')
it('should cache LLM responses for 5 minutes to reduce costs')
it('should preserve armor state after reducing harm from L2 to L1')
it('should throw ValidationError when dice pool is negative')
```

**❌ BAD - Vague or Implementation-Focused:**
```typescript
it('works correctly')  // What does "correctly" mean?
it('tests the function')  // Obvious, not descriptive
it('should call setState')  // Implementation detail
it('scenario 1')  // No context
```

### Arrange-Act-Assert (AAA) Pattern

**Always use AAA structure for clarity:**

```typescript
it('should calculate critical success on 6', () => {
  // Arrange: Setup test data
  const diceResults = [6, 6, 4];

  // Act: Execute the logic
  const outcome = evaluateDiceRoll(diceResults);

  // Assert: Verify expectations
  expect(outcome).toBe('critical');
  expect(outcome.highestDie).toBe(6);
});
```

### Test Independence

**✅ GOOD - Isolated Tests:**
```typescript
beforeEach(() => {
  // Each test gets fresh state
  gameState = createFreshGameState();
});

it('test A', () => { /* uses gameState */ });
it('test B', () => { /* uses separate gameState */ });
```

**❌ BAD - Shared State:**
```typescript
let sharedState = {}; // Tests modify this
it('test A', () => { sharedState.foo = 'bar'; });
it('test B', () => { expect(sharedState.foo).toBe('bar'); }); // Depends on test A!
```

### What to Test

**✅ Test These:**
- Public API behavior (functions, methods, components)
- User-facing features (can the user do X?)
- Edge cases (empty, null, boundary values)
- Error handling (does it fail gracefully?)
- Integration points (API calls, database queries)

**❌ Don't Test These:**
- Private implementation details (internal helper functions)
- Third-party library internals (assume React works)
- Generated code (unless it's business logic)
- Trivial getters/setters with no logic

### Test Data Builders

**Use builders for complex test data:**

```typescript
// ✅ GOOD - Reusable test data builder
function buildCharacter(overrides = {}) {
  return {
    id: 'test-char-1',
    name: 'Cutter',
    playbook: 'Cutter',
    stress: 0,
    harm: [],
    armor: true,
    ...overrides  // Easy to customize per test
  };
}

it('should increase stress when resisting', () => {
  const character = buildCharacter({ stress: 3 });
  // Test uses character with stress=3
});
```

---

## LLM Testing Patterns

### Promptfoo LLM-as-Judge Template

```yaml
# Tests for AI outputs (narrative quality, reasoning)
prompts:
  - file://prompts/gm-narrative.txt

providers:
  - id: anthropic:messages:claude-sonnet-4
    config:
      temperature: 1.0

tests:
  - description: "GM should telegraph position/effect before roll"
    vars:
      action: "I Skirmish with the gang enforcers"
      character: { /* character JSON */ }
    assert:
      - type: llm-rubric
        value: |
          The GM response must:
          - State position (controlled/risky/desperate) explicitly
          - State effect (limited/standard/great) explicitly
          - Explain WHY these were chosen based on fiction

          Grade as:
          EXCELLENT: All three present and clear
          ACCEPTABLE: Position and effect stated, reasoning weak
          POOR: Missing position or effect

      - type: llm-rubric
        value: |
          Does the GM show collaborative tone (asking questions, inviting detail)?

          EXCELLENT: Asks open-ended questions, invites player creativity
          ACCEPTABLE: Acknowledges player action, minimal collaboration
          POOR: Dictates outcomes without player input
```

### Integration Test with Real LLM

```typescript
describe('Rules Agent Integration', () => {
  it('should infer correct position for desperate situation', async () => {
    // Arrange
    const scenario = {
      action: 'I Skirmish against 5 armed guards while wounded',
      character: buildCharacter({ harm: [{ level: 2, description: 'Broken Arm' }] })
    };

    // Act: Real LLM call (costs ~$0.01)
    const response = await rulesAgent.processAction(scenario);

    // Assert: Structured output (not narrative quality)
    expect(response.position).toBe('desperate');
    expect(response.effect).toBe('limited');
    expect(response.dicePool).toBeLessThan(3); // Harm reduces dice
    expect(response.consequences).toContain('severe harm');
  });
});
```

---

## INVEST Checklist (Apply to Every User Story)

Before writing a story, verify it passes all six criteria:

- [ ] **Independent** - Can be completed without depending on other stories
- [ ] **Negotiable** - Details emerge through conversation, not a fixed contract
- [ ] **Valuable** - Delivers clear value to user or business
- [ ] **Estimable** - Team can estimate effort (not too vague, not too detailed)
- [ ] **Small** - Completable in one sprint/iteration (typically 1-5 days)
- [ ] **Testable** - Clear acceptance criteria define when it's done

**If a story fails any criteria, it's not ready - refine or split it.**

---

## Quick Reference

**User Story Red Flags (INVEST Violations):**
- No acceptance criteria → Too vague
- >3 acceptance criteria → Split into multiple stories
- Technical implementation details → Wrong audience
- Missing "So that" → No clear value

**Test Red Flags:**
- Test name doesn't describe behavior → Rename
- Test depends on another test's state → Isolate
- Test is >50 lines → Break into smaller tests
- Test tests implementation details → Test behavior instead
- Test never fails → Remove (not testing anything)

**When to Write E2E vs Integration vs Unit:**
- **E2E:** User can complete full workflow (slow, expensive, high confidence)
- **Integration:** Multiple modules work together (moderate speed, good ROI)
- **Unit:** Single function/module logic (fast, cheap, low-level confidence)

**Ratio guidance:** 70% unit, 20% integration, 10% E2E (adjust based on project)
