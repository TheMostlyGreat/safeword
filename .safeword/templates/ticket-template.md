---
id: XXX
status: in_progress
created: YYYY-MM-DDTHH:MM:SSZ
last_modified: YYYY-MM-DDTHH:MM:SSZ
---

# Title

**Goal:** {One sentence: what are we trying to achieve?}

**Why:** {One sentence: why does this matter?}

## Work Log

**Purpose:** Track what you've tried so you don't repeat dead ends or lose context.

**CRITICAL: Re-read this ticket before each significant action to stay on track.**

**Log immediately after:**

- Starting work
- Completing a step
- Trying an approach (document result: success or failure)
- Discovering a blocker, tradeoff, or decision point
- Writing a test (RED) or making it pass (GREEN)
- Committing code

**Format:** `YYYY-MM-DDTHH:MM:SSZ Action: Description (refs: commit/file/PR)`

**Examples:**

```text
- 2025-11-24T18:50:00Z Started: Changing button background to red
- 2025-11-24T18:51:30Z Tried: Added `background: red` to Button.css
- 2025-11-24T18:52:00Z Found: Button now has white text on red (unreadable)
- 2025-11-24T18:53:00Z Tried: Changed text color to white
- 2025-11-24T18:54:15Z Found: Hover state still blue (conflicts)
- 2025-11-24T18:55:00Z Complete: Updated all button states to red theme (refs: commit 9a3f2c1)
```

---

{Keep work log in reverse-chronological order. Newest entries at top.}
{Re-read before each action. Check what you've tried. Stay aligned with Goal.}

---

## Optional Sections (Add When Needed)

### Planning Docs

{Only for complex features that need feature specs, test definitions, design docs}

- .safeword/planning/specs/feature-XXX-name.md
- .safeword/planning/test-definitions/XXX-feature-name.md
- .safeword/planning/design/XXX-feature-name.md

### Scope

{Only for complex features with unclear boundaries}

**In scope:**

- **Out of scope:**

-

### Acceptance Criteria

{Only for features or complex bugs where "done" isn't obvious}

- [ ]
- [ ]

### Root Cause

{Only for bugs that required investigation}

{What caused this issue? Document for future reference.}
