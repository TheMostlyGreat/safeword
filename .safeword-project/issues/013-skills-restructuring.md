---
id: '013'
title: Restructure skills for LLM optimization
type: epic
status: ready
priority: medium
created: 2026-01-08
children: ['013a', '013b', '013c']
---

# Restructure Skills for LLM Optimization

This epic covers restructuring skills for better LLM performance.

## Children

- **013a**: [BDD skill compression and phase-based splitting](./013a-bdd-skill-compression.md)
- **013b**: [Quality review skill - phase-aware with web research](./013b-quality-review-restructure.md)
- **013c**: [Testing guide consolidation](./013c-testing-guide-consolidation.md)

## Shared Research

### LLM Context Optimization

- Models perform best at 10-64k tokens, not their advertised 200k
- "Lost in the middle" phenomenon: <40% recall for middle content vs >80% for start/end
- Stay at 70-80% of context window capacity
- Cursor recommends rules under 100 lines each

### Reliable Rule/Skill Loading

| Pattern                 | Activation Rate |
| ----------------------- | --------------- |
| Generic descriptions    | ~20%            |
| USE WHEN prefix         | High            |
| WHEN + WHEN NOT in body | 80-84%          |
| Trigger-rich language   | High            |

**Key insight:** Description is the gatekeeper. Include explicit "USE WHEN [condition]" and trigger phrases.

### Anthropic Best Practices

- Just-in-time loading, few-shot examples > extensive rules
- Performance cliff at 70-80% context
- Simple masking halves cost while matching summarization performance
