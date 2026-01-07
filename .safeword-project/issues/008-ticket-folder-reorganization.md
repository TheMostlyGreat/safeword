---
id: 008
type: feature
phase: backlog
status: pending
parent: 001
created: 2026-01-07T16:36:00Z
last_modified: 2026-01-07T16:36:00Z
---

# Iteration 7: Ticket/Artifact Folder Reorganization

**Goal:** Improve the file/folder structure for BDD artifacts to be more intuitive and scalable.

**Parent Epic:** 001-stateful-bdd-flow

## Problem

Current structure:

```
.safeword-project/
├── issues/
│   ├── 001-epic.md
│   ├── 006-child.md
│   └── 007-child.md
└── test-definitions/
    ├── 006-tests.md
    └── 007-tests.md
```

Issues:

- Artifacts for same ticket spread across folders
- Hard to see all artifacts for one ticket at a glance
- Naming convention relies on ID prefix matching

## Potential Solutions

**Option A: Ticket folders**

```
.safeword-project/
└── tickets/
    ├── 001-epic/
    │   ├── ticket.md
    │   └── children.md (or inline)
    ├── 006-phase-aware/
    │   ├── ticket.md
    │   └── test-definitions.md
    └── 007-iteration6/
        ├── ticket.md
        └── test-definitions.md
```

**Option B: Keep flat, improve tooling**

- Better glob patterns
- CLI commands to list ticket + artifacts together

**Option C: Hybrid**

- Epics get folders (contain children refs)
- Leaf tickets stay flat

## Out of Scope

- Changing BDD phases themselves
- Changing ticket metadata format

## Notes

- Need to consider migration path for existing tickets
- Should update artifact-first rule in BDD skill
- May need schema changes for new paths
