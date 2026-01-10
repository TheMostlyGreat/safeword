---
id: 017d
type: feature
phase: intake
status: ready
parent: 017
created: 2026-01-10T20:23:00Z
last_modified: 2026-01-10T20:23:00Z
---

# Smart Quality Review (Prompt-Based)

**User Story:** When I run `/bdd` and the agent drifts from my scenarios or creates code without tests, I want intelligent detection so I catch context-aware issues that simple thresholds miss.

**Goal:** Use LLM evaluation for deeper quality analysis beyond simple thresholds.

**Parent:** [017 - Continuous Quality Monitoring](../017-continuous-quality-monitoring/ticket.md)

**Priority:** Low - This is an opt-in enhancement. 017a/017b/017c provide the core solution.

## Why Optional

| Approach        | Pros                         | Cons                       |
| --------------- | ---------------------------- | -------------------------- |
| Threshold-based | Fast, deterministic, free    | Doesn't understand context |
| Prompt-based    | Understands context, smarter | Adds latency, costs money  |

Threshold-based (017a) solves the core problem. Prompt-based adds intelligence for teams wanting deeper analysis.

## How It Works

Use Claude Code's prompt-based hook with Haiku for evaluation:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Analyze recent changes for quality issues..."
          }
        ]
      }
    ]
  }
}
```

## Evaluation Prompt

```
Analyze recent session activity for quality signals.

Check:
1. Drift from ticket scenarios (if .safeword-project/tickets/ exists)
2. Test coverage gaps (new code without corresponding tests)
3. Accumulating complexity (files growing too large)
4. Repeated similar changes (possible refactor opportunity)
5. Error patterns (similar errors recurring)

If concerning patterns found:
  Return {"ok": false, "reason": "Brief explanation", "severity": "soft|hard"}

If session looks healthy:
  Return {"ok": true}

Be conservative - only flag clear issues.
```

## Cost Analysis

Claude 3.5 Haiku pricing:

- Input: $1/M tokens
- Output: $5/M tokens

**Per quality check** (~2K input + 100 output tokens): **~$0.0025** (0.25 cents)

| Usage  | Checks/Day | Monthly Cost |
| ------ | ---------- | ------------ |
| Light  | 10         | $0.75        |
| Normal | 50         | $3.75        |
| Heavy  | 200        | $15.00       |

Cost is negligible but adds ~500ms latency per check.

## Opt-In Configuration

Enable via environment variable:

```bash
export SAFEWORD_SMART_QUALITY=true
```

Or in `.safeword-project/config.json`:

```json
{
  "smartQuality": {
    "enabled": true,
    "checkFrequency": "every_100_loc",
    "severityThreshold": "soft"
  }
}
```

## Integration with Threshold-Based

Smart review complements, doesn't replace, threshold-based:

| LOC Changed | Threshold Action | Smart Review                  |
| ----------- | ---------------- | ----------------------------- |
| 0-100       | None             | Runs if enabled               |
| 100-200     | None             | Runs, can trigger soft remind |
| 200-400     | Soft reminder    | Runs, can upgrade to hard     |
| 400+        | Hard block       | Runs, provides context        |

## When Smart Review Adds Value

1. **Drift detection** - "You're implementing feature X but scenarios describe Y"
2. **Pattern recognition** - "You've made 5 similar changes, consider refactor"
3. **Coverage gaps** - "New auth module has no tests"
4. **Complexity warnings** - "This file is now 500+ lines, consider splitting"

## Limitations

1. **Latency** - Adds ~500ms per check
2. **Cost** - Small but non-zero
3. **False positives** - LLM may flag non-issues
4. **Cursor support** - Prompt-based hooks are Claude Code only

## Acceptance Criteria

- [ ] Prompt-based hook evaluates session health
- [ ] Opt-in via SAFEWORD_SMART_QUALITY env var
- [ ] Config file option for fine-tuning
- [ ] Returns soft/hard severity for integration with 017a
- [ ] Latency under 1s per check
- [ ] Clear documentation of costs
- [ ] Graceful degradation if API unavailable

## Testing

1. Enable smart quality → verify checks run
2. Create drift scenario → verify detected
3. Disable smart quality → verify no checks
4. Simulate API failure → verify graceful handling
5. Measure latency → verify under 1s

## Future Considerations

- **Batch analysis** - Analyze multiple edits together (reduce API calls)
- **Local model** - Use local LLM to eliminate API cost/latency
- **Learning** - Track false positives to improve prompt

## Work Log

---

- 2026-01-10T20:23:00Z Created: Optional prompt-based quality review

---
