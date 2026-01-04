# BDD vs TDD in Software Development

## Short Answer

Both are test-first approaches. TDD focuses on code correctness. BDD focuses on system behavior and shared understanding.

## TDD (Test-Driven Development)

Write a failing unit test → write minimal code → refactor.

- Tests are technical and close to the implementation
- **Audience**: developers
- **Goal**: correct, well-designed code

**Example**:

```
shouldCalculateTaxForCalifornia()
```

## BDD (Behavior-Driven Development)

Write behavior scenarios first, in plain language.

- Tests describe what the system should do, not how
- **Audience**: developers + product + stakeholders
- **Goal**: shared understanding and correct behavior

**Example**:

```gherkin
Given a California customer
When they check out
Then sales tax is applied
```

## Key Differences

| Dimension        | TDD                        | BDD                      |
| ---------------- | -------------------------- | ------------------------ |
| Focus            | Implementation correctness | Business behavior        |
| Test level       | Unit tests                 | Acceptance / integration |
| Language         | Code-centric               | Human-readable           |
| Who participates | Developers                 | Dev + Product + Business |
| Output           | Tests                      | Executable specs         |

## How They Relate

BDD builds on TDD.

- You often do BDD for features, TDD inside them
- In practice: BDD defines **what**, TDD ensures **how** is correct

### Rule of Thumb

- If you're arguing about requirements, use BDD
- If you're shaping APIs and logic, use TDD

---

# BDD → TDD Integrated Process Flow

Below is a practical end-to-end process flow that combines BDD → TDD in a single development lifecycle.

## 1. Define Behavior (BDD)

**Owner**: Product + Engineering  
**Goal**: Shared understanding

- Start with a user outcome
- Write scenarios in plain language (Given / When / Then)
- Agree on edge cases and success criteria

**Output**: Executable behavior specs

## 2. Validate Scenarios

**Owner**: Team  
**Goal**: Prevent misbuilt features

- Review scenarios for clarity and completeness
- Confirm they describe behavior, not implementation
- Lock scenarios before coding

**Gate**: No coding until scenarios are approved

## 3. Break Behavior into Technical Work

**Owner**: Engineers  
**Goal**: Make behavior implementable

Decompose scenarios into:

- Components
- APIs
- Domain logic
- Identify units that need tests

**Output**: Engineering task list

## 4. Implement with TDD (Inner Loop)

**Owner**: Engineers  
**Goal**: Correct, maintainable code

For each unit:

1. Write a failing unit test
2. Write minimal code to pass
3. Refactor safely

**Output**: Well-tested implementation

## 5. Run BDD Scenarios (Outer Loop)

**Owner**: CI / QA / Team  
**Goal**: Validate behavior end-to-end

- Execute behavior scenarios against the system
- Ensure user-visible behavior matches expectations

**Gate**: Feature is only "done" if scenarios pass

## 6. Iterate

**If unit tests fail**:
→ Fix implementation

**If BDD scenarios fail**:
→ Either behavior was misunderstood or requirements changed  
→ Update scenarios first, then code

## Mental Model

- **BDD** = What & Why
- **TDD** = How & Correctness
- BDD guards product intent
- TDD guards code quality

### One-Line Summary

Define behavior first (BDD), build it correctly second (TDD), and never ship code that passes tests but fails intent.

---

# BDD → TDD Flow (One Level Deeper)

Here's the same BDD → TDD flow, expanded one level deeper with clear sub-steps, artifacts, and gates.

## 1. Define Behavior (BDD)

**Inputs**: problem statement / user story / intent

### Activities

**3 Amigos kickoff** (Product + Eng + QA): align on user goal and scope.

**Example mapping**:

- Rules (business logic)
- Examples (concrete cases)
- Questions (unknowns / risks)

**Draft Given / When / Then scenarios**:

- Happy path + key unhappy paths + boundary cases
- Define observable outcomes (what can be asserted)

### Outputs (artifacts)

- Feature/scenario spec (e.g., .feature file or equivalent)
- Glossary of domain terms (to keep wording consistent)
- Open questions list (owned, dated)

## 2. Validate Scenarios (BDD Quality Gate)

**Goal**: scenarios are testable, unambiguous, and stable enough to build.

### Checklist

- **Atomic**: one behavior per scenario
- **Observable**: "Then" is measurable (state change, API response, UI text)
- **No implementation detail**: avoid "click button X" unless it's truly UI behavior
- **Deterministic**: no time, randomness, external dependency without control
- **Data is defined**: what preconditions/data must exist to run it

### Gate / Definition of Ready (DoR)

Scenarios approved + questions resolved (or explicitly deferred with a plan)

## 3. Break Behavior into Technical Work (Design + Planning)

### Activities

**Map each scenario step to system seams**:

- UI flow, API endpoints, service calls, events, DB effects

**Identify components and responsibilities**:

- domain rules, adapters, persistence, integrations

**Decide test strategy per component**:

- unit tests (fast rules/logic)
- component/contract tests (API boundaries)
- BDD acceptance tests (end-to-end behavior)

**Create task breakdown**:

- domain logic tasks
- API/UI tasks
- test harness/fixtures tasks
- step-definition tasks

### Outputs

- Engineering task list + dependency notes
- Test plan notes (what's unit vs component vs BDD)

## 4. Implement with TDD (Inner Loop)

For each unit/component:

1. Write failing unit test (express the rule/behavior at code level)
2. Implement minimal code to pass
3. Refactor (clean design, reduce duplication)
4. Repeat for edge cases derived from BDD examples

### Practices that keep this clean

- Keep domain logic isolated (easy to unit test)
- Use interfaces/adapters for external services (mockable)
- Commit in small increments with green tests

### Outputs

- Unit test suite + implementation
- (Optional) contract/component tests for key boundaries

## 5. Run BDD Scenarios (Outer Loop)

### Activities

**Create/finish step definitions**:

- keep steps thin (translate intent → call public API/UI)
- push logic into reusable helpers/clients, not step files

**Build test data setup/teardown**:

- fixtures, factories, seeded data, or API-based setup

**Execute scenarios locally, then in CI**:

- publish reports (pass/fail + screenshots/logs if UI)

### Gate / Definition of Done (DoD) for the feature

- All BDD scenarios pass in CI
- No critical flakes (or flake addressed with a root cause ticket)

## 6. Iterate (Triage + Update Loop)

When something fails, classify fast:

- **Scenario wrong / requirement changed**: update scenario first → then code
- **Bug in implementation**: TDD at the failing unit boundary → fix → refactor
- **Test flake / environment issue**: stabilize harness/data/timeouts → add guardrails
- **Missing coverage**: add scenario or add unit tests based on the gap

### Output

Updated living specs + stable automated suite

## Compact Flow Diagram

**Behavior (BDD)**:  
3 Amigos → Example Mapping → Scenarios drafted → Scenario quality gate ✅

**Build (TDD)**:  
Decompose → Unit TDD cycles (red/green/refactor) → Integrate

**Prove (BDD)**:  
Step defs + fixtures → Run scenarios locally → Run in CI → Done ✅

---

# Steps Before "Define Behavior"

There are a few high-leverage steps that typically come before "Define Behavior (BDD)" so the BDD session is fast, concrete, and not derailed by unknowns.

## 0. Intake and Triage

**Goal**: decide if this is worth doing now and what type of work it is.

- Capture the request (feature, bug, tech debt, compliance, etc.)
- Identify owner (PM/Eng) and impacted users/systems
- Initial priority call (now / next / later)

**Output**: a scoped "work item" in the backlog

## 1. Problem Framing

**Goal**: align on the problem before discussing solutions.

- What user pain/opportunity are we addressing?
- Current state vs desired state
- Primary user/persona + key use case

**Output**: 2–5 sentences of problem statement + target user

## 2. Define Success

**Goal**: make "good" measurable.

- Success metrics (business + product)
- Leading indicators (usage, conversion, latency, error rates)
- "Must not regress" metrics (reliability, cost, support tickets)

**Output**: a short success definition + how it will be observed

## 3. Scope and Constraints

**Goal**: bound the work so BDD scenarios don't sprawl.

- In-scope / out-of-scope
- Assumptions
- Known constraints (platform, latency, budget, legal, accessibility)
- Dependencies (teams, services, vendors)

**Output**: scope box + dependency list

## 4. Baseline the Current Behavior

**Goal**: avoid arguing about what the system currently does (especially for changes/bugs).

- Repro steps (for bugs) or current user journey map
- Known edge cases from support/sales/ops
- Existing analytics/log evidence

**Output**: "as-is" behavior notes (sometimes a single "characterization" test)

## 5. Feasibility and Risk Scan

**Goal**: surface "unknown unknowns" early.

- Technical feasibility (APIs available? data exists? permissions?)
- Security/privacy/compliance considerations
- Operational risks (migration, rollout, monitoring)

**Output**: risk list + any required spikes

## 6. Prep Inputs for the BDD Session

**Goal**: make "Define Behavior" concrete immediately.

- Wireframes/mockups (if UI)
- Example data (sample requests, payloads, edge-case datasets)
- Glossary of domain terms (to avoid step wording drift)

**Output**: BDD-ready packet

## Gate: "Ready to Define Behavior"

Proceed to BDD when you have:

- Clear problem + scope
- Clear success signal
- Major unknowns either resolved or explicitly tracked with a plan

---

# TDD Micro-Loop and Design Work

## What "Classic" TDD Means (the micro-loop)

The canonical TDD cycle is:

### Red

- Write a new test for a small behavior
- Run it and confirm it fails for the right reason

### Green

- Write the minimum production code to make the test pass

### Refactor

- Improve design/structure (rename, extract, remove duplication, reshape APIs)
- Keep tests green throughout

**Key point**: "writing the test" is part of Red, but Red isn't complete until you execute it and see it fail.

## Where "Design and Architecture Work" Fits

TDD does not forbid design/architecture—it just treats it differently:

### A) Design happens continuously via Refactor (inside the loop)

A large portion of "design" work in TDD is:

- shaping interfaces to make tests easy to write
- improving cohesion/decoupling
- extracting domain concepts
- reorganizing modules

That's **Refactor**.

### B) Some design happens before you start the loop (outside the loop)

In real systems, you often do lightweight up-front work such as:

- choose boundaries (service vs library vs module)
- identify integration points / APIs
- decide persistence strategy or messaging patterns
- do a quick "walking skeleton" or spike to reduce uncertainty

That's not "wrong"—it's just not the TDD loop itself. It's discovery / architecture / planning that precedes or brackets TDD.

## A Practical "Expanded TDD Flow"

This matches what many teams actually do:

### Select a thin slice (the smallest meaningful behavior)

0.1) **Test list** (write the list of tests you think you'll need)  
0.2) **Micro-design sketch** (interfaces, collaborators, seams; keep it lightweight)

1. **Red** (write one test + run it; fail)
2. **Green** (minimal code to pass)
3. **Refactor** (design cleanup; maybe bigger structural improvements)
4. **Repeat**

If the work is architecture-heavy, add:

- **Spike / prototype** (time-boxed) before step 1, then throw away or harden intentionally

## The Crisp Answer

You're not wrong that teams often do "test definition" and some design/arch thinking early.

But in strict TDD terminology:

- "test definition" is part of **Red**, and
- "design" is primarily expressed through **Refactor**, with only minimal up-front design unless necessary

---

# What Happens in and After the "Done" Phase

In BDD, "Done" is less "we finished coding" and more "we have a stable, executable spec that we can safely carry forward." The work before you move to the next feature is mostly release hardening + spec stewardship.

## In the Done Phase (BDD-specific)

### Acceptance suite is green in CI

- All agreed scenarios pass (happy path + key edges)
- Runs are repeatable (no hidden dependencies, stable data, controlled time)

### Scenario quality check (keep the spec maintainable)

- Remove duplicate/overlapping scenarios
- Tighten assertions (Then steps validate outcomes, not internal mechanics)
- Normalize language to the glossary (domain terms stay consistent)

### Promote scenarios into your regression contract

- Tag scenarios (e.g., @smoke, @regression, @billing)
- Decide which ones must run on every PR vs nightly (cost vs confidence)

### Flake and runtime handling

- If any scenario is flaky: fix root cause or quarantine with an owner + SLA
- Optimize slow setup (fixtures, seed data, test env reuse)

### Traceability and closure

- Link: feature ticket ↔ scenarios ↔ PRs ↔ release item
- Ensure the scenarios represent the final agreed behavior (not an outdated draft)

## Immediately After Done (before starting the next feature)

### Release readiness

- Confirm non-functional requirements: performance, security, privacy, accessibility (as applicable)
- Confirm migrations/backward compatibility
- Confirm observability: logs, metrics, dashboards, alerts for the new behavior

### Rollout plan (risk-managed release)

- Feature flag / gradual rollout / canary strategy (if applicable)
- Clear rollback plan (what to revert, what data is impacted)
- Release notes / internal comms (support, sales, ops)

### Production verification

- Smoke check in prod (or prod-like): the critical BDD "smoke" scenarios or equivalent
- Validate key metrics against the success definition (baseline vs expected)

### Operational follow-through

- Monitor for a defined window (errors, latency, drops in conversion, support tickets)
- Triage any issues and decide: hotfix vs backlog

### Learning + backlog hygiene

- Capture deltas: what changed in understanding, what surprised you
- File follow-ups: tech debt discovered, missing scenarios, tooling improvements
- Update team documentation if the behavior affects integration or usage patterns

## Practical "Exit Criteria" Before Moving On

You can confidently start the next feature when:

- The new scenarios are part of a stable regression set (or explicitly quarantined with an owner)
- Release is deployed (or scheduled) with monitoring and rollback covered
- Any remaining work is clearly tracked as follow-up tickets (not "tribal knowledge")

---

# Complete End-to-End BDD → TDD Workflow

Below is an updated, detailed, end-to-end workflow that integrates pre-BDD shaping, BDD for behavior/specs, TDD for implementation, and post-"Done" release stewardship.

## Phase 0 — Intake and Triage

**Goal**: decide whether to do it now and what "it" is.

- Capture the request (feature/bug/improvement/compliance)
- Identify stakeholders and impacted surfaces (UI/API/integration/billing, etc.)
- Assign an owner (PM + Eng counterpart)
- Initial priority and sequencing decision

### Outputs

- Backlog item + owner + target window
- Initial scope note (1–3 sentences)

### Gate

Work is accepted into the pipeline (or explicitly deferred)

## Phase 1 — Problem Framing and Success Definition

**Goal**: align on the problem and how you'll know it worked.

- Write a problem statement (current pain → desired outcome)
- Define the primary user and context
- Define success:
  - Product/business metric(s)
  - Reliability/performance expectations
  - "Must not regress" constraints (cost, latency, churn, support load)

### Outputs

- Problem statement
- Success criteria (measurable)
- Non-negotiable constraints list

### Gate

Problem + success are agreed (no solution debate required yet)

## Phase 2 — Scope Box and Risk Scan

**Goal**: prevent scope explosion and surface unknowns early.

- Define In-scope / Out-of-scope
- Identify dependencies (teams, services, vendors)
- Risk scan:
  - Data availability
  - Security/privacy/compliance
  - Operational complexity (migrations, rollouts)
- If uncertainty is high, run a time-boxed spike (prototype / investigation)

### Outputs

- Scope box
- Dependency list
- Risk log + mitigation plan (including spikes)

### Gate (Ready for BDD session)

Biggest unknowns either resolved or explicitly tracked with an owner/plan

## Phase 3 — Define Behavior (BDD)

**Goal**: create shared, testable definitions of "what it should do."

- 3 Amigos working session (PM + Eng + QA)
- Example mapping:
  - Business rules
  - Concrete examples
  - Open questions
- Write scenarios in Given / When / Then:
  - Happy path
  - Key failure modes
  - Boundary conditions
- Establish a domain glossary (terms used in steps must be consistent)

### Outputs

- BDD scenarios (feature/spec)
- Glossary
- Open questions (if any) + decision log

## Phase 4 — Scenario Quality Gate (BDD "Definition of Ready")

**Goal**: ensure scenarios are buildable and won't thrash.

### Checklist

- Each scenario is atomic (one behavior)
- "Then" is observable and assertable
- No hidden implementation detail
- Deterministic setup (data/time/external services controlled)
- Required test data and preconditions are explicit

### Outputs

Approved scenario set tagged as "Ready"

### Gate

No implementation starts until this passes (or exceptions are explicit)

## Phase 5 — Technical Decomposition and Test Strategy

**Goal**: convert behavior into implementable slices with clear test layers.

- Identify seams and components:
  - UI
  - API
  - Domain logic
  - Persistence
  - Integrations/events
- Choose test layering:
  - Unit tests (fast rules/logic)
  - Component/contract tests (service/API boundaries)
  - BDD acceptance tests (end-to-end behavior)
- Define a "thin slice" plan (walking skeleton if needed)

### Outputs

- Task breakdown (engineer-ready)
- Test plan (what goes where)
- Minimal architecture notes (interfaces, boundaries)

### Gate

A thin slice can be implemented and validated end-to-end

## Phase 6 — Implement (TDD inner loop + integration)

**Goal**: build correctly, keep design clean, stay shippable.

### 6A. TDD micro-loop (per unit of behavior)

1. **Test list** (quick list of tests you expect to need for the slice)
2. **Micro-design sketch** (interfaces/collaborators only; keep it light)
3. **Red**: write one test + run it (confirm fail for right reason)
4. **Green**: minimal code to pass
5. **Refactor**: improve names, structure, duplication, boundaries
6. **Repeat** until the slice is complete

### 6B. Component/contract tests (as needed)

Validate boundaries: API shapes, event schemas, integration expectations

### Outputs

- Production code
- Unit test suite
- Component/contract tests (where applicable)

### Gate

Unit + component tests green locally and in CI

## Phase 7 — BDD Automation (outer loop)

**Goal**: prove the feature behavior matches the agreed scenarios.

- Implement step definitions:
  - Steps should call public interfaces (UI/API), not internals
  - Keep steps thin; put logic in helpers/clients
- Test data strategy:
  - Fixtures/factories/seed scripts
  - Deterministic time and external dependency control
- Run scenarios:
  - Local (dev confidence)
  - CI (merge gate)
  - Publish reports (failures are diagnosable)

### Outputs

- Executable BDD suite
- Stable test harness + data setup
- CI reporting

### Gate

All BDD scenarios pass in CI (or explicit quarantine policy with owner/SLA)

## Phase 8 — "Done" for the Feature

**Goal**: convert "it works" into "it stays working."

- Promote scenarios into regression:
  - Tagging (smoke, regression, critical-path)
  - Decide what runs per PR vs nightly
- Stability and maintainability:
  - Remove redundant scenarios
  - Fix flakes (root cause) or quarantine with ticket + owner
  - Reduce runtime (optimize setup)
- Traceability:
  - Ticket ↔ scenarios ↔ PRs ↔ release notes

### Outputs

- Clean, stable living spec
- Regression classification and coverage clarity

### Gate

Meets Definition of Done: behavior proven + suite stable + traceability complete

## Phase 9 — Release Readiness and Rollout

**Goal**: ship safely.

- Non-functional checks:
  - Performance/latency/cost
  - Security/privacy review (as required)
  - Accessibility (if UI)
- Rollout plan:
  - Feature flag / canary / staged rollout
  - Rollback plan (including data considerations)
- Release communications:
  - Support/sales/internal notes as needed

### Outputs

- Rollout plan + rollback plan
- Monitoring expectations and dashboards/alerts updated

### Gate

Approved for deployment

## Phase 10 — Post-release Verification and Closure

**Goal**: confirm real-world success and finish cleanly before the next feature.

- Production verification:
  - Smoke checks (critical BDD smoke or equivalent)
  - Validate metrics against success criteria
- Monitor for a defined window:
  - Errors, latency, conversion, support tickets
- Triage:
  - Hotfix vs backlog
- Closeout:
  - Capture learnings
  - File follow-ups (tech debt, missing coverage, tooling improvements)

### Outputs

- Verified outcome (or remediation plan)
- Follow-up backlog items
- Final status: shipped + stable

## Quick "Move to Next Feature" Criteria

You move on when:

- BDD scenarios are green and stable (or explicitly quarantined with owner/SLA)
- Rollout is complete (or scheduled with clear gates)
- Monitoring confirms no major regressions
- Follow-ups are written down (not tribal knowledge)
