# Testing Methodology

---

## Test Philosophy

**Test what matters** - Focus on user experience and delivered features, not implementation details.

**Always test what you build** - Run tests yourself before completion. Don't ask the user to verify.

---

## Testing Principles

**Goal:** Catch bugs quickly and cheaply with fast feedback loops.

**Optimization rule:** Test with the fastest test type that can catch the bug.

**Tie-breaking rule:** If multiple test types apply, choose the faster one.

### Test Speed Hierarchy (Fast → Slow)

```
Unit (milliseconds)      ← Pure functions, no I/O
  ↓
Integration (seconds)    ← Multiple modules, database, API calls
  ↓
LLM Eval (seconds)       ← AI judgment, costs $0.01-0.30 per run
  ↓
E2E (seconds-minutes)    ← Full browser, user flows
```

### Anti-Patterns: Testing at the Wrong Level

❌ **Testing business logic with E2E tests**
```typescript
// BAD: Launching browser to test a calculation
test('discount calculation', async ({ page }) => {
  await page.goto('/checkout')
  await page.fill('[name="price"]', '100')
  await expect(page.locator('.total')).toContainText('80')
})

// GOOD: Unit test (runs in milliseconds)
it('applies 20% discount', () => {
  expect(calculateDiscount(100, 0.20)).toBe(80)
})
```

❌ **Testing UI components at the wrong level**
```typescript
// BAD: Heavy mocking in unit test (brittle, tests implementation details)
it('renders header', () => {
  const mockProps = { /* 50 lines of mocks */ }
  render(<Header {...mockProps} />)
  expect(mockProps.onLogout).toHaveBeenCalled() // Testing implementation
})

// BETTER: Integration test (fast, tests behavior with real data)
it('renders header with username', () => {
  render(<Header user={{ name: 'Alex' }} />)
  expect(screen.getByRole('banner')).toHaveTextContent('Alex')
})

// BEST for testing full user flow: E2E test (only when needed for multi-page flows)
test('user sees header after login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'alex@example.com')
  await page.click('button:has-text("Login")')
  await expect(page.getByRole('banner')).toContainText('Alex')
})
```

**Principle:** Use integration tests for component behavior, E2E tests for multi-page user flows.

### Target Distribution (Guideline, Not Rule)

**Focus on speed, not strict ratios:**
- Write as many **fast tests** (unit + integration) as possible
- Write **E2E tests** only for critical user paths that require a browser
- Write **LLM evals** only for AI features requiring quality judgment

**Common patterns by architecture:**
- **Microservices:** More integration tests needed (test service contracts, API interactions)
- **UI-heavy apps:** More E2E tests needed (test multi-page flows, visual interactions)
- **Pure libraries:** Mostly unit tests (pure functions, no external dependencies)
- **AI-powered apps:** Add LLM evals (test prompt quality, reasoning accuracy)

**Red flag:** If you have more E2E tests than integration tests, your test suite is too slow.

---

## TDD Workflow (RED → GREEN → REFACTOR)

**Test-Driven Development** - Write tests BEFORE implementation. Tests define expected behavior, code makes them pass.

### Phase 1: RED (Write Failing Tests)

**Steps:**
1. Write test based on expected input/output
2. **CRITICAL:** Run test and confirm it fails for the right reason
3. **DO NOT write any implementation code yet**
4. Commit the test when satisfied

**Critical warnings:**
- ⚠️ **No mock implementations** - Be explicit about TDD to avoid creating placeholder code for functionality that doesn't exist yet
- ⚠️ **Verify failure** - Test must fail before implementation (proves test works)
- ⚠️ **Performance** - Run single tests, not whole suite (`npm test -- path/to/file.test.ts`)

**Example:**
```typescript
// RED: Write failing test
it('calculates total with tax', () => {
  expect(calculateTotal(100, 0.08)).toBe(108)  // FAILS - function doesn't exist
})
```

### Phase 2: GREEN (Make Tests Pass)

**Steps:**
1. Write **minimum** code to make test pass
2. Run test - verify it passes
3. No extra features (YAGNI - You Ain't Gonna Need It)

**Example:**
```typescript
// GREEN: Minimal implementation
function calculateTotal(amount: number, taxRate: number): number {
  return amount + (amount * taxRate)
}
```

### Phase 3: REFACTOR (Clean Up)

**Steps:**
1. Improve code quality without changing behavior
2. Run tests - verify they still pass
3. Remove duplication, improve naming

**Optional: Subagent Validation**
- Use independent AI instance to verify implementation isn't overfitting to tests
- Ask: "Does this implementation handle edge cases beyond the test scenarios?"

---

## When to Use Each Test Type

### Decision Tree

Answer these questions in order to choose the test type. Questions are mutually exclusive - stop at the first match. If multiple seem to apply, use the tie-breaking rule (line 19): choose the faster one.

```
1. Does this test AI-generated content quality (tone, reasoning, creativity)?
   └─ YES → LLM Evaluation
      Examples: Narrative quality, prompt effectiveness, conversational naturalness
   └─ NO → Continue to question 2

2. Does this test require a real browser (Playwright/Cypress)?
   └─ YES → E2E test
      Examples: Multi-page navigation, browser-specific behavior (localStorage, cookies), visual regression, drag-and-drop
      Note: React Testing Library does NOT require a browser - that's integration testing
   └─ NO → Continue to question 3

3. Does this test interactions between multiple components/services?
   └─ YES → Integration test
      Examples: API + database, React component + state store, service + external API
   └─ NO → Continue to question 4

4. Does this test a pure function (input → output, no I/O or side effects)?
   └─ YES → Unit test
      Examples: Calculations, formatters, validators, pure algorithms
   └─ NO → Re-evaluate: What are you actually testing?
```

**Edge cases:**
- **Non-deterministic functions** (Math.random(), Date.now(), UUID generation) → Unit test with mocked randomness/time
- **Functions with environment dependencies** (process.env, window.location) → Integration test
- **Mixed pure + I/O logic** → Extract pure logic into separate function → Unit test pure part, integration test I/O

**Re-evaluation guide:**
If testing behavior that doesn't fit the four categories:
1. **Break it down:** Separate pure logic from I/O/UI concerns
2. **Test each piece separately:** Pure logic → Unit, I/O → Integration, Multi-page flow → E2E
3. **Example:** Login validation
   - Pure: `isValidEmail(email)` → Unit test
   - I/O: `checkUserExists(email)` → Integration test (hits database)
   - Full flow: Login form → Dashboard → E2E test (multi-page)

### What Bugs Can Each Test Type Catch?

Understanding which test type catches which bugs helps you choose the fastest effective test.

| Bug Type | Can Unit Test Catch? | Can Integration Test Catch? | Can E2E Test Catch? | Best Choice |
|----------|---------------------|----------------------------|-------------------|-------------|
| Calculation error | ✅ YES | ✅ YES | ✅ YES | Unit (fastest) |
| Invalid input handling | ✅ YES | ✅ YES | ✅ YES | Unit (fastest) |
| Database query returning wrong data | ❌ NO | ✅ YES | ✅ YES | Integration (faster than E2E) |
| API endpoint contract violation | ❌ NO | ✅ YES | ✅ YES | Integration (faster than E2E) |
| Race condition between services | ❌ NO | ✅ YES | ✅ YES | Integration (faster than E2E) |
| State management bug (Zustand, Redux) | ❌ NO | ✅ YES | ✅ YES | Integration (faster than E2E) |
| React component rendering wrong data | ❌ NO | ✅ YES | ✅ YES | Integration (faster than E2E) |
| CSS layout broken | ❌ NO | ❌ NO | ✅ YES | E2E (only option) |
| Multi-page navigation broken | ❌ NO | ❌ NO | ✅ YES | E2E (only option) |
| Browser-specific rendering | ❌ NO | ❌ NO | ✅ YES | E2E (only option) |
| Form validation UX (full flow) | ❌ NO | ⚠️ Partial | ✅ YES | E2E (tests full UX) |
| AI prompt quality degradation | ❌ NO | ❌ NO | ❌ NO | LLM Eval (only option) |
| AI reasoning accuracy | ❌ NO | ❌ NO | ❌ NO | LLM Eval (only option) |

**Key principle:** If multiple test types can catch the bug, choose the fastest one.

---

## Test Type Examples

### 1. Unit Tests

**Note:** If your business logic needs a database, API, or file system, use an integration test instead.

**Example:**
```typescript
// ✅ GOOD - Pure function
it('applies 20% discount for VIP users', () => {
  expect(calculateDiscount(100, { tier: 'VIP' })).toBe(80)
})

// ❌ BAD - Testing implementation details
it('calls setState with correct value', () => {
  expect(setState).toHaveBeenCalledWith({ count: 1 })
})
```

### 2. Integration Tests

**Key distinction:** Integration tests can render UI components but don't require a real browser. They run in Node.js with jsdom (simulated browser environment).

**Example:**
```typescript
// ✅ GOOD - Tests agent + state integration
describe('Agent + State Integration', () => {
  it('updates character state after agent processes action', async () => {
    const agent = new GameAgent()
    const store = useGameStore.getState()

    await agent.processAction('attack guard')

    expect(store.character.stress).toBeGreaterThan(0)
    expect(store.messages).toHaveLength(2) // player + AI response
  })
})
```

### 3. E2E Tests

**Fail-Fast Configuration (CRITICAL for TDD):**

Playwright must be configured to stop immediately on the first failure. This enables strict TDD workflow where you fix one test at a time.

**Required `playwright.config.ts` settings:**
```typescript
export default defineConfig({
  // Stop after first failure (fail-fast for TDD)
  maxFailures: 1,
  
  // No retries - we want immediate feedback
  retries: 0,
  
  // Sequential execution (one test at a time)
  workers: 1,
  fullyParallel: false,
  
  // Optional: Global teardown to force immediate exit
  globalTeardown: './tests/global-teardown.ts',
})
```

**Global teardown example (`tests/global-teardown.ts`):**
```typescript
async function globalTeardown() {
  // Force immediate exit on first failure
  setTimeout(() => {
    process.exit(0)
  }, 100)
}

export default globalTeardown
```

**Why fail-fast matters for TDD:**
- **RED phase:** Write failing test → see it fail → commit
- **GREEN phase:** Fix one test → see it pass → commit
- **No distractions:** Don't see 10 failures when fixing test #1
- **Faster feedback:** Know immediately if your fix worked

**Example:**
```typescript
// ✅ GOOD - Tests complete user flow
test('user creates account and first item', async ({ page }) => {
  await page.goto('/signup')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'secure123')
  await page.click('button:has-text("Sign Up")')
  await expect(page).toHaveURL('/dashboard')

  await page.click('text=New Item')
  await page.fill('[name="title"]', 'My First Item')
  await page.click('text=Save')
  await expect(page.getByText('My First Item')).toBeVisible()
})
```

### 4. LLM Evaluations

**Cost:** ~$0.01-0.30 per test run (depends on prompt size, caching)

**Example:**
```yaml
- description: "Infer user intent from casual input"
  vars:
    input: "I want to order a large pepperoni"
  assert:
    - type: javascript
      value: JSON.parse(output).intent === 'order_pizza'
    - type: llm-rubric
      value: |
        EXCELLENT: Confirms pizza type/size, asks for delivery details
        POOR: Generic response or wrong intent
```

**Assertion types:**

**Programmatic** (fast, deterministic):
- JSON schema validation
- Required fields present
- Values in valid ranges
- Output format compliance

**LLM-as-Judge** (nuanced, contextual):
- Reasoning quality
- Tone/style adherence
- Factual accuracy
- Conversational naturalness
- Domain expertise demonstration

**When to skip LLM evals:**
- Structured output validation (use programmatic tests)
- Simple classification tasks (unit tests sufficient)
- Non-AI features

---

## Cost Considerations

**LLM eval costs:** $0.01-0.30 per run depending on prompt size. **Prompt caching reduces costs by 90%** (30 scenarios: $0.30 → $0.03 after first run).

**Cost reduction strategies:**
- Cache static content (system prompts, examples, rules)
- Batch multiple scenarios in one run
- Run full evals on PR/schedule, not every commit

**ROI:** Catching one bad prompt change before production >> eval costs

---

## Test Coverage Goals

- **Unit tests:** 80%+ coverage of pure functions
- **Integration tests:** All critical paths covered (see definition below)
- **E2E tests:** All critical multi-page user flows have at least one E2E test
- **LLM evals:** All AI features have evaluation scenarios

**What are "critical paths"?**
- **Always critical:** Authentication, payment/checkout, data loss scenarios (delete, overwrite)
- **Usually critical:** Core user workflows (create → edit → publish), primary feature flows
- **Rarely critical:** UI polish (button colors, layout tweaks), admin-only features with low usage
- **Rule of thumb:** If it breaks, would users notice immediately and be unable to complete their main task?

---

## Writing Effective Tests

### AAA Pattern (Arrange-Act-Assert)

Structure tests clearly: Setup data (Arrange) → Execute behavior (Act) → Verify expectations (Assert).

```typescript
it('applies discount to VIP users', () => {
  const user = { tier: 'VIP' }, cart = { total: 100 }  // Arrange
  const result = applyDiscount(user, cart)              // Act
  expect(result.total).toBe(80)                         // Assert
})
```

### Test Naming

Be descriptive and specific, not vague or implementation-focused.

```typescript
// ✅ GOOD
it('returns 401 when API key is missing')
it('preserves user input after validation error')

// ❌ BAD
it('works correctly')
it('should call setState')
```

### Test Independence

**Each test should:**
- Run in any order
- Not depend on other tests
- Clean up its own state
- Use fresh fixtures/data

```typescript
// ✅ GOOD - Fresh state per test
beforeEach(() => { gameState = createFreshGameState() })

// ❌ BAD - Shared state (test B depends on test A)
let sharedUser = createUser()
it('test A', () => { sharedUser.name = 'Alice' })
it('test B', () => { expect(sharedUser.name).toBe('Alice') })
```

### Async Testing

**NEVER use arbitrary timeouts** - Makes tests slow and non-deterministic.

```typescript
// ❌ BAD - Arbitrary timeout
await page.waitForTimeout(3000)  // What if it takes 3.1 seconds?
await sleep(500)  // Flaky test

// ✅ GOOD - Poll until condition is met
await expect.poll(() => getStatus()).toBe('ready')
await page.waitForSelector('[data-testid="loaded"]')
await waitFor(() => expect(screen.getByText('Success')).toBeVisible())
```

**Why:** Polling is deterministic (passes when condition is met) and faster (no unnecessary waiting).

---

## What Not to Test

❌ **Implementation details** - Private methods, CSS classes, internal state, how (test what users see)
❌ **Third-party libraries** - Assume React/Axios work, test YOUR code
❌ **Trivial code** - Getters/setters with no logic, pass-through functions
❌ **UI copy** - Exact text (use regex `/submit/i`), specific wording (test error shown, not message)

---

## CI/CD Integration

Run unit+integration tests on every commit (fast feedback), E2E tests on every PR, and LLM evals on schedule (weekly to catch regressions without per-commit cost).

---

## Quick Reference

| Need to test... | Test type | Technology | Speed | Cost |
|----------------|-----------|------------|-------|------|
| Pure function | Unit | Vitest | Fast | Free |
| Service integration | Integration | Vitest | Medium | Free |
| Full user flow | E2E | Playwright | Slow | Free |
| AI reasoning quality | LLM eval | Promptfoo | Slow | $0.01-0.30 |

---

## Project-Specific Testing Documentation

**Location:** `tests/AGENTS.md` (may be nested like `packages/web/tests/AGENTS.md` in monorepos)

**Purpose:** Document project-specific testing stack, commands, and setup. Supplements global methodology.

**What to include:**
- **Tech stack:** Testing frameworks (Vitest/Jest, Playwright/Cypress, Promptfoo)
- **Test commands:** How to run tests, including single-file execution for performance
- **Setup requirements:** API keys, build steps, database setup, browser installation
- **File structure:** Where tests live and naming conventions
- **Project patterns:** Custom helpers, fixtures, mocks, assertion styles
- **TDD guidance:** Project-specific workflow expectations (write tests first, commit tests before implementation)
- **Coverage requirements:** Minimum coverage thresholds or critical paths
- **PR requirements:** Test passage requirements before merge

**Example:**
```markdown
# Testing

## Tech Stack
- Unit/Integration: Vitest
- E2E: Playwright
- LLM Evals: Promptfoo

## Commands
npm test                           # All tests
npm test -- path/to/file.test.ts   # Single file (performance)
npm run test:coverage              # With coverage report
npm run test:e2e                   # E2E tests only

## TDD Workflow
1. Write failing tests first (RED phase)
2. Confirm tests fail: `npm test -- path/to/file.test.ts`
3. Commit tests before implementation
4. Implement minimum code to pass (GREEN phase)
5. Refactor while keeping tests green

## Setup
1. Install: `npm install`
2. Browsers: `npx playwright install`
3. API keys: `export ANTHROPIC_API_KEY=sk-ant-...`
4. Build before testing: `npm run build`

## Coverage Requirements
- Unit tests: 80%+ for business logic
- E2E tests: All critical user paths

## PR Requirements
- All tests must pass
- No skipped tests without justification
- Coverage thresholds met
```

**If not found:** Ask user "Where are the testing docs?"

**Cascading precedence:**
1. **Global** (`~/.claude/testing-methodology.md`) - Universal methodology (test type selection, TDD workflow)
2. **Project** (`tests/AGENTS.md`) - Specific stack, commands, patterns
