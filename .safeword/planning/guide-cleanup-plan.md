# Guide Cleanup Plan

**Goal:** Reduce context load from ~5,156 lines to ~220 lines per session.

---

## Summary

| Metric        | Before | After         |
| ------------- | ------ | ------------- |
| SAFEWORD.md   | 756    | ~220          |
| Guides loaded | ~4,400 | 0 (on-demand) |
| Guide files   | 13     | 10            |

---

## SAFEWORD.md Changes

### Keep (trim)

| Section                         | Current | Target |
| ------------------------------- | ------- | ------ |
| Planning Documentation Location | ~22     | 10     |
| Ticket System                   | ~88     | 40     |
| Feature Development Workflow    | ~136    | 60     |
| TodoWrite Best Practices        | ~45     | 20     |
| Response Format                 | ~25     | 20     |
| Avoid Over-Engineering          | ~27     | 15     |
| Self-Testing                    | ~72     | 30     |
| Project Memory                  | ~14     | 10     |

### Move

| Section                               | Destination             |
| ------------------------------------- | ----------------------- |
| Setup Scripts (~71 lines)             | README.md               |
| Layers & Boundaries (~15 lines)       | `architecture-guide.md` |
| Architecture Review (LLM) (~17 lines) | `architecture-guide.md` |

### Delete

| Section                | Lines |
| ---------------------- | ----- |
| Creating Documentation | ~87   |

### Remove (replace with lookup table)

All `@path` import sections (~106 lines total):

- Code Philosophy, TDD Templates, Testing Methodology
- LLM Prompting, Writing Instructions, AGENTS.md Guide
- Zombie Process, Learning Extraction

### Add: Lookup Table (~15 lines)

```markdown
## Guide Lookup

| Task                             | Guide                        |
| -------------------------------- | ---------------------------- |
| Writing/choosing tests           | `testing.md`                 |
| Creating user stories            | `user-story-guide.md`        |
| Creating test definitions        | `testing.md`                 |
| Design doc or architecture doc   | `architecture-guide.md`      |
| Data architecture                | `data-architecture-guide.md` |
| Writing CLAUDE.md/AGENTS.md      | `context-files-guide.md`     |
| Extracting learnings             | `learning-extraction.md`     |
| LLM prompts, evals, instructions | `llm-guide.md`               |
| Filling design docs              | `design-doc-guide.md`        |
| Code style/philosophy            | `code-philosophy.md`         |
| Port conflicts/zombie processes  | `zombie-process-cleanup.md`  |

**Path:** `.safeword/guides/[filename]`
```

---

## Guide Changes

### Consolidate (13 → 10)

| From                                                                             | To             |
| -------------------------------------------------------------------------------- | -------------- |
| `testing-methodology.md` + `tdd-best-practices.md` + `test-definitions-guide.md` | `testing.md`   |
| `llm-prompting.md` + `llm-instruction-design.md`                                 | `llm-guide.md` |

### Final Guides

| Guide                        | Before | After |
| ---------------------------- | ------ | ----- |
| `testing.md`                 | 1,570  | ~250  |
| `llm-guide.md`               | 352    | ~200  |
| `architecture-guide.md`      | 424+32 | ~180  |
| `learning-extraction.md`     | 553    | ~150  |
| `context-files-guide.md`     | 458    | ~100  |
| `user-story-guide.md`        | 257    | ~100  |
| `data-architecture-guide.md` | 201    | ~100  |
| `design-doc-guide.md`        | 172    | ~80   |
| `code-philosophy.md`         | 196    | ~80   |
| `zombie-process-cleanup.md`  | 220    | ~80   |

---

## Implementation Order

1. **SAFEWORD.md** - Remove imports, add lookup table, trim sections, move/delete as above
2. **Create merged guides** - `testing.md`, `llm-guide.md`
3. **Delete old files** - 5 files being merged
4. **Trim guides** - Apply trimming principles to all 10

---

## Trimming Principles

- 1 example per concept
- Tables over prose
- Decision trees, not narratives
- No meta-commentary
- No redundancy with SAFEWORD.md
