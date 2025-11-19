# LLM Prompting Best Practices

This guide covers two related topics:

**Part 1: Prompting LLMs** - How to structure prompts when actively using an LLM (API calls, chat interactions)

**Part 2: Writing Instructions for LLMs** - How to write documentation that LLMs will read and follow (AGENTS.md, CLAUDE.md, testing guides, coding standards)

---

## Part 1: Prompting LLMs

### Prompt Engineering Principles

**Concrete Examples Over Abstract Rules:**
- ✅ Good: Show "❌ BAD" vs "✅ GOOD" code examples
- ❌ Bad: "Follow best practices" (too vague)

**"Why" Over "What":**
- Explain architectural trade-offs and reasoning
- Include specific numbers (90% cost reduction, 3x faster)
- Document gotchas with explanations

**Structured Outputs:**
- Use JSON mode for predictable LLM responses
- Define explicit schemas with validation
- Return structured data, not prose

```typescript
// ❌ BAD - Prose output
"The user wants to create a campaign named 'Shadows' with 4 players"

// ✅ GOOD - Structured JSON
{ "intent": "create_campaign", "name": "Shadows", "playerCount": 4 }
```

### Cost Optimization

**Prompt Caching (Critical for AI Agents):**
- Static rules → System prompt with cache_control: ephemeral (caches for ~5 min, auto-expires)
- Dynamic data (character state, user input) → User message (no caching)
- Example: 468-line prompt costs $0.10 without caching, $0.01 with (90% reduction)
- Cache invalidation: ANY change to cached blocks breaks ALL caches
- Rule: Change system prompts sparingly; accept one-time cache rebuild cost

**Message Architecture:**
```typescript
// ✅ GOOD - Cacheable system prompt
systemPrompt: [
  { text: STATIC_RULES, cache_control: { type: 'ephemeral' } },
  { text: STATIC_EXAMPLES, cache_control: { type: 'ephemeral' } }
]
userMessage: `Character: ${dynamicState}\nAction: ${userInput}`

// ❌ BAD - Uncacheable (character state in system prompt)
systemPrompt: `Rules + Character: ${dynamicState}`
```

### Testing AI Outputs

**LLM-as-Judge Pattern:**
- Use LLM to evaluate nuanced qualities (narrative tone, reasoning quality)
- Avoid brittle keyword matching for creative outputs
- Define rubrics: EXCELLENT / ACCEPTABLE / POOR with criteria
- Example: "Does the GM's response show collaborative tone?" vs checking for specific words

**Evaluation Framework:**
- Unit tests: Pure functions (parsing, validation)
- Integration tests: Agent + real LLM calls (schema compliance)
- LLM Evals: Judgment quality (position/effect reasoning, atmosphere)
- Cost awareness: 30 scenarios ≈ $0.15-0.30 per run with caching

---

## Part 2: Writing Instructions for LLMs

**Comprehensive framework:** See @~/.agents/coding/guides/llm-instruction-design.md

**Quick summary:** When creating documentation that LLMs will read and follow (AGENTS.md, CLAUDE.md, testing guides, coding standards), apply 13 core principles:

1. **MECE Principle** - Decision trees must be mutually exclusive and collectively exhaustive
2. **Explicit Over Implicit** - Define all terms, never assume LLMs know what you mean
3. **No Contradictions** - Different sections must align, LLMs don't reconcile conflicts
4. **Concrete Examples Over Abstract Rules** - Show, don't just tell (2-3 examples per rule)
5. **Edge Cases Must Be Explicit** - What seems obvious to humans often isn't to LLMs
6. **Actionable Over Vague** - Replace subjective terms with optimization rules + red flags
7. **Decision Trees: Sequential Over Parallel** - Ordered steps that stop at first match
8. **Tie-Breaking Rules** - Tell LLMs how to choose when multiple options apply
9. **Lookup Tables for Complex Decisions** - Provide reference tables for complex logic
10. **Avoid Caveats in Tables** - Keep patterns clean, parentheticals break LLM pattern matching
11. **Percentages: Context or None** - Include adjustment guidance or use principles instead
12. **Specificity in Questions** - Use precise technical terms, not general descriptions
13. **Re-evaluation Paths** - Provide concrete next steps when LLMs hit dead ends

**Also includes:** Anti-patterns to avoid, quality checklist, research-backed principles, and before/after examples.
