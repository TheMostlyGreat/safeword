# User Story Guide for Claude Code

## How to Fill Out Feature User Stories

**Template:** `@.safeword/templates/user-stories-template.md`

**When user asks:** "Create user stories for issue #N" or "Create user stories for [feature]"

**What you do:**

1. Read `@.safeword/templates/user-stories-template.md`
2. Fill in feature name, issue number, status
3. Create numbered stories (Story 1, Story 2, etc.)
4. Add acceptance criteria with ✅/❌ checkboxes for tracking
5. Include test file references
6. Add summary with completion % and phases
7. Save to project location (e.g., `planning/user-stories/45-feature-name.md`)

**DO include:**

- Status tracking (✅/❌ per story and AC)
- Test file references
- Implementation status
- Completion percentage
- Phase tracking
- Next steps

---

## INVEST Validation (Do This Before Saving)

After filling out story, mentally check:

✅ **Independent** - Can be done without other stories?
✅ **Negotiable** - Are details left for conversation?
✅ **Valuable** - Does "So that" clearly state value?
✅ **Estimable** - Can team estimate this (1-5 days)?
✅ **Small** - Completable in one sprint?
✅ **Testable** - Are acceptance criteria specific?

**If ANY check fails → Refine or split the story**

---

## Writing Good Acceptance Criteria

**✅ GOOD - Specific, user-facing, testable:**

- User can switch campaigns without page reload
- Response time is under 200ms
- Current campaign is visually highlighted
- Error message explains what went wrong

**❌ BAD - Vague, technical, or implementation:**

- Campaign switching works ← Too vague
- Use Zustand for state ← Implementation detail
- Database is fast ← Not user-facing
- Code is clean ← Not testable

---

## Size Guidelines

| Indicator           | Too Big | Just Right | Too Small |
| ------------------- | ------- | ---------- | --------- |
| Acceptance Criteria | 6+      | 1-5        | 0         |
| Personas/Screens    | 3+      | 1-2        | N/A       |
| Duration            | 6+ days | 1-5 days   | <1 hour   |
| **Action**          | Split   | ✅ Ship    | Combine   |

**Decision rule:** When borderline (e.g., 5 AC but 2 personas), err on the side of splitting. Smaller stories are easier to estimate and complete.

---

## Examples

### ✅ GOOD Story

**As a** player with multiple campaigns
**I want** to switch between campaigns from the sidebar
**So that** I can quickly resume different games

**Acceptance Criteria:**

- [ ] Sidebar shows all campaigns with last-played date
- [ ] Clicking campaign loads it within 200ms
- [ ] Current campaign is highlighted

### ❌ BAD Story (Too Big)

**As a** user
**I want** a complete campaign management system
**So that** I can organize my games

**Acceptance Criteria:**

- [ ] Create, edit, delete campaigns
- [ ] Share campaigns with other players
- [ ] Export/import campaign data
- [ ] Search and filter campaigns
- [ ] Tag campaigns by theme

**Problem:** This is 5+ separate stories. Split it.

### ❌ BAD Story (No Value)

**As a** developer
**I want** to refactor the GameStore
**So that** code is cleaner

**Problem:**

- Developer is not a user
- "Cleaner code" is not user-facing value
- This is a technical task, not a user story

### ✅ BETTER (Technical Story)

**Technical Task:** Refactor GameStore to use Immer

**Why:** Prevent state mutation bugs (3 bugs in last sprint)
**Effort:** 2-3 hours
**Test:** All existing tests pass, no new mutations

---

## Conversation Starter, Not Contract

**Remember:** User story is a placeholder for conversation.

**During planning, discuss:**

- Edge cases not in acceptance criteria
- Technical approach (but don't document it in story)
- Open questions or dependencies
- How to split if too big

**The story should NOT contain:**

- Technical implementation details
- Test strategies
- UI mockups (link to them instead)
- Definition of done (that's team-wide)

---

## Technical Constraints Section

**Purpose:** Capture non-functional requirements that inform test definitions. These are NOT user stories but constrain how stories are implemented.

**When to use:** Fill in constraints BEFORE writing test definitions. Delete sections that don't apply—keep it lean.

### Categories

| Category       | What It Captures                 | Examples                                        |
| -------------- | -------------------------------- | ----------------------------------------------- |
| Performance    | Speed, throughput, capacity      | Response time < 200ms, 1000 concurrent users    |
| Security       | Auth, validation, rate limiting  | Sanitized inputs, session required, 100 req/min |
| Compatibility  | Browsers, devices, accessibility | Chrome 100+, iOS 14+, WCAG 2.1 AA               |
| Data           | Privacy, retention, compliance   | GDPR delete in 72h, 90-day log retention        |
| Dependencies   | Existing systems, restrictions   | Use AuthService, no new packages                |
| Infrastructure | Resources, offline, deployment   | < 512MB memory, offline-capable                 |

### ✅ GOOD Constraints (Specific, Testable)

```markdown
### Performance

- [ ] API response < 200ms at P95 under 100 concurrent users
- [ ] Initial page load < 3s on simulated 3G

### Security

- [ ] All user inputs sanitized via DOMPurify
- [ ] Rate limited: 100 requests/min per IP
```

### ❌ BAD Constraints (Vague, Untestable)

```markdown
### Performance

- [ ] Should be fast ← How fast? Under what conditions?
- [ ] Good performance ← Not measurable

### Security

- [ ] Secure ← What does this mean?
- [ ] Protected from hackers ← Not specific
```

### Decision Rule

**Include a constraint if:**

- It affects how you write tests (performance tests, security tests)
- It limits implementation choices (must use X, can't use Y)
- Violating it would fail an audit or break SLAs

**Skip if:**

- It's a project-wide standard already in ARCHITECTURE.md
- It's obvious (don't document "code must compile")

### Tie-Breaking

**If constraint fits multiple categories:** Choose the most specific one.

| Constraint                 | Could Fit                     | Best Category  | Why                             |
| -------------------------- | ----------------------------- | -------------- | ------------------------------- |
| API rate limit 100 req/min | Security, Performance         | Security       | Rate limiting is access control |
| Page load < 3s on 3G       | Performance, Compatibility    | Performance    | Speed is primary concern        |
| Must work offline          | Infrastructure, Compatibility | Infrastructure | Offline is deployment concern   |

**Edge case:** If truly cross-cutting (e.g., "GDPR compliance" spans Data + Security), pick one and add a note: "See also: Security constraints"

---

## LLM Optimization Tips

**Core principle:** User stories are instructions that LLMs read and follow. Apply LLM instruction design best practices.

**See:** `@.safeword/guides/llm-guide.md` for comprehensive framework on writing LLM-consumable documentation.

**When filling templates:**

- Use specific, concrete language (not vague)
- Avoid generic phrases ("improve UX", "make better")
- Include numbers where relevant (200ms, 3 items, under 5 clicks)
- Use concrete examples over abstract rules
- Define all terms explicitly
- Write for humans, not robots

**Token efficiency:**

- Template is 9 lines (minimal prompt caching cost)
- No nested sections (flat structure)
- No validation metadata in file

---

## File Naming Convention

Save stories as: `.safeword/planning/user-stories/[slug].md`

**Good filenames:**

- `campaign-switching.md`
- `export-character-pdf.md`
- `stress-tracking.md`

**Bad filenames:**

- `user-story-1.md` ← Not descriptive
- `STORY_CAMPAIGN_SWITCHING_FINAL_v2.md` ← Bloated
